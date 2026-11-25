import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { once } from "node:events";

const key = randomBytes(32).toString("base64url");
const configured = !process.argv.includes("--unconfigured");
process.env.NODE_ENV = "production";
process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/test";
process.env.PWD_API_ALLOWED_ORIGINS = "https://office.example.test";
if (configured) process.env.PWD_CORRESPONDENCE_API_KEY = key;
else delete process.env.PWD_CORRESPONDENCE_API_KEY;

const { default: app } = await import("../../artifacts/api-server/src/app.ts");
const server = app.listen(0, "127.0.0.1");
try {
  await once(server, "listening");
  const base = `http://127.0.0.1:${server.address().port}/api`;
  const authorization = { Authorization: `Bearer ${key}` };
  const send = (path, init) => fetch(base + path, init);
  assert.equal((await send("/healthz")).status, 200);
  const protectedRoutes = [
    ["GET", "/session"],
    ["GET", "/correspondence/letters"],
    ["POST", "/correspondence/letters"],
    ["PATCH", "/correspondence/letters/1"],
    ["DELETE", "/correspondence/letters/1"],
    ["POST", "/correspondence/letters/1/generate-docx"],
    ["GET", "/correspondence/letters/1/download"],
    ["GET", "/legal/letters"],
    ["PATCH", "/legal/letters/1/finalize"],
    ["GET", "/legal/styles"],
  ];
  for (const [method, path] of protectedRoutes) {
    const response = await send(path, { method });
    assert.equal(response.status, configured ? 401 : 503, `${method} ${path}`);
    assert.equal(response.headers.get("cache-control"), "no-store");
  }
  assert.equal((await send("/session", { headers: authorization })).status, configured ? 204 : 503);
  if (configured) {
    const wrongKey = randomBytes(32).toString("base64url");
    assert.equal((await send("/session", { headers: { Authorization: `Bearer ${wrongKey}` } })).status, 401);
    assert.equal((await send("/correspondence/letters/invalid", { headers: authorization })).status, 400);
    assert.equal((await send("/legal/letters/invalid", { headers: authorization })).status, 400);
    for (const [path, body] of [
      ["/correspondence/letters/1", { subject: false }],
      ["/legal/letters/1", { subject: false }],
      ["/legal/styles/1", { name: false }],
    ]) {
      assert.equal((await send(path, {
        method: "PATCH",
        headers: { ...authorization, "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })).status, 400);
    }
    for (const origin of ["https://office.example.test", "https://other.example.test"]) {
      const response = await send("/session", {
        method: "OPTIONS",
        headers: { Origin: origin, "Access-Control-Request-Method": "GET", "Access-Control-Request-Headers": "Authorization" },
      });
      assert.equal(response.headers.get("access-control-allow-origin"), origin.includes("office.") ? origin : null);
    }
  }
  console.log(configured ? "PASS — correspondence API access checks" : "PASS — missing key fails closed");
} finally {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
