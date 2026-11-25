import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";
import { readFile } from "node:fs/promises";
import { inflateRawSync } from "node:zlib";

const testDb = new URL(process.env.TEST_DATABASE_URL ?? "postgresql://localhost/postgres");
assert.ok(process.env.TEST_DATABASE_URL, "Set TEST_DATABASE_URL to the disposable integration database.");
assert.ok(["localhost", "127.0.0.1", "[::1]"].includes(testDb.hostname), "Use a loopback test database.");
const schema = `corr_test_${randomBytes(8).toString("hex")}`;
testDb.searchParams.set("options", `-c search_path=${schema}`);
process.env.DATABASE_URL = testDb.href;
process.env.NODE_ENV = "production";
process.env.LOG_LEVEL = "silent";
process.env.PWD_CORRESPONDENCE_API_KEY = randomBytes(32).toString("base64url");

const { pool } = await import("../../lib/db/src/index.ts");
const { default: app } = await import("../../artifacts/api-server/src/app.ts");

function documentXml(zip) {
  const end = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  assert.ok(end >= 0, "Expected a DOCX archive.");
  let central = zip.readUInt32LE(end + 16);
  while (central < end) {
    assert.equal(zip.readUInt32LE(central), 0x02014b50);
    const nameLength = zip.readUInt16LE(central + 28);
    const name = zip.toString("utf8", central + 46, central + 46 + nameLength);
    if (name === "word/document.xml") {
      const header = zip.readUInt32LE(central + 42);
      const start = header + 30 + zip.readUInt16LE(header + 26) + zip.readUInt16LE(header + 28);
      const compressed = zip.subarray(start, start + zip.readUInt32LE(central + 20));
      return (zip.readUInt16LE(central + 10) === 8 ? inflateRawSync(compressed) : compressed).toString("utf8");
    }
    central += 46 + nameLength + zip.readUInt16LE(central + 30) + zip.readUInt16LE(central + 32);
  }
  throw new Error("Missing main Word document.");
}

let server;
let createdSchema = false;
try {
  await pool.query(`CREATE SCHEMA ${schema}`);
  createdSchema = true;
  await pool.query(`
    CREATE TABLE correspondence_letters (
      id serial PRIMARY KEY, type text NOT NULL, status text NOT NULL DEFAULT 'draft',
      letter_number text NOT NULL DEFAULT '', date text NOT NULL DEFAULT '',
      to_name text NOT NULL DEFAULT '', to_designation text NOT NULL DEFAULT '', to_office text NOT NULL DEFAULT '',
      subject text NOT NULL DEFAULT '', reference text, body text NOT NULL DEFAULT '',
      from_name text NOT NULL DEFAULT '', from_designation text NOT NULL DEFAULT '', from_office text NOT NULL DEFAULT '',
      cc text, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  await pool.query("INSERT INTO correspondence_letters (type, body) VALUES ($1, $2)", ["new", "पहले से सहेजा गया पत्र"]);
  const migration = await readFile(new URL("../../lib/db/migrations/001-bilingual-correspondence.sql", import.meta.url), "utf8");
  await pool.query(migration);
  await pool.query(migration);

  server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  const origin = `http://127.0.0.1:${server.address().port}`;
  const root = "/api/correspondence/letters";
  const request = (path, method = "GET", data) => fetch(origin + path, {
    method,
    headers: { Authorization: `Bearer ${process.env.PWD_CORRESPONDENCE_API_KEY}`, "Content-Type": "application/json" },
    body: data === undefined ? undefined : JSON.stringify(data),
  });
  const json = async (response, expected = 200) => {
    const body = await response.text();
    assert.equal(response.status, expected, body);
    return JSON.parse(body);
  };

  const old = await json(await request(root + "/1"));
  assert.equal(old.language, "hindi");
  assert.equal(old.body, "पहले से सहेजा गया पत्र");
  assert.equal(old.bodyEn, "");

  const draft = {
    type: "new", language: "both", letterNumber: "25/26", date: "25.11.2026",
    toName: "परीक्षण", toDesignation: "अभियंता", toOffice: "उदयपुर",
    subject: "परीक्षण पत्र", body: "मूल हिन्दी विषयवस्तु", reference: "पुराना संदर्भ",
    fromName: "लेखक", fromDesignation: "अभियंता", fromOffice: "उदयपुर",
    toNameEn: "Office Clerk", toDesignationEn: "Clerk", toOfficeEn: "Udaipur",
    subjectEn: "Bilingual verification", referenceEn: "Previous reference", bodyEn: "Original English body",
    fromNameEn: "Test Author", fromDesignationEn: "Executive Engineer", fromOfficeEn: "Udaipur", ccEn: "Records office",
  };
  const saved = await json(await request(root, "POST", draft), 201);
  const path = `${root}/${saved.id}`;
  for (const [key, value] of Object.entries(draft)) assert.equal(saved[key], value, key);
  assert.ok((await json(await request(root))).some(letter => letter.id === saved.id && letter.bodyEn === draft.bodyEn));
  assert.equal((await request(path, "PATCH", {})).status, 400);

  const changed = await json(await request(path, "PATCH", { bodyEn: "Revised English body", reference: "" }));
  assert.equal(changed.body, draft.body);
  assert.equal(changed.reference, "");
  assert.equal(changed.bodyEn, "Revised English body");

  const download = await request(path + "/download");
  assert.equal(download.status, 200);
  assert.match(download.headers.get("content-type"), /wordprocessingml\.document/);
  const xml = documentXml(Buffer.from(await download.arrayBuffer()));
  assert.ok(xml.includes(draft.body));
  assert.ok(xml.includes(changed.bodyEn));
  assert.ok(!xml.includes(draft.bodyEn));
  const generated = await json(await request(path + "/generate-docx", "POST"));
  assert.equal(generated.downloadPath, path + "/download");
  assert.equal((await request(path, "DELETE")).status, 204);
  assert.equal((await request(generated.downloadPath)).status, 404);
  console.log("PASS — legacy letters, bilingual save and edit, fresh DOCX, and delete");
} finally {
  if (server) await new Promise(resolve => server.close(resolve));
  try {
    if (createdSchema) await pool.query(`DROP SCHEMA ${schema} CASCADE`);
  } finally {
    await pool.end();
  }
}
