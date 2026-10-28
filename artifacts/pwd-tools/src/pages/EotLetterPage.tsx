/**
 * Extension of Time (EOT) Letter Generator
 * Generates Hindi A4 EOT application / sanction letter with DOCX download.
 */
import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePrintPage } from "@/lib/printPage";
import { AlignmentType, Document, Packer, PageOrientation, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { ArrowLeft, CalendarClock, Download } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const A4_W = 11906; const A4_H = 16838; const MAR = 1417; const ZERO = 0;
const FONT = "Mangal";
const sp = { before: ZERO, after: ZERO, line: 276, lineRule: "auto" as const };
const para = (text: string, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED, firstLine?: number, bold = false, size = 22) =>
  new Paragraph({ children: [new TextRun({ text, font: FONT, size, bold })], alignment: align, spacing: sp, ...(firstLine ? { indent: { firstLine } } : {}) });
const blank = () => new Paragraph({ children: [], spacing: sp });

const EOT_TYPES = [
  { id: "application", label: "EOT आवेदन (Contractor to EE)" },
  { id: "sanction", label: "EOT स्वीकृति (EE sanction letter)" },
  { id: "rejection", label: "EOT अस्वीकृति (EE rejection letter)" },
];

const INP = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400";
const LBL = "block text-xs font-semibold text-gray-700 mb-1";
const TA = INP + " resize-none";

function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function EotLetterPage() {
  useDocumentTitle("EOT Letter");
  usePrintPage();
  const [, go] = useLocation();
  const [form, setForm] = useState({
    eotType: "sanction",
    letterNumber: "",
    date: today(),
    contractorName: "",
    contractorAddress: "",
    agreementNumber: "",
    nameOfWork: "",
    originalCompletionDate: "",
    extendedCompletionDate: "",
    extensionDays: "",
    reasonForDelay: "",
    ldApplicable: "नहीं",
    ldAmount: "",
    remarks: "",
    fromName: "अनिल खिची",
    fromDesignation: "अधिशाषी अभियंता",
    fromOffice: "सा.नि.वि. जिला खण्ड द्वितीय, उदयपुर",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const eotLabel = EOT_TYPES.find(t => t.id === form.eotType)?.label ?? "";

  async function downloadDocx() {
    const isSanction = form.eotType === "sanction";
    const isReject = form.eotType === "rejection";
    const children = [
      para("राजस्थान सरकार", AlignmentType.CENTER, undefined, true, 28),
      para(`${form.fromDesignation}, सार्वजनिक निर्माण विभाग`, AlignmentType.CENTER, undefined, true, 26),
      para(form.fromOffice, AlignmentType.CENTER, undefined, true, 24),
      blank(),
      new Paragraph({
        children: [
          new TextRun({ text: `क्रमांकः ${form.letterNumber}`, font: FONT, size: 22 }),
          new TextRun({ text: "\t", font: FONT, size: 22 }),
          new TextRun({ text: `दिनांकः ${form.date}`, font: FONT, size: 22 }),
        ],
        spacing: sp,
        tabStops: [{ type: "right" as any, position: A4_W - MAR * 2 }],
      }),
      blank(),
      para("प्रेषित:", AlignmentType.LEFT),
      para(`${form.contractorName},`, AlignmentType.LEFT),
      para(`${form.contractorAddress}।`, AlignmentType.LEFT),
      blank(),
      para(`विषय:– ${form.nameOfWork} — समय विस्तार (EOT) ${isSanction ? "स्वीकृति" : isReject ? "अस्वीकृति" : "आवेदन"} के सम्बन्ध में।`, AlignmentType.JUSTIFIED, undefined, true),
      para(`संदर्भ:– अनुबंध संख्या ${form.agreementNumber}।`, AlignmentType.JUSTIFIED),
      blank(),
      para("महोदय,", AlignmentType.LEFT),
      blank(),
      para(`        उपरोक्त विषयान्तर्गत ${form.nameOfWork} के कार्यानुबंध संख्या ${form.agreementNumber} के अन्तर्गत कार्य की मूल पूर्णता तिथि ${form.originalCompletionDate} थी।`, AlignmentType.JUSTIFIED, 720),
      blank(),
      para(`        कार्य में विलम्ब का कारण: ${form.reasonForDelay}`, AlignmentType.JUSTIFIED, 720),
      blank(),
      ...(isSanction ? [
        para(`        उपरोक्त कारणों को दृष्टिगत रखते हुए ${form.extensionDays} दिन का समय विस्तार (EOT) स्वीकृत किया जाता है तथा कार्य की संशोधित पूर्णता तिथि ${form.extendedCompletionDate} निर्धारित की जाती है।`, AlignmentType.JUSTIFIED, 720),
        blank(),
        para(`        ${form.ldApplicable === "हाँ" ? `उक्त अवधि में रु. ${form.ldAmount}/- की हानि (L.D.) संवेदक से वसूल की जाएगी।` : "उक्त अवधि में कोई हानि (L.D.) देय नहीं है।"}`, AlignmentType.JUSTIFIED, 720),
      ] : isReject ? [
        para("        उपरोक्त कारणों पर विचार करने के उपरांत समय विस्तार (EOT) का आवेदन स्वीकार नहीं किया जा सकता। संवेदक से अनुबंध की शर्तों के अनुसार विलम्ब हानि (L.D.) वसूल की जाएगी।", AlignmentType.JUSTIFIED, 720),
      ] : [
        para(`        अतः आपसे निवेदन है कि ${form.extensionDays} दिन के समय विस्तार की स्वीकृति प्रदान करें।`, AlignmentType.JUSTIFIED, 720),
      ]),
      blank(),
      ...(form.remarks ? [para(`        टिप्पणी: ${form.remarks}`, AlignmentType.JUSTIFIED, 720), blank()] : []),
      para("भवदीय,", AlignmentType.LEFT),
      blank(), blank(), blank(),
      para(`(${form.fromName})`, AlignmentType.LEFT),
      para(form.fromDesignation, AlignmentType.LEFT),
      para(form.fromOffice, AlignmentType.LEFT),
    ];
    const doc = new Document({ sections: [{ properties: { page: { size: { orientation: PageOrientation.PORTRAIT, width: A4_W, height: A4_H }, margin: { top: MAR, right: MAR, bottom: MAR, left: MAR, header: ZERO, footer: ZERO } } }, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `EOT_${form.eotType}_${form.letterNumber || "draft"}_${form.date}.docx`);
  }

  return (
    <ToolShell title="EOT Letter">
      <div className="min-h-[100dvh] bg-teal-50">
        <div className="bg-teal-700 text-white px-6 py-3 flex items-center gap-3 shadow">
          <button onClick={() => go("/")} className="p-1.5 rounded hover:bg-teal-600"><ArrowLeft size={16} /></button>
          <CalendarClock size={18} />
          <div className="flex-1">
            <h1 className="font-bold text-sm">Extension of Time (EOT) Letter</h1>
            <p className="text-teal-200 text-xs">समय विस्तार आवेदन / स्वीकृति / अस्वीकृति — A4 DOCX</p>
          </div>
          <button onClick={downloadDocx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-teal-800 rounded text-xs font-bold">
            <Download size={13} /> DOCX
          </button>
        </div>

        <div className="max-w-6xl mx-auto p-4 flex gap-4">
          <div className="w-[400px] shrink-0 flex flex-col gap-3">
            <div><label className={LBL}>पत्र का प्रकार</label>
              <select className={INP} value={form.eotType} onChange={set("eotType")}>
                {EOT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>क्रमांक</label><input className={INP} value={form.letterNumber} onChange={set("letterNumber")} /></div>
              <div><label className={LBL}>दिनांक</label><input className={INP} value={form.date} onChange={set("date")} /></div>
            </div>
            <div><label className={LBL}>ठेकेदार का नाम</label><input className={INP} value={form.contractorName} onChange={set("contractorName")} /></div>
            <div><label className={LBL}>पता</label><textarea className={TA} rows={2} value={form.contractorAddress} onChange={set("contractorAddress")} /></div>
            <div><label className={LBL}>अनुबंध संख्या</label><input className={INP} value={form.agreementNumber} onChange={set("agreementNumber")} /></div>
            <div><label className={LBL}>कार्य का नाम</label><textarea className={TA} rows={2} value={form.nameOfWork} onChange={set("nameOfWork")} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>मूल पूर्णता तिथि</label><input className={INP} value={form.originalCompletionDate} onChange={set("originalCompletionDate")} /></div>
              <div><label className={LBL}>संशोधित पूर्णता तिथि</label><input className={INP} value={form.extendedCompletionDate} onChange={set("extendedCompletionDate")} /></div>
            </div>
            <div><label className={LBL}>विस्तार (दिन)</label><input className={INP} value={form.extensionDays} onChange={set("extensionDays")} /></div>
            <div><label className={LBL}>विलम्ब का कारण</label><textarea className={TA} rows={3} value={form.reasonForDelay} onChange={set("reasonForDelay")} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>L.D. लागू</label>
                <select className={INP} value={form.ldApplicable} onChange={set("ldApplicable")}>
                  <option>नहीं</option><option>हाँ</option>
                </select>
              </div>
              {form.ldApplicable === "हाँ" && <div><label className={LBL}>L.D. राशि (रु.)</label><input className={INP} value={form.ldAmount} onChange={set("ldAmount")} /></div>}
            </div>
            <div><label className={LBL}>टिप्पणी (वैकल्पिक)</label><textarea className={TA} rows={2} value={form.remarks} onChange={set("remarks")} /></div>
            <button onClick={downloadDocx} className="w-full py-3 bg-teal-700 text-white rounded-lg font-bold text-sm hover:bg-teal-800 flex items-center justify-center gap-2">
              <Download size={16} /> Download Word (.docx)
            </button>
          </div>

          <div className="flex-1 bg-white border border-gray-200 rounded shadow p-8 text-sm font-serif" style={{ minHeight: "297mm", maxWidth: "210mm" }}>
            <div className="text-center font-bold text-base mb-1">राजस्थान सरकार</div>
            <div className="text-center font-bold">{form.fromDesignation}, सार्वजनिक निर्माण विभाग</div>
            <div className="text-center font-bold text-sm mb-2">{form.fromOffice}</div>
            <hr className="border-black mb-2" />
            <div className="flex justify-between text-xs mb-2"><span>क्रमांकः {form.letterNumber}</span><span>दिनांकः {form.date}</span></div>
            <div className="text-xs mb-2">{form.contractorName},<br />{form.contractorAddress}।</div>
            <p className="text-xs font-bold mb-1">विषय:– {form.nameOfWork} — EOT {form.eotType === "sanction" ? "स्वीकृति" : form.eotType === "rejection" ? "अस्वीकृति" : "आवेदन"}</p>
            <p className="text-xs mb-1">संदर्भ: अनुबंध संख्या {form.agreementNumber}</p>
            <p className="text-xs mb-2">महोदय,</p>
            <p className="text-xs text-justify mb-1">मूल पूर्णता तिथि: {form.originalCompletionDate}</p>
            <p className="text-xs text-justify mb-1">विलम्ब कारण: {form.reasonForDelay}</p>
            {form.eotType === "sanction" && <p className="text-xs text-justify mb-1">{form.extensionDays} दिन EOT स्वीकृत। संशोधित पूर्णता: {form.extendedCompletionDate}।</p>}
            {form.eotType === "rejection" && <p className="text-xs text-justify mb-1">EOT आवेदन अस्वीकृत। L.D. वसूल की जाएगी।</p>}
            <p className="text-xs mb-6 mt-4">भवदीय,</p>
            <p className="text-xs font-bold">({form.fromName})</p>
            <p className="text-xs">{form.fromDesignation}</p>
            <p className="text-xs">{form.fromOffice}</p>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
