import { readFileSync } from 'fs';

const src = readFileSync('artifacts/pwd-tools/src/pages/BankCommunicationGenerator.tsx', 'utf8');

let pass = 0, fail = 0;
function check(label, ok) {
    console.log((ok ? '✅' : '❌') + ' ' + label);
    ok ? pass++ : fail++;
}

// ── Slice each builder function for isolated checks ──────────────────────────
const verStart = src.indexOf('function buildVerificationHtml');
const extStart = src.indexOf('function buildExtensionHtml');
const bankStart = src.indexOf('function buildBankExtensionHtml');
const stanStart = src.indexOf('function buildStandaloneHtml');

const verSrc = src.slice(verStart, extStart);
const extSrc = src.slice(extStart, bankStart);
const bankSrc = src.slice(bankStart, stanStart);

// ── 1. buildBankExtensionHtml — new DD fallback paragraph ────────────────────
console.log('\n── buildBankExtensionHtml (letter to BANK) ─────────────────────');
check('DD fallback paragraph present', bankSrc.includes('Demand Draft'));
check('Condition: ग्राहक/सम्बन्धित संवेदक (updated wording)', bankSrc.includes('ग्राहक/सम्बन्धित संवेदक'));
check('Condition: सहमति / अनुमति अप्राप्त', bankSrc.includes('सहमति / अनुमति अप्राप्त'));
check('Reference: अधोहस्ताक्षरकर्ता', bankSrc.includes('अधोहस्ताक्षरकर्ता'));
check('Delivery: Insured Courier', bankSrc.includes('Insured Courier'));
check('Delivery: Speed Post', bankSrc.includes('Speed Post'));
check('Delivery: निजी संदेशवाहक', bankSrc.includes('निजी संदेशवाहक'));
check('Payee: अधिशाषी अभियन्ता, सा.नि.वि. जिला खण्ड द्वितीय, उदयपुर',
    bankSrc.includes('जिला खण्ड द्वितीय, उदयपुर'));
check('Original para: विस्तारित कर सम्बन्धित दस्तावेज still present',
    bankSrc.includes('विस्तारित कर सम्बन्धित दस्तावेज'));
check('bgAmount placeholder used in DD amount', bankSrc.includes('bgAmount'));
check('bgNewExpiryDate still in original para', bankSrc.includes('bgNewExpiryDate'));

// ── 2. Other templates NOT modified ──────────────────────────────────────────
console.log('\n── Other templates untouched ───────────────────────────────────');
check('buildVerificationHtml: no DD paragraph', !verSrc.includes('Demand Draft'));
check('buildExtensionHtml: no DD paragraph', !extSrc.includes('Demand Draft'));

// ── 3. CSS paragraph rules ────────────────────────────────────────────────────
console.log('\n── CSS @page / paragraph rules ─────────────────────────────────');
const cssBlock = src.slice(src.indexOf('<style>'), src.indexOf('</style>'));
check('CSS: @page A4 margin 25mm', cssBlock.includes('size: A4; margin: 25mm'));
check('CSS: p margin reset to 0', cssBlock.includes('margin: 0;'));
check('CSS: p padding reset to 0', cssBlock.includes('padding: 0;'));
check('CSS: first-line indent 0.6in', cssBlock.includes('text-indent: 0.6in'));
check('CSS: text-align justify on p', cssBlock.includes('text-align: justify'));
check('CSS: line-height 1.5 on p', cssBlock.includes('line-height: 1.5'));
check('CSS: no stray margin-bottom on p', !cssBlock.match(/^\s{2}p\s*\{[^}]*\d+pt/m));

// ── 4. Preview JSX — BankExtensionPreview ────────────────────────────────────
console.log('\n── BankExtensionPreview JSX component ──────────────────────────');
const prevStart = src.indexOf('function BankExtensionPreview');
const prevEnd = src.indexOf('\nfunction ', prevStart + 10);
const prevSrc = src.slice(prevStart, prevEnd);

check('JSX: original विस्तारित paragraph present', prevSrc.includes('विस्तारित'));
check('JSX: new DD paragraph present', prevSrc.includes('Demand Draft'));
check('JSX: सहमति / अनुमति condition in JSX', prevSrc.includes('सहमति / अनुमति'));
check('JSX: अधोहस्ताक्षरकर्ता in JSX', prevSrc.includes('अधोहस्ताक्षरकर्ता'));
check('JSX: Insured Courier in JSX', prevSrc.includes('Insured Courier'));
check('JSX: Speed Post in JSX', prevSrc.includes('Speed Post'));
check('JSX: निजी संदेशवाहक in JSX', prevSrc.includes('निजी संदेशवाहक'));
check('JSX: LetterSign gap after new para', prevSrc.includes('LetterSign'));

// ── 5. General file health ────────────────────────────────────────────────────
console.log('\n── General file health ──────────────────────────────────────────');
check('numberToWordsHindi exported', src.includes('export function numberToWordsHindi'));
check('Three templates defined', (src.match(/TemplateType/g) || []).length >= 2);
check('defaultData has bgNewExpiryDate', src.includes('bgNewExpiryDate'));
check('handleDownloadDoc creates .doc blob', src.includes("application/msword"));
check('handlePrint calls window.print', src.includes('window.print'));
check('update() auto-converts bgAmount→words', src.includes("key === 'bgAmount'"));
check('All 3 template builders present',
    src.includes('buildVerificationHtml') &&
    src.includes('buildExtensionHtml') &&
    src.includes('buildBankExtensionHtml'));

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n══ SMOKE TEST 3 — BANK LETTER: ${pass} passed, ${fail} failed ══`);
// exitCode, not process.exit(): the latter races libuv teardown on Node 26/Windows
if (fail > 0) process.exitCode = 1;
