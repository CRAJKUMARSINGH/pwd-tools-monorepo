import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { archiveDelete, archiveLoad, archiveSave, formatSavedAt, type ArchiveEntry } from '@/lib/archive';
import { FileDown, History, Printer, RefreshCw, Trash2, X } from 'lucide-react';
import { useRef, useState } from 'react';

// ─── Hindi Number-to-Words ────────────────────────────────────────────────────

const HI_ONES = [
  '', 'एक', 'दो', 'तीन', 'चार', 'पाँच', 'छः', 'सात', 'आठ', 'नौ',
  'दस', 'ग्यारह', 'बारह', 'तेरह', 'चौदह', 'पन्द्रह', 'सोलह', 'सत्रह', 'अठारह', 'उन्नीस',
  'बीस', 'इक्कीस', 'बाईस', 'तेईस', 'चौबीस', 'पच्चीस', 'छब्बीस', 'सत्ताईस', 'अट्ठाईस', 'उनतीस',
  'तीस', 'इकतीस', 'बत्तीस', 'तैंतीस', 'चौंतीस', 'पैंतीस', 'छत्तीस', 'सैंतीस', 'अड़तीस', 'उनचालीस',
  'चालीस', 'इकतालीस', 'बयालीस', 'तैंतालीस', 'चौंतालीस', 'पैंतालीस', 'छियालीस', 'सैंतालीस', 'अड़तालीस', 'उनचास',
  'पचास', 'इक्यावन', 'बावन', 'तिरपन', 'चौवन', 'पचपन', 'छप्पन', 'सत्तावन', 'अट्ठावन', 'उनसठ',
  'साठ', 'इकसठ', 'बासठ', 'तिरसठ', 'चौंसठ', 'पैंसठ', 'छियासठ', 'सड़सठ', 'अड़सठ', 'उनहत्तर',
  'सत्तर', 'इकहत्तर', 'बहत्तर', 'तिहत्तर', 'चौहत्तर', 'पचहत्तर', 'छिहत्तर', 'सतहत्तर', 'अठहत्तर', 'उनासी',
  'अस्सी', 'इक्यासी', 'बयासी', 'तिरासी', 'चौरासी', 'पचासी', 'छियासी', 'सत्तासी', 'अट्ठासी', 'नवासी',
  'नब्बे', 'इक्यानवे', 'बानवे', 'तिरानवे', 'चौरानवे', 'पचानवे', 'छियानवे', 'सत्तानवे', 'अट्ठानवे', 'निन्यानवे',
];
function _hiBelow100(n: number): string { return HI_ONES[n] ?? ''; }
function _hiBelow1000(n: number): string {
  if (n < 100) return _hiBelow100(n);
  const h = Math.floor(n / 100);
  const r = n % 100;
  return `${_hiBelow100(h)} सौ${r > 0 ? ' ' + _hiBelow100(r) : ''}`;
}
export function numberToWordsHindi(input: string | number): string {
  const raw = String(input).replace(/,/g, '').trim();
  const [intPartStr, decPartStr] = raw.split('.');
  const intVal = parseInt(intPartStr, 10);
  if (isNaN(intVal) || intVal < 0) return '';
  if (intVal === 0) {
    const paise = decPartStr ? parseInt(decPartStr.padEnd(2, '0').slice(0, 2), 10) : 0;
    return paise > 0 ? `शून्य रुपये ${_hiBelow100(paise)} पैसे` : 'शून्य';
  }
  const parts: string[] = [];
  let n = intVal;
  if (n >= 10000000) { parts.push(`${_hiBelow1000(Math.floor(n / 10000000))} करोड़`); n %= 10000000; }
  if (n >= 100000) { parts.push(`${_hiBelow1000(Math.floor(n / 100000))} लाख`); n %= 100000; }
  if (n >= 1000) { parts.push(`${_hiBelow1000(Math.floor(n / 1000))} हजार`); n %= 1000; }
  if (n > 0) { parts.push(_hiBelow1000(n)); }
  let result = parts.join(' ');
  const paise = decPartStr ? parseInt(decPartStr.padEnd(2, '0').slice(0, 2), 10) : 0;
  if (paise > 0) result += ` रुपये ${_hiBelow100(paise)} पैसे`;
  return result;
}

// ─── Types ──────────────────────────────────────────────────────────────────

type TemplateType = 'bg-verification' | 'bg-extension' | 'bg-release' | 'bg-encashment';

type BankCommunicationData = {
  officeNameHi: string;
  departmentNameHi: string;
  letterNo: string;
  letterDate: string;

  // BG Verification (to Bank)
  bankName: string;
  bankBranch: string;
  bgNumber: string;
  bgDate: string;
  bgAmount: string;
  bgAmountWords: string;
  contractorName: string;
  contractorAddress: string;

  // BG Extension (to Contractor)
  contractorClass: string;
  projectName: string;
  bgExpiryDate: string;
  extensionDays: string;
  ccBankName: string;
  ccBankAddress: string;

  // BG Bank Extension (to Bank directly)
  bgNewExpiryDate: string;
  ccContractorName: string;
  ccContractorAddress: string;

  signatoryName: string;
  signatoryDesignation: string;
};

const defaultData: BankCommunicationData = {
  officeNameHi: 'कार्यालय अधिशाषी अभियन्ता',
  departmentNameHi: 'सार्वजनिक निर्माण विभाग जिला खण्ड द्वितीय उदयपुर।',
  letterNo: '',
  letterDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' }),

  bankName: 'HDFC Bank',
  bankBranch: 'उदयपुर',
  bgNumber: 'C73GT02251250002',
  bgDate: '05.05.2025',
  bgAmount: '8,43,734.00',
  bgAmountWords: 'आठ लाख तियालीस हजार सात सौ चौतीस',
  contractorName: 'रचना कन्स्ट्रक्शन',
  contractorAddress: '8 नवरत्न काम्प्लेक्स बेदला रोड़ उदयपुर',

  contractorClass: 'ए क्लास संवेदक',
  projectName:
    'Construction of various Non Patchable/Missing Link Roads Package No. Rj-32/NP/ML/2025-26/02',
  bgExpiryDate: '31.05.2026',
  extensionDays: '3',
  ccBankName: 'यूनियन बैंक ऑफ इण्डिया',
  ccBankAddress: 'कल्पतरु अपार्टमेन्ट, न्यू फतेहपुरा, उदयपुर',

  bgNewExpiryDate: '30.09.2026',
  ccContractorName: 'रचना कन्स्ट्रक्शन',
  ccContractorAddress: '8 नवरत्न काम्प्लेक्स बेदला रोड़ उदयपुर',

  signatoryName: 'अनिल खिच्ची',
  signatoryDesignation: 'अधिशाषी अभियन्ता',
};

const TEMPLATE_OPTIONS: { value: TemplateType; labelHi: string; labelEn: string; desc: string }[] = [
  {
    value: 'bg-verification',
    labelHi: 'बैंक गारन्टी सत्यापन पत्र',
    labelEn: 'BG Verification Letter',
    desc: 'बैंक प्रबन्धक को BG सत्यापित कराने हेतु पत्र',
  },
  {
    value: 'bg-extension',
    labelHi: 'बैंक गारन्टी वैधता बढ़ाने का पत्र',
    labelEn: 'BG Validity Extension Letter',
    desc: 'ठेकेदार को BG अवधि बढ़ाने हेतु पत्र (बैंक को प्रतिलिपि)',
  },
  {
    value: 'bg-encashment',
    labelHi: 'बैंक गारन्टी भुनाने हेतु पत्र',
    labelEn: 'BG Encashment Letter',
    desc: 'बैंक प्रबन्धक को BG तत्काल जब्त कर D.D. बनाने हेतु पत्र',
  },
  {
    value: 'bg-release',
    labelHi: 'बैंक गारन्टी रिलीज / मुक्त करने का पत्र',
    labelEn: 'BG Release Letter',
    desc: 'बैंक प्रबन्धक को BG अब सुरक्षा के रूप में आवश्यक नहीं — रिलीज हेतु पत्र',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function esc(v: string): string {
  return (v || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');
}

const BLANK_NO = '………………………………';

function officeHeaderHtml(d: BankCommunicationData): string {
  return `
  <div class="office">
    <div class="office-name">${esc(d.officeNameHi)}</div>
    <div class="office-dept">${esc(d.departmentNameHi)}</div>
  </div>
  <div class="meta-row">
    <div><strong>क्रमांक:-</strong> ${esc(d.letterNo) || BLANK_NO}</div>
    <div><strong>दिनांक:-</strong> ${esc(d.letterDate)}</div>
  </div>`;
}

function signHtml(d: BankCommunicationData, gap: boolean): string {
  return `
  <div class="sign ${gap ? 'sign-gap' : ''}">
    <div class="sign-inner">
      <div class="sign-name">(${esc(d.signatoryName)})</div>
      <div>${esc(d.signatoryDesignation)}</div>
      <div>सा.नि.वि. जिला खण्ड द्वितीय उदयपुर</div>
    </div>
  </div>`;
}

function buildVerificationHtml(d: BankCommunicationData): string {
  return `
  ${officeHeaderHtml(d)}
  <div class="block">
    <div><strong>श्रीमान प्रबन्धक महोदय,</strong></div>
    <div>${esc(d.bankName)} ${esc(d.bankBranch)}</div>
  </div>
  <div class="block tight"><strong>विषय:-</strong> बैंक गारन्टी सत्यापित कराने बाबत।</div>
  <div class="block"><strong>सन्दर्भ:-</strong> बैंक गारन्टी संख्या ${esc(d.bgNumber)} दिनांक ${esc(d.bgDate)}</div>
  <p>महोदय,</p>
  <p>
    उपरोक्त विषयान्तर्गत निवेदन है कि आपके द्वारा जारी बैंक गारन्टी संख्या
    <strong>${esc(d.bgNumber)}</strong> दिनांक <strong>${esc(d.bgDate)}</strong>
    RS. <strong>${esc(d.bgAmount)}</strong> (${esc(d.bgAmountWords)} मात्र)
    मैसर्स <strong>${esc(d.contractorName)}</strong> ${esc(d.contractorAddress)} के नाम जारी की गई है।
    उक्त बैंक गारन्टी की छाया प्रति संलग्न कर भिजवाई जा रही है।
    कृपया सत्यापित कराने का कष्ट करावे।
  </p>
  <div class="block"><strong>सलग्न:-</strong> BG की छाया प्रति</div>
  ${signHtml(d, true)}
  <div class="copy">
    <div class="block tight"><strong>क्रमांक:-</strong> ${esc(d.letterNo) || BLANK_NO}</div>
    <p>
      प्रतिलिपि ${esc(d.ccBankName)}, ${esc(d.ccBankAddress)} को प्रस्तुत कर
      निवेदन है कि उक्त बैंक गारन्टी को सत्यापित कर इस कार्यालय को अवगत करावें।
    </p>
    ${signHtml(d, false)}
  </div>`;
}

function buildExtensionHtml(d: BankCommunicationData): string {
  return `
  ${officeHeaderHtml(d)}
  <div class="block">
    <div>मैसर्स <strong>${esc(d.contractorName)}</strong>,</div>
    <div>${esc(d.contractorClass)}</div>
    <div>${esc(d.contractorAddress)}</div>
  </div>
  <div class="block"><strong>विषय:-</strong> बैंक गारंटी की वैधता अवधि बढ़ाने के संबंध में।</div>
  <p>महोदय,</p>
  <p>
    उपरोक्त विषयान्तर्गत लेख है कि सन्दर्भित पत्र द्वारा
    <strong>${esc(d.projectName)}</strong> कार्य की बैंक गारंटी संख्या
    <strong>${esc(d.bgNumber)}</strong> दिनांक <strong>${esc(d.bgDate)}</strong>
    राशि <strong>${esc(d.bgAmount)}/-</strong> (${esc(d.bgAmountWords)} मात्र) प्रस्तुत की गयी थी
    जिसकी बैंक गारंटी की वैधता अवधि <strong>${esc(d.bgExpiryDate)}</strong> को समाप्त हो रही है।
    अतः इस पत्र द्वारा लिखा जाता है कि <strong>${esc(d.extensionDays)}</strong> दिवस में
    उक्त बैंक गारन्टी की वैधता अवधि बढाकर प्रस्तुत करे।
  </p>
  <p>
    यदि आप निर्धारित तिथि से पूर्व बैंक गारंटी (BG) प्रस्तुत करते हैं, तो यह आपकी जिम्मेदारी
    रहेगी कि आप समय-समय पर स्वयं बैंक गारंटी का नवीनीकरण करवाएँ, अन्यथा बैंक गारंटी इनकेश कर
    ली जाएगी, जिसकी जिम्मेदारी आपकी रहेगी। कृपया अभिसूचित हों।
  </p>
  ${signHtml(d, true)}
  <div class="copy">
    <div class="block tight"><strong>क्रमांक:-</strong> ${esc(d.letterNo) || BLANK_NO}</div>
    <p>
      प्रतिलिपि प्रबन्धक, ${esc(d.ccBankName)}, ${esc(d.ccBankAddress)} को
      प्रस्तुत कर निवेदन है कि उक्त बैंक गारन्टी की समयावधि बढाकर प्रस्तुत करें।
    </p>
    ${signHtml(d, false)}
  </div>`;
}

function buildBankExtensionHtml(d: BankCommunicationData): string {
  return `
  ${officeHeaderHtml(d)}
  <div class="block">
    <div><strong>प्रबन्धक,</strong></div>
    <div>${esc(d.bankName)},</div>
    <div>शाखा — ${esc(d.bankBranch)}</div>
  </div>
  <div class="block tight"><strong>विषय:-</strong> बैंक गारन्टी की वैधता अवधि विस्तार कराने बाबत्।</div>
  <div class="block"><strong>सन्दर्भ:-</strong> बैंक गारन्टी संख्या ${esc(d.bgNumber)} दिनांक ${esc(d.bgDate)}</div>
  <p>महोदय,</p>
  <p>
    उपरोक्त विषयान्तर्गत लेख है कि सन्दर्भित पत्र द्वारा
    <strong>${esc(d.projectName)}</strong> कार्य की बेक गारंटी संख्या
    <strong>${esc(d.bgNumber)}</strong> दिनांक <strong>${esc(d.bgDate)}</strong>,
    राशि रु. <strong>${esc(d.bgAmount)}/-</strong> (${esc(d.bgAmountWords)} मात्र)
    मैसर्स <strong>${esc(d.contractorName)}</strong>, ${esc(d.contractorAddress)} द्वारा
    प्रस्तुत की गयी थी जिसकी वैधता अवधि <strong>${esc(d.bgExpiryDate)}</strong> को समाप्त हो रही है।
  </p>
  <p>
    अतः इस पत्र द्वारा लिखा जाता है कि उक्त बैंक गारन्टी की वैधता अवधि दिनांक
    <strong>${esc(d.bgNewExpiryDate)}</strong> तक विस्तारित कर सम्बन्धित दस्तावेज
    तत्काल इस कार्यालय में प्रेषित किये जावें।
  </p>
  <p>
    यदि आपके ग्राहक/सम्बन्धित संवेदक की उपरोक्त वैधता अवधि विस्तारित कराने की सहमति / अनुमति अप्राप्त हो
    तो राशि <strong>${esc(d.bgAmount)}/-</strong> रुपये का Demand Draft तत्काल
    अधोहस्ताक्षरकर्ता के नाम अर्थात् <strong>अधिशाषी अभियन्ता, सा.नि.वि.
    जिला खण्ड द्वितीय, उदयपुर</strong> के पक्ष में जारी कर Insured Courier /
    Speed Post अथवा निजी संदेशवाहक के हाथों भिजवाना सुनिश्चित करें।
  </p>
  ${signHtml(d, true)}
  <div class="copy">
    <div class="block tight"><strong>क्रमांक:-</strong> ${esc(d.letterNo) || BLANK_NO}</div>
    <p>
      प्रतिलिपि मैसर्स ${esc(d.ccContractorName)}, ${esc(d.ccContractorAddress)} को
      प्रस्तुत कर निवेदन है कि उक्त बैंक गारन्टी की समयावधि दिनांक
      <strong>${esc(d.bgNewExpiryDate)}</strong> तक बढाकर इस कार्यालय में प्रस्तुत करें।
    </p>
    ${signHtml(d, false)}
  </div>`;
}


function buildReleaseHtml(d: BankCommunicationData): string {
  return `
  ${officeHeaderHtml(d)}
  <div class="block">
    <div><strong>प्रबन्धक,</strong></div>
    <div>${esc(d.bankName)},</div>
    <div>शाखा — ${esc(d.bankBranch)}</div>
  </div>
  <div class="block tight"><strong>विषय:-</strong> बैंक गारन्टी (Bank Guarantee) रिलीज / मुक्त करने बाबत्।</div>
  <div class="block"><strong>सन्दर्भ:-</strong> बैंक गारन्टी संख्या ${esc(d.bgNumber)} दिनांक ${esc(d.bgDate)} राशि रु. ${esc(d.bgAmount)}/-</div>
  <p>महोदय,</p>
  <p>
    उपरोक्त विषयान्तर्गत लेख है कि मैसर्स <strong>${esc(d.contractorName)}</strong>,
    ${esc(d.contractorAddress)} द्वारा <strong>${esc(d.projectName)}</strong> कार्य हेतु
    आपके बैंक द्वारा जारी बैंक गारन्टी संख्या <strong>${esc(d.bgNumber)}</strong>
    दिनांक <strong>${esc(d.bgDate)}</strong> राशि रु. <strong>${esc(d.bgAmount)}/-</strong>
    (${esc(d.bgAmountWords)} मात्र) इस कार्यालय में प्रतिभूति (Security) के रूप में जमा थी।
  </p>
  <p>
    उक्त कार्य पूर्ण / संबंधित औपचारिकताएँ पूर्ण हो चुकी हैं।
    <strong>The BG is no longer required as security by this office.</strong>
    अतः उक्त बैंक गारन्टी को तत्काल रिलीज / मुक्त कर मैसर्स
    <strong>${esc(d.contractorName)}</strong> के पक्ष में वापस कर दिया जावे।
  </p>
  <p>
    कृपया उक्त बैंक गारन्टी रिलीज करने की कार्यवाही पूर्ण कर इस कार्यालय को भी अवगत करावें।
  </p>
  ${signHtml(d, true)}
  <div class="copy">
    <div class="block tight"><strong>क्रमांक:-</strong> ${esc(d.letterNo) || BLANK_NO}</div>
    <p>
      प्रतिलिपि मैसर्स ${esc(d.ccContractorName || d.contractorName)}, ${esc(d.ccContractorAddress || d.contractorAddress)} को
      सूचनार्थ एवं आवश्यक कार्यवाही हेतु प्रेषित।
    </p>
    ${signHtml(d, false)}
  </div>`;
}

function buildEncashmentHtml(d: BankCommunicationData): string {
  return `
  <div style="text-align:center;margin-bottom:16px;">
    <div style="font-weight:bold;font-size:14px;">${esc(d.officeNameHi)}</div>
    <div style="font-weight:bold;font-size:13px;margin-top:2px;">${esc(d.departmentNameHi)}</div>
  </div>
  <div style="display:flex;justify-content:space-between;margin-bottom:16px;font-size:12px;">
    <div><strong>क्रमांक:-</strong> ${esc(d.letterNo) || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</div>
    <div><strong>दिनांक:-</strong> ${esc(d.letterDate)}</div>
  </div>
  <div style="margin-bottom:16px;">
    <div><strong>श्रीमान प्रबन्धक महोदय,</strong></div>
    <div>${esc(d.bankName)},</div>
    <div>शाखा — ${esc(d.bankBranch)}</div>
  </div>
  <div style="margin-bottom:8px;"><strong>विषय:-</strong> बैंक गारन्टी जब्त कर भुनाने बाबत्।</div>
  <div style="margin-bottom:16px;"><strong>सन्दर्भ:-</strong> बैंक गारन्टी संख्या ${esc(d.bgNumber)} दिनांक ${esc(d.bgDate)}</div>
  <p style="text-align:justify;margin-bottom:12px;line-height:1.8;">
    महोदय,
  </p>
  <p style="text-align:justify;margin-bottom:12px;line-height:1.8;">
    उपरोक्त विषयान्तर्गत लेख है कि मैसर्स <strong>${esc(d.contractorName)}</strong>,
    ${esc(d.contractorAddress)} द्वारा <strong>${esc(d.projectName)}</strong> कार्य के
    सम्बन्ध में आपके बैंक द्वारा जारी बैंक गारन्टी संख्या <strong>${esc(d.bgNumber)}</strong>
    दिनांक <strong>${esc(d.bgDate)}</strong> राशि रु. <strong>${esc(d.bgAmount)}/-</strong>
    (${esc(d.bgAmountWords)} मात्र) इस कार्यालय में जमा की गई थी।
  </p>
  <p style="text-align:justify;margin-bottom:20px;line-height:1.8;">
    उक्त कार्य के एग्रीमेन्ट की शर्तों की उचित पालना हेतु उक्त बैंक गारन्टी को एन्कैश कर राशि
    विभाग के खाते में जमा लेने की आवश्यकता है। अतः उक्त बैंक गारन्टी को तत्काल जब्त
    कर एन्कैश कर पूर्ण राशि को अधिशाषी अभियन्ता, सा.नि.वि. जिला
    खण्ड द्वितीय उदयपुर के नाम डिमाण्ड ड्राफ्ट बनवाकर तुरन्त इस कार्यालय को प्रेषित
    करने का श्रम करें।
  </p>
  <div style="text-align:right;margin:32px 0 24px;">
    <div style="height:40px;"></div>
    <div style="font-weight:bold;">(${esc(d.signatoryName)})</div>
    <div>${esc(d.signatoryDesignation)}</div>
    <div>सा.नि.वि. जिला खण्ड द्वितीय उदयपुर</div>
  </div>
  <div style="margin-top:16px;font-size:12px;">
    <div style="margin-bottom:4px;"><strong>क्रमांक:-</strong> ${esc(d.letterNo) || '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;'}</div>
    <div style="margin-bottom:8px;">
      प्रतिलिपि मैसर्स ${esc(d.ccContractorName)}, ${esc(d.ccContractorAddress)} को
      प्रस्तुत कर सूचनार्थ एवं आवश्यक कार्यवाही हेतु प्रेषित।
    </div>
    <div style="text-align:right;margin-top:20px;">
      <div style="font-weight:bold;">(${esc(d.signatoryName)})</div>
      <div>${esc(d.signatoryDesignation)}</div>
      <div>सा.नि.वि. जिला खण्ड द्वितीय उदयपुर</div>
    </div>
  </div>`;
}

function buildStandaloneHtml(template: TemplateType, d: BankCommunicationData): string {
  const body =
    template === 'bg-verification'
      ? buildVerificationHtml(d)
      : template === 'bg-extension'
        ? buildExtensionHtml(d)
        : template === 'bg-release'
          ? buildReleaseHtml(d)
          : buildEncashmentHtml(d);
  const title =
    template === 'bg-verification'
      ? 'Bank Guarantee Verification Letter'
      : template === 'bg-extension'
        ? 'Bank Guarantee Extension Letter (to Contractor)'
        : template === 'bg-release'
          ? 'Bank Guarantee Release Letter'
          : 'Bank Guarantee Encashment Letter';

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  /* ── HEADER / FOOTER SAFETY NET ── margin:0 kills browser header/footer band.
     If a footer still appears, it will only read: DRAFTED BY PRIYANKA JAIN, PWD UDAIPUR */
  @page {
    size: A4 portrait;
    margin: 0;
    @bottom-center {
      content: "DRAFTED BY PRIYANKA JAIN, PWD UDAIPUR";
      font-size: 8pt;
      font-family: Arial, sans-serif;
      color: #000;
    }
  }
  header, footer { display: none !important; }
  body {
    font-family: 'Mangal', 'Nirmala UI', 'Noto Sans Devanagari', sans-serif;
    font-size: 12pt; line-height: 1.5; color: #000; margin: 0;
  }
  .wrap { max-width: 170mm; margin: 0 auto; padding: 25mm; box-sizing: border-box; }
</style>
</head>
<body><div class="wrap">${body}</div></body>
</html>`;
}

const BANK_ARCHIVE_KEY = 'bank-comm-archive';

// ─── Archive Panel ────────────────────────────────────────────────────────────

function ArchivePanel({
  onRestore,
  onClose,
}: {
  onRestore: (entry: ArchiveEntry<{ template: string; data: BankCommunicationData }>) => void;
  onClose: () => void;
}) {
  const [entries, setEntries] = useState(() =>
    archiveLoad<{ template: string; data: BankCommunicationData }>(BANK_ARCHIVE_KEY)
  );

  function handleDelete(id: string) {
    archiveDelete(BANK_ARCHIVE_KEY, id);
    setEntries(archiveLoad(BANK_ARCHIVE_KEY));
  }

  const TEMPLATE_LABELS: Record<string, string> = {
    'bg-verification': 'BG Verification',
    'bg-extension': 'BG Extension (Contractor)',
    'bg-release': 'BG Release',
    'bg-encashment': 'BG Encashment',
  };

  return (
    <div className="flex flex-col h-full bg-card border-l shadow-xl z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />
          <span className="font-bold text-sm">Last 10 Saved Letters</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <ScrollArea className="flex-1">
        {entries.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">
            कोई सहेजा गया पत्र नहीं।<br />
            <span className="text-xs">Download करने पर यहाँ save होगा।</span>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {entries.map((e) => (
              <div key={e.id} className="border rounded-lg p-3 bg-background hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-primary truncate">
                      {TEMPLATE_LABELS[e.data.template] || e.data.template}
                    </div>
                    <div className="text-xs text-foreground/80 mt-0.5 font-medium truncate">
                      {e.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {formatSavedAt(e.savedAt)}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => onRestore(e)}
                      className="text-[10px] bg-primary text-primary-foreground px-2 py-1 rounded font-semibold hover:opacity-80"
                      title="Restore this letter"
                    >
                      Restore
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-red-400 hover:text-red-600 p-1"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

// ─── Field Component ──────────────────────────────────────────────────────────

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm font-semibold">
        {label}
        {hint && <span className="ml-1 font-normal text-muted-foreground text-xs">({hint})</span>}
      </Label>
      {children}
    </div>
  );
}

// ─── Preview Components ───────────────────────────────────────────────────────

function LetterOffice({ d }: { d: BankCommunicationData }) {
  return (
    <>
      <div className="bank-letter-office">
        <div className="bank-letter-office-name">{d.officeNameHi}</div>
        <div className="bank-letter-office-dept">{d.departmentNameHi}</div>
      </div>
      <div className="bank-letter-meta">
        <div>
          <strong>क्रमांक:-</strong> {d.letterNo || '………………………………'}
        </div>
        <div>
          <strong>दिनांक:-</strong> {d.letterDate}
        </div>
      </div>
    </>
  );
}

function LetterSign({ d, gap }: { d: BankCommunicationData; gap?: boolean }) {
  return (
    <div className="bank-letter-sign" style={gap ? { marginTop: '36pt' } : undefined}>
      <div className="bank-letter-sign-inner">
        {gap ? <div style={{ height: '28pt' }} /> : null}
        <div style={{ fontWeight: 700 }}>({d.signatoryName})</div>
        <div>{d.signatoryDesignation}</div>
        <div>सा.नि.वि. जिला खण्ड द्वितीय उदयपुर</div>
      </div>
    </div>
  );
}

function VerificationPreview({ d }: { d: BankCommunicationData }) {
  return (
    <>
      <LetterOffice d={d} />

      <div className="bank-letter-block">
        <div><strong>श्रीमान प्रबन्धक महोदय,</strong></div>
        <div>{d.bankName} {d.bankBranch}</div>
      </div>

      <div className="bank-letter-block">
        <strong>विषय:-</strong> बैंक गारन्टी सत्यापित कराने बाबत।
      </div>
      <div className="bank-letter-block">
        <strong>सन्दर्भ:-</strong> बैंक गारन्टी संख्या {d.bgNumber} दिनांक {d.bgDate}
      </div>

      <p>महोदय,</p>

      <p>
        उपरोक्त विषयान्तर्गत निवेदन है कि आपके द्वारा जारी बैंक गारन्टी संख्या{' '}
        <strong>{d.bgNumber}</strong> दिनांक <strong>{d.bgDate}</strong> RS.{' '}
        <strong>{d.bgAmount}</strong> ({d.bgAmountWords} मात्र) मैसर्स{' '}
        <strong>{d.contractorName}</strong> {d.contractorAddress} के नाम जारी की गई है। उक्त
        बैंक गारन्टी की छाया प्रति संलग्न कर भिजवाई जा रही है।
        कृपया सत्यापित कराने का कष्ट करावे।
      </p>

      <div className="bank-letter-block">
        <strong>सलग्न:-</strong> BG की छाया प्रति
      </div>

      <LetterSign d={d} gap />

      <div className="bank-letter-block">
        <strong>क्रमांक:-</strong> {d.letterNo || '………………………………'}
      </div>
      <p>
        प्रतिलिपि {d.ccBankName}, {d.ccBankAddress} को प्रस्तुत कर
        निवेदन है कि उक्त बैंक गारन्टी को सत्यापित कर इस कार्यालय को अवगत
        करावें।
      </p>
      <LetterSign d={d} />
    </>
  );
}

function ExtensionPreview({ d }: { d: BankCommunicationData }) {
  return (
    <>
      <LetterOffice d={d} />

      <div className="bank-letter-block">
        <div>मैसर्स <strong>{d.contractorName}</strong>,</div>
        <div>{d.contractorClass}</div>
        <div>{d.contractorAddress}</div>
      </div>

      <div className="bank-letter-block">
        <strong>विषय:-</strong> बैंक गारंटी की वैधता अवधि बढ़ाने के संबंध में।
      </div>

      <p>महोदय,</p>

      <p>
        उपरोक्त विषयान्तर्गत लेख है कि सन्दर्भित पत्र द्वारा{' '}
        <strong>{d.projectName}</strong> कार्य की बैंक गारंटी संख्या{' '}
        <strong>{d.bgNumber}</strong> दिनांक <strong>{d.bgDate}</strong> राशि{' '}
        <strong>{d.bgAmount}/-</strong> ({d.bgAmountWords} मात्र) प्रस्तुत की गयी थी जिसकी
        बैंक गारंटी की वैधता अवधि <strong>{d.bgExpiryDate}</strong> को समाप्त हो रही है।
        अतः इस पत्र द्वारा लिखा जाता है कि <strong>{d.extensionDays}</strong> दिवस में
        उक्त बैंक गारन्टी की वैधता अवधि बढाकर प्रस्तुत करे।
      </p>

      <p>
        यदि आप निर्धारित तिथि से पूर्व बैंक गारंटी (BG) प्रस्तुत करते हैं, तो यह आपकी
        जिम्मेदारी रहेगी कि आप समय-समय पर स्वयं बैंक गारंटी का नवीनीकरण करवाएँ, अन्यथा
        बैंक गारंटी इनकेश कर ली जाएगी, जिसकी जिम्मेदारी आपकी रहेगी। कृपया अभिसूचित हों।
      </p>

      <LetterSign d={d} gap />

      <div className="bank-letter-block">
        <strong>क्रमांक:-</strong> {d.letterNo || '………………………………'}
      </div>
      <p>
        प्रतिलिपि प्रबन्धक, {d.ccBankName}, {d.ccBankAddress} को प्रस्तुत कर निवेदन है कि
        उक्त बैंक गारन्टी की समयावधि बढाकर प्रस्तुत करें।
      </p>
      <LetterSign d={d} />
    </>
  );
}

function BankExtensionPreview({ d }: { d: BankCommunicationData }) {
  return (
    <>
      <LetterOffice d={d} />

      <div className="bank-letter-block">
        <div><strong>प्रबन्धक,</strong></div>
        <div>{d.bankName},</div>
        <div>शाखा — {d.bankBranch}</div>
      </div>

      <div className="bank-letter-block">
        <strong>विषय:-</strong> बैंक गारन्टी की वैधता अवधि विस्तार कराने बाबत्।
      </div>
      <div className="bank-letter-block">
        <strong>सन्दर्भ:-</strong> बैंक गारन्टी संख्या {d.bgNumber} दिनांक {d.bgDate}
      </div>

      <p>महोदय,</p>

      <p>
        उपरोक्त विषयान्तर्गत लेख है कि सन्दर्भित पत्र द्वारा{' '}
        <strong>{d.projectName}</strong> कार्य की बेक गारंटी संख्या{' '}
        <strong>{d.bgNumber}</strong> दिनांक <strong>{d.bgDate}</strong>, राशि रु.{' '}
        <strong>{d.bgAmount}/-</strong> ({d.bgAmountWords} मात्र) मैसर्स{' '}
        <strong>{d.contractorName}</strong>, {d.contractorAddress} द्वारा प्रस्तुत की गयी थी
        जिसकी वैधता अवधि <strong>{d.bgExpiryDate}</strong> को समाप्त हो रही है।
      </p>

      <p>
        अतः इस पत्र द्वारा लिखा जाता है कि उक्त बैंक गारन्टी की वैधता अवधि दिनांक{' '}
        <strong>{d.bgNewExpiryDate}</strong> तक विस्तारित कर सम्बन्धित दस्तावेज तत्काल इस
        कार्यालय में प्रेषित किये जावें।
      </p>

      <p>
        यदि आपके ग्राहक/सम्बन्धित संवेदक की उपरोक्त वैधता अवधि विस्तारित कराने की सहमति / अनुमति अप्राप्त हो
        तो राशि <strong>{d.bgAmount}/-</strong> रुपये का Demand Draft तत्काल अधोहस्ताक्षरकर्ता
        के नाम अर्थात् <strong>अधिशाषी अभियन्ता, सा.नि.वि. जिला खण्ड द्वितीय, उदयपुर</strong> के
        पक्ष में जारी कर Insured Courier / Speed Post अथवा निजी संदेशवाहक के हाथों भिजवाना
        सुनिश्चित करें।
      </p>

      <LetterSign d={d} gap />

      <div className="bank-letter-block">
        <strong>क्रमांक:-</strong> {d.letterNo || '………………………………'}
      </div>
      <p>
        प्रतिलिपि मैसर्स {d.ccContractorName}, {d.ccContractorAddress} को प्रस्तुत कर
        निवेदन है कि उक्त बैंक गारन्टी की समयावधि दिनांक{' '}
        <strong>{d.bgNewExpiryDate}</strong> तक बढाकर इस कार्यालय में प्रस्तुत करें।
      </p>
      <LetterSign d={d} />
    </>
  );
}


function ReleasePreview({ d }: { d: BankCommunicationData }) {
  return (
    <>
      <LetterOffice d={d} />

      <div className="bank-letter-block">
        <div><strong>प्रबन्धक,</strong></div>
        <div>{d.bankName},</div>
        <div>शाखा — {d.bankBranch}</div>
      </div>

      <div className="bank-letter-block">
        <strong>विषय:-</strong> बैंक गारन्टी (Bank Guarantee) रिलीज / मुक्त करने बाबत्।
      </div>
      <div className="bank-letter-block">
        <strong>सन्दर्भ:-</strong> बैंक गारन्टी संख्या {d.bgNumber} दिनांक {d.bgDate} राशि रु. {d.bgAmount}/-
      </div>

      <p>महोदय,</p>

      <p>
        उपरोक्त विषयान्तर्गत लेख है कि मैसर्स <strong>{d.contractorName}</strong>,{' '}
        {d.contractorAddress} द्वारा <strong>{d.projectName}</strong> कार्य हेतु आपके बैंक द्वारा
        जारी बैंक गारन्टी संख्या <strong>{d.bgNumber}</strong> दिनांक <strong>{d.bgDate}</strong>{' '}
        राशि रु. <strong>{d.bgAmount}/-</strong> ({d.bgAmountWords} मात्र) इस कार्यालय में
        प्रतिभूति (Security) के रूप में जमा थी।
      </p>

      <p>
        उक्त कार्य पूर्ण / संबंधित औपचारिकताएँ पूर्ण हो चुकी हैं।{' '}
        <strong>The BG is no longer required as security by this office.</strong> अतः उक्त बैंक
        गारन्टी को तत्काल रिलीज / मुक्त कर मैसर्स <strong>{d.contractorName}</strong> के पक्ष में
        वापस कर दिया जावे।
      </p>

      <p>
        कृपया उक्त बैंक गारन्टी रिलीज करने की कार्यवाही पूर्ण कर इस कार्यालय को भी अवगत करावें।
      </p>

      <LetterSign d={d} gap />

      <div className="bank-letter-block">
        <strong>क्रमांक:-</strong> {d.letterNo || '………………………………'}
      </div>
      <p>
        प्रतिलिपि मैसर्स {d.ccContractorName || d.contractorName},{' '}
        {d.ccContractorAddress || d.contractorAddress} को सूचनार्थ एवं आवश्यक कार्यवाही हेतु
        प्रेषित।
      </p>
      <LetterSign d={d} />
    </>
  );
}

function EncashmentPreview({ d }: { d: BankCommunicationData }) {
  return (
    <>
      <div className="text-center mb-5">
        <h1 className="text-[14px] font-bold">{d.officeNameHi}</h1>
        <h2 className="text-[13px] font-bold mt-0.5">{d.departmentNameHi}</h2>
      </div>

      <div className="flex justify-between mb-5 text-[12px]">
        <div>
          <span className="font-bold">क्रमांक:-</span>{' '}
          {d.letterNo || '………………………………'}
        </div>
        <div>
          <span className="font-bold">दिनांक:-</span> {d.letterDate}
        </div>
      </div>

      <div className="mb-5">
        <div className="font-bold">श्रीमान प्रबन्धक महोदय,</div>
        <div>{d.bankName},</div>
        <div>शाखा — {d.bankBranch}</div>
      </div>

      <div className="mb-2">
        <span className="font-bold">विषय:-</span> बैंक गारन्टी जब्त कर भुनाने बाबत्।
      </div>
      <div className="mb-5">
        <span className="font-bold">सन्दर्भ:-</span> बैंक गारन्टी संख्या {d.bgNumber} दिनांक {d.bgDate}
      </div>

      <p className="text-justify mb-3 leading-relaxed">महोदय,</p>

      <p className="text-justify mb-3 leading-relaxed">
        उपरोक्त विषयान्तर्गत लेख है कि मैसर्स{' '}
        <strong>{d.contractorName}</strong>, {d.contractorAddress} द्वारा{' '}
        <strong>{d.projectName}</strong> कार्य के सम्बन्ध में आपके बैंक द्वारा जारी बैंक
        गारन्टी संख्या <strong>{d.bgNumber}</strong> दिनांक <strong>{d.bgDate}</strong> राशि
        रु. <strong>{d.bgAmount}/-</strong> ({d.bgAmountWords} मात्र) इस कार्यालय में जमा की
        गई थी।
      </p>

      <p className="text-justify mb-6 leading-relaxed">
        उक्त कार्य के एग्रीमेन्ट की शर्तों की उचित पालना हेतु उक्त बैंक गारन्टी को एन्कैश कर राशि
        विभाग के खाते में जमा लेने की आवश्यकता है। अतः उक्त बैंक गारन्टी को तत्काल जब्त
        कर एन्कैश कर पूर्ण राशि को अधिशाषी अभियन्ता, सा.नि.वि. जिला
        खण्ड द्वितीय उदयपुर के नाम डिमाण्ड ड्राफ्ट बनवाकर तुरन्त इस कार्यालय को प्रेषित
        करने का श्रम करें।
      </p>

      <div className="flex justify-end mb-6 mt-8">
        <div className="text-center w-[220px]">
          <div className="h-10" />
          <div className="font-bold">({d.signatoryName})</div>
          <div>{d.signatoryDesignation}</div>
          <div>सा.नि.वि. जिला खण्ड द्वितीय उदयपुर</div>
        </div>
      </div>

      <div className="mt-6 text-[12px]">
        <div className="mb-1">
          <span className="font-bold">क्रमांक:-</span>{' '}
          {d.letterNo || '………………………………'}
        </div>
        <p className="text-justify leading-relaxed">
          प्रतिलिपि मैसर्स {d.ccContractorName}, {d.ccContractorAddress} को प्रस्तुत कर
          सूचनार्थ एवं आवश्यक कार्यवाही हेतु प्रेषित।
        </p>
        <div className="flex justify-end mt-6">
          <div className="text-center w-[220px]">
            <div className="font-bold">({d.signatoryName})</div>
            <div>{d.signatoryDesignation}</div>
            <div>सा.नि.वि. जिला खण्ड द्वितीय उदयपुर</div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BankCommunicationGenerator() {
  const [template, setTemplate] = useState<TemplateType>('bg-verification');
  const [data, setData] = useState<BankCommunicationData>(defaultData);
  const [showArchive, setShowArchive] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof BankCommunicationData>(key: K, value: BankCommunicationData[K]) {
    setData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === 'bgAmount') {
        const words = numberToWordsHindi(value as string);
        if (words) next.bgAmountWords = words;
      }
      return next;
    });
  }

  const handlePrint = () => {
    const html = buildStandaloneHtml(template, data);
    const printWin = window.open('', '_blank', 'width=900,height=700');
    if (!printWin) return;
    printWin.document.open();
    printWin.document.write(html);
    printWin.document.close();
    printWin.focus();
    // Give fonts/layout a moment to render before printing
    setTimeout(() => {
      printWin.print();
      printWin.close();
    }, 400);
  };
  const handleReset = () => {
    setData(defaultData);
    setTemplate('bg-verification');
  };

  const handleDownloadDoc = () => {
    // Save to archive before downloading
    const label = `${selectedTemplate.labelEn} — ${data.contractorName || '(no contractor)'} — ${data.letterDate}`;
    archiveSave(BANK_ARCHIVE_KEY, label, { template, data });
    const html = buildStandaloneHtml(template, data);
    const name =
      template === 'bg-verification'
        ? 'bg-verification-letter'
        : template === 'bg-extension'
          ? 'bg-extension-letter-contractor'
          : template === 'bg-release'
            ? 'bg-release-letter'
            : 'bg-encashment-letter';
    const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${name}.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  function handleRestore(entry: ArchiveEntry<{ template: string; data: BankCommunicationData }>) {
    setTemplate(entry.data.template as TemplateType);
    setData(entry.data.data);
    setShowArchive(false);
  }

  const selectedTemplate = TEMPLATE_OPTIONS.find((t) => t.value === template)!;

  return (
    <div className="flex min-h-[100dvh] w-full bg-background overflow-hidden">
      {/* ── LEFT PANEL: FORM ── */}
      <div className="w-[420px] flex flex-col border-r bg-card shadow-md hide-on-print z-10 flex-shrink-0">
        <div className="px-4 py-3 border-b bg-primary text-primary-foreground">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="font-bold text-base leading-tight">बैंक संचार पत्र</h1>
              <p className="text-xs text-primary-foreground/75 mt-0.5">
                Bank Communication — P.W.D. District Div.-II Udaipur
              </p>
            </div>
            <div className="flex gap-1 mt-0.5 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowArchive(v => !v)}
                title="Last 10 saved letters"
                className="h-8 px-2 text-xs"
              >
                <History className="h-3.5 w-3.5 mr-1" /> History
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                title="Reset"
                className="h-8 px-2 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-primary-foreground/80 bg-primary-foreground/10 rounded px-2 py-1 leading-relaxed">
            📋 टेम्पलेट चुनें और विवरण भरें — दाईं तरफ पत्र तैयार होगा।
            <br />
            <span className="text-primary-foreground/60">
              Select a template and fill details. The letter updates automatically.
            </span>
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-4 space-y-6 pb-10">
            {/* Template selector */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-1.5">
                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">टेम्पलेट चुनें</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Select Template</p>
                </div>
              </div>

              {TEMPLATE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${template === opt.value
                    ? 'border-primary bg-primary/5'
                    : 'border-border bg-muted/30 hover:bg-muted/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="template"
                    value={opt.value}
                    checked={template === opt.value}
                    onChange={() => setTemplate(opt.value)}
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <div className="text-sm font-bold">{opt.labelHi}</div>
                    <div className="text-xs text-muted-foreground">{opt.labelEn}</div>
                    <div className="text-[11px] text-muted-foreground mt-1">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </section>

            {/* Letter details */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-1.5">
                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">पत्र विवरण</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Letter Details</p>
                </div>
              </div>

              <Field label="क्रमांक" hint="Letter No.">
                <Input
                  value={data.letterNo}
                  onChange={(e) => update('letterNo', e.target.value)}
                  placeholder="जैसे: 325-26"
                  className="h-10"
                />
              </Field>

              <Field label="दिनांक" hint="Date">
                <Input
                  value={data.letterDate}
                  onChange={(e) => update('letterDate', e.target.value)}
                  placeholder="DD/MM/YYYY"
                  className="h-10"
                />
              </Field>
            </section>

            {/* Bank Guarantee details (shared) */}
            <section className="space-y-3">
              <div className="flex items-center gap-2 border-b pb-1.5">
                <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <p className="text-sm font-bold leading-none">बैंक गारन्टी विवरण</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Bank Guarantee Details</p>
                </div>
              </div>

              <Field label="BG संख्या" hint="BG Number">
                <Input
                  value={data.bgNumber}
                  onChange={(e) => update('bgNumber', e.target.value)}
                  placeholder="जैसे: C73GT02251250002"
                  className="h-10 font-mono"
                />
              </Field>

              <Field label="BG दिनांक" hint="BG Date">
                <Input
                  value={data.bgDate}
                  onChange={(e) => update('bgDate', e.target.value)}
                  placeholder="DD.MM.YYYY"
                  className="h-10"
                />
              </Field>

              <Field label="BG राशि (अंकों में)" hint="Amount in Figures">
                <Input
                  value={data.bgAmount}
                  onChange={(e) => update('bgAmount', e.target.value)}
                  placeholder="जैसे: 8,43,734.00"
                  className="h-10"
                />
              </Field>

              <Field label="BG राशि (शब्दों में)" hint="Amount in Words">
                <Input
                  value={data.bgAmountWords}
                  onChange={(e) => update('bgAmountWords', e.target.value)}
                  placeholder="जैसे: आठ लाख तियालीस हजार..."
                  className="h-10"
                />
              </Field>
            </section>

            {/* Template-specific fields */}
            {template === 'bg-verification' ? (
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-none">बैंक एवं ठेकेदार</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Bank & Contractor</p>
                  </div>
                </div>

                <Field label="बैंक का नाम" hint="Bank Name">
                  <Input
                    value={data.bankName}
                    onChange={(e) => update('bankName', e.target.value)}
                    placeholder="जैसे: HDFC Bank"
                    className="h-10"
                  />
                </Field>

                <Field label="बैंक शाखा / स्थान" hint="Branch / Location">
                  <Input
                    value={data.bankBranch}
                    onChange={(e) => update('bankBranch', e.target.value)}
                    placeholder="जैसे: उदयपुर"
                    className="h-10"
                  />
                </Field>

                <Field label="ठेकेदार / फर्म का नाम" hint="Contractor / Firm Name">
                  <Input
                    value={data.contractorName}
                    onChange={(e) => update('contractorName', e.target.value)}
                    placeholder="जैसे: रचना कन्स्ट्रक्शन"
                    className="h-10"
                  />
                </Field>

                <Field label="ठेकेदार का पता" hint="Contractor Address">
                  <Textarea
                    value={data.contractorAddress}
                    onChange={(e) => update('contractorAddress', e.target.value)}
                    placeholder="पूरा पता"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="हस्ताक्षरकर्ता का नाम" hint="Signatory Name">
                  <Input
                    value={data.signatoryName}
                    onChange={(e) => update('signatoryName', e.target.value)}
                    placeholder="जैसे: अनिल खिच्ची"
                    className="h-10"
                  />
                </Field>

                <Field label="पदनाम" hint="Designation">
                  <Input
                    value={data.signatoryDesignation}
                    onChange={(e) => update('signatoryDesignation', e.target.value)}
                    placeholder="जैसे: अधिशाषी अभियन्ता"
                    className="h-10"
                  />
                </Field>

                <Field label="प्रतिलिपि — बैंक का नाम" hint="CC Bank Name">
                  <Input
                    value={data.ccBankName}
                    onChange={(e) => update('ccBankName', e.target.value)}
                    placeholder="जैसे: यूनियन बैंक ऑफ इण्डिया"
                    className="h-10"
                  />
                </Field>

                <Field label="प्रतिलिपि — बैंक का पता" hint="CC Bank Address">
                  <Textarea
                    value={data.ccBankAddress}
                    onChange={(e) => update('ccBankAddress', e.target.value)}
                    placeholder="बैंक शाखा का पूरा पता"
                    className="min-h-[72px] resize-none"
                  />
                </Field>
              </section>
            ) : template === 'bg-extension' ? (
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-none">ठेकेदार एवं परियोजना</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Contractor & Project</p>
                  </div>
                </div>

                <Field label="ठेकेदार / फर्म का नाम" hint="Contractor / Firm Name">
                  <Input
                    value={data.contractorName}
                    onChange={(e) => update('contractorName', e.target.value)}
                    placeholder="जैसे: सिद्धार्थ शर्मा"
                    className="h-10"
                  />
                </Field>

                <Field label="ठेकेदार वर्ग" hint="Contractor Class">
                  <Input
                    value={data.contractorClass}
                    onChange={(e) => update('contractorClass', e.target.value)}
                    placeholder="जैसे: ए क्लास संवेदक"
                    className="h-10"
                  />
                </Field>

                <Field label="ठेकेदार का पता" hint="Contractor Address">
                  <Textarea
                    value={data.contractorAddress}
                    onChange={(e) => update('contractorAddress', e.target.value)}
                    placeholder="पूरा पता"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="परियोजना / कार्य का नाम" hint="Project / Work Name">
                  <Textarea
                    value={data.projectName}
                    onChange={(e) => update('projectName', e.target.value)}
                    placeholder="Package No. और कार्य का विवरण"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="BG वैधता समाप्ति दिनांक" hint="BG Expiry Date">
                  <Input
                    value={data.bgExpiryDate}
                    onChange={(e) => update('bgExpiryDate', e.target.value)}
                    placeholder="DD.MM.YYYY"
                    className="h-10"
                  />
                </Field>

                <Field label="विस्तार हेतु दिन" hint="Extension Days">
                  <Input
                    value={data.extensionDays}
                    onChange={(e) => update('extensionDays', e.target.value)}
                    placeholder="जैसे: 3"
                    className="h-10"
                  />
                </Field>

                <Field label="प्रतिलिपि — बैंक का नाम" hint="CC Bank Name">
                  <Input
                    value={data.ccBankName}
                    onChange={(e) => update('ccBankName', e.target.value)}
                    placeholder="जैसे: यूनियन बैंक ऑफ इण्डिया"
                    className="h-10"
                  />
                </Field>

                <Field label="प्रतिलिपि — बैंक का पता" hint="CC Bank Address">
                  <Textarea
                    value={data.ccBankAddress}
                    onChange={(e) => update('ccBankAddress', e.target.value)}
                    placeholder="बैंक शाखा का पूरा पता"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="हस्ताक्षरकर्ता का नाम" hint="Signatory Name">
                  <Input
                    value={data.signatoryName}
                    onChange={(e) => update('signatoryName', e.target.value)}
                    placeholder="जैसे: अनिल खिच्ची"
                    className="h-10"
                  />
                </Field>

                <Field label="पदनाम" hint="Designation">
                  <Input
                    value={data.signatoryDesignation}
                    onChange={(e) => update('signatoryDesignation', e.target.value)}
                    placeholder="जैसे: अधिशाषी अभियन्ता"
                    className="h-10"
                  />
                </Field>
              </section>
            ) : template === 'bg-encashment' ? (
              <section className="space-y-3">{/* bg-encashment — BG Encashment Letter to Bank */}
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-none">बैंक, ठेकेदार एवं परियोजना</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Bank, Contractor & Project</p>
                  </div>
                </div>

                <Field label="बैंक का नाम" hint="Bank Name">
                  <Input
                    value={data.bankName}
                    onChange={(e) => update('bankName', e.target.value)}
                    placeholder="जैसे: HDFC Bank"
                    className="h-10"
                  />
                </Field>

                <Field label="बैंक शाखा / स्थान" hint="Branch / Location">
                  <Input
                    value={data.bankBranch}
                    onChange={(e) => update('bankBranch', e.target.value)}
                    placeholder="जैसे: उदयपुर"
                    className="h-10"
                  />
                </Field>

                <Field label="ठेकेदार / फर्म का नाम" hint="Contractor / Firm Name">
                  <Input
                    value={data.contractorName}
                    onChange={(e) => update('contractorName', e.target.value)}
                    placeholder="जैसे: रचना कन्स्ट्रक्शन"
                    className="h-10"
                  />
                </Field>

                <Field label="ठेकेदार का पता" hint="Contractor Address">
                  <Textarea
                    value={data.contractorAddress}
                    onChange={(e) => update('contractorAddress', e.target.value)}
                    placeholder="पूरा पता"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="परियोजना / कार्य का नाम" hint="Project / Work Name">
                  <Textarea
                    value={data.projectName}
                    onChange={(e) => update('projectName', e.target.value)}
                    placeholder="Package No. और कार्य का विवरण"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="प्रतिलिपि — ठेकेदार का नाम" hint="CC Contractor Name">
                  <Input
                    value={data.ccContractorName}
                    onChange={(e) => update('ccContractorName', e.target.value)}
                    placeholder="जैसे: रचना कन्स्ट्रक्शन"
                    className="h-10"
                  />
                </Field>

                <Field label="प्रतिलिपि — ठेकेदार का पता" hint="CC Contractor Address">
                  <Textarea
                    value={data.ccContractorAddress}
                    onChange={(e) => update('ccContractorAddress', e.target.value)}
                    placeholder="ठेकेदार का पूरा पता"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="हस्ताक्षरकर्ता का नाम" hint="Signatory Name">
                  <Input
                    value={data.signatoryName}
                    onChange={(e) => update('signatoryName', e.target.value)}
                    placeholder="जैसे: अनिल खिच्ची"
                    className="h-10"
                  />
                </Field>

                <Field label="पदनाम" hint="Designation">
                  <Input
                    value={data.signatoryDesignation}
                    onChange={(e) => update('signatoryDesignation', e.target.value)}
                    placeholder="जैसे: अधिशाषी अभियन्ता"
                    className="h-10"
                  />
                </Field>
              </section>
            ) : (
              <section className="space-y-3">{/* bg-release — BG Release Letter to Bank */}
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <p className="text-sm font-bold leading-none">बैंक, ठेकेदार एवं परियोजना</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Bank, Contractor & Project</p>
                  </div>
                </div>

                <Field label="बैंक का नाम" hint="Bank Name">
                  <Input
                    value={data.bankName}
                    onChange={(e) => update('bankName', e.target.value)}
                    placeholder="जैसे: HDFC Bank"
                    className="h-10"
                  />
                </Field>

                <Field label="बैंक शाखा / स्थान" hint="Branch / Location">
                  <Input
                    value={data.bankBranch}
                    onChange={(e) => update('bankBranch', e.target.value)}
                    placeholder="जैसे: उदयपुर"
                    className="h-10"
                  />
                </Field>

                <Field label="ठेकेदार / फर्म का नाम" hint="Contractor / Firm Name">
                  <Input
                    value={data.contractorName}
                    onChange={(e) => update('contractorName', e.target.value)}
                    placeholder="जैसे: रचना कन्स्ट्रक्शन"
                    className="h-10"
                  />
                </Field>

                <Field label="ठेकेदार का पता" hint="Contractor Address">
                  <Textarea
                    value={data.contractorAddress}
                    onChange={(e) => update('contractorAddress', e.target.value)}
                    placeholder="पूरा पता"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="परियोजना / कार्य का नाम" hint="Project / Work Name">
                  <Textarea
                    value={data.projectName}
                    onChange={(e) => update('projectName', e.target.value)}
                    placeholder="Package No. और कार्य का विवरण"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="प्रतिलिपि — ठेकेदार का नाम" hint="CC Contractor Name">
                  <Input
                    value={data.ccContractorName}
                    onChange={(e) => update('ccContractorName', e.target.value)}
                    placeholder="जैसे: रचना कन्स्ट्रक्शन"
                    className="h-10"
                  />
                </Field>

                <Field label="प्रतिलिपि — ठेकेदार का पता" hint="CC Contractor Address">
                  <Textarea
                    value={data.ccContractorAddress}
                    onChange={(e) => update('ccContractorAddress', e.target.value)}
                    placeholder="ठेकेदार का पूरा पता"
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="हस्ताक्षरकर्ता का नाम" hint="Signatory Name">
                  <Input
                    value={data.signatoryName}
                    onChange={(e) => update('signatoryName', e.target.value)}
                    placeholder="जैसे: अनिल खिच्ची"
                    className="h-10"
                  />
                </Field>

                <Field label="पदनाम" hint="Designation">
                  <Input
                    value={data.signatoryDesignation}
                    onChange={(e) => update('signatoryDesignation', e.target.value)}
                    placeholder="जैसे: अधिशाषी अभियन्ता"
                    className="h-10"
                  />
                </Field>
              </section>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-1">
              <Button type="button" onClick={handlePrint} className="w-full h-12 text-base font-bold">
                <Printer className="mr-2 h-5 w-5" />
                🖨️ Print / Save as PDF
              </Button>
              <Button
                type="button"
                onClick={handleDownloadDoc}
                className="w-full h-12 text-base font-bold bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                <FileDown className="mr-2 h-5 w-5" />
                💾 Save as .doc (Word)
              </Button>
            </div>
          </div>
        </ScrollArea>
      </div>

      {/* ── RIGHT PANEL: A4 PREVIEW ── */}
      <div className="flex-1 overflow-auto bg-slate-100 p-8">
        <div className="max-w-[210mm] mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 hide-on-print">
          <div>
            <p className="text-xs text-muted-foreground">
              Disable &quot;Headers and footers&quot; in the print dialog for best output.
            </p>
            <p className="text-xs font-semibold text-primary mt-1">{selectedTemplate.labelHi}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handlePrint}>
              <Printer className="mr-1.5 h-3.5 w-3.5" /> Print / PDF
            </Button>
            <Button size="sm" variant="outline" onClick={handleDownloadDoc}>
              <FileDown className="mr-1.5 h-3.5 w-3.5" /> Word (.doc)
            </Button>
          </div>
        </div>

        <div
          ref={pageRef}
          className="a4-page bank-letter"
          style={{
            fontFamily: "'Mangal', 'Nirmala UI', 'Noto Sans Devanagari', sans-serif",
            fontSize: "12pt",
            lineHeight: 2.35,
            padding: "20mm 22mm",
          }}
        >
          {template === 'bg-verification' ? (
            <VerificationPreview d={data} />
          ) : template === 'bg-extension' ? (
            <ExtensionPreview d={data} />
          ) : template === 'bg-release' ? (
            <ReleasePreview d={data} />
          ) : (
            <EncashmentPreview d={data} />
          )}
        </div>
      </div>
    </div>
  );
}
