/**
 * Logic smoke test for roman-to-hindi.ts
 * Simulates the transliterateWord / transliterateLastWord functions in pure JS
 * (without TypeScript compilation) by re-implementing the same DICT lookup.
 */

let pass = 0, fail = 0;
function check(label, ok) {
    console.log((ok ? '✅' : '❌') + ' ' + label);
    ok ? pass++ : fail++;
}

// ── Re-implement DICT from source (read the file, eval the dict) ─────────────
import { readFileSync } from 'fs';

const src = readFileSync(
    'artifacts/pwd-tools/src/lib/roman-to-hindi.ts', 'utf8'
);

// Extract the DICT block
const dictMatch = src.match(/const DICT[^=]*=\s*\{([\s\S]*?)\};/);
if (!dictMatch) { console.error('❌ Could not parse DICT'); process.exit(1); }

// Build a JS-evaluable dict string
const dictSrc = `({ ${dictMatch[1]} })`;
let DICT;
try {
    DICT = eval(dictSrc);
} catch (e) {
    // Some entries have duplicate keys — that's fine, last one wins in JS
    // Try cleaning and re-evaluating
    DICT = {};
    const lines = dictMatch[1].split('\n');
    for (const line of lines) {
        const m = line.match(/['"]?([\w.\-/]+)['"]?\s*:\s*['"]([^'"]+)['"]/);
        if (m) DICT[m[1].toLowerCase()] = m[2];
    }
}

// Simple transliterate word (dict only — same logic as the TS file)
function transliterateWord(roman) {
    const lower = roman.toLowerCase().trim();
    if (!lower || /^\d+$/.test(lower)) return roman;
    if (/^[।,.!?;:()\-/]+$/.test(lower)) return roman;
    if (DICT[lower]) return DICT[lower];
    return roman; // phonetic fallback not tested here — dict is the critical path
}

function transliterateLastWord(text) {
    const trailingSpace = text.endsWith(' ') ? ' ' : '';
    const trimmed = text.trimEnd();
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace === -1) return transliterateWord(trimmed) + trailingSpace;
    const before = trimmed.slice(0, lastSpace + 1);
    const lastWord = trimmed.slice(lastSpace + 1);
    return before + transliterateWord(lastWord) + trailingSpace;
}

// ── Test cases ───────────────────────────────────────────────────────────────

console.log('\n── Dictionary word tests ──────────────────────────────────────');
const wordTests = [
    ['mange', 'मांगे'],
    ['sanlagn', 'संलग्न'],
    ['hai', 'है'],
    ['atah', 'अतः'],
    ['nirast', 'निरस्त'],
    ['aakshep', 'आक्षेप'],
    ['pratilipi', 'प्रतिलिपि'],
    ['karwaye', 'करवायें'],
    ['samvedak', 'संवेदक'],
    ['adhishashi', 'अधिशाषी'],
    ['abhiyanta', 'अभियंता'],
    ['sahayak', 'सहायक'],
    ['bhugtan', 'भुगतान'],
    ['karyaadesh', 'कार्यादेश'],
    ['anubandh', 'अनुबंध'],
    ['shasti', 'शास्ति'],
    ['aropit', 'आरोपित'],
    ['vibhag', 'विभाग'],
    ['nirdharit', 'निर्धारित'],
    ['bitman', 'बिट्मन'],
    ['maap', 'माप'],
    ['purn', 'पूर्ण'],
    ['antim', 'अंतिम'],
    ['notice', 'नोटिस'],
    ['vasuli', 'वसूली'],
    ['jari', 'जारी'],
];

wordTests.forEach(([roman, expected]) => {
    const result = transliterateWord(roman);
    check(`"${roman}" → "${expected}" (got: "${result}")`, result === expected);
});

console.log('\n── Numbers / punctuation passthrough ──────────────────────────');
['123', '2,73,315', '।', '.', '-'].forEach(tok => {
    const result = transliterateWord(tok);
    check(`"${tok}" passes through unchanged`, result === tok);
});

console.log('\n── transliterateLastWord (simulates spacebar press) ───────────');
const lastWordTests = [
    // [input after space typed, expected output]
    ['mange ', 'मांगे '],
    // transliterateLastWord converts only the LAST word before the trailing space
    // "atah aakshep " → only "aakshep" gets converted (atah was already converted on previous space)
    ['atah aakshep ', 'atah आक्षेप '],
    ['sanlagn ', 'संलग्न '],
    ['Aaj kary ', 'Aaj कार्य '],   // mixed — only last word converted
    ['1234 ', '1234 '],          // number passthrough
    ['nirast', 'निरस्त'],         // no trailing space — single word
];

lastWordTests.forEach(([input, expected]) => {
    const result = transliterateLastWord(input);
    check(`transliterateLastWord("${input}") → "${expected}"`, result === expected);
});

console.log('\n── Full reply sentence simulation ─────────────────────────────');
// Simulate user typing a full reply word by word with spaces
function simulateTyping(words) {
    let text = '';
    for (const w of words) {
        text += w;
        // Simulate spacebar after each word
        text = transliterateLastWord(text);
    }
    return text.trim();
}

const sentence1 = simulateTyping(['mange ', 'gaye ', 'dastavejo ', 'ki ', 'pratilipi ', 'sanlagn ', 'hai ']);
check(
    `Full sentence: "mange gaye dastavejo ki pratilipi sanlagn hai" → contains संलग्न`,
    sentence1.includes('संलग्न')
);
check(
    `Full sentence contains प्रतिलिपि`,
    sentence1.includes('प्रतिलिपि')
);
check(
    `Full sentence contains मांगे`,
    sentence1.includes('मांगे')
);

console.log(`\n   Result: "${sentence1}"`);

console.log('\n── localStorage key names ──────────────────────────────────────');
const pageSrc = readFileSync('artifacts/pwd-tools/src/pages/AuditReply/AuditWorkspace.tsx', 'utf8');
check('audit-reply-data key used', pageSrc.includes("'audit-reply-data'"));
check('audit-extra-rows key used', pageSrc.includes("'audit-extra-rows'"));

console.log('\n── NewRowForm fields ───────────────────────────────────────────');
check('Para ID / Para No. input present', pageSrc.includes('Para ID') || pageSrc.includes('Para No.'));
check('Header input present', pageSrc.includes('Header'));
check('Gist textarea present in form', pageSrc.includes('Gist'));
check('Obs textarea present in form', pageSrc.includes('Observation'));
check('Default Reply input in form', pageSrc.includes('Default Reply'));
check('handleAddRow wires defaultReply', pageSrc.includes('defaultReply'));
check('Delete button only on extra rows (isExtra check)', pageSrc.includes('isExtra'));

console.log(`\n══ SMOKE TEST RESULT: ${pass} passed, ${fail} failed ══`);
// exitCode, not process.exit(): the latter races libuv teardown on Node 26/Windows
if (fail > 0) process.exitCode = 1;
