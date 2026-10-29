# PWD Tools Monorepo

A pnpm workspace holding the PWD Tools suite.

| Path | What it is |
| --- | --- |
| `artifacts/pwd-tools` | The application: React 19 + Vite 7 + Tailwind 4 SPA (wouter routing) with the PWD document tools — work orders, notices, EOT letters, bank communication, contractor enlistment, and image compression with authoritative GPS EXIF stamping |
| `scripts` | Node smoke tests used as CI gates |

## Requirements

- **pnpm 10.33.0** — the root `preinstall` script rejects npm and yarn.
- Node 22+ for the smoke tests, which import TypeScript directly and rely on native type stripping.

`pnpm-lock.yaml` is intentionally gitignored (v9 catalog format is not supported on the Netlify build servers), so installs resolve from the registry.

## Scripts

From the repository root:

| Command | Effect |
| --- | --- |
| `pnpm dev` | Run the `@workspace/pwd-tools` dev server on `0.0.0.0` |
| `pnpm build` | Typecheck, then build every package |
| `pnpm typecheck` | Typecheck the libraries, `artifacts/**`, and `scripts` |
| `pnpm test` | Vitest |
| `pnpm smoketest:gps` | GPS/EXIF smoke test |
| `pnpm smoketest:navigation` | Route navigation smoke test |

When pnpm is unavailable, the smoke tests can be run directly:

```bash
node scripts/tests/smoketest-gps.mjs
node scripts/tests/smoketest-navigation.mjs
```

Both exit `0` only when every check passes, and print a per-check report so a failure identifies itself. `smoketest-gps.mjs` also writes `scripts/tests/.out/gps-smoke.jpg` (gitignored) for eyeballing.

## Deployment: the CSP must allow jsdelivr, or compression self-hosts

`artifacts/pwd-tools/src/pages/ImageCompressor.tsx` calls `browser-image-compression` with `useWebWorker: true`. With the worker enabled, the library **imports itself inside the worker** from its default `libURL`:

```
https://cdn.jsdelivr.net/npm/browser-image-compression/dist/browser-image-compression.js
```

The library's own documentation therefore prescribes this CSP:

```
content-security-policy: script-src 'self' blob: https://cdn.jsdelivr.net
```

`blob:` covers the worker script itself; `https://cdn.jsdelivr.net` covers the import above.

**Failure mode.** If the CSP omits jsdelivr, that import is blocked and compression silently falls back to the main thread. Compression still succeeds and no error is surfaced, but the UI can freeze on large photos. The same fallback happens on a poor network connection. This is a deployment dependency, not a code defect — it is invisible to the smoke tests, because they exercise the EXIF layer rather than the worker.

**To remove the dependency entirely**, set `options.libURL` to a self-hosted copy of `browser-image-compression.js` and then allow only `script-src 'self' blob:`. The option is documented as `libURL` in `browser-image-compression`'s README.
