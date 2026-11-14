/**
 * Roman-to-Hindi (Devanagari) transliteration engine
 * Offline, zero-dependency — covers common Hindi words used in PWD audit replies
 *
 * Strategy:
 *  1. Exact-word dictionary for the most common audit/official Hindi phrases
 *  2. Phonetic fallback using consonant+vowel rules for unknown words
 */

// ── 1. Exact-word dictionary ────────────────────────────────────────────────
const DICT: Record<string, string> = {
    // Common audit reply words
    maange: 'मांगे', mange: 'मांगे', maangi: 'मांगी',
    gaye: 'गये', gaya: 'गया', gayi: 'गई', gai: 'गई',
    dastavej: 'दस्तावेज', dastavejj: 'दस्तावेज', dastavejo: 'दस्तावेजों',
    dastavejo3: 'दस्तावेजों',
    ki: 'की', ke: 'के', ka: 'का', ko: 'को',
    pratilipi: 'प्रतिलिपि', pratiilipi: 'प्रतिलिपि',
    sanlagn: 'संलग्न', sanlagna: 'संलग्न', sanglagn: 'संलग्न', hai: 'है', hain: 'हैं', tha: 'था', thi: 'थी', the: 'थे',
    atah: 'अतः', ata: 'अतः',
    aakshep: 'आक्षेप', aksep: 'आक्षेप',
    nirast: 'निरस्त', nirasat: 'निरस्त',
    karwaye: 'करवायें', karwaye3: 'करवायें', karawaye: 'करवायें',
    // People / roles
    savaedak: 'संवेदक', samvedak: 'संवेदक', sanvedak: 'संवेदक', savedak: 'संवेदक',
    adhishashi: 'अधिशाषी', adhisasi: 'अधिशाषी',
    abhiyanta: 'अभियंता', abhiynta: 'अभियंता',
    sahayak: 'सहायक',
    khandiya: 'खण्डीय', khandiy: 'खण्डीय',
    lekhaakar: 'लेखाकार', lekhakar: 'लेखाकार',
    uchadikari: 'उच्चाधिकारी', ucchadhikari: 'उच्चाधिकारी',
    // Actions
    jari: 'जारी', jaari: 'जारी',
    kiya: 'किया', kiye: 'किये', kari: 'की', kar: 'कर',
    karna: 'करना', karne: 'करने',
    prarambh: 'प्रारम्भ', shuru: 'शुरू',
    diya: 'दिया', diye: 'दिये', dene: 'देने',
    liya: 'लिया', liye: 'लिये',
    kiया: 'किया',
    bhugtan: 'भुगतान', bhugtaan: 'भुगतान',
    vasuli: 'वसूली',
    notice: 'नोटिस', notis: 'नोटिस',
    karwahi: 'कार्यवाही', karywahi: 'कार्यवाही', karyawahi: 'कार्यवाही',
    pragatirat: 'प्रगतिरत', pragrat: 'प्रगतिरत',
    // CRC / technical
    crc: 'सी.आर.सी.', 'c.r.c.': 'सी.आर.सी.',
    mul: 'मूल', mool: 'मूल',
    sthan: 'स्थान', sthal: 'स्थान',
    par: 'पर', pe: 'पे',
    patra: 'पत्र', patrawali: 'पत्रावली',
    pariawali: 'पत्रावली',
    // Quantities / numbers helper words
    rashi: 'राशि', raashi: 'राशि',
    rupaye: 'रुपये', rs: 'रु.',
    pratishat: 'प्रतिशत', parsent: 'प्रतिशत',
    avadhi: 'अवधि', awadhi: 'अवधि',
    // Common conjunctions / prepositions
    tatha: 'तथा', aur: 'और', va: 'व', evam: 'एवं',
    mein: 'में', main: 'में', se: 'से', tak: 'तक',
    jo: 'जो', jab: 'जब', jabki: 'जबकि',
    kintu: 'किन्तु', parantu: 'परन्तु', lekin: 'लेकिन',
    is: 'इस', iska: 'इसका', iski: 'इसकी', iske: 'इसके',
    us: 'उस', uska: 'उसका', unka: 'उनका',
    yah: 'यह', ye: 'ये', vah: 'वह', ve: 'वे',
    nahi: 'नहीं', nahin: 'नहीं', nhi: 'नहीं',
    // Audit-specific phrases (multi-word mapped as single tokens with underscore)
    kary: 'कार्य', karya: 'कार्य',
    karyaadesh: 'कार्यादेश', karyadesh: 'कार्यादेश',
    anubandh: 'अनुबंध', anubanddh: 'अनुबंध',
    dhara: 'धारा',
    shasati: 'शास्ति', shasti: 'शास्ति',
    aropit: 'आरोपित', aaropit: 'आरोपित',
    arop: 'आरोप',
    uttardayitva: 'उत्तरदायित्व', utardayitv: 'उत्तरदायित्व',
    nirdharit: 'निर्धारित', nirdhaarit: 'निर्धारित',
    suchit: 'सूचित', soochit: 'सूचित',
    lekha: 'लेखा', pariksha: 'परीक्षा',
    ankeshan: 'अंकेक्षण', ankekshan: 'अंकेक्षण',
    prativedaan: 'प्रतिवेदन', pratiwedan: 'प्रतिवेदन',
    uttar: 'उत्तर',
    vibhag: 'विभाग', vibhagiy: 'विभागीय', vibhagiya: 'विभागीय',
    niyam: 'नियम', niyamo: 'नियमों',
    adesh: 'आदेश', aadesh: 'आदेश', aadeso: 'आदेशों',
    avhelna: 'अवहेलना', awahelna: 'अवहेलना',
    laperwahi: 'लापरवाही', laprwahi: 'लापरवाही',
    dyotak: 'द्योतक',
    uplabdh: 'उपलब्ध',
    anurodh: 'अनुरोध',
    praman: 'प्रमाण', pramanit: 'प्रमाणित',
    tasdeek: 'तस्दीक',
    purn: 'पूर्ण', poorn: 'पूर्ण',
    apurna: 'अपूर्ण',
    antim: 'अंतिम', aantim: 'अंतिम',
    bill: 'बिल', bil: 'बिल',
    running: 'रनिंग',
    maap: 'माप', naap: 'माप',
    pustika: 'पुस्तिका',
    darp: 'दर्ज', darj: 'दर्ज',
    indraj: 'इन्द्राज',
    ank: 'अंक', ankan: 'अंकन',
    bank: 'बैंक',
    guarantee: 'गारंटी', garanti: 'गारंटी',
    vaidyata: 'वैद्यता', validity: 'वैद्यता',
    dlp: 'दोष निवारण अवधि',
    bitumen: 'बिट्मन', bitman: 'बिट्मन', bitumin: 'बिट्मन',
    used: 'प्रयुक्त',
    balance: 'शेष',
    quantity: 'मात्रा',
    // Specific reply phrases — type these tokens to insert full phrase
    'sanlagn_hai': 'संलग्न है। अतः आक्षेप निरस्त करवायें।',
    'aksep_nirast': 'आक्षेप निरस्त करवायें।',
    'pratilipi_sanlagn': 'प्रतिलिपि संलग्न है।',
};

// ── 2. Phonetic consonant/vowel map for fallback ────────────────────────────
// Maps Roman sequences → Devanagari (longest-match first)
const PHONETIC: [string, string][] = [
    // Clusters first (longest match)
    ['ksh', 'क्ष'], ['gyn', 'ज्ञ'], ['tr', 'त्र'],
    ['shr', 'श्र'], ['str', 'स्त्र'], ['sth', 'स्थ'], ['spr', 'स्प्र'],
    ['dhy', 'ध्य'], ['dhr', 'ध्र'], ['bhr', 'भ्र'], ['ghr', 'घ्र'],
    ['pr', 'प्र'], ['br', 'ब्र'], ['kr', 'क्र'], ['gr', 'ग्र'],
    ['dr', 'द्र'], ['vr', 'व्र'], ['sr', 'स्र'], ['hr', 'ह्र'],
    ['tr', 'त्र'], ['nr', 'न्र'],
    ['kk', 'क्क'], ['tt', 'त्त'], ['pp', 'प्प'], ['nn', 'न्न'],
    ['ll', 'ल्ल'], ['ss', 'स्स'], ['mm', 'म्म'],
    // Vowels (standalone — only at start of word or after another vowel)
    ['aa', 'आ'], ['ii', 'ई'], ['uu', 'ऊ'], ['ee', 'ई'],
    ['oo', 'ऊ'], ['ai', 'ऐ'], ['au', 'औ'], ['an', 'अं'], ['am', 'अं'],
    ['a', 'अ'], ['i', 'इ'], ['u', 'उ'], ['e', 'ए'], ['o', 'ओ'],
    // Consonants
    ['ch', 'च'], ['sh', 'श'], ['th', 'थ'], ['dh', 'ध'], ['bh', 'भ'],
    ['gh', 'घ'], ['jh', 'झ'], ['kh', 'ख'], ['ph', 'फ'], ['rh', 'र्ह'],
    ['nh', 'न्ह'],
    ['k', 'क'], ['g', 'ग'], ['c', 'क'], ['j', 'ज'], ['z', 'ज़'],
    ['t', 'त'], ['d', 'द'], ['n', 'न'], ['p', 'प'], ['b', 'ब'],
    ['m', 'म'], ['y', 'य'], ['r', 'र'], ['l', 'ल'], ['v', 'व'],
    ['w', 'व'], ['s', 'स'], ['h', 'ह'], ['f', 'फ'], ['q', 'क'],
    ['x', 'क्स'],
    // Matras (vowel signs after consonant)
    ['aa', 'ा'], ['ii', 'ी'], ['uu', 'ू'], ['ee', 'ी'],
    ['oo', 'ू'], ['ai', 'ै'], ['au', 'ौ'],
    ['a', 'ा'], ['i', 'ि'], ['u', 'ु'], ['e', 'े'], ['o', 'ो'],
    // Anusvara / chandrabindu
    ['ng', 'ं'], ['nk', 'ंक'], ['nt', 'ंत'], ['nd', 'ंद'],
    ['N', 'ं'],
    // Halant
    ['^', '्'],
];

/**
 * Transliterate a single Roman word → Hindi
 * First tries exact dictionary lookup, then phonetic fallback
 */
export function transliterateWord(roman: string): string {
    const lower = roman.toLowerCase().trim();
    if (!lower || /^\d+$/.test(lower)) return roman; // keep numbers as-is
    // Keep punctuation-only tokens
    if (/^[।,.!?;:()\-/]+$/.test(lower)) return roman;

    // Dictionary lookup (case-insensitive)
    if (DICT[lower]) return DICT[lower];

    // Try with common suffix stripping
    const suffixes: [string, string][] = [
        ['on', 'ों'], ['on', 'ों'], ['o', 'ों'],
        ['e', 'े'], ['i', 'ी'], ['a', 'ा'],
    ];
    for (const [suf, matra] of suffixes) {
        if (lower.endsWith(suf)) {
            const stem = lower.slice(0, -suf.length);
            if (DICT[stem]) return DICT[stem] + matra;
        }
    }

    // Phonetic fallback — simple sequential mapping
    // (good enough for basic Hindi words; won't be perfect for all words)
    let result = '';
    let i = 0;
    const w = lower;
    while (i < w.length) {
        let matched = false;
        for (const [pat, deva] of PHONETIC) {
            if (w.startsWith(pat, i)) {
                result += deva;
                i += pat.length;
                matched = true;
                break;
            }
        }
        if (!matched) {
            result += w[i];
            i++;
        }
    }
    return result || roman;
}

/**
 * Transliterate the last word in a string (called on spacebar press).
 * Returns the new full string with the last Roman word replaced by Hindi.
 */
export function transliterateLastWord(text: string): string {
    // Split keeping trailing space
    const trailingSpace = text.endsWith(' ') ? ' ' : '';
    const trimmed = text.trimEnd();
    const lastSpace = trimmed.lastIndexOf(' ');
    if (lastSpace === -1) {
        // Only one word
        return transliterateWord(trimmed) + trailingSpace;
    }
    const before = trimmed.slice(0, lastSpace + 1);
    const lastWord = trimmed.slice(lastSpace + 1);
    return before + transliterateWord(lastWord) + trailingSpace;
}
