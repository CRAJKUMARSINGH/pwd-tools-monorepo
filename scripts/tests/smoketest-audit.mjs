import { readFileSync } from 'fs';

let pass = 0, fail = 0;
function check(label, ok) {
  console.log((ok ? '✅' : '❌') + ' ' + label);
  ok ? pass++ : fail++;
}

// ── 1. audit-cases.ts ────────────────────────────────────────────────────────
const src = readFileSync('artifacts/pwd-tools/src/data/audit-cases.ts', 'utf8');
const caseCount = (src.match(/no:/g) || []).length;
check(`audit-cases.ts: ${caseCount} cases found (expected 14)`, caseCount === 14);

['no', 'header', 'gist', 'resp', 'obs'].forEach(f => {
    const n = (src.match(new RegExp(f + ':', 'g')) || []).length;
    check(`Field "${f}" present in all ${caseCount} cases (found ${n})`, n >= caseCount);
});

const noMatches = [...src.matchAll(/no: "(\d+)"/g)].map(m => m[1]);
const unique = new Set(noMatches);
check(`No duplicate para numbers (${noMatches.join(', ')})`, unique.size === noMatches.length);
check(`Para numbers run 1-14`, JSON.stringify([...unique].sort((a, b) => +a - +b)) === JSON.stringify(['1','2','3','4','5','6','7','8','9','10','11','12','13','14']));

// ── 2. generate-docx.ts ──────────────────────────────────────────────────────
const docxSrc = readFileSync('artifacts/pwd-tools/src/lib/generate-docx.ts', 'utf8');
[
    ['landscape orientation set', /landscape/],
    ['Mangal font used', /Mangal/],
    ['rowSpan: 2 for para header', /rowSpan: 2/],
    ['columnSpan: 5 for header row', /columnSpan: 5/],
    ['FFFDE7 reply cell shading', /FFFDE7/],
    ['E3F2FD comments cell shading', /E3F2FD/],
    ['saveAs called for download', /saveAs/],
    ['Packer.toBlob used', /Packer\.toBlob/],
    ['DRAFT_REPLY filename prefix', /DRAFT_REPLY/],
    ['date appended to filename', /toISOString/],
    ['flatMap over cases', /flatMap/],
    ['replies parameter consumed', /replies\[c\.no\]/],
].forEach(([label, re]) => check(`generate-docx: ${label}`, re.test(docxSrc)));

// ── 3. AuditReplyPage.tsx ────────────────────────────────────────────────────
const pageSrc = readFileSync('artifacts/pwd-tools/src/pages/AuditReplyPage.tsx', 'utf8');
[
    ['localStorage read on init', /localStorage\.getItem/],
    ['localStorage write on change', /localStorage\.setItem/],
    ['generateDocx imported and called', /generateDocx/],
    ['CASES imported', /CASES/],
    ['reply textarea present', /textarea/],
    ['handleReplyChange handler', /handleReplyChange/],
    ['rowSpan={2} for para no cell', /rowSpan=\{2\}/],
    ['Download button present', /Download/],
    ['useEffect for persistence', /useEffect/],
    ['Roman-to-Hindi transliteration imported', /transliterateLastWord/],
    ['Roman mode toggle button', /रo/],
    ['InlineInsertForm for adding paras', /InlineInsertForm/],
    ['extra rows persisted to localStorage', /audit-extra-rows/],
    ['delete extra row button', /Trash2/],
    ['orderedCases drives table display', /orderedCases/],
    ['reorder moveUp moveDown', /moveUp|moveDown/],
    ['insertAfter state for inline insert', /insertAfter/],
    ['audit-order persisted to localStorage', /audit-order/],
].forEach(([label, re]) => check(`AuditReplyPage: ${label}`, re.test(pageSrc)));

// ── 3b. roman-to-hindi.ts ────────────────────────────────────────────────────
const romanSrc = readFileSync('artifacts/pwd-tools/src/lib/roman-to-hindi.ts', 'utf8');
[
    ['transliterateWord exported', /export function transliterateWord/],
    ['transliterateLastWord exported', /export function transliterateLastWord/],
    ['DICT lookup table present', /const DICT/],
    ['PHONETIC fallback table present', /const PHONETIC/],
    ['common audit word: sanlagn', /sanlagn/],
    ['common audit word: nirast', /nirast/],
    ['common audit word: aakshep', /aakshep/],
    ['common audit word: atah', /atah/],
    ['common audit word: pratilipi', /pratilipi/],
].forEach(([label, re]) => check(`roman-to-hindi: ${label}`, re.test(romanSrc)));

// ── 4. Routing ───────────────────────────────────────────────────────────────
const appSrc = readFileSync('artifacts/pwd-tools/src/App.tsx', 'utf8');
check('App.tsx: AuditReplyPage imported', /import.*AuditReplyPage/.test(appSrc));
check('App.tsx: route /audit-reply registered', /path.*audit-reply/.test(appSrc));

// ── 5. Home tile ─────────────────────────────────────────────────────────────
const homeSrc = readFileSync('artifacts/pwd-tools/src/pages/Home.tsx', 'utf8');
check('Home.tsx: audit-reply tile present', homeSrc.includes('audit-reply'));
check('Home.tsx: directPath to /audit-reply', /directPath.*audit-reply/.test(homeSrc));

// ── 6. Dependencies ──────────────────────────────────────────────────────────
const pkg = JSON.parse(readFileSync('artifacts/pwd-tools/package.json', 'utf8'));
check(`package.json dep: docx ${pkg.dependencies?.docx || 'MISSING'}`, !!pkg.dependencies?.docx);
check(`package.json dep: file-saver ${pkg.dependencies?.['file-saver'] || 'MISSING'}`, !!pkg.dependencies?.['file-saver']);
check(`package.json devDep: @types/file-saver`, !!pkg.devDependencies?.['@types/file-saver']);

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n── RESULT: ${pass} passed, ${fail} failed ──`);
// exitCode, not process.exit(): the latter races libuv teardown on Node 26/Windows
if (fail > 0) process.exitCode = 1;