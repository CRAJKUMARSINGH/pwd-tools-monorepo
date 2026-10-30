/**
 * No-Dues (अदेयता प्रमाण पत्र) Generator
 * Generates the Hindi forwarding letter for a No-Dues certificate with
 * A4 preview, print/PDF and DOCX download. Sender is fixed (EXEC DIV II).
 *
 * Only three inputs, per the source template: ADDRESS, CONTRACTOR_NAME and
 * REFER_LETTER. क्रमांक / दिनांक are left as handwritten blanks on purpose.
 */
import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePrintPage } from "@/lib/printPage";
import { AlignmentType, Document, Packer, PageBreak, PageOrientation, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { ArrowLeft, Download, FileCheck2, Printer } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const A4_W = 11906; const A4_H = 16838; const MAR = 1417; const ZERO = 0;
const FONT = "Mangal";
const sp = { before: ZERO, after: ZERO, line: 276, lineRule: "auto" as const };

/** Zero-spaced single-run paragraph. */
const para = (text: string, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED, firstLine?: number, bold = false, size = 22) =>
  new Paragraph({ children: [new TextRun({ text, font: FONT, size, bold })], alignment: align, spacing: sp, ...(firstLine ? { indent: { firstLine } } : {}) });

/** Paragraph built from mixed normal/bold runs (used for विषय and the body line). */
const runs = (parts: { text: string; bold?: boolean }[], align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED, firstLine?: number, size = 22) =>
  new Paragraph({
    children: parts.map((p) => new TextRun({ text: p.text, font: FONT, size, bold: p.bold })),
    alignment: align,
    spacing: sp,
    ...(firstLine ? { indent: { firstLine } } : {}),
  });

const blank = () => new Paragraph({ children: [], spacing: sp });

const INP = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400";
const LBL = "block text-xs font-semibold text-gray-700 mb-1";
const TA = INP + " resize-none";

const OFFICE_1 = "कार्यालय अधिशाषी अभियन्ता";
const OFFICE_2 = "सा.नि.वि. खण्ड द्वितीय, उदयपुर";
const SIGN_DESIG = "(अधिशाषी अभियन्ता)";
const SIGN_DIV = "EXEC DIV II";

/* ── Page 2 — certificate. Office line differs from the forward ("जिला खण्ड"). ── */
const CERT_OFFICE_2 = "सा.नि.वि. जिला खण्ड द्वितीय, उदयपुर";
const CERT_BODY_OFFICE = "सा.नि.वि. खण्ड द्वितीय, उदयपुर";
const CERT_MAIN = "अदेयता प्रमाण पत्र";
const CERT_SUB = "(No Dues Certificate)";
const CERT_CERTIFY = "यह प्रमाणित किया जाता है कि";
const CERT_NAME_LABEL = "ठेकेदार / फर्म का नाम : ";
const CERT_BODY = "के नाम पर इस कार्यालय (अधिशाषी अभियन्ता, सा.नि.वि. खण्ड द्वितीय, उदयपुर) में कोई भी बकाया राशि, देयता, वसूली योग्य राशि अथवा कोई अन्य दावा शेष नहीं है।";
const CERT_CLOSE = "अतः उपरोक्त ठेकेदार / फर्म को अदेयता प्रमाणित की जाती है।";
const CERT_PLACE = "स्थान : उदयपुर";

function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function NoDuesPage() {
  useDocumentTitle("No-Dues Certificate");
  usePrintPage("portrait");
  const [, go] = useLocation();
  const [form, setForm] = useState({
    address: "",
    contractorName: "",
    referLetter: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }));

  async function downloadDocx() {
    const children = [
      para(OFFICE_1, AlignmentType.CENTER, undefined, true, 24),
      para(OFFICE_2, AlignmentType.CENTER, undefined, true, 22),
      blank(),
      para("क्रमांक :- ________________", AlignmentType.LEFT),
      para("दिनांक :- ________________", AlignmentType.LEFT),
      blank(),
      para("सेवा में,", AlignmentType.LEFT),
      ...form.address.split("\n").filter(Boolean).map((line) => para(line, AlignmentType.LEFT)),
      blank(),
      runs([{ text: "विषय :- ", bold: true }, { text: "अदेयता प्रमाण पत्र भिजवाने बाबत्।", bold: true }]),
      runs([{ text: "संदर्भ :- ", bold: true }, { text: `आपके कार्यालय का पत्र क्रमांक ${form.referLetter}।` }]),
      blank(),
      para("महोदय,", AlignmentType.LEFT),
      blank(),
      runs([
        { text: "        उपरोक्त विषय एवं संदर्भित पत्र के क्रम में अवगत कराना है कि इस कार्यालय में " },
        { text: form.contractorName, bold: true },
        { text: " के नाम पर कोई बकाया राशि / देयता नहीं है।" },
      ], AlignmentType.JUSTIFIED, 720),
      blank(),
      runs([
        { text: "        अतः प्रार्थी के पक्ष में " },
        { text: "अदेयता प्रमाण पत्र", bold: true },
        { text: " इस पत्र के साथ संलग्न कर प्रेषित किया जा रहा है।" },
      ], AlignmentType.JUSTIFIED, 720),
      blank(),
      para("संलग्न :- अदेयता प्रमाण पत्र (मूल)।", AlignmentType.LEFT),
      blank(),
      para("भवदीय,", AlignmentType.LEFT),
      blank(), blank(), blank(),
      para(SIGN_DESIG, AlignmentType.LEFT),
      para(OFFICE_2, AlignmentType.LEFT),
      para(SIGN_DIV, AlignmentType.LEFT, undefined, true),

      /* ── Page 2 — अदेयता प्रमाण पत्र (No Dues Certificate) ── */
      new Paragraph({ children: [new PageBreak()] }),
      para(OFFICE_1, AlignmentType.CENTER, undefined, true, 24),
      para(CERT_OFFICE_2, AlignmentType.CENTER, undefined, true, 22),
      blank(),
      para("क्रमांक :- ________________", AlignmentType.LEFT),
      para("दिनांक :- ________________", AlignmentType.LEFT),
      blank(),
      blank(),
      para(CERT_MAIN, AlignmentType.CENTER, undefined, true, 28),
      para(CERT_SUB, AlignmentType.CENTER),
      blank(),
      para(CERT_CERTIFY, AlignmentType.LEFT),
      blank(),
      runs([{ text: CERT_NAME_LABEL, bold: true }, { text: form.contractorName, bold: true }], AlignmentType.LEFT),
      blank(),
      para(CERT_BODY),
      blank(),
      para(CERT_CLOSE),
      blank(), blank(), blank(),
      para(CERT_PLACE, AlignmentType.LEFT),
      blank(),
      para(SIGN_DESIG, AlignmentType.RIGHT),
      para(CERT_BODY_OFFICE, AlignmentType.RIGHT),
    ];
    const doc = new Document({ sections: [{ properties: { page: { size: { orientation: PageOrientation.PORTRAIT, width: A4_W, height: A4_H }, margin: { top: MAR, right: MAR, bottom: MAR, left: MAR, header: ZERO, footer: ZERO } } }, children }] });
    const blob = await Packer.toBlob(doc);
    const safeName = form.contractorName.trim().replace(/[\\/:*?"<>|]/g, "").slice(0, 40) || "draft";
    saveAs(blob, `NoDues_${safeName}_${today()}.docx`);
  }

  return (
    <ToolShell title="No-Dues Certificate">
      <div className="min-h-[100dvh] bg-sky-50">
        <div className="hide-on-print bg-sky-800 text-white px-6 py-3 flex items-center gap-3 shadow">
          <button onClick={() => go("/")} className="p-1.5 rounded hover:bg-sky-700" aria-label="होम / Home"><ArrowLeft size={16} /></button>
          <FileCheck2 size={18} />
          <div className="flex-1">
            <h1 className="font-bold text-sm">No-Dues Certificate (अदेयता प्रमाण पत्र)</h1>
            <p className="text-sky-200 text-xs">अदेयता प्रमाण पत्र भिजवाने हेतु आवरण पत्र — A4 प्रिव्यू / DOCX</p>
          </div>
          <button onClick={() => window.print()} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-sky-800 rounded text-xs font-bold">
            <Printer size={13} /> Print / PDF
          </button>
          <button onClick={downloadDocx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-sky-800 rounded text-xs font-bold">
            <Download size={13} /> DOCX
          </button>
        </div>

        <div className="max-w-6xl mx-auto p-4 flex gap-4">
          <div className="hide-on-print w-[400px] shrink-0 flex flex-col gap-3">
            <div>
              <label className={LBL}>सेवा में (पता)</label>
              <textarea className={TA} rows={3} value={form.address} onChange={set("address")} placeholder="अधीक्षण अभियन्ता, सा.नि.वि. वृत्त (शहर), उदयपुर" />
            </div>
            <div>
              <label className={LBL}>ठेकेदार / फर्म का नाम</label>
              <input className={INP} value={form.contractorName} onChange={set("contractorName")} placeholder="श्री भगवती लाल मेघवाल पिता सोहन लाल मेघवाल" />
            </div>
            <div>
              <label className={LBL}>संदर्भ पत्र (क्रमांक + दिनांक)</label>
              <input className={INP} value={form.referLetter} onChange={set("referLetter")} placeholder="पंजीयन / 2026-27 / डी- (18) दिनांक 06/09/2026" />
            </div>
            <p className="text-[11px] text-gray-500">
              क्रमांक एवं दिनांक पत्र पर रिक्त स्थान में हस्तलिखित भरे जाएंगे।
            </p>
            <button onClick={downloadDocx} className="w-full py-3 bg-sky-800 text-white rounded-lg font-bold text-sm hover:bg-sky-900 flex items-center justify-center gap-2">
              <Download size={16} /> Download Word (.docx)
            </button>
          </div>

          <div className="flex-1 print-wrap">
            <div className="a4-page text-[12px] leading-[1.5]">
              <div className="text-center font-bold">{OFFICE_1}</div>
              <div className="text-center font-bold mb-6">{OFFICE_2}</div>
              <div className="mb-4">
                <div>क्रमांक :- ________________</div>
                <div>दिनांक :- ________________</div>
              </div>

              <div className="mb-4">
                <div>सेवा में,</div>
                <div className="whitespace-pre-line">{form.address}</div>
              </div>

              <p className="font-bold mb-1">विषय :- अदेयता प्रमाण पत्र भिजवाने बाबत्।</p>
              <p className="mb-4">
                <span className="font-bold">संदर्भ :- </span>आपके कार्यालय का पत्र क्रमांक {form.referLetter}।
              </p>

              <p className="mb-3">महोदय,</p>

              <p className="text-justify mb-3 indent-[1.27cm]">
                उपरोक्त विषय एवं संदर्भित पत्र के क्रम में अवगत कराना है कि इस कार्यालय में{" "}
                <span className="font-bold">{form.contractorName}</span> के नाम पर कोई बकाया राशि / देयता नहीं है।
              </p>

              <p className="text-justify mb-4 indent-[1.27cm]">
                अतः प्रार्थी के पक्ष में <span className="font-bold">अदेयता प्रमाण पत्र</span> इस पत्र के साथ संलग्न कर प्रेषित किया जा रहा है।
              </p>

              <p className="mb-6">संलग्न :- अदेयता प्रमाण पत्र (मूल)।</p>

              <p className="mb-16">भवदीय,</p>
              <p>{SIGN_DESIG}</p>
              <p>{OFFICE_2}</p>
              <p className="font-bold">{SIGN_DIV}</p>
            </div>

            {/* Page 2 — अदेयता प्रमाण पत्र (No Dues Certificate) */}
            <div className="a4-page text-[12px] leading-[1.5]">
              <div className="text-center font-bold">{OFFICE_1}</div>
              <div className="text-center font-bold mb-6">{CERT_OFFICE_2}</div>
              <div className="mb-4">
                <div>क्रमांक :- ________________</div>
                <div>दिनांक :- ________________</div>
              </div>

              <div className="text-center font-bold text-[16px] mt-8 mb-1">{CERT_MAIN}</div>
              <div className="text-center mb-8">{CERT_SUB}</div>

              <p className="mb-3">{CERT_CERTIFY}</p>

              <p className="mb-3">
                <span className="font-bold">{CERT_NAME_LABEL}</span>
                <span className="font-bold">{form.contractorName}</span>
              </p>

              <p className="text-justify mb-3">{CERT_BODY}</p>

              <p className="text-justify mb-10">{CERT_CLOSE}</p>

              <p className="mb-10">{CERT_PLACE}</p>

              <div className="text-right">
                <p>{SIGN_DESIG}</p>
                <p>{CERT_BODY_OFFICE}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
