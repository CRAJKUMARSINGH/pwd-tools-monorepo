# Known issues / pre-existing debt

Short note to accompany the E-05 (ErrorBoundary), E-09 (CI workflow) and E-12 (Netlify headers) work.
These items are **outside the scope** of that work and are tracked separately.

## Verification snapshot (measured, this revision)

- `node scripts/tests/smoketest-audit.mjs` — 54 passed, 0 failed
- `node scripts/tests/smoketest-transliteration.mjs` — 49 passed, 0 failed
- `node scripts/tests/smoketest-bankletter.mjs` — 35 passed, 0 failed
- `node scripts/tests/smoketest-navigation.mjs` — 19 routes checked, 0 gaps
- `node scripts/tests/smoketest-gps.mjs` — 39/39 checks
- `node scripts/tests/smoketest-print.mjs` — print contracts hold

Environment caveat: `pnpm typecheck` cannot run in the sandbox (`corepack/dist/pnpm.js` is
missing). Types were checked by invoking `tsc` directly against
`artifacts/pwd-tools/tsconfig.json`.

## Pre-existing `tsc` errors (NOT introduced by this work)

`tsc -p artifacts/pwd-tools/tsconfig.json --noEmit` reports **234 error lines** at this
revision. Breakdown by code:

| Code  | Count | Where / cause |
|-------|-------|---------------|
| TS2322 | 110 | Radix UI + React 19 `Omit<…, "ref"> & RefAttributes` mismatch — `src/components/ui/*` and consuming pages (`BankCommunicationGenerator.tsx`, `DocumentGenerator.tsx`, …) |
| TS2339 | 100 | Same Radix/React-19 typing drift (`className`/`children` not on the derived prop types) |
| TS1117 | 8   | Duplicate object-literal keys in `src/lib/roman-to-hindi.ts` (`DICT`/`PHONETIC` tables) |
| TS7006 | 6   | Implicit `any` parameters |
| TS2559 | 4   | Type has no properties in common |
| TS2741 | 2   | Missing property in object literal |
| TS2304 | 1   | Cannot find name |
| TS2345 | 1   | Argument type mismatch |
| TS2724 | 1   | `QueryClient` not exported by `@tanstack/react-query` — `src/App.tsx:24` |
| TS7031 | 1   | Binding element implicitly `any` |

Notes:

- The bulk (TS2322 + TS2339 = 210) is dependency-version drift between the installed
  `@types/react` (19) and the Radix UI primitives. It predates and is unrelated to the
  E-05 / E-09 / E-12 work and the AuditReply feature restoration.
- TS1117 in `roman-to-hindi.ts` is a genuine pre-existing defect (later key silently
  overrides an earlier duplicate). Untouched by this work.
- TS2724 `QueryClient` in `App.tsx:24` is the error originally expected above; its import
  line is unchanged by this work.
- **Zero** `tsc` errors are reported in the files restored/added here:
  `AuditReplyPage.tsx`, `lib/generate-docx.ts`, `NoDuesPage.tsx`,
  `components/ErrorBoundary.tsx`, `lib/printPage.ts`.

## Lint

`pnpm lint` cannot be executed in the sandbox (same corepack issue), so any lint findings
are unverified here and are not claimed as clean. They remain tracked as pre-existing debt.

## Disposition

The CI gate (`.github/workflows/ci.yml`, `test:smoke`) is intentionally left strict — no
suites excluded, no lowered bar. On CI the typecheck step will still surface the
pre-existing errors above until the Radix/React-19 typing drift and the
`roman-to-hindi.ts` duplicates are addressed in a separate change.
