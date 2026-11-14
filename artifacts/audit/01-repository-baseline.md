# Phase A — Repository Baseline

**Audit date:** 14 November 2026  
**Auditor:** Kiro (independent inspection)

---

## Git state

| Item | Value |
|------|-------|
| Branch | `main` |
| `HEAD` SHA | `47b444452f39bf0f43f2911da178c143f8b0c85f` |
| `origin/main` SHA | `47b444452f39bf0f43f2911da178c143f8b0c85f` |
| Working tree | **clean** (no uncommitted changes) |
| Divergence | None — local == remote |

## Requested commit verification

| Commit | Present | Subject |
|--------|---------|---------|
| `853ef86` | ✅ | fix(not-found): add Home navigation button + tighten navigation smoke test |
| `49bedec` | ✅ | docs: add full audit report PWD_TOOLS_FULL_AUDIT_REPORT.md |
| `47b4444` | ✅ | docs: update audit report — all 15 bugs fixed, 0 TS errors, Netlify verified |

## Recent commit history

```
47b4444  docs: update audit report — all 15 bugs fixed, 0 TS errors, Netlify verified
6e008fd  fix(ts): eliminate all 11 TypeScript errors — zero tsc errors remain
49bedec  docs: add full audit report PWD_TOOLS_FULL_AUDIT_REPORT.md
853ef86  fix(not-found): add Home navigation button + tighten navigation smoke test
5887897  feat: No-Dues page, registration one-page output, image GPS cleanup, AuditReply refactor
bfd89eb  fix(pwd-tools): single JPEG gate, Null Island guard, and DateTimeOriginal GPS stamps
e08ad5f  test(scripts): finish the process.exitCode conversion across the smoke harnesses
43273fb  fix(pwd-tools): apply reviewed EXIF deltas and pin the smoke-test exit code
f00c49e  feat(pwd-tools): apply CODE-JUNCTION patch set (parity, GPS, navigation, Audit Reply)
cfe8e08  fix: add Home button to Audit Reply page header
```

## Registered routes (from App.tsx — current source)

| Path | Component | Home nav mechanism |
|------|-----------|-------------------|
| `/` | `Home` | — (is home) |
| `/tool/:id` | `ToolViewer` | `navigate("/")` |
| `/audit-reply` | `AuditReply/index` | `ToolShell` (landing/upload) + `navigate("/")` (workspace) |
| `/data-vault` | `DataVaultPage` | `navigate("/")` in header |
| `/correspondence` | `CorrespondencePage` | `ToolShell` |
| `/legal-correspondence` | `LegalCorrespondencePage` | `ToolShell` |
| `/bill-form` | `BillForm` | `ToolShell` |
| `/speed-money-tool` | `SpeedMoneyTool` | `ToolShell` |
| `/excel-to-emd` | `ExcelToEmd` | `ToolShell` |
| `/document-generator` | `DocumentGenerator` | `ToolShell` |
| `/enrollment-data` | `EnrollmentDataForm` | `ToolShell` |
| `/contractor-registration` | `ContractorRegistration` | wrapper → `DocumentGenerator` → `ToolShell` |
| `/bank-communication` | `BankCommunication` | `ToolShell` wrapper |
| `/notice` | `NoticePage` | `ToolShell` |
| `/work-order` | `WorkOrderPage` | `ToolShell` |
| `/eot-letter` | `EotLetterPage` | `ToolShell` |
| `/rescission-notice` | `RescissionNoticePage` | `ToolShell` |
| `/no-dues` | `NoDuesPage` | `ToolShell` |
| `/image-compressor` | `ImageCompressor` | `navigate("/")` |
| (catch-all) | `NotFound` | `navigate("/")` — "← Back to Home" button |

**Total routed pages: 19 (+ catch-all 404)**

## Infrastructure

| Item | Value |
|------|-------|
| Build tool | Vite 7.3.6 |
| Framework | React 19.1.0 |
| Routing | wouter 3.10.0 |
| Package manager | pnpm 10.33.0 |
| Node target | .nvmrc (22+) |
| Deployment | Netlify — auto-deploy on push to main |
| SPA fallback | `[[redirects]] /* → /index.html status=200` |
| CSP | `script-src 'self' cdn.jsdelivr.net` (for image-compression worker) |
