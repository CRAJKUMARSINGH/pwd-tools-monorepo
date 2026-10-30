#!/usr/bin/env node
/**
 * smoketest-print.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * E-02 regression guard.
 *
 * The A4 print geometry is declared in three separate places, and every past
 * print regression came from them drifting apart:
 *
 *   • `src/index.css`          — must declare NO `@page` at all, or it collides
 *                                with the per-route rule and every portrait tool
 *                                prints landscape.
 *   • `src/lib/printPage.ts`   — the one place allowed to emit `@page`.
 *   • `pages/DocumentGenerator.tsx` — must pin portrait and must not emit a
 *                                footer margin box.
 *
 * Run:  node scripts/tests/smoketest-print.mjs
 *
 * Exit code 0 = pass, 1 = a print contract was broken. No network.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../..");
const css = readFileSync(path.join(ROOT, "artifacts/pwd-tools/src/index.css"), "utf8");
const doc = readFileSync(
  path.join(ROOT, "artifacts/pwd-tools/src/pages/DocumentGenerator.tsx"),
  "utf8",
);

let bad = 0;
const fail = (m) => {
  console.log(`  ✗ ${m}`);
  bad++;
};

if ((css.match(/@page\s*\{/g) || []).length) fail("index.css still declares @page");
if (!/usePrintPage\(\s*"portrait"\s*\)/.test(doc)) fail("DocumentGenerator is not pinned to portrait");
if (/@bottom-center/.test(doc)) fail("DocumentGenerator emits a footer");
if (/margin-bottom:\s*0\s*!important/.test(css)) fail("blanket margin reset is back");

console.log(
  bad
    ? `\nFAIL — ${bad} print contract${bad === 1 ? "" : "s"} broken`
    : "\nPASS — print contracts hold",
);
// exitCode, not process.exit(): the latter races libuv teardown on Node 26/Windows
process.exitCode = bad ? 1 : 0;
