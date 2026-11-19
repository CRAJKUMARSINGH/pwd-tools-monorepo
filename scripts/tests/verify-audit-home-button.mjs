/**
 * verify-audit-home-button.mjs
 *
 * Verifies that the AuditReply Back-to-Home button fix is structurally correct:
 *  1. Only ONE sticky header at top-0 exists when in workspace mode
 *     (must be in index.tsx, NOT AuditWorkspace.tsx)
 *  2. The header contains a "← Back to Home" button with aria-label="Back to Home"
 *  3. The header has hide-on-print (excluded from print)
 *  4. The header has z-40 (above all workspace content)
 *  5. AuditWorkspace no longer has its own sticky top-0 header
 *  6. The tab bar in AuditWorkspace uses top-[41px] (single header offset)
 *  7. The landing/upload path still uses ToolShell (which has its own Home button)
 *  8. No competing z-index on workspace content that could obscure the header
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../artifacts/pwd-tools/src");

let pass = 0;
let fail = 0;

function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ ${label}`);
    pass++;
  } else {
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ""}`);
    fail++;
  }
}

const indexSrc = readFileSync(resolve(root, "pages/AuditReply/index.tsx"), "utf8");
const workspaceSrc = readFileSync(resolve(root, "pages/AuditReply/AuditWorkspace.tsx"), "utf8");

console.log("\n── AuditReply/index.tsx ─────────────────────────────────────────────");

check(
  "imports FileText from lucide-react",
  /import\s*\{[^}]*FileText[^}]*\}\s*from\s*["']lucide-react["']/.test(indexSrc)
);
check(
  "imports ArrowLeft from lucide-react",
  /import\s*\{[^}]*ArrowLeft[^}]*\}\s*from\s*["']lucide-react["']/.test(indexSrc)
);
check(
  "workspace branch renders a <header> element (not a <div>)",
  /<header\b/.test(indexSrc)
);
check(
  "header has hide-on-print class",
  /hide-on-print/.test(indexSrc)
);
check(
  "header has sticky top-0 z-40",
  /sticky top-0 z-40/.test(indexSrc)
);
check(
  'Back-to-Home button has aria-label="Back to Home"',
  /aria-label=["']Back to Home["']/.test(indexSrc)
);
check(
  "Back-to-Home button text contains ← Back to Home",
  /←\s*Back to Home/.test(indexSrc)
);
check(
  "Back-to-Home button calls navigate(\"/\")",
  /navigate\(["']\/["']\)/.test(indexSrc)
);
check(
  "Menu button present alongside Back-to-Home (combined header)",
  /aria-label=["']Back to audit menu["']/.test(indexSrc)
);
check(
  "Uses handleExit function (not inline arrow for Menu to stay consistent)",
  /handleExit/.test(indexSrc)
);
check(
  "ToolShell still used for landing/upload steps",
  /ToolShell/.test(indexSrc)
);
check(
  "step === 'workspace' branch returns <> fragment with header + AuditWorkspace",
  /step === ["']workspace["']/.test(indexSrc)
);
check(
  "No duplicate sticky top-0 elements in index.tsx (only one header sticky top-0 z-40)",
  (indexSrc.match(/sticky top-0 z-40/g) || []).length === 1,
  `found ${(indexSrc.match(/sticky top-0 z-40/g) || []).length} occurrences`
);
check(
  "No old sticky top-0 z-40 div (replaced by proper <header>)",
  !/<div[^>]*sticky top-0 z-40/.test(indexSrc)
);

console.log("\n── AuditReply/AuditWorkspace.tsx ────────────────────────────────────");

check(
  "AuditWorkspace NO LONGER has its own sticky top-0 header",
  !(/sticky top-0.*z-20|z-20.*sticky top-0/).test(workspaceSrc),
  "competing header must be removed"
);
check(
  "AuditWorkspace has no <header> element at all",
  !/<header\b/.test(workspaceSrc),
  "header ownership moved to index.tsx"
);
check(
  "Tab bar uses top-[41px] (single combined header offset)",
  /top-\[41px\]/.test(workspaceSrc)
);
check(
  "Tab bar still has z-10 (below the z-40 combined header)",
  /sticky top-\[41px\] z-10/.test(workspaceSrc)
);
check(
  "Tab bar still has print:hidden",
  /print:hidden/.test(workspaceSrc)
);
check(
  "AuditWorkspace onExit prop still accepted",
  /onExit/.test(workspaceSrc)
);
check(
  "audit-print scope still present",
  /audit-print/.test(workspaceSrc)
);
check(
  "usePrintPage still called for landscape orientation",
  /usePrintPage\(["']landscape["']/.test(workspaceSrc)
);
check(
  "localStorage audit-reply-data still used",
  /audit-reply-data/.test(workspaceSrc)
);
check(
  "No top-[72px] remnant (old offset for two-header layout)",
  !/top-\[72px\]/.test(workspaceSrc),
  "old offset must be replaced by top-[41px]"
);

console.log("\n── Cross-file: stacking context safety ────────────────────────────");

check(
  "Combined header z-40 > any workspace z-index",
  !(/z-50|z-60|z-70|z-80|z-90|z-\[5|z-\[6|z-\[7|z-\[8|z-\[9/).test(workspaceSrc),
  "no z-index in AuditWorkspace should exceed 40"
);

console.log(`\n── RESULT: ${pass} passed, ${fail} failed ──\n`);
if (fail > 0) process.exitCode = 1;
