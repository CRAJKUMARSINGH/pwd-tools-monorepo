/**
 * Roman → Devanagari (Hindi) transliteration engine
 * No external dependency. Greedy longest-match left-to-right.
 *
 * Examples:
 *   adhishasi  → अधिशासी
 *   abhiyanta  → अभियंता
 *   savinivi   → सा.नि.वि.
 *   janch      → जांच
 */

// ── Mapping table (longest pattern first after sort) ─────────────────────
const RAW: [string, string][] = [
    // special clusters
    ["shree", "श्री"], ["shri", "श्री"], ["shra", "श्र"],
    ["ksha", "क्ष"], ["ksh", "क्ष"], ["gya", "ज्ञ"],
    ["tra", "त्र"], ["tri", "त्रि"],

    // aspirated + sibilant digraphs
    ["chh", "छ"], ["ch", "च"], ["sh", "श"], ["jh", "झ"],
    ["kh", "ख"], ["gh", "घ"], ["th", "थ"], ["dh", "ध"],
    ["ph", "फ"], ["bh", "भ"], ["nn", "ण"],

    // long vowel combos
    ["aai", "आई"], ["aau", "आउ"],
    ["aa", "आ"], ["ee", "ई"], ["ii", "ई"], ["oo", "ऊ"], ["uu", "ऊ"],
    ["ai", "ऐ"], ["au", "औ"], ["ou", "औ"], ["oi", "ओइ"],

    // consonant + vowel combos  (ka ki kee ku koo ke kai ko kau)
    ...buildCVs("k", "क"), ...buildCVs("kh", "ख"),
    ...buildCVs("g", "ग"), ...buildCVs("gh", "घ"),
    ...buildCVs("c", "क"), // c → क (common romanisation)
    ...buildCVs("ch", "च"), ...buildCVs("chh", "छ"),
    ...buildCVs("j", "ज"), ...buildCVs("jh", "झ"),
    ...buildCVs("t", "त"), ...buildCVs("th", "थ"),
    ...buildCVs("d", "द"), ...buildCVs("dh", "ध"),
    ...buildCVs("n", "न"), ...buildCVs("nn", "ण"),
    ...buildCVs("p", "प"), ...buildCVs("ph", "फ"),
    ...buildCVs("b", "ब"), ...buildCVs("bh", "भ"),
    ...buildCVs("m", "म"),
    ...buildCVs("y", "य"),
    ...buildCVs("r", "र"),
    ...buildCVs("l", "ल"),
    ...buildCVs("v", "व"), ...buildCVs("w", "व"),
    ...buildCVs("s", "स"), ...buildCVs("sh", "श"),
    ...buildCVs("h", "ह"),
    ...buildCVs("f", "फ"),
    ...buildCVs("z", "ज़"),

    // standalone vowels
    ["a", "अ"], ["i", "इ"], ["u", "उ"], ["e", "ए"], ["o", "ओ"],

    // bare consonants (inherent 'a')
    ["k", "क"], ["g", "ग"], ["c", "क"], ["j", "ज"],
    ["t", "त"], ["d", "द"], ["n", "न"],
    ["p", "प"], ["b", "ब"], ["m", "म"],
    ["y", "य"], ["r", "र"], ["l", "ल"],
    ["v", "व"], ["w", "व"], ["s", "स"], ["h", "ह"],
    ["f", "फ"], ["z", "ज़"],
];

/** Build consonant+vowel combos for one consonant */
function buildCVs(roman: string, deva: string): [string, string][] {
    return [
        [roman + "au", deva + "ौ"], [roman + "au", deva + "ौ"],
        [roman + "ai", deva + "ै"],
        [roman + "oo", deva + "ू"], [roman + "uu", deva + "ू"],
        [roman + "ee", deva + "ी"], [roman + "ii", deva + "ी"],
        [roman + "aa", deva + "ा"],
        [roman + "a", deva + ""],   // inherent a — no matra
        [roman + "i", deva + "ि"],
        [roman + "u", deva + "ु"],
        [roman + "e", deva + "े"],
        [roman + "o", deva + "ो"],
    ];
}

// Sort longest key first for greedy match
const TABLE: [string, string][] = RAW.sort((a, b) => b[0].length - a[0].length);

// ── Core converter ────────────────────────────────────────────────────────

/**
 * Transliterate one Roman word to Devanagari.
 * Skips words that already contain Devanagari or are purely numeric/punctuation.
 */
export function transliterateWord(word: string): string {
    if (!word) return word;
    // Already Devanagari — leave alone
    if (/[\u0900-\u097F]/.test(word)) return word;
    // No Roman letters — leave alone (numbers, symbols, dates)
    if (!/[a-zA-Z]/.test(word)) return word;

    const lower = word.toLowerCase();
    let out = "";
    let i = 0;

    while (i < lower.length) {
        let matched = false;
        for (const [key, val] of TABLE) {
            if (lower.startsWith(key, i)) {
                out += val;
                i += key.length;
                matched = true;
                break;
            }
        }
        if (!matched) {
            // Pass through unchanged (digit, hyphen, slash, etc.)
            out += word[i];
            i++;
        }
    }
    return out;
}

/**
 * Transliterate a full multi-word text.
 * Each whitespace-delimited token is converted independently.
 */
export function transliterateText(text: string): string {
    // Split on whitespace while preserving the whitespace chars
    return text.replace(/[^\s]+/g, (token) => transliterateWord(token));
}

/**
 * Convert only the *last* typed word in a text string.
 * Called on Space / Enter so the user sees live conversion word-by-word.
 * Returns the updated full string.
 */
export function convertLastWord(fullText: string): string {
    // Find where the last word starts
    const m = fullText.match(/([\s\S]*[\s])?([^\s]+)(\s)$/);
    if (!m) return fullText; // no trailing space yet → nothing to convert
    const prefix = m[1] ?? "";
    const lastWord = m[2];
    const space = m[3];
    if (/[\u0900-\u097F]/.test(lastWord)) return fullText; // already Hindi
    return prefix + transliterateWord(lastWord) + space;
}

/** Insert punctuation or whitespace at the caret and convert the word just typed. */
export function convertAtCaret(value: string, start: number, end: number, separator: string) {
    const before = value.slice(0, start);
    const converted = convertLastWord(before + " ").slice(0, -1);
    if (converted === before) return null;
    const prefix = converted + separator;
    return { value: prefix + value.slice(end), caret: prefix.length };
}
