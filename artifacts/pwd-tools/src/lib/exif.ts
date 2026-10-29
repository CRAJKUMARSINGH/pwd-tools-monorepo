import piexifjs from "piexifjs";

// ── Types ──────────────────────────────────────────────────────────────────
export type ExifIfds = {
  "0th": Record<number, unknown>;
  Exif: Record<number, unknown>;
  GPS: Record<number, unknown>;
  Interop: Record<number, unknown>;
  "1st": Record<number, unknown>;
  thumbnail: string | null;
};

export type GpsSource = "exif" | "preset" | "device" | "manual";

export type GpsDetails = {
  latitude: number;
  longitude: number;
  altitude?: number | null;
  accuracy?: number | null;
  timestampUtc?: Date | null;
  mapDatum?: string;
  source: GpsSource;
};

export type InjectResult = {
  blob: Blob;
  ok: boolean;
  error?: string;
};

/**
 * One decision, made once. The caller must not re-derive "is this a JPEG?"
 * — that is how the UI and the parser drift apart.
 */
export type ExifRead =
  | { status: "ok"; exif: ExifIfds }
  | { status: "not-jpeg"; mime: string }
  | { status: "unreadable" };

export const emptyExif = (): ExifIfds => ({
  "0th": {}, Exif: {}, GPS: {}, Interop: {}, "1st": {}, thumbnail: null,
});

// ── Base64 / byte helpers ──────────────────────────────────────────────────
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const CHUNK = 0x4000;                    // avoids arg-limit blowup on large files
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return window.btoa(binary);
}

export const arrayBufferToDataUrl = (b: ArrayBuffer, mime = "image/jpeg") =>
  `data:${mime};base64,${arrayBufferToBase64(b)}`;

export function dataUrlToBytes(dataUrl: string): Uint8Array<ArrayBuffer> {
  const bin = window.atob(dataUrl.split(",")[1] ?? "");
  const out = new Uint8Array(new ArrayBuffer(bin.length));
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ── Read ───────────────────────────────────────────────────────────────────
/**
 * Some Android pickers report an empty file.type for real JPEGs, so fall back
 * to sniffing the SOI marker before rejecting the file.
 */
export async function looksLikeJpeg(file: File): Promise<boolean> {
  if (/^image\/jpe?g$/i.test(file.type)) return true;
  if (file.type) return false;                    // a real, different type
  const head = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  return head[0] === 0xff && head[1] === 0xd8;    // SOI
}

/**
 * The single place that decides whether a file is readable EXIF. Returns the
 * parsed bag, or the reason it could not be read — never both, and never a bare
 * null the caller has to reinterpret.
 */
export async function readExifFromFile(file: File): Promise<ExifRead> {
  if (!(await looksLikeJpeg(file))) return { status: "not-jpeg", mime: file.type };
  try {
    const buf = await file.arrayBuffer();
    const obj = piexifjs.load(arrayBufferToDataUrl(buf)) as unknown as ExifIfds | null;
    // piexifjs.load() yields null — not {} — for a JPEG with no EXIF segment.
    return { status: "ok", exif: obj ? { ...emptyExif(), ...obj } : emptyExif() };
  } catch {
    return { status: "unreadable" };
  }
}

const rationalToNumber = (r: unknown): number | null => {
  if (typeof r === "number") return r;
  if (Array.isArray(r) && typeof r[0] === "number") {
    const den = r[1] as number;
    return den ? (r[0] as number) / den : (r[0] as number);
  }
  return null;
};

const dmsToDecimal = (dms: unknown): number | null => {
  if (!Array.isArray(dms) || dms.length < 3) return null;
  const [d, m, s] = (dms as unknown[]).map(rationalToNumber);
  if (d == null || m == null || s == null) return null;
  return d + m / 60 + s / 3600;
};

/** EXIF refs can arrive lowercase or NUL-padded — normalise before comparing. */
const ref = (v: unknown, fallback: "N" | "E"): string =>
  String(v ?? "").replace(/\0/g, "").trim().toUpperCase() || fallback;

/**
 * Extract real coordinates. NOTE: a GPS IFD containing only GPSVersionID is
 * NOT usable — the old code returned hasGps = true for those.
 */
export function readGps(exif: ExifIfds | null): GpsDetails | null {
  const g = exif?.GPS;
  if (!g) return null;

  const lat = dmsToDecimal(g[piexifjs.GPSIFD.GPSLatitude]);
  const lng = dmsToDecimal(g[piexifjs.GPSIFD.GPSLongitude]);
  if (lat == null || lng == null) return null;

  const signedLat = ref(g[piexifjs.GPSIFD.GPSLatitudeRef], "N") === "S" ? -lat : lat;
  const signedLng = ref(g[piexifjs.GPSIFD.GPSLongitudeRef], "E") === "W" ? -lng : lng;

  const alt = rationalToNumber(g[piexifjs.GPSIFD.GPSAltitude]);
  const altRef = g[piexifjs.GPSIFD.GPSAltitudeRef];

  const dStamp = g[piexifjs.GPSIFD.GPSDateStamp] as string | undefined;
  const tStamp = g[piexifjs.GPSIFD.GPSTimeStamp];
  let timestampUtc: Date | null = null;
  if (dStamp && Array.isArray(tStamp)) {
    const t = (tStamp as unknown[]).map(rationalToNumber);
    const [Y, M, D] = dStamp.split(":").map(Number);
    const hh = t[0] ?? null;
    const mm = t[1] ?? null;
    const ss = t[2] ?? null;
    if (
      hh !== null && mm !== null && ss !== null &&
      [Y, M, D].every((n) => Number.isFinite(n))
    ) {
      timestampUtc = new Date(Date.UTC(Y, M - 1, D, hh, mm, Math.floor(ss)));
    }
  }

  return {
    latitude: signedLat,
    longitude: signedLng,
    altitude: alt == null ? null : (altRef === 1 ? -alt : alt),
    accuracy: rationalToNumber(g[piexifjs.GPSIFD.GPSHPositioningError]),
    timestampUtc,
    mapDatum: (g[piexifjs.GPSIFD.GPSMapDatum] as string) ?? "WGS-84",
    source: "exif",
  };
}

// ── Write ──────────────────────────────────────────────────────────────────
/** Decimal degrees → EXIF RATIONAL[3], with 60″/60′ carry. */
export function decimalToDmsRational(value: number): [number, number][] {
  const abs = Math.abs(value);
  let deg = Math.floor(abs);
  const minFloat = (abs - deg) * 60;
  let min = Math.floor(minFloat);
  let secScaled = Math.round((minFloat - min) * 60 * 10000);
  if (secScaled >= 600000) { secScaled = 0; min += 1; }   // 59.99999″ → 60″
  if (min >= 60) { min = 0; deg += 1; }                    // 59.9999′ → 60′
  return [[deg, 1], [min, 1], [secScaled, 10000]];
}

export function buildGpsIfd(gps: GpsDetails): Record<number, unknown> {
  const G = piexifjs.GPSIFD;
  const ifd: Record<number, unknown> = {
    [G.GPSVersionID]: [2, 3, 0, 0],
    [G.GPSLatitudeRef]: gps.latitude >= 0 ? "N" : "S",
    [G.GPSLatitude]: decimalToDmsRational(gps.latitude),
    [G.GPSLongitudeRef]: gps.longitude >= 0 ? "E" : "W",
    [G.GPSLongitude]: decimalToDmsRational(gps.longitude),
    [G.GPSMapDatum]: gps.mapDatum ?? "WGS-84",
  };
  if (gps.altitude != null) {
    ifd[G.GPSAltitudeRef] = gps.altitude >= 0 ? 0 : 1;
    ifd[G.GPSAltitude] = [Math.round(Math.abs(gps.altitude) * 100), 100];
  }
  if (gps.accuracy != null) {
    ifd[G.GPSHPositioningError] = [Math.round(gps.accuracy * 100), 100];
  }
  if (gps.timestampUtc) {
    const t = gps.timestampUtc;
    const p2 = (n: number) => String(n).padStart(2, "0");
    ifd[G.GPSDateStamp] = `${t.getUTCFullYear()}:${p2(t.getUTCMonth() + 1)}:${p2(t.getUTCDate())}`;
    ifd[G.GPSTimeStamp] = [
      [t.getUTCHours(), 1],
      [t.getUTCMinutes(), 1],
      [t.getUTCSeconds() * 1000 + t.getUTCMilliseconds(), 1000],
    ];
  }
  return ifd;
}

/**
 * The compressor redraws through a canvas → output pixels are upright and the
 * embedded thumbnail is stale. Force Orientation = 1 and drop the thumbnail.
 */
export function normaliseForReencodedJpeg(exif: ExifIfds): void {
  exif["0th"][piexifjs.ImageIFD.Orientation] = 1;
  exif["0th"][piexifjs.ImageIFD.Software] = "PWD Tools Suite Image Compressor";
  exif.thumbnail = null;
}

/**
 * DateTimeOriginal is local wall-clock "YYYY:MM:DD HH:MM:SS" carrying no zone
 * and no milliseconds. It is taken as written rather than converted: inventing
 * an offset the file never recorded would be a worse lie than the mismatch.
 */
const parseDateTimeOriginal = (exif: ExifIfds | null): Date | null => {
  const raw = exif?.Exif?.[piexifjs.ExifIFD.DateTimeOriginal];
  if (typeof raw !== "string") return null;
  const m = raw.match(/^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/);
  if (!m) return null;
  const Y = Number(m[1]), Mo = Number(m[2]), D = Number(m[3]);
  const h = Number(m[4]), mi = Number(m[5]), s = Number(m[6]);
  if (![Y, Mo, D, h, mi, s].every(Number.isFinite)) return null;
  return new Date(Date.UTC(Y, Mo - 1, D, h, mi, s));
};

/** Build the EXIF to attach: start from the source, override GPS if supplied. */
export function composeExif(
  source: ExifIfds | null,
  gps: GpsDetails | null,
): ExifIfds {
  const base: ExifIfds = source
    ? { ...(JSON.parse(JSON.stringify(source)) as ExifIfds), thumbnail: null }
    : emptyExif();
  // Rebuild unless the point came from the file's own GPS IFD — keeping the
  // original IFD verbatim preserves satellites / DOP / direction / speed, but a
  // rebuild is still required when the source carries no usable GPS at all.
  const sourceHasGps = !!readGps(source);
  if (gps && (gps.source !== "exif" || !sourceHasGps)) {
    // Reviewers cross-check the GPS stamp against DateTimeOriginal, so the
    // capture time wins over the device clock. It only replaces a stamp that was
    // already going to be written — it never introduces one on its own.
    const captured = parseDateTimeOriginal(source);
    const stamp = gps.timestampUtc ? captured ?? gps.timestampUtc : null;
    base.GPS = buildGpsIfd({ ...gps, timestampUtc: stamp });
  }
  normaliseForReencodedJpeg(base);
  return base;
}

/** Insert EXIF into a JPEG blob, then re-parse to prove it landed. */
export async function injectExif(
  jpeg: Blob,
  exif: ExifIfds,
  expectGps: boolean,
): Promise<InjectResult> {
  try {
    const dataUrl = arrayBufferToDataUrl(await jpeg.arrayBuffer());
    const inserted = piexifjs.insert(piexifjs.dump(exif), dataUrl);
    const blob = new Blob([dataUrlToBytes(inserted)], { type: "image/jpeg" });

    const check = piexifjs.load(arrayBufferToDataUrl(await blob.arrayBuffer()));
    const ok = expectGps
      ? !!(check.GPS[piexifjs.GPSIFD.GPSLatitude] && check.GPS[piexifjs.GPSIFD.GPSLongitude])
      : Object.keys(check["0th"]).length > 0;

    return { blob, ok, error: ok ? undefined : "EXIF written but not re-read back" };
  } catch (e) {
    return { blob: jpeg, ok: false, error: (e as Error)?.message ?? "EXIF injection failed" };
  }
}

export const gmapsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
