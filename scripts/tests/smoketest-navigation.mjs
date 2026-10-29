#!/usr/bin/env node
/**
 * smoketest-navigation.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * E-01 regression guard.
 *
 * Derives the route list from `artifacts/pwd-tools/src/App.tsx` so a new page
 * cannot ship without (a) a way home and (b) a per-route document title.
 *
 *   • Home affordance  — the page mentions <ToolShell> or calls navigate("/")
 *   • document.title   — the page calls useDocumentTitle(...)
 *
 * `/` is exempt from the Home-affordance check (there is nowhere to go back to),
 * `NotFound` is exempt entirely, and thin wrappers that render another page
 * (which carries the shell itself) are listed in WRAPPERS.
 *
 * Run:  npx tsx scripts/tests/smoketest-navigation.mjs
 *       (or: node scripts/tests/smoketest-navigation.mjs)
 *
 * Exit code 0 = pass, 1 = gaps found. No network.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(fileURLToPath(import.meta.url), "../../..");
const SRC = path.join(ROOT, "artifacts/pwd-tools/src");
const app = readFileSync(path.join(SRC, "App.tsx"), "utf8");

// component name → import specifier
const imports = Object.fromEntries(
  [...app.matchAll(/import\s+(\w+)\s+from\s+"(@\/pages\/[^"]+)"/g)].map(([, n, p]) => [n, p]),
);

// every routable page — handles component={X}, component={() => <X />}
// and the path-less catch-all (which is dropped, having no `path`).
const routes = app
  .split(/\r?\n/)
  .filter((line) => line.includes("<Route"))
  .map((line) => {
    const route = line.match(/path="([^"]+)"/)?.[1];
    const comp =
      line.match(/component=\{\s*\(\s*\)\s*=>\s*<(\w+)/)?.[1] ??
      line.match(/component=\{(\w+)\}/)?.[1] ??
      line.match(/component=(\w+)/)?.[1];
    return route && comp ? { route, comp } : null;
  })
  .filter(Boolean)
  .filter(({ comp }) => imports[comp]);

/** Pages that need neither check. */
const EXEMPT = new Set(["NotFound"]);
/** Routes that *are* home — nowhere to navigate back to. */
const HOME_ROUTES = new Set(["/"]);
/** Thin wrappers that render another page which carries the shell itself. */
const WRAPPERS = new Set(["ContractorRegistration"]);

/** `@/pages/Correspondence` → `src/pages/Correspondence/index.tsx` */
function resolvePageFile(spec) {
  const rel = spec.replace(/^@\//, "");
  const direct = path.join(SRC, rel + ".tsx");
  if (existsSync(direct)) return direct;
  const index = path.join(SRC, rel, "index.tsx");
  if (existsSync(index)) return index;
  return null;
}

let failed = 0;
for (const { route, comp } of routes) {
  if (EXEMPT.has(comp)) continue;

  const file = resolvePageFile(imports[comp]);
  if (!file) {
    failed++;
    console.log(`  ✗ ${route.padEnd(26)} ${comp.padEnd(26)} page file not found`);
    continue;
  }
  const text = readFileSync(file, "utf8");

  const hasHome = /<ToolShell\b/.test(text) || /navigate\(\s*["'`]\/["'`]\s*\)/.test(text);
  const hasTitle = /useDocumentTitle\s*\(/.test(text);

  const checks = [[hasTitle, "document.title (useDocumentTitle)"]];
  if (!HOME_ROUTES.has(route) && !WRAPPERS.has(comp)) checks.push([hasHome, "Home affordance"]);

  for (const [ok, what] of checks) {
    if (ok) continue;
    failed++;
    console.log(`  ✗ ${route.padEnd(26)} ${comp.padEnd(26)} missing ${what}`);
  }
}

console.log(`\n${routes.length} routes checked — ${failed} gap${failed === 1 ? "" : "s"}`);
// exitCode, not process.exit(): the latter races libuv teardown on Node 26/Windows
process.exitCode = failed ? 1 : 0;
