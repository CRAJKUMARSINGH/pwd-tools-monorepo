/**
 * Work Order / Supply Order Generator
 * Hindi A4 work order letter with DOCX download.
 */
import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePrintPage } from "@/lib/printPage";
import { AlignmentType, Document, Packer, PageOrientation, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { ArrowLeft, ClipboardList, Download } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const A4_W = 11906; const A4_H = 16838; const MAR = 1417; const ZERO = 0;
const FONT = "Mangal";
const sp = { before: ZERO, after: ZERO, line: 276, lineRule: "auto" as const };
const para = (text: string, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED, firstLine?: number, bold = false, size = 22) =>
  new Paragraph({ children: [new TextRun({ text, font: FONT, size, bold })], alignment: align, spacing: sp, ...(firstLine ? { indent: { firstLine } } : {}) });
const blank = () => new Paragraph({ children: [], spacing: sp });

const INP = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400";
const LBL = "block text-xs font-semibold text-gray-700 mb-1";
const TA = INP + " resize-none";

function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function WorkOrderPage() {
  useDocumentTitle("Work Order");
  usePrintPage();
  const [, go] = useLocation();
  const [form, setForm] = useState({
    letterNumber: "",
    date: today(),
    workOrderNumber: "",
    workOrderDate: today(),
    contractorName: "",
    contractorAddress: "",
    nameOfWork: "",
    amount: "",
    startDate: today(),
    completionDate: "",
    completionDays: "90",
    agreementNumber: "",
    packageNumber: "",
    schemeName: "",
    specialConditions: "",
    fromName: "अनिल खिची",
    fromDesignation: "अधिशाषी अभियंता",
    fromOffice: "सा.नि.वि. जिला खण्ड द्वितीय, उदयपुर",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function downloadDocx() {
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
      para("कार्यादेश / WORK ORDER", AlignmentType.CENTER, undefined, true, 26),
      blank(),
      para(`कार्यादेश संख्या: ${form.workOrderNumber}       दिनांक: ${form.workOrderDate}`, AlignmentType.LEFT),
      blank(),
      para(`प्रति,`, AlignmentType.LEFT),
      para(`${form.contractorName},`, AlignmentType.LEFT),
      para(`${form.contractorAddress}।`, AlignmentType.LEFT),
      blank(),
      para(`विषय:– ${form.nameOfWork} का कार्यादेश।`, AlignmentType.JUSTIFIED, undefined, true),
      blank(),
      para("महोदय,", AlignmentType.LEFT),
      blank(),
      para(`        आपको सूचित किया जाता है कि ${form.schemeName ? form.schemeName + " के अंतर्गत " : ""}${form.nameOfWork} का कार्य${form.packageNumber ? " (Package No. " + form.packageNumber + ")" : ""}, अनुबंध संख्या ${form.agreementNumber}, राशि रु. ${form.amount}/-, आपको आवंटित किया जाता है।`, AlignmentType.JUSTIFIED, 720),
      blank(),
      para(`        कार्य प्रारंभ करने की तिथि: ${form.startDate}`, AlignmentType.JUSTIFIED, 720),
      para(`        कार्य पूर्णता की निर्धारित तिथि: ${form.completionDate || `(${form.completionDays} दिन)`}`, AlignmentType.JUSTIFIED, 720),
      blank(),
      ...(form.specialConditions ? [
        para("        विशेष शर्तें:", AlignmentType.LEFT, 720, true),
        ...form.specialConditions.split("\n").map(l => para(`        ${l}`, AlignmentType.JUSTIFIED, 720)),
        blank(),
      ] : []),
      para("        कृपया उपरोक्त कार्य को गुणवत्तापूर्वक, निर्धारित समय-सीमा में पूर्ण करें। कार्य प्रारंभ के पूर्व इस कार्यालय में उपस्थित होकर अनुबंध हस्ताक्षरित करें।", AlignmentType.JUSTIFIED, 720),
      blank(),
      para("भवदीय,", AlignmentType.LEFT),
      blank(), blank(), blank(),
      para(`(${form.fromName})`, AlignmentType.LEFT),
      para(form.fromDesignation, AlignmentType.LEFT),
      para(form.fromOffice, AlignmentType.LEFT),
    ];
    const doc = new Document({ sections: [{ properties: { page: { size: { orientation: PageOrientation.PORTRAIT, width: A4_W, height: A4_H }, margin: { top: MAR, right: MAR, bottom: MAR, left: MAR, header: ZERO, footer: ZERO } } }, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `WorkOrder_${form.workOrderNumber || "draft"}_${form.date}.docx`);
  }

  return (
    <ToolShell title="Work Order">
      <div className="min-h-[100dvh] bg-blue-50">
        <div className="bg-blue-800 text-white px-6 py-3 flex items-center gap-3 shadow">
          <button onClick={() => go("/")} className="p-1.5 rounded hover:bg-blue-700"><ArrowLeft size={16} /></button>
          <ClipboardList size={18} />
          <div className="flex-1">
            <h1 className="font-bold text-sm">Work Order / Supply Order Generator</h1>
            <p className="text-blue-200 text-xs">कार्यादेश / आपूर्ति आदेश — Hindi A4 DOCX</p>
          </div>
          <button onClick={downloadDocx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-800 rounded text-xs font-bold hover:bg-blue-50">
            <Download size={13} /> DOCX
          </button>
        </div>

        <div className="max-w-6xl mx-auto p-4 flex gap-4">
          <div className="w-[400px] shrink-0 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>क्रमांक</label><input className={INP} value={form.letterNumber} onChange={set("letterNumber")} /></div>
              <div><label className={LBL}>दिनांक</label><input className={INP} value={form.date} onChange={set("date")} /></div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>कार्यादेश संख्या</label><input className={INP} value={form.workOrderNumber} onChange={set("workOrderNumber")} /></div>
              <div><label className={LBL}>कार्यादेश दिनांक</label><input className={INP} value={form.workOrderDate} onChange={set("workOrderDate")} /></div>
            </div>
            <div><label className={LBL}>ठेकेदार का नाम</label><input className={INP} value={form.contractorName} onChange={set("contractorName")} /></div>
            <div><label className={LBL}>पता</label><textarea className={TA} rows={2} value={form.contractorAddress} onChange={set("contractorAddress")} /></div>
            <div><label className={LBL}>कार्य का नाम</label><textarea className={TA} rows={2} value={form.nameOfWork} onChange={set("nameOfWork")} /></div>
            <div><label className={LBL}>योजना का नाम (खाली छोड़ें यदि नहीं)</label><input className={INP} value={form.schemeName} onChange={set("schemeName")} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>Package No.</label><input className={INP} value={form.packageNumber} onChange={set("packageNumber")} /></div>
              <div><label className={LBL}>अनुबंध संख्या</label><input className={INP} value={form.agreementNumber} onChange={set("agreementNumber")} /></div>
            </div>
            <div><label className={LBL}>राशि (रु.)</label><input className={INP} value={form.amount} onChange={set("amount")} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>कार्य प्रारंभ तिथि</label><input className={INP} value={form.startDate} onChange={set("startDate")} /></div>
              <div><label className={LBL}>पूर्णता तिथि / दिन</label><input className={INP} value={form.completionDate || form.completionDays} onChange={set("completionDate")} /></div>
            </div>
            <div><label className={LBL}>विशेष शर्तें (वैकल्पिक)</label><textarea className={TA} rows={3} value={form.specialConditions} onChange={set("specialConditions")} /></div>
            <button onClick={downloadDocx} className="w-full py-3 bg-blue-800 text-white rounded-lg font-bold text-sm hover:bg-blue-900 flex items-center justify-center gap-2">
              <Download size={16} /> Download Word (.docx)
            </button>
          </div>

          <div className="flex-1 bg-white border border-gray-200 rounded shadow p-8 text-sm font-serif" style={{ minHeight: "297mm", maxWidth: "210mm" }}>
            <div className="text-center font-bold text-base mb-1">राजस्थान सरकार</div>
            <div className="text-center font-bold">{form.fromDesignation}, सार्वजनिक निर्माण विभाग</div>
            <div className="text-center font-bold text-sm mb-1">{form.fromOffice}</div>
            <hr className="border-black mb-2" />
            <div className="flex justify-between text-xs mb-1"><span>क्रमांकः {form.letterNumber}</span><span>दिनांकः {form.date}</span></div>
            <div className="text-center font-bold text-sm my-2">कार्यादेश / WORK ORDER</div>
            <div className="text-xs mb-1">कार्यादेश संख्या: {form.workOrderNumber} &nbsp;&nbsp; दिनांक: {form.workOrderDate}</div>
            <div className="text-xs mb-2">प्रति,<br />{form.contractorName},<br />{form.contractorAddress}।</div>
            <p className="text-xs font-bold mb-2">विषय:– {form.nameOfWork} का कार्यादेश।</p>
            <p className="text-xs mb-2">महोदय,</p>
            <p className="text-xs text-justify mb-2">&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;आपको सूचित किया जाता है कि {form.schemeName ? form.schemeName + " के अंतर्गत " : ""}{form.nameOfWork}{form.packageNumber ? ` (Package: ${form.packageNumber})` : ""}, अनुबंध संख्या {form.agreementNumber}, राशि रु. {form.amount}/-, आपको आवंटित किया जाता है।</p>
            <p className="text-xs mb-1">प्रारंभ: {form.startDate} &nbsp;|&nbsp; पूर्णता: {form.completionDate || form.completionDays + " दिन"}</p>
            {form.specialConditions && <p className="text-xs mb-2 whitespace-pre-wrap">विशेष शर्तें:<br />{form.specialConditions}</p>}
            <p className="text-xs mb-4">कार्य गुणवत्तापूर्वक, निर्धारित समय-सीमा में पूर्ण करें।</p>
            <p className="text-xs mb-6">भवदीय,</p>
            <p className="text-xs font-bold">({form.fromName})</p>
            <p className="text-xs">{form.fromDesignation}</p>
            <p className="text-xs">{form.fromOffice}</p>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
