import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { Script } from "node:vm";

const directory = new URL("../../artifacts/pwd-tools/public/tools/", import.meta.url);
const netlify = readFileSync(new URL("../../netlify.toml", import.meta.url), "utf8");
const policy = netlify.match(/Content-Security-Policy = "[^"]*script-src ([^;]+)/)?.[1].split(" ");
assert.ok(policy?.includes("'self'"), "Netlify must allow scripts packaged with the app");
assert.ok(!policy.includes("'unsafe-inline'"), "Legacy tools must run without inline script permissions");

const tools = readdirSync(directory).filter(name => name.endsWith(".html"));
for (const tool of tools) {
  const html = readFileSync(new URL(tool, directory), "utf8");
  assert.doesNotMatch(html, /\son\w+\s*=/i, `${tool} has an inline event handler`);
  for (const [, attributes, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const src = attributes.match(/\bsrc="([^"]+)"/)?.[1];
    assert.ok(src && !body.trim(), `${tool} contains inline script`);
    if (src.startsWith("https://")) {
      assert.ok(policy.includes(src), `${tool} script is blocked by the Netlify policy: ${src}`);
    } else {
      const script = readFileSync(new URL(src, directory), "utf8");
      new Script(script, { filename: src });
    }
  }
}
console.log(`PASS — scripts in all ${tools.length} legacy tool pages match the Netlify policy`);
