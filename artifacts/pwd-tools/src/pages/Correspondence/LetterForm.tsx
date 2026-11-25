import { ArrowLeft, FileCheck, Languages, Save } from "lucide-react";
import { useId, useState } from "react";
import type { Letter, LetterFormData, LetterLanguage, LetterType } from "./types";
import {
  DEFAULT_FROM_DESIGNATION,
  DEFAULT_FROM_DESIGNATION_EN,
  DEFAULT_FROM_NAME,
  DEFAULT_FROM_NAME_EN,
  DEFAULT_FROM_OFFICE,
  DEFAULT_FROM_OFFICE_EN,
} from "./types";
import { useTranslit } from "./useTranslit";

interface Props {
  initialType: LetterType;
  existing?: Letter;
  onSubmit: (data: LetterFormData) => void;
  saving?: boolean;
  onBack: () => void;
}

function todayStr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

const LABEL = "block text-xs font-semibold text-gray-600 mb-1";
const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent";
const TEXTAREA = INPUT + " resize-none";

const LANGUAGE_LABEL: Record<LetterLanguage, string> = {
  hindi: "हिन्दी",
  english: "English",
  both: "हिन्दी + English",
};

// ── Small wrapper components so each field gets its own translit hook ─────

interface HInputProps {
  label: string;
  testid?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  translit: boolean;
  required?: boolean;
}

function HInput({ label, testid, value, onChange, placeholder, translit, required }: HInputProps) {
  const tl = useTranslit(translit, value, onChange);
  const id = useId();
  return (
    <div>
      <label className={LABEL} htmlFor={id}>{label}{required && " *"}</label>
      <input
        id={id}
        aria-required={required}
        data-testid={testid}
        className={INPUT + (translit ? " bg-amber-50 focus:bg-white" : "")}
        placeholder={placeholder}
        {...tl}
      />
    </div>
  );
}

interface HTextareaProps extends HInputProps {
  rows?: number;
}

function HTextarea({ label, testid, value, onChange, placeholder, translit, rows = 3, required }: HTextareaProps) {
  const tl = useTranslit(translit, value, onChange);
  const id = useId();
  return (
    <div>
      <label className={LABEL} htmlFor={id}>{label}{required && " *"}</label>
      <textarea
        id={id}
        aria-required={required}
        data-testid={testid}
        className={TEXTAREA + (translit ? " bg-amber-50 focus:bg-white" : "")}
        rows={rows}
        placeholder={placeholder}
        {...tl}
      />
    </div>
  );
}

// ── Main form ──────────────────────────────────────────────────────────────

export default function LetterForm({ initialType, existing, onSubmit, onBack, saving = false }: Props) {
  const isEdit = !!existing;
  const isReply = (existing?.type ?? initialType) === "reply";

  const [translit, setTranslit] = useState(false);

  const [form, setForm] = useState<LetterFormData>({
    type: existing?.type ?? initialType,
    status: existing?.status ?? "draft",
    language: existing?.language ?? "hindi",
    letterNumber: existing?.letterNumber ?? "",
    date: existing?.date ?? todayStr(),
    toName: existing?.toName ?? "",
    toDesignation: existing?.toDesignation ?? "",
    toOffice: existing?.toOffice ?? "",
    toNameEn: existing?.toNameEn ?? "",
    toDesignationEn: existing?.toDesignationEn ?? "",
    toOfficeEn: existing?.toOfficeEn ?? "",
    subject: existing?.subject ?? "",
    subjectEn: existing?.subjectEn ?? "",
    reference: existing?.reference ?? "",
    referenceEn: existing?.referenceEn ?? "",
    body: existing?.body ?? "",
    bodyEn: existing?.bodyEn ?? "",
    fromName: existing?.fromName ?? DEFAULT_FROM_NAME,
    fromDesignation: existing?.fromDesignation ?? DEFAULT_FROM_DESIGNATION,
    fromOffice: existing?.fromOffice ?? DEFAULT_FROM_OFFICE,
    fromNameEn: existing?.fromNameEn ?? DEFAULT_FROM_NAME_EN,
    fromDesignationEn: existing?.fromDesignationEn ?? DEFAULT_FROM_DESIGNATION_EN,
    fromOfficeEn: existing?.fromOfficeEn ?? DEFAULT_FROM_OFFICE_EN,
    cc: existing?.cc ?? "",
    ccEn: existing?.ccEn ?? "",
    toMany: existing?.toMany ?? "",
  });

  function set(field: keyof LetterFormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function setLanguage(language: LetterLanguage) {
    setForm((prev) => ({ ...prev, language }));
  }

  const showHindi = form.language !== "english";
  const showEnglish = form.language !== "hindi";

  function handleSubmit(status: "draft" | "final") {
    if (!form.letterNumber.trim()) {
      alert("क्रमांक / Letter number आवश्यक है");
      return;
    }
    if (form.language === "hindi" && (!form.toName.trim() || !form.subject.trim() || !form.body.trim())) {
      alert("हिन्दी में प्राप्तकर्ता, विषय और पत्र की सामग्री आवश्यक है");
      return;
    }
    if (form.language === "english" && (!form.toNameEn.trim() || !form.subjectEn.trim() || !form.bodyEn.trim())) {
      alert("In English mode, recipient, subject, and letter body are required");
      return;
    }
    if (form.language === "both" && (
      !form.toName.trim() || !form.subject.trim() || !form.body.trim() ||
      !form.toNameEn.trim() || !form.subjectEn.trim() || !form.bodyEn.trim()
    )) {
      alert("हिन्दी और English दोनों संस्करणों में प्राप्तकर्ता, विषय और सामग्री भरें");
      return;
    }
    onSubmit({ ...form, status });
  }

  // helper: make setter callback for a field
  const s = (field: keyof LetterFormData) => (v: string) => set(field, v);

  return (
    <div className="flex flex-col gap-6">

      {/* ── Header bar ── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button data-testid="btn-back" onClick={onBack}
          className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors">
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-base font-bold text-gray-800 flex-1">
          {isEdit ? "पत्र संपादित करें / Edit Letter"
            : isReply ? "प्रत्युत्तर पत्र / Reply Letter"
              : "नया पत्र / New Letter"}
        </h2>

        {/* ── Roman→Hindi toggle ── */}
        {showHindi && (
          <button
            type="button"
            onClick={() => setTranslit((v) => !v)}
            title={translit
              ? "Roman→Hindi सक्रिय — Space दबाने पर शब्द हिन्दी में बदलेगा। बंद करने के लिए क्लिक करें।"
              : "Roman लिपि में टाइप करें — Space पर हिन्दी में बदलेगा"}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold border transition-all select-none ${translit
              ? "bg-amber-500 text-white border-amber-500 shadow-md"
              : "bg-white text-gray-600 border-gray-300 hover:border-amber-400 hover:text-amber-600"
              }`}
          >
            <Languages size={15} />
            {translit ? "अ→ Roman बंद करें" : "Roman → अ"}
          </button>
        )}
      </div>

      {/* ── Transliteration tip banner (visible when active) ── */}
      {translit && showHindi && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
          <span className="text-xl leading-none mt-0.5">⌨️</span>
          <div>
            <p className="font-semibold mb-0.5">Roman → हिन्दी सक्रिय है</p>
            <p className="text-xs text-amber-700">
              हिन्दी वाले खेत (पीले रंग) में Roman में टाइप करें और
              <kbd className="mx-1 px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded text-xs font-mono">Space</kbd>
              दबाएं — शब्द अपने आप हिन्दी में बदल जाएगा।
              <span className="ml-2 opacity-70">
                उदा॰: <code className="font-mono">adhishasi</code> → <span className="font-devanagari">अधिशासी</span>
              </span>
              <br />
              <span className="opacity-70">
                <kbd className="px-1.5 py-0.5 bg-amber-100 border border-amber-300 rounded text-xs font-mono">Ctrl+Z</kbd>
                {" "}से अंतिम बदलाव वापस लें।
              </span>
            </p>
          </div>
        </div>
      )}

      {/* ── Language selector ── */}
      <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
        <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-3">
          Draft language / पत्र की भाषा
        </p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(LANGUAGE_LABEL) as LetterLanguage[]).map((lng) => (
            <button key={lng} type="button" data-testid={`language-${lng}`} aria-pressed={form.language === lng}
              onClick={() => setLanguage(lng)}
              className={`px-4 py-2 rounded-md text-sm font-semibold border transition-colors ${form.language === lng
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
            >
              {LANGUAGE_LABEL[lng]}
            </button>
          ))}
        </div>
        <p className="text-xs text-blue-700 mt-2">
          Both mode keeps Hindi and English as separate versions in preview and Word file.
        </p>
      </div>

      {/* ── Letter number & date ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={LABEL} htmlFor="letter-number">क्रमांक / Letter No. *</label>
          <input id="letter-number" data-testid="input-letter-number" className={INPUT} aria-required="true"
            value={form.letterNumber}
            onChange={(e) => set("letterNumber", e.target.value)}
            placeholder="PWD/EE/DD-II/UDR/2026/___" />
        </div>
        <div>
          <label className={LABEL} htmlFor="letter-date">दिनांक / Date *</label>
          <input id="letter-date" data-testid="input-date" className={INPUT} aria-required="true"
            value={form.date}
            onChange={(e) => set("date", e.target.value)}
            placeholder="DD.MM.YYYY" />
        </div>
      </div>

      {/* ── Recipient ── */}
      <section className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
          प्राप्तकर्ता / Recipient
        </p>
        {showHindi && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <HInput label="नाम" testid="input-to-name"
              value={form.toName} onChange={s("toName")}
              placeholder="श्री रामलाल शर्मा" translit={translit} required />
            <HInput label="पदनाम" testid="input-to-designation"
              value={form.toDesignation} onChange={s("toDesignation")}
              placeholder="अधीक्षण अभियंता" translit={translit} required />
            <HInput label="कार्यालय" testid="input-to-office"
              value={form.toOffice} onChange={s("toOffice")}
              placeholder="सा.नि.वि., वृत्त–उदयपुर" translit={translit} required />
          </div>
        )}
        {showEnglish && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className={LABEL} htmlFor="letter-recipient-en">Name *</label>
              <input id="letter-recipient-en" data-testid="input-to-name-en" className={INPUT} aria-required="true"
                value={form.toNameEn} onChange={(e) => set("toNameEn", e.target.value)}
                placeholder="Superintending Engineer" />
            </div>
            <div>
              <label className={LABEL} htmlFor="letter-designation-en">Designation</label>
              <input id="letter-designation-en" data-testid="input-to-designation-en" className={INPUT}
                value={form.toDesignationEn} onChange={(e) => set("toDesignationEn", e.target.value)}
                placeholder="Superintending Engineer" />
            </div>
            <div>
              <label className={LABEL} htmlFor="letter-office-en">Office</label>
              <input id="letter-office-en" data-testid="input-to-office-en" className={INPUT}
                value={form.toOfficeEn} onChange={(e) => set("toOfficeEn", e.target.value)}
                placeholder="PWD Circle, Udaipur" />
            </div>
          </div>
        )}
      </section>

      {/* ── Subject ── */}
      <section className="grid grid-cols-1 gap-4">
        {showHindi && (
          <HInput label="विषय" testid="input-subject"
            value={form.subject} onChange={s("subject")}
            placeholder="विशेष जांच प्रतिवेदन वर्ष 2025-26 के संबंध में..."
            translit={translit} required />
        )}
        {showEnglish && (
          <div>
            <label className={LABEL} htmlFor="letter-subject-en">Subject *</label>
            <input id="letter-subject-en" data-testid="input-subject-en" className={INPUT} aria-required="true"
              value={form.subjectEn} onChange={(e) => set("subjectEn", e.target.value)}
              placeholder="Enter subject..." />
          </div>
        )}
      </section>

      {/* ── Reference (reply only) ── */}
      {isReply && (
        <section className="grid grid-cols-1 gap-4">
          {showHindi && (
            <HTextarea label="संदर्भ" testid="input-reference"
              value={form.reference} onChange={s("reference")}
              placeholder="आपका पत्र क्रमांक एक2(1308)अनु.14/SAR/2025-26 दिनांक 01.07.2026"
              translit={translit} rows={2} />
          )}
          {showEnglish && (
            <div>
              <label className={LABEL} htmlFor="letter-reference-en">Reference</label>
              <textarea id="letter-reference-en" data-testid="input-reference-en" className={TEXTAREA} rows={2}
                value={form.referenceEn} onChange={(e) => set("referenceEn", e.target.value)}
                placeholder="Reference letter details..." />
            </div>
          )}
        </section>
      )}

      {/* ── Body ── */}
      <section className="grid grid-cols-1 gap-4">
        {showHindi && (
          <HTextarea label="पत्र की सामग्री" testid="input-body"
            value={form.body} onChange={s("body")}
            placeholder="उपरोक्त विषयान्तर्गत लेख है कि..."
            translit={translit} rows={8} required />
        )}
        {showEnglish && (
          <div>
            <label className={LABEL} htmlFor="letter-body-en">Letter body *</label>
            <textarea id="letter-body-en" data-testid="input-body-en" className={TEXTAREA} rows={8} aria-required="true"
              value={form.bodyEn} onChange={(e) => set("bodyEn", e.target.value)}
              placeholder="Write the main body of the letter..." />
          </div>
        )}
      </section>

      {/* ── Sender ── */}
      <section className="border border-blue-100 rounded-lg p-4 bg-blue-50">
        <p className="text-xs font-bold text-blue-500 uppercase tracking-wide mb-3">
          प्रेषक / Sender
        </p>
        {showHindi && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <HInput label="नाम" testid="input-from-name"
              value={form.fromName} onChange={s("fromName")} translit={translit} />
            <HInput label="पदनाम" testid="input-from-designation"
              value={form.fromDesignation} onChange={s("fromDesignation")} translit={translit} />
            <HInput label="कार्यालय" testid="input-from-office"
              value={form.fromOffice} onChange={s("fromOffice")} translit={translit} />
          </div>
        )}
        {showEnglish && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div><label className={LABEL} htmlFor="letter-sender-en">Name</label>
              <input id="letter-sender-en" data-testid="input-from-name-en" className={INPUT}
                value={form.fromNameEn} onChange={(e) => set("fromNameEn", e.target.value)} /></div>
            <div><label className={LABEL} htmlFor="letter-sender-designation-en">Designation</label>
              <input id="letter-sender-designation-en" data-testid="input-from-designation-en" className={INPUT}
                value={form.fromDesignationEn} onChange={(e) => set("fromDesignationEn", e.target.value)} /></div>
            <div><label className={LABEL} htmlFor="letter-sender-office-en">Office</label>
              <input id="letter-sender-office-en" data-testid="input-from-office-en" className={INPUT}
                value={form.fromOfficeEn} onChange={(e) => set("fromOfficeEn", e.target.value)} /></div>
          </div>
        )}
      </section>

      {/* ── CC ── */}
      <section className="grid grid-cols-1 gap-4">
        {showHindi && (
          <HTextarea label="प्रतिलिपि (एक प्रति प्रत्येक पंक्ति में)"
            testid="input-cc"
            value={form.cc} onChange={s("cc")}
            placeholder="मुख्य अभियंता (भवन), सा.नि.वि., जयपुर को सूचनार्थ।"
            translit={translit} rows={3} />
        )}
        {showEnglish && (
          <div>
            <label className={LABEL} htmlFor="letter-cc-en">Copy to (one per line)</label>
            <textarea id="letter-cc-en" data-testid="input-cc-en" className={TEXTAREA} rows={3}
              value={form.ccEn} onChange={(e) => set("ccEn", e.target.value)}
              placeholder="Chief Engineer (Buildings), PWD, Jaipur for information." />
          </div>
        )}
      </section>

      {/* ── Actions ── */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-gray-200">
        <button data-testid="btn-save-draft" disabled={saving} onClick={() => handleSubmit("draft")}
          className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors">
          <Save size={15} /> Draft सहेजें
        </button>
        <button data-testid="btn-save-final" disabled={saving} onClick={() => handleSubmit("final")}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-700 text-white rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors">
          <FileCheck size={15} /> अंतिम रूप से सहेजें / Save Final
        </button>
      </div>

    </div>
  );
}
