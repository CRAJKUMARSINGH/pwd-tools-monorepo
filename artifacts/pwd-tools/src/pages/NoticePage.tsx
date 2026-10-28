/**
 * Notice / Show-Cause Letter Generator
 * Generates bilingual Hindi/English A4 notice letters with DOCX download.
 * Covers: show-cause notice, blacklist notice, general notice to contractor.
 */
import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePrintPage } from "@/lib/printPage";
import { AlignmentType, Document, Packer, PageOrientation, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { AlertTriangle, ArrowLeft, Download } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

const A4_W = 11906; const A4_H = 16838; const MAR = 1417; const ZERO = 0;
const FONT = "Mangal";
const sp = { before: ZERO, after: ZERO, line: 276, lineRule: "auto" as const };
const para = (text: string, align: typeof AlignmentType[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED, indent?: number, bold = false, size = 22) =>
  new Paragraph({ children: [new TextRun({ text, font: FONT, size, bold })], alignment: align, spacing: sp, ...(indent ? { indent: { firstLine: indent } } : {}) });
const blank = () => new Paragraph({ children: [], spacing: sp });

const NOTICE_TYPES = [
  { id: "show-cause", label: "कारण बताओ नोटिस (Show-Cause Notice)" },
  { id: "blacklist", label: "ब्लैकलिस्ट नोटिस (Blacklist Notice)" },
  { id: "general", label: "सामान्य नोटिस (General Notice)" },
  { id: "warning", label: "चेतावनी पत्र (Warning Letter)" },
];

const INP = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";
const LBL = "block text-xs font-semibold text-gray-700 mb-1";
const TA = INP + " resize-none";

function today() {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export default function NoticePage() {
  useDocumentTitle("Notice");
  usePrintPage();
  const [, go] = useLocation();
  const [form, setForm] = useState({
    noticeType: "show-cause",
    letterNumber: "",
    date: today(),
    toName: "",
    toDesignation: "",
    toOffice: "",
    subject: "",
    body: "",
    replyDays: "15",
    fromName: "अनिल खिची",
    fromDesignation: "अधिशाषी अभियंता",
    fromOffice: "सा.नि.वि. जिला खण्ड द्वितीय, उदयपुर",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const noticeLabel = NOTICE_TYPES.find(n => n.id === form.noticeType)?.label ?? "";

  async function downloadDocx() {
    const bodyLines = form.body.split("\n");
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
      para(`${form.toDesignation},`, AlignmentType.LEFT),
      para(`${form.toName},`, AlignmentType.LEFT),
      para(`${form.toOffice}।`, AlignmentType.LEFT),
      blank(),
      para(`विषय:– ${noticeLabel} — ${form.subject}`, AlignmentType.JUSTIFIED, undefined, true),
      blank(),
      para("महोदय,", AlignmentType.LEFT),
      blank(),
      ...bodyLines.map(l => para(l, AlignmentType.JUSTIFIED, 720)),
      blank(),
      para(`अतः आपसे अपेक्षा की जाती है कि इस नोटिस की प्राप्ति के ${form.replyDays} दिनों के अन्दर अपना स्पष्टीकरण / उत्तर इस कार्यालय में प्रस्तुत करें। निर्धारित अवधि में उत्तर प्रस्तुत न करने पर एकपक्षीय कार्यवाही की जाएगी।`, AlignmentType.JUSTIFIED, 720),
      blank(),
      para("भवदीय,", AlignmentType.LEFT),
      blank(), blank(), blank(),
      para(`(${form.fromName})`, AlignmentType.LEFT),
      para(form.fromDesignation, AlignmentType.LEFT),
      para(form.fromOffice, AlignmentType.LEFT),
    ];
    const doc = new Document({ sections: [{ properties: { page: { size: { orientation: PageOrientation.PORTRAIT, width: A4_W, height: A4_H }, margin: { top: MAR, right: MAR, bottom: MAR, left: MAR, header: ZERO, footer: ZERO } } }, children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, `Notice_${form.letterNumber || "draft"}_${form.date}.docx`);
  }

  return (
    <ToolShell title="Notice">
      <div className="min-h-[100dvh] bg-orange-50">
        <div className="bg-orange-700 text-white px-6 py-3 flex items-center gap-3 shadow">
          <button onClick={() => go("/")} className="p-1.5 rounded hover:bg-orange-600"><ArrowLeft size={16} /></button>
          <AlertTriangle size={18} />
          <div className="flex-1">
            <h1 className="font-bold text-sm">नोटिस / Notice Generator</h1>
            <p className="text-orange-200 text-xs">Show-cause · Blacklist · Warning · General — A4 DOCX</p>
          </div>
          <button onClick={downloadDocx} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-orange-800 rounded text-xs font-bold hover:bg-orange-50">
            <Download size={13} /> Download DOCX
          </button>
        </div>

        <div className="max-w-6xl mx-auto p-4 flex gap-4">
          {/* Form */}
          <div className="w-[400px] shrink-0 flex flex-col gap-3">
            <div><label className={LBL}>नोटिस का प्रकार</label>
              <select className={INP} value={form.noticeType} onChange={set("noticeType")}>
                {NOTICE_TYPES.map(n => <option key={n.id} value={n.id}>{n.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LBL}>क्रमांक</label><input className={INP} value={form.letterNumber} onChange={set("letterNumber")} /></div>
              <div><label className={LBL}>दिनांक</label><input className={INP} value={form.date} onChange={set("date")} /></div>
            </div>
            <div><label className={LBL}>प्राप्तकर्ता — नाम</label><input className={INP} value={form.toName} onChange={set("toName")} /></div>
            <div><label className={LBL}>पदनाम</label><input className={INP} value={form.toDesignation} onChange={set("toDesignation")} /></div>
            <div><label className={LBL}>कार्यालय</label><input className={INP} value={form.toOffice} onChange={set("toOffice")} /></div>
            <div><label className={LBL}>विषय</label><input className={INP} value={form.subject} onChange={set("subject")} /></div>
            <div><label className={LBL}>नोटिस की सामग्री (प्रत्येक अनुच्छेद नई पंक्ति में)</label>
              <textarea className={TA} rows={8} value={form.body} onChange={set("body")} />
            </div>
            <div><label className={LBL}>उत्तर की समयसीमा (दिन)</label><input className={INP} value={form.replyDays} onChange={set("replyDays")} /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><label className={LBL}>नाम</label><input className={INP} value={form.fromName} onChange={set("fromName")} /></div>
              <div><label className={LBL}>पदनाम</label><input className={INP} value={form.fromDesignation} onChange={set("fromDesignation")} /></div>
              <div><label className={LBL}>कार्यालय</label><input className={INP} value={form.fromOffice} onChange={set("fromOffice")} /></div>
            </div>
            <button onClick={downloadDocx} className="w-full py-3 bg-orange-700 text-white rounded-lg font-bold text-sm hover:bg-orange-800 flex items-center justify-center gap-2">
              <Download size={16} /> Download Word (.docx)
            </button>
          </div>

          {/* Preview */}
          <div className="flex-1 bg-white border border-gray-200 rounded shadow p-8 text-sm font-serif" style={{ minHeight: "297mm", maxWidth: "210mm" }}>
            <div className="text-center font-bold text-base mb-1">राजस्थान सरकार</div>
            <div className="text-center font-bold">{form.fromDesignation}, सार्वजनिक निर्माण विभाग</div>
            <div className="text-center font-bold text-sm mb-2">{form.fromOffice}</div>
            <hr className="border-black mb-2" />
            <div className="flex justify-between text-xs mb-2">
              <span>क्रमांकः {form.letterNumber}</span><span>दिनांकः {form.date}</span>
            </div>
            <div className="text-xs mb-2">प्रेषित:<br />{form.toDesignation},<br />{form.toName},<br />{form.toOffice}।</div>
            <p className="text-xs font-bold mb-2">विषय:– {noticeLabel} — {form.subject}</p>
            <p className="text-xs mb-2">महोदय,</p>
            <div className="text-xs text-justify mb-2 whitespace-pre-wrap">{form.body}</div>
            <p className="text-xs text-justify mb-4">अतः आपसे अपेक्षा की जाती है कि इस नोटिस की प्राप्ति के {form.replyDays} दिनों के अन्दर अपना स्पष्टीकरण / उत्तर इस कार्यालय में प्रस्तुत करें।</p>
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
