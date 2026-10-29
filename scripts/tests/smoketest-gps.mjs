#!/usr/bin/env node
/**
 * smoketest-gps.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * Smoke test for artifacts/pwd-tools/src/lib/exif.ts
 *
 * Covers the GPS "add + preserve" contract:
 *   • decimal ⇄ EXIF DMS rational conversion, including 60″/60′ carry
 *   • all four hemispheres and the ±90 / ±180 extremes
 *   • altitude sign handling (GPSAltitudeRef)
 *   • UTC date/time stamps
 *   • REGRESSION: Orientation must be forced to 1 after canvas re-encode
 *     (otherwise portrait photos come out double-rotated)
 *   • source EXIF survival: Make / Model / DateTimeOriginal / ISO
 *   • the verify-after-write guard actually detects a missing GPS block
 *   • the output is still a structurally valid JPEG
 *
 * Run:  npx tsx scripts/tests/smoketest-gps.mjs
 *       (or: node --experimental-strip-types scripts/tests/smoketest-gps.mjs)
 *
 * Exit code 0 = pass, 1 = fail. No network, no fixtures on disk.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── Environment shims: exif.ts targets the browser ───────────────────────────
globalThis.window ??= globalThis;
if (typeof globalThis.btoa !== "function") {
  globalThis.btoa = (s) => Buffer.from(s, "binary").toString("base64");
  globalThis.atob = (s) => Buffer.from(s, "base64").toString("binary");
}

const { writeFileSync, mkdirSync } = await import("node:fs");
const { createRequire } = await import("node:module");
// piexifjs is installed under the app workspace (pnpm keeps it out of the
// repo root). Resolve it exactly as the app does, so this test runs without a
// hoisted install.
const requireFromApp = createRequire(
  new URL("../../artifacts/pwd-tools/package.json", import.meta.url),
);
const piexifjs = requireFromApp("piexifjs");

const EXIF_MODULE = new URL(
  "../../artifacts/pwd-tools/src/lib/exif.ts",
  import.meta.url,
).href;

const {
  buildGpsIfd,
  composeExif,
  decimalToDmsRational,
  emptyExif,
  gmapsUrl,
  injectExif,
  readExifFromFile,
  readGps,
} = await import(EXIF_MODULE);

// ── Tiny harness ─────────────────────────────────────────────────────────────
const C = {
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const r = fn();
    if (r instanceof Promise) throw new Error("use testAsync()");
    passed++;
    console.log(`  ${C.green("✓")} ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, message: e.message });
    console.log(`  ${C.red("✗")} ${name}`);
    console.log(`      ${C.dim(e.message)}`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ${C.green("✓")} ${name}`);
  } catch (e) {
    failed++;
    failures.push({ name, message: e.message });
    console.log(`  ${C.red("✗")} ${name}`);
    console.log(`      ${C.dim(e.message)}`);
  }
}

function eq(actual, expected, label = "value") {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function approx(actual, expected, tol, label = "value") {
  if (typeof actual !== "number" || !Number.isFinite(actual)) {
    throw new Error(`${label}: expected a finite number, got ${JSON.stringify(actual)}`);
  }
  if (Math.abs(actual - expected) > tol) {
    throw new Error(`${label}: expected ≈${expected} (±${tol}), got ${actual}`);
  }
}

function truthy(v, label = "value") {
  if (!v) throw new Error(`${label}: expected truthy, got ${JSON.stringify(v)}`);
}

function falsy(v, label = "value") {
  if (v) throw new Error(`${label}: expected falsy, got ${JSON.stringify(v)}`);
}

function section(title) {
  console.log(`\n${C.bold(title)}`);
}

// ── Fixtures ─────────────────────────────────────────────────────────────────
/**
 * Structurally valid 115-byte 1×1 baseline JPEG — SOI, JFIF APP0, DQT, SOF0,
 * SOS, one entropy byte, EOI. piexifjs only walks the segment table (it never
 * decodes pixels), so no real image data is needed. Built from bytes rather
 * than a hand-copied base64 string, because a corrupted literal silently makes
 * every insert() call fail with "Wrong JPEG data."
 */
const JPEG_BYTES = (() => {
  const parts = [];
  const b = (...v) => parts.push(...v);
  b(0xff, 0xd8);                                                     // SOI
  b(0xff, 0xe0, 0x00, 0x10);                                         // APP0
  b(0x4a, 0x46, 0x49, 0x46, 0x00);                                   // "JFIF\0"
  b(0x01, 0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00);
  b(0xff, 0xdb, 0x00, 0x43, 0x00, ...new Array(64).fill(0x01));      // DQT
  b(0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01, 0x00, 0x01, 0x01, 0x01, 0x11, 0x00); // SOF0
  b(0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00);     // SOS
  b(0x00);                                                           // entropy
  b(0xff, 0xd9);                                                     // EOI
  return Uint8Array.from(parts);
})();

const jpegBlob = () => new Blob([JPEG_BYTES], { type: "image/jpeg" });

function jpegFile(type = "image/jpeg") {
  if (typeof globalThis.File === "function") {
    return new File([JPEG_BYTES], "smoke.jpg", { type });
  }
  // Node < 20 fallback
  return { type, name: "smoke.jpg", arrayBuffer: async () => JPEG_BYTES.buffer.slice(0) };
}

const bytesOf = async (blob) => new Uint8Array(await blob.arrayBuffer());

const isJpeg = (bytes) =>
  bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;

// Reference coordinate used throughout (Udaipur, Girwa tehsil HQ)
const LAT = 24.5854;
const LNG = 73.7125;

// ═════════════════════════════════════════════════════════════════════════════
console.log(C.bold("\nGPS EXIF smoke test — artifacts/pwd-tools/src/lib/exif.ts"));
console.log(C.dim(`fixture: ${JPEG_BYTES.length}-byte 1×1 JPEG`));

// ── 1. DMS conversion ────────────────────────────────────────────────────────
section("1. decimalToDmsRational");

test("converts a normal latitude to RATIONAL[3]", () => {
  const dms = decimalToDmsRational(24.7522);
  eq(dms.length, 3, "entry count");
  eq(dms[0][0] / dms[0][1], 24, "degrees");
  eq(dms[1][0] / dms[1][1], 45, "minutes");
  approx(dms[2][0] / dms[2][1], 7.92, 1e-9, "seconds");
  eq(dms[2][1], 10000, "second denominator");
});

test("carries 59.999999″ → next minute", () => {
  const dms = decimalToDmsRational(24.99999999);
  eq(dms[0][0] / dms[0][1], 25, "degrees after carry");
  eq(dms[1][0] / dms[1][1], 0, "minutes after carry");
  eq(dms[2][0] / dms[2][1], 0, "seconds after carry");
});

test("never emits 60 minutes", () => {
  for (const v of [24.99999999, 12.9999999999, 59.9999999, 0.99999999999]) {
    const [, m] = decimalToDmsRational(v).map(([n, d]) => n / d);
    if (m >= 60) throw new Error(`minutes = ${m} for ${v}`);
  }
});

test("handles zero and the exact poles/antimeridian", () => {
  for (const v of [0, 90, -90, 180, -180]) {
    const dms = decimalToDmsRational(v);
    eq(dms.length, 3, `entry count for ${v}`);
    truthy(Number.isFinite(dms[0][0] / dms[0][1]), `degrees for ${v}`);
  }
});

test("round-trips through DMS within 1e-7°", () => {
  for (const v of [24.5854, -33.8688, 51.5074, -0.0001234, 89.999999]) {
    const [d, m, s] = decimalToDmsRational(v).map(([n, den]) => n / den);
    const back = d + m / 60 + s / 3600;
    approx(back, Math.abs(v), 1e-7, `round-trip for ${v}`);
  }
});

// ── 2. GPS IFD construction ──────────────────────────────────────────────────
section("2. buildGpsIfd");

test("emits version, refs, rationals and map datum", () => {
  const G = piexifjs.GPSIFD;
  const ifd = buildGpsIfd({ latitude: LAT, longitude: LNG, source: "preset" });
  eq(ifd[G.GPSVersionID].join(","), "2,3,0,0", "GPSVersionID");
  eq(ifd[G.GPSLatitudeRef], "N", "latitude ref");
  eq(ifd[G.GPSLongitudeRef], "E", "longitude ref");
  eq(ifd[G.GPSLatitude].length, 3, "latitude rationals");
  eq(ifd[G.GPSMapDatum], "WGS-84", "map datum");
});

test("southern + western hemispheres", () => {
  const G = piexifjs.GPSIFD;
  const ifd = buildGpsIfd({ latitude: -33.8688, longitude: -70.65, source: "manual" });
  eq(ifd[G.GPSLatitudeRef], "S", "latitude ref");
  eq(ifd[G.GPSLongitudeRef], "W", "longitude ref");
  const lat = ifd[G.GPSLatitude].map(([n, d]) => n / d);
  approx(lat[0] + lat[1] / 60 + lat[2] / 3600, 33.8688, 1e-7, "abs latitude");
});

test("negative altitude sets GPSAltitudeRef = 1", () => {
  const G = piexifjs.GPSIFD;
  const ifd = buildGpsIfd({ latitude: LAT, longitude: LNG, altitude: -12.5, source: "device" });
  eq(ifd[G.GPSAltitudeRef], 1, "altitude ref");
  approx(ifd[G.GPSAltitude][0] / ifd[G.GPSAltitude][1], 12.5, 1e-9, "abs altitude");
});

test("positive altitude sets GPSAltitudeRef = 0", () => {
  const G = piexifjs.GPSIFD;
  const ifd = buildGpsIfd({ latitude: LAT, longitude: LNG, altitude: 598.4, source: "device" });
  eq(ifd[G.GPSAltitudeRef], 0, "altitude ref");
});

test("timestamp written as GPSDateStamp + GPSTimeStamp", () => {
  const G = piexifjs.GPSIFD;
  const t = new Date(Date.UTC(2026, 9, 28, 6, 5, 4));
  const ifd = buildGpsIfd({ latitude: LAT, longitude: LNG, timestampUtc: t, source: "device" });
  eq(ifd[G.GPSDateStamp], "2026:10:28", "GPSDateStamp");
  eq(ifd[G.GPSTimeStamp].length, 3, "GPSTimeStamp shape");
  eq(ifd[G.GPSTimeStamp][0][0] / ifd[G.GPSTimeStamp][0][1], 6, "hours");
});

test("omits altitude/accuracy/timestamp when absent", () => {
  const G = piexifjs.GPSIFD;
  const ifd = buildGpsIfd({ latitude: LAT, longitude: LNG, source: "preset" });
  falsy(G.GPSAltitude in ifd, "GPSAltitude");
  falsy(G.GPSHPositioningError in ifd, "GPSHPositioningError");
  falsy(G.GPSDateStamp in ifd, "GPSDateStamp");
});

// ── 3. Orientation regression (the double-rotation bug) ──────────────────────
section("3. REGRESSION — Orientation must be forced to 1");

test("composeExif resets a landscape-rotated Orientation (6) to 1", () => {
  const src = emptyExif();
  src["0th"][piexifjs.ImageIFD.Orientation] = 6;
  const out = composeExif(src, { latitude: LAT, longitude: LNG, source: "exif" });
  eq(out["0th"][piexifjs.ImageIFD.Orientation], 1, "Orientation");
});

test("composeExif resets Orientation (8) to 1", () => {
  const src = emptyExif();
  src["0th"][piexifjs.ImageIFD.Orientation] = 8;
  eq(composeExif(src, null)["0th"][piexifjs.ImageIFD.Orientation], 1, "Orientation");
});

test("stale thumbnail is dropped", () => {
  const src = emptyExif();
  src.thumbnail = "\xff\xd8\xff\xd9";
  eq(composeExif(src, null).thumbnail, null, "thumbnail");
});

test("Software tag is stamped", () => {
  const out = composeExif(null, null);
  truthy(out["0th"][piexifjs.ImageIFD.Software], "Software");
});

test("source EXIF object is not mutated in place", () => {
  const src = emptyExif();
  src["0th"][piexifjs.ImageIFD.Orientation] = 6;
  composeExif(src, { latitude: LAT, longitude: LNG, source: "exif" });
  eq(src["0th"][piexifjs.ImageIFD.Orientation], 6, "source Orientation untouched");
});

// ── 3b. composeExif — file-sourced GPS must be kept verbatim ─────────────────
section("3b. composeExif — file-sourced GPS is preserved");

test("original GPS IFD survives untouched when the point came from the file", () => {
  const G = piexifjs.GPSIFD;
  const src = emptyExif();
  src.GPS[G.GPSLatitudeRef] = "N";
  src.GPS[G.GPSLatitude] = [[24, 1], [35, 1], [7400, 10000]];
  src.GPS[G.GPSLongitudeRef] = "E";
  src.GPS[G.GPSLongitude] = [[73, 1], [42, 1], [0, 10000]];
  src.GPS[G.GPSDOP] = [12, 10];
  src.GPS[G.GPSSatellites] = "08";

  const out = composeExif(src, { latitude: LAT, longitude: LNG, source: "exif" });
  eq(out.GPS[G.GPSDOP][0], 12, "GPSDOP preserved");
  eq(out.GPS[G.GPSSatellites], "08", "GPSSatellites preserved");
  eq(out.GPS[G.GPSLatitude][2][0], 7400, "latitude not rebuilt from the new point");
});

test("rebuilds GPS when an exif-sourced point has no source GPS IFD", () => {
  const src = emptyExif();                      // e.g. a photo with no GPS block
  const out = composeExif(src, { latitude: LAT, longitude: LNG, source: "exif" });
  eq(out.GPS[piexifjs.GPSIFD.GPSLatitude].length, 3, "latitude written");
  eq(out.GPS[piexifjs.GPSIFD.GPSLongitude].length, 3, "longitude written");
});

test("an override still rebuilds over a file that already has GPS", () => {
  const src = emptyExif();
  src.GPS[piexifjs.GPSIFD.GPSLatitude] = [[1, 1], [2, 1], [3, 10000]];
  src.GPS[piexifjs.GPSIFD.GPSLongitude] = [[4, 1], [5, 1], [6, 10000]];
  const out = composeExif(src, { latitude: LAT, longitude: LNG, source: "manual" });
  const lat = out.GPS[piexifjs.GPSIFD.GPSLatitude].map(([n, d]) => n / d);
  approx(lat[0] + lat[1] / 60 + lat[2] / 3600, LAT, 1e-7, "overridden latitude");
});

// ── 4. readGps guards ────────────────────────────────────────────────────────
section("4. readGps");

test("returns null for a GPS IFD holding only GPSVersionID", () => {
  const exif = emptyExif();
  exif.GPS[piexifjs.GPSIFD.GPSVersionID] = [2, 3, 0, 0];
  falsy(readGps(exif), "readGps");
});

test("returns null when latitude is present but longitude is not", () => {
  const exif = emptyExif();
  exif.GPS[piexifjs.GPSIFD.GPSLatitudeRef] = "N";
  exif.GPS[piexifjs.GPSIFD.GPSLatitude] = [[24, 1], [35, 1], [7400, 10000]];
  falsy(readGps(exif), "readGps");
});

test("returns null for null / empty exif", () => {
  falsy(readGps(null), "null input");
  falsy(readGps(emptyExif()), "empty exif");
});

test("decodes signed coordinates from refs", () => {
  const exif = emptyExif();
  const G = piexifjs.GPSIFD;
  exif.GPS[G.GPSLatitudeRef] = "S";
  exif.GPS[G.GPSLatitude] = [[33, 1], [52, 1], [76800, 10000]];   // 33°52'7.68" S
  exif.GPS[G.GPSLongitudeRef] = "W";
  exif.GPS[G.GPSLongitude] = [[70, 1], [39, 1], [0, 10000]];      // 70°39'0" W
  const gps = readGps(exif);
  truthy(gps, "readGps result");
  approx(gps.latitude, -33.8688, 1e-4, "signed latitude");
  approx(gps.longitude, -70.65, 1e-4, "signed longitude");
});

test("decodes a below-sea-level altitude as negative", () => {
  const exif = emptyExif();
  const G = piexifjs.GPSIFD;
  exif.GPS[G.GPSLatitudeRef] = "N";
  exif.GPS[G.GPSLatitude] = [[24, 1], [35, 1], [0, 10000]];
  exif.GPS[G.GPSLongitudeRef] = "E";
  exif.GPS[G.GPSLongitude] = [[73, 1], [42, 1], [0, 10000]];
  exif.GPS[G.GPSAltitudeRef] = 1;
  exif.GPS[G.GPSAltitude] = [1250, 100];   // single RATIONAL, not a nested pair
  approx(readGps(exif).altitude, -12.5, 1e-9, "altitude");
});

// ── 5. Real byte-level round trip ────────────────────────────────────────────
section("5. injectExif — real JPEG round trip");

await testAsync("writes GPS into a JPEG and reads the same coordinates back", async () => {
  const exif = composeExif(null, { latitude: LAT, longitude: LNG, source: "preset" });
  const res = await injectExif(jpegBlob(), exif, true);
  truthy(res.ok, `injectExif.ok (${res.error ?? ""})`);

  const back = readGps(piexifjs.load(await blobToDataUrl(res.blob)));
  truthy(back, "GPS readable from output");
  approx(back.latitude, LAT, 1e-6, "latitude fidelity");
  approx(back.longitude, LNG, 1e-6, "longitude fidelity");
});

await testAsync("output is still a structurally valid JPEG", async () => {
  const res = await injectExif(jpegBlob(), composeExif(null, { latitude: LAT, longitude: LNG, source: "manual" }), true);
  const bytes = await bytesOf(res.blob);
  truthy(isJpeg(bytes), "SOI … EOI markers");
  truthy(bytes.length > JPEG_BYTES.length, "EXIF segment appended");
});

await testAsync("output stays under 64 KB of EXIF overhead", async () => {
  const res = await injectExif(jpegBlob(), composeExif(null, { latitude: LAT, longitude: LNG, source: "manual" }), true);
  const overhead = (await bytesOf(res.blob)).length - JPEG_BYTES.length;
  if (overhead > 65536) throw new Error(`overhead ${overhead} bytes`);
});

await testAsync("source EXIF survives: Make, Model, DateTimeOriginal, ISO", async () => {
  const src = emptyExif();
  src["0th"][piexifjs.ImageIFD.Make] = "Xiaomi";
  src["0th"][piexifjs.ImageIFD.Model] = "Redmi Note 12";
  src.Exif[piexifjs.ExifIFD.DateTimeOriginal] = "2026:10:28 11:22:33";
  src.Exif[piexifjs.ExifIFD.ISOSpeedRatings] = 200;

  const res = await injectExif(
    jpegBlob(),
    composeExif(src, { latitude: LAT, longitude: LNG, source: "exif" }),
    true,
  );
  truthy(res.ok, `injectExif.ok (${res.error ?? ""})`);

  const back = piexifjs.load(await blobToDataUrl(res.blob));
  eq(back["0th"][piexifjs.ImageIFD.Make], "Xiaomi", "Make");
  eq(back["0th"][piexifjs.ImageIFD.Model], "Redmi Note 12", "Model");
  eq(back.Exif[piexifjs.ExifIFD.DateTimeOriginal], "2026:10:28 11:22:33", "DateTimeOriginal");
  eq(back.Exif[piexifjs.ExifIFD.ISOSpeedRatings], 200, "ISO");
  eq(back["0th"][piexifjs.ImageIFD.Orientation], 1, "Orientation after round trip");
});

await testAsync("altitude + UTC stamp survive the round trip", async () => {
  const t = new Date(Date.UTC(2026, 9, 28, 6, 5, 4));
  const res = await injectExif(
    jpegBlob(),
    composeExif(null, { latitude: LAT, longitude: LNG, altitude: 598.4, accuracy: 4.2, timestampUtc: t, source: "device" }),
    true,
  );
  truthy(res.ok, `injectExif.ok (${res.error ?? ""})`);

  const back = readGps(piexifjs.load(await blobToDataUrl(res.blob)));
  approx(back.altitude, 598.4, 1e-6, "altitude");
  approx(back.accuracy, 4.2, 1e-6, "accuracy");
  eq(back.timestampUtc.toISOString(), t.toISOString(), "timestamp");
});

// ── 6. Verification guard ────────────────────────────────────────────────────
section("6. verify-after-write guard");

await testAsync("ok = false when GPS was expected but the IFD has none", async () => {
  const res = await injectExif(jpegBlob(), composeExif(null, null), true);
  falsy(res.ok, "res.ok");
  truthy(res.error, "res.error message");
});

await testAsync("ok = true when GPS was not expected", async () => {
  const res = await injectExif(jpegBlob(), composeExif(null, null), false);
  truthy(res.ok, `res.ok (${res.error ?? ""})`);
});

await testAsync("non-JPEG input fails cleanly and returns a blob", async () => {
  const garbage = new Blob([new Uint8Array([1, 2, 3, 4, 5])], { type: "image/jpeg" });
  const res = await injectExif(garbage, composeExif(null, { latitude: LAT, longitude: LNG, source: "manual" }), true);
  falsy(res.ok, "res.ok");
  truthy(res.blob instanceof Blob, "blob returned");
});

// ── 7. readExifFromFile ──────────────────────────────────────────────────────
section("7. readExifFromFile");

await testAsync("returns null for a non-JPEG mime type", async () => {
  falsy(await readExifFromFile(jpegFile("image/png")), "PNG result");
});

await testAsync("returns a well-formed IFD bag for a JPEG with no EXIF", async () => {
  const exif = await readExifFromFile(jpegFile("image/jpeg"));
  truthy(exif, "exif bag");
  for (const k of ["0th", "Exif", "GPS", "Interop", "1st"]) {
    truthy(exif[k] && typeof exif[k] === "object", `${k} ifd`);
  }
  falsy(readGps(exif), "readGps on EXIF-less JPEG");
});

// ── 8. misc ──────────────────────────────────────────────────────────────────
section("8. helpers");

test("gmapsUrl formats to 6 dp", () => {
  eq(gmapsUrl(24.5854, 73.7125), "https://www.google.com/maps?q=24.585400,73.712500");
});

// ── 9. Human-eyeball artifact ────────────────────────────────────────────────
section("9. artifact");
await testAsync("writes a sample output for manual inspection", async () => {
  const res = await injectExif(
    jpegBlob(),
    composeExif(null, { latitude: LAT, longitude: LNG, altitude: 598.4, source: "manual" }),
    true,
  );
  truthy(res.ok, "injectExif.ok");
  const dir = new URL("./.out/", import.meta.url);
  mkdirSync(dir, { recursive: true });
  writeFileSync(new URL("gps-smoke.jpg", dir), Buffer.from(await res.blob.arrayBuffer()));
  console.log(`      ${C.dim("→ scripts/tests/.out/gps-smoke.jpg")}`);
});

async function blobToDataUrl(blob) {
  const b64 = Buffer.from(await blob.arrayBuffer()).toString("base64");
  return `data:image/jpeg;base64,${b64}`;
}

// ── Summary ──────────────────────────────────────────────────────────────────
const total = passed + failed;
console.log("\n" + "─".repeat(64));
if (failed === 0) {
  console.log(C.green(C.bold(`PASS — ${passed}/${total} checks`)));
} else {
  console.log(C.red(C.bold(`FAIL — ${failed} of ${total} checks failed`)));
  for (const f of failures) console.log(C.red(`  • ${f.name}\n      ${f.message}`));
}
console.log("─".repeat(64) + "\n");
// Do not use process.exit() here: on Node 26 / Windows it tears the loop down
// while libuv async handles are still closing, which surfaced a red run as
// 0xC0000409 (Assertion failed: !(handle->flags & UV_HANDLE_CLOSING),
// src\win\async.c) instead of exit 1 — observed 2026-10-28. Setting exitCode
// lets the loop drain naturally, so a failing check always exits 1.
process.exitCode = failed === 0 ? 0 : 1;
