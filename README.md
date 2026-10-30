# PWD Tools Monorepo

A pnpm workspace holding the PWD Tools suite — the document and correspondence
tools used by PWD Udaipur.

| Path | What it is |
| --- | --- |
| `artifacts/pwd-tools` | The application: React 19 + Vite 7 + Tailwind 4 SPA (wouter routing) with the PWD document tools — work orders, notices, EOT letters, bank communication, contractor enlistment, and image compression with authoritative GPS EXIF stamping |
| `scripts` | Node smoke tests used as CI gates |
| `.kiro/steering` | Standing specifications that override convenience |

## Requirements

- **pnpm 10.33.0** — the root `preinstall` script rejects npm and yarn.
- Node 22+ for the smoke tests, which import TypeScript directly and rely on native type stripping.

`pnpm-lock.yaml` is intentionally gitignored (v9 catalog format is not supported on the Netlify build servers), so installs resolve from the registry.

## Routes

`artifacts/pwd-tools/src/App.tsx` is the single source of truth. The navigation
smoke test walks this table, so a route added to the router without a working
component fails CI.

| Route | Component |
| --- | --- |
| `/` | `Home` |
| `/tool/:id` | `ToolViewer` |
| **Correspondence** | |
| `/audit-reply` | `AuditReply` |
| `/data-vault` | `DataVaultPage` |
| `/correspondence` | `CorrespondencePage` |
| `/legal-correspondence` | `LegalCorrespondencePage` |
| **Bill & Financial** | |
| `/bill-form` | `BillForm` |
| `/speed-money-tool` | `SpeedMoneyTool` |
| `/excel-to-emd` | `ExcelToEmd` |
| `/document-generator` | `DocumentGenerator` |
| `/enrollment-data` | `EnrollmentDataForm` |
| **Contractor** | |
| `/contractor-registration` | `ContractorRegistration` |
| `/bank-communication` | `BankCommunication` |
| **New tools** | |
| `/notice` | `NoticePage` |
| `/work-order` | `WorkOrderPage` |
| `/eot-letter` | `EotLetterPage` |
| `/rescission-notice` | `RescissionNoticePage` |
| `/no-dues` | `NoDuesPage` |
| `/image-compressor` | `ImageCompressor` |
| *(anything else)* | `NotFound` |

## Dev setup

From the repository root:

| Command | Effect |
| --- | --- |
| `pnpm dev` | Run the `@workspace/pwd-tools` dev server on `0.0.0.0` |
| `pnpm build` | Typecheck, then build every package |
| `pnpm typecheck` | Typecheck the libraries, `artifacts/**`, and `scripts` |
| `pnpm test` | Vitest |
| `pnpm smoketest:gps` | GPS/EXIF smoke test |
| `pnpm smoketest:navigation` | Route navigation smoke test |

Only the GPS and navigation harnesses are wired into `package.json`. The other
three exist and are run directly:

```bash
node scripts/tests/smoketest-gps.mjs              # EXIF/GPS layer, writes scripts/tests/.out/gps-smoke.jpg
node scripts/tests/smoketest-navigation.mjs       # route table above
node scripts/tests/smoketest-audit.mjs            # Audit Reply data + docx generation
node scripts/tests/smoketest-bankletter.mjs       # Bank communication letter templates
node scripts/tests/smoketest-transliteration.mjs  # roman-to-hindi dictionary
```

Every harness exits `0` only when all its checks pass and prints a per-check
report, so a failure identifies itself. They set `process.exitCode` rather than
calling `process.exit()`: on Node 26/Windows the latter tears the loop down
while libuv async handles are still closing, which reported a red run as
`0xC0000409` instead of exit 1.

## Document output rules

The standing specification is
[`.kiro/steering/doc-pdf-print-specifications.md`](.kiro/steering/doc-pdf-print-specifications.md).
Read it before touching any docx, PDF or print code.

Two rules that catch people out:

- **Output is `.docx` or `.pdf` only.** Never emit `.txt` or plain-text letter
  files.
- **Never add a header or footer.** Both margin heights are `0`, with no running
  header, no page numbers and no running footer.

> **Resolved everywhere except one route:** the footer is opt-in. Call
> [`usePrintPage`](artifacts/pwd-tools/src/lib/printPage.ts) with no second
> argument and no `@bottom-center` box is emitted at all. Only the audit
> workspace (`AuditReply/AuditWorkspace.tsx`) passes the text ("DRAFTED BY
> PRIYANKA JAIN, PWD UDAIPUR"), so that single route still contradicts the rule
> above.

## Deployment: the CSP must allow jsdelivr, or compression self-hosts

`artifacts/pwd-tools/src/pages/ImageCompressor.tsx` calls
`browser-image-compression` with `useWebWorker: true`. That makes the library
**import itself inside the worker** from its default `libURL`:

```
https://cdn.jsdelivr.net/npm/browser-image-compression/dist/browser-image-compression.js
```

[`netlify.toml`](netlify.toml) therefore ships a `Content-Security-Policy`
header allowing `https://cdn.jsdelivr.net` in both `script-src` and
`worker-src`. `blob:` covers the worker script itself.

**Failure mode.** If the CSP omits jsdelivr, that import is blocked and
compression silently falls back to the main thread. Compression still succeeds
and no error is surfaced, but the UI can freeze on large photos. The same
fallback happens on a poor network connection. This is a deployment dependency,
not a code defect — it is invisible to the smoke tests, because they exercise
the EXIF layer rather than the worker.

**To remove the dependency entirely**, set `options.libURL` to a self-hosted
copy of `browser-image-compression.js` and then drop jsdelivr from the policy.

## GPS / EXIF limitations

Known and accepted, not bugs:

- **JPEG only.** `piexifjs` cannot read or write PNG or HEIC. Anything else is
  rejected with an explicit message rather than silently passing through.
- **No XMP or ICC preservation.** Only the EXIF IFDs are carried across; colour
  profiles and XMP blocks are dropped by the re-encode.
- **Orientation.** The compressor redraws through a canvas, so output pixels are
  upright and `Orientation` is forced to `1`. Whether the *input* was rotated
  correctly is the browser's EXIF handling, which varies by engine.
- **Timestamps.** `GPSDateStamp`/`GPSTimeStamp` follow the photo's
  `DateTimeOriginal` when the file has one, and fall back to the device clock
  otherwise. `DateTimeOriginal` carries no timezone, so it is written as-is;
  a device-clock stamp is UTC.

## Contributing

- Wrap new full-page tools in
  [`ToolShell`](artifacts/pwd-tools/src/components/ToolShell.tsx) so the Home
  button and the print-hidden header stay consistent.
- Any page that prints must call
  [`usePrintPage`](artifacts/pwd-tools/src/lib/printPage.ts) with the right
  orientation (`"landscape"` for the wide tables). Omit the second argument
  unless the page genuinely needs a running footer. `index.css` must declare no
  `@page` of its own — the per-route rule is the only one, and
  `scripts/tests/smoketest-print.mjs` fails if that drifts.
- Add or extend a smoketest for anything you change in `src/lib`. The GPS and
  navigation harnesses are wired as CI gates; the rest must at least keep
  passing when run directly.
- Report flakes as defects rather than retrying until green.
