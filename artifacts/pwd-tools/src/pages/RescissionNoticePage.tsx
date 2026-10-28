/**
 * Rescission / Risk-Cost Notice Generator
 * Generates Hindi A4 rescission order and risk-cost notice with DOCX download.
 */
import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePrintPage } from "@/lib/printPage";
import { AlignmentType, BorderStyle, Document, Packer, PageOrientation, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { ArrowLeft, Download, Gavel } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const A4_W = 11906; const A4_H = 16838; const MAR = 1417; const ZERO = 0;
const FONT = "Mangal";
const sp = { before: ZERO, after: ZERO, line: 276, lineRule: "auto" as const };
const para = (text: string, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED, firstLine?: number, bold = false, size = 22) =>
  new Paragraph({ children: [new TextRun({ text, font: FONT, size, bold })], alignment: align, spacing: sp, ...(firstLine ? { indent: { firstLine } } : {}) });
const blank = () => new Paragraph({ children: [], spacing: sp });

const INP = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400";
const LBL = "block text-xs font-semibold text-gray-700 mb-1";
const TA = INP + " resize-none";

function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function RescissionNoticePage() {
  useDocumentTitle("Rescission Notice");
  usePrintPage();
  const [, go] = useLocation();
  const [form, setForm] = useState({
    letterNumber: "",
    date: today(),
    contractorName: "",
    contractorDesignation: "श्रेणी 'ए' संवेदक 2",
    contractorAddress: "",
    agreementNumber: "",
    nameOfWork: "",
    packageNumber: "",
    schemeName: "",
    contractAmount: "",
    startDate: "",
    completionDate: "",
    reasonsForRescission: "",
    rescissionClause: "धारा 2 एवं 3",
    riskCostAmount: "",
    riskCostPercent: "10.50",
    newTenderReference: "",
    ccLines: "अधीक्षण अभियंता, सा.नि.वि. वृत (शहर), उदयपुर — सूचनार्थ।\nसहायक अभियंता, सम्बंधित उपखण्ड — अभिलेख हेतु।\nकार्यालय अभिलेख।",
    fromName: "अनिल खिची",
    fromDesignation: "अधिशाषी अभियंता",
    fromOffice: "सा.नि.वि. जिला खण्ड द्वितीय, उदयपुर",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  async function downloadDocx() {
    const ccArr = form.ccLines.split("\n").filter(Boolean);
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
      para("कार्यालय आदेश / OFFICE ORDER", AlignmentType.CENTER, undefined, true, 26),
      blank(),
      para(`${form.nameOfWork}${form.packageNumber ? " — Package No. " + form.packageNumber : ""}${form.schemeName ? " — " + form.schemeName : ""}, कार्यानुबंध संख्या ${form.agreementNumber} के सम्बन्ध में।`, AlignmentType.JUSTIFIED, undefined, true),
      blank(),
      para(`        मेसर्स ${form.contractorName}, ${form.contractorDesignation}, ${form.contractorAddress} को उपरोक्त कार्य राशि रु. ${form.contractAmount}/- में आवंटित किया गया था। कार्य प्रारम्भ तिथि ${form.startDate} एवं निर्धारित पूर्णता तिथि ${form.completionDate} थी।`, AlignmentType.JUSTIFIED, 720),
      blank(),
      para(`        ${form.reasonsForRescission}`, AlignmentType.JUSTIFIED, 720),
      blank(),
      para(`        अतः उपरोक्त परिस्थितियों को दृष्टिगत रखते हुए कार्यानुबंध की ${form.rescissionClause} के अन्तर्गत उक्त कार्यानुबंध रिसाइड (Rescind) किया जाता है।`, AlignmentType.JUSTIFIED, 720),
      blank(),
      para(`        उक्त कार्यानुबंध रिसाइड के फलस्वरूप मेसर्स ${form.contractorName} को रिस्क एवं कोस्ट के आधार पर राशि रु. ${form.riskCostAmount}/- (अधिकतम अधिप्राप्ति पर ${form.riskCostPercent}% की दर से)${form.newTenderReference ? " पुनः निविदा " + form.newTenderReference + " के पश्चात" : ""} वसूल किए जाने का निर्धारण किया जाता है। उक्त राशि संवेदक को इस विभाग में देय किसी भी भुगतान से वसूल की जाएगी।`, AlignmentType.JUSTIFIED, 720),
      blank(),
      para("भवदीय,", AlignmentType.LEFT),
      blank(), blank(), blank(),
      para(`(${form.fromName})`, AlignmentType.LEFT),
      para(form.fromDesignation, AlignmentType.LEFT),
      para(form.fromOffice, AlignmentType.LEFT),
      blank(),
      new Paragraph({
        children: [],
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
        spacing: sp,
      }),
      para("प्रतिलिपि सूचनार्थ एवं आवश्यक कार्यवाही हेतु प्रेषित:", AlignmentType.LEFT, undefined, true),
      blank(),
      ...ccArr.map((line, i) => para(`${i + 1}.  ${line}`, AlignmentType.JUSTIFIED, 360)),
      blank(), blank(),
      para(`(${form.fromName})`, AlignmentType.LEFT),
      para(form.fromDesignation, AlignmentType.LEFT),
    ];
    const doc = new Document({ sections: [{ properties: { page: { size: { orientation: PageOrientation.PORTRAIT, width: A4_W, height: A4_H }, margin: { top: MAR, right: MAR, bottom: MAR, left: MAR, header: ZERO, footer: ZERO } } }, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `RescissionOrder_${form.letterNumber || "draft"}_${form.date}.docx`);
  }

  return (
    <ToolShell title="Rescission Notice">
      <div className="min-h-[100dvh] bg-red-50">
        <div className="bg-red-800 text-white px-6 py-3 flex items-center gap-3 shadow">
          <button onClick={() => go("/")} className="p-1.5 rounded hover:bg-red-700"><ArrowLeft size={16} /></button>
          <Gavel size={18} />
          <div className="flex-1">
            <h1 className="font-bold text-sm">Rescission / Risk-Cost Order Generator</h1>
            <p className="text-red-200 text-xs">कार्यानुबंध रिसाइड आदेश एवं रिस्क-कोस्ट नोटिस — A4 DOCX</p>
          </div>
          <button onClick={downloadDocx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-red-800 rounded text-xs font-bold">
            <Download size={13} /> DOCX
          </button>
        </div>

        <div className="max-w-6xl mx-auto p-4 flex gap-4">
          <div className="w-[400px] shrink-0 flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>क्रमांक</label><input className={INP} value={form.letterNumber} onChange={set("letterNumber")} /></div>
              <div><label className={LBL}>दिनांक</label><input className={INP} value={form.date} onChange={set("date")} /></div>
            </div>
            <div><label className={LBL}>ठेकेदार का नाम</label><input className={INP} value={form.contractorName} onChange={set("contractorName")} /></div>
            <div><label className={LBL}>श्रेणी/पदनाम</label><input className={INP} value={form.contractorDesignation} onChange={set("contractorDesignation")} /></div>
            <div><label className={LBL}>पता</label><textarea className={TA} rows={2} value={form.contractorAddress} onChange={set("contractorAddress")} /></div>
            <div><label className={LBL}>कार्य का नाम</label><textarea className={TA} rows={2} value={form.nameOfWork} onChange={set("nameOfWork")} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>Package No.</label><input className={INP} value={form.packageNumber} onChange={set("packageNumber")} /></div>
              <div><label className={LBL}>अनुबंध संख्या</label><input className={INP} value={form.agreementNumber} onChange={set("agreementNumber")} /></div>
            </div>
            <div><label className={LBL}>योजना</label><input className={INP} value={form.schemeName} onChange={set("schemeName")} /></div>
            <div><label className={LBL}>अनुबंध राशि (रु.)</label><input className={INP} value={form.contractAmount} onChange={set("contractAmount")} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>प्रारम्भ तिथि</label><input className={INP} value={form.startDate} onChange={set("startDate")} /></div>
              <div><label className={LBL}>निर्धारित पूर्णता</label><input className={INP} value={form.completionDate} onChange={set("completionDate")} /></div>
            </div>
            <div><label className={LBL}>रिसाइड के कारण</label><textarea className={TA} rows={4} value={form.reasonsForRescission} onChange={set("reasonsForRescission")} /></div>
            <div><label className={LBL}>रिसाइड धारा</label><input className={INP} value={form.rescissionClause} onChange={set("rescissionClause")} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>रिस्क-कोस्ट राशि (रु.)</label><input className={INP} value={form.riskCostAmount} onChange={set("riskCostAmount")} /></div>
              <div><label className={LBL}>प्रतिशत (%)</label><input className={INP} value={form.riskCostPercent} onChange={set("riskCostPercent")} /></div>
            </div>
            <div><label className={LBL}>नई निविदा सन्दर्भ (वैकल्पिक)</label><input className={INP} value={form.newTenderReference} onChange={set("newTenderReference")} /></div>
            <div><label className={LBL}>प्रतिलिपि (एक प्रति प्रत्येक पंक्ति में)</label><textarea className={TA} rows={3} value={form.ccLines} onChange={set("ccLines")} /></div>
            <button onClick={downloadDocx} className="w-full py-3 bg-red-800 text-white rounded-lg font-bold text-sm hover:bg-red-900 flex items-center justify-center gap-2">
              <Download size={16} /> Download Word (.docx)
            </button>
          </div>

          <div className="flex-1 bg-white border border-gray-200 rounded shadow p-8 text-sm font-serif" style={{ minHeight: "297mm", maxWidth: "210mm" }}>
            <div className="text-center font-bold text-base mb-1">राजस्थान सरकार</div>
            <div className="text-center font-bold">{form.fromDesignation}, सार्वजनिक निर्माण विभाग</div>
            <div className="text-center font-bold text-sm mb-2">{form.fromOffice}</div>
            <hr className="border-black mb-2" />
            <div className="flex justify-between text-xs mb-2"><span>क्रमांकः {form.letterNumber}</span><span>दिनांकः {form.date}</span></div>
            <div className="text-center font-bold text-sm mb-2">कार्यालय आदेश / OFFICE ORDER</div>
            <p className="text-xs font-bold mb-2">{form.nameOfWork}{form.packageNumber ? " — " + form.packageNumber : ""}, अनुबंध: {form.agreementNumber}</p>
            <p className="text-xs text-justify mb-2">मेसर्स {form.contractorName} ({form.contractorDesignation}) — राशि रु. {form.contractAmount}/-, प्रारम्भ: {form.startDate}, पूर्णता: {form.completionDate}।</p>
            <p className="text-xs text-justify mb-2">{form.reasonsForRescission}</p>
            <p className="text-xs text-justify mb-2">अतः कार्यानुबंध {form.rescissionClause} के अन्तर्गत रिसाइड किया जाता है।</p>
            <p className="text-xs text-justify mb-4">रिस्क-कोस्ट राशि रु. {form.riskCostAmount}/- ({form.riskCostPercent}%) वसूल की जाएगी।</p>
            <p className="text-xs mb-4">भवदीय,</p>
            <p className="text-xs font-bold">({form.fromName})</p>
            <p className="text-xs mb-4">{form.fromDesignation}<br />{form.fromOffice}</p>
            <hr className="border-black mt-4 mb-1" />
            <p className="text-xs font-bold mb-1">प्रतिलिपि:</p>
            {form.ccLines.split("\n").map((l, i) => <p key={i} className="text-xs">{i + 1}. {l}</p>)}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
