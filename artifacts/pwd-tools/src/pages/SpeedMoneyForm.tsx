import { useState } from "react";
import { useLocation } from "wouter";

// ── Types ─────────────────────────────────────────────────────────────────────
type YesNo = "Yes" | "No";

interface SpeedMoneyFormData {
    agreementNo: string;
    nameOfContractor: string;
    nameOfContractorCustom: string;
    contractorSearch: string;
    dateOfCommencement: string;
    amountThisBill: string;
    depV: string;
    miningRoyaltyOption: "A0" | "B15" | "C30";
    headWiseBifurcation: YesNo;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DIYAS = [
    { left: "3%", delay: "0s", dur: "2.8s" },
    { left: "11%", delay: "0.4s", dur: "3.2s" },
    { left: "21%", delay: "0.9s", dur: "2.5s" },
    { left: "33%", delay: "0.2s", dur: "3.6s" },
    { left: "46%", delay: "1.1s", dur: "2.9s" },
    { left: "59%", delay: "0.6s", dur: "3.1s" },
    { left: "70%", delay: "1.4s", dur: "2.7s" },
    { left: "81%", delay: "0.3s", dur: "3.4s" },
    { left: "91%", delay: "0.8s", dur: "2.6s" },
];

const CONTRACTORS = [
    "Laxmi Lal Dangi", "Charbhuja Constrution and Solutions", "Siddharth Sharma",
    "Aadhyashakti Infrastructure", "Abdul Rauf Khan", "Acharya Construction",
    "Adinath Enterprises", "Alif Construction", "Arjun Construction",
    "Ashapura Construction", "Ashutosh Construction", "B L Construction",
    "Badri Lal Menaria", "Balaji Builders And Developers", "Barkat Ali Bahadur Khan",
    "BG Enterprises", "Bhagwan Stone Crusher", "Bhagya Laxmi Construction",
    "Bhanwar Lal and Sons", "Bheru Construction", "Bherunath Construction",
    "Buildtech Engineering", "Chamunda Construction", "Chetak Construction",
    "Choudhary Industries", "Dashrath Singh Shaktawat", "Dhan Laxmi Enterprises",
    "Dharti Dhan Construction", "Disha Construction", "Durga Construction Company",
    "Firoz Khan", "Ganpati Construction", "Gaurav Enbterprises", "Gautam Kumar",
    "Global Vision Construction and Service", "Gopal Kothari", "Govind Singh Chouhan",
    "GR Agarwal Builders and Developers", "Hamza Construction", "Hans Projects",
    "Hanumant Sai Construction", "Hind Construction", "HP Infrastructure",
    "Innotech Construction Pvt Ltd", "Jai Ambe Maa Construction",
    "Jai Bhawani Construction Company", "Jai Enterprises", "Jasandeep Enterprises",
    "Jayant Builders and Developers", "K.B. Construction Co.", "Kamlesh Chhatwani",
    "KGN ENGINEERS M ZAFAR", "Khushi Enterprises", "Kirti Construction",
    "KK Gupta construction Pvt Ltd", "KS CONSTRUCTION", "Kumawat Construction",
    "L S Construction", "Lal Singh Jhala", "Lokesh Chandel",
    "M/S DAKSH CONSTRUCTION", "M/s Soni Enterprises", "Maa Idana Construction",
    "Madan Construction Company", "Madhav Engineering Services Pvt. Ltd.",
    "Maestro Construction", "Mahadev Construction", "Mahalaxmi Construction",
    "MAHAYAGNA INFRAPROJECTS LLP", "Mahima Construction", "Mandusia Construction Company",
    "Mayank Construction", "MD Construction", "Meera Construction",
    "Metro Enterprises", "Mohan Lal Audchiya", "Moon Enterprises",
    "MS Siddharth Sharma", "Mudit Constructions", "N R G Infra",
    "Nalwaya Construction", "Naresh Kumar Goyal", "Natural Cemeco Private Limited",
    "Navkar Buildcon", "Neel Kanth Sharma", "Nisha Enterprises",
    "Nitin Construction Co", "OM SAI CONSTRUCTION", "Om Shivam Construction Company",
    "P S C Enterprises", "Paliwal Infra Projects", "Panwar Construction",
    "Paras Construction", "Parshwanath Construction", "Patel Enterprises",
    "PK Construction", "Prem Construction Suresh Dangi", "Prithvi Singh Tak",
    "RACHANA CONSTRUCTION", "Radha Kishan Sharma", "Rahil Construction",
    "RAJ BUILDERS", "Raja Ram Construction", "Rajendra Kumar Kalal",
    "Rakesh Kumar Shrimali", "Ram Narayan Menariya", "Ramaiya Infrabuild",
    "Ramesh Chand Solanki", "Rameshwar Lal Choubisa", "RISHABH CONSTRUCTION CO",
    "Roop Lal Patel", "Royal Infra Developers", "S K Construction",
    "S N G Infra Projects", "Sandal Buildcon Private Limited", "Sanjay Mehta",
    "Sant Saheb Construction", "Sanwaria Construction", "Sarangdevot Enterprises",
    "Shaktawat Construction", "Shanti Lal Suthar", "Shiv Construction",
    "Shiv Infra Project and Building Materials", "Shiv Kripa Construction",
    "Shiv Shakti Construction", "Shivam Enterprises", "Shrawan Kumar Bhakhar",
    "Shree Ji Construction", "Shree Nath Construction", "Shree Ram and Company",
    "Shri Amrit Lal Purbia", "Shri Anoop Kumar", "Shri Kallaji Construction",
    "Shri Krishna construction", "Shri Mahesh Construction and Suppliers",
    "Shubh Construction", "SHUBHAM CONSTRUCTION", "Shubham Enterprises",
    "Siddhi Vinayak Builders", "SND CONSTRUCTION", "Sunil Dhabhai",
    "T R Construction", "Tol Singh", "UDAIPUR BUILDCOM",
    "Universal Engineering Group", "Utkarsh Infratec", "V K ENGINEERS",
    "Vaibhav Buildcon", "Vardhman Enterprises", "Vikram Singh",
    "Vinayak Construction", "Vinod Enterprises", "Vipin Kumawat",
    "Vishnu Construction Co", "Yash Construciton company",
    "Zawiya Construction Private Limited",
];

const defaultForm: SpeedMoneyFormData = {
    agreementNo: "",
    nameOfContractor: "",
    nameOfContractorCustom: "",
    contractorSearch: "",
    dateOfCommencement: "",
    amountThisBill: "",
    depV: "0",
    miningRoyaltyOption: "A0",
    headWiseBifurcation: "No",
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function parseDDMMYYYY(s: string): Date | null {
    const clean = s.replace(/\D/g, "");
    if (clean.length !== 8) return null;
    const d = parseInt(clean.slice(0, 2), 10);
    const m = parseInt(clean.slice(2, 4), 10);
    const y = parseInt(clean.slice(4, 8), 10);
    if (m < 1 || m > 12 || d < 1 || d > 31) return null;
    const dt = new Date(y, m - 1, d);
    return isNaN(dt.getTime()) ? null : dt;
}

function getFY(dateStr: string): string {
    const d = parseDDMMYYYY(dateStr);
    const now = new Date();
    if (!d) return String(now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear());
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    return String(m >= 4 ? y + 1 : y);
}

function maskDateInput(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    let out = digits;
    if (digits.length > 4) out = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
    else if (digits.length > 2) out = digits.slice(0, 2) + "/" + digits.slice(2);
    return out;
}

function todayDDMMYYYY(): string {
    const t = new Date();
    const dd = String(t.getDate()).padStart(2, "0");
    const mm = String(t.getMonth() + 1).padStart(2, "0");
    const yyyy = t.getFullYear();
    return `${dd}${mm}${yyyy}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
function Diyas() {
    return (
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", pointerEvents: "none" }}>
            {DIYAS.map((d, i) => (
                <div key={i} style={{ position: "absolute", bottom: "4px", left: d.left, animation: `floatBalloon ${d.dur} ${d.delay} ease-in-out infinite` }}>
                    <div style={{ fontSize: "22px", lineHeight: 1, filter: "drop-shadow(0 0 6px #FFD700) drop-shadow(0 0 12px #FF8C00)" }}>🪔</div>
                </div>
            ))}
            {["8%", "25%", "43%", "62%", "78%", "95%"].map((left, i) => (
                <div key={`f${i}`} style={{ position: "absolute", top: "4px", left, fontSize: "16px", opacity: 0.7, animation: `floatBalloon ${2.4 + i * 0.3}s ${i * 0.5}s ease-in-out infinite` }}>🌸</div>
            ))}
        </div>
    );
}

interface DeductionTableProps {
    rows: [string, string][];
}

function DeductionsPreview({ rows }: DeductionTableProps) {
    const tdL = "border border-gray-500 px-2 py-1 font-semibold bg-gray-50 w-1/2 align-top text-xs";
    const tdR = "border border-gray-500 px-2 py-1 w-1/2 align-top text-xs";
    return (
        <div className="bg-white border border-gray-400 text-black text-xs overflow-auto" style={{ fontFamily: "'Noto Sans Devanagari','Segoe UI',sans-serif" }}>
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <td colSpan={2} className="border border-gray-500 text-center font-bold py-2 text-sm" style={{ background: "#fce4ec", color: "#880e4f" }}>
                            SPEED MONEY CALCULATION
                        </td>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([label, value], i) => (
                        <tr key={i}>
                            <td className={tdL + " pl-6"}>{label}</td>
                            <td className={tdR}>{value}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// ── Print HTML ────────────────────────────────────────────────────────────────
function buildPrintHtml(rows: [string, string][], filename: string): string {
    const dedHtml = rows
        .map(([l, v]) => `<tr><td class="l">${l}</td><td class="r">${v}</td></tr>`)
        .join("");
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>${filename}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap" rel="stylesheet">
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
  * { box-sizing:border-box; margin:0; padding:0; }
  body { padding:10mm; font-family:'Noto Sans Devanagari','Segoe UI',sans-serif; font-size:9pt; color:#000; background:#fff; }
  table { width:100%; border-collapse:collapse; }
  td { border:1px solid #555; padding:4px 6px; vertical-align:top; }
  .h { text-align:center; font-weight:700; font-size:10pt; background:#fce4ec; color:#880e4f; padding:4px; }
  .l { font-weight:600; background:#f5f5f5; width:50%; }
  .r { width:50%; }
</style>
</head>
<body>
<table>
  <tr><td colspan="2" class="h">SPEED MONEY CALCULATION</td></tr>
  ${dedHtml}
</table>
</body>
</html>`;
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SpeedMoneyForm() {
    const [form, setForm] = useState<SpeedMoneyFormData>(defaultForm);
    const [, navigate] = useLocation();

    const setField = (field: keyof SpeedMoneyFormData, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const set = (field: keyof SpeedMoneyFormData) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
            setField(field, e.target.value);

    // ── Calculations ─────────────────────────────────────────────────────────
    const thisBillAmt = parseFloat(form.amountThisBill) || 0;
    const depV = parseFloat(form.depV) || 0;

    const sd10 = Math.round(thisBillAmt * 0.10);
    const it2 = Math.round(thisBillAmt * 0.02);
    const rawGst = thisBillAmt * 0.02;
    const gst2 = Math.round(rawGst) % 2 === 0 ? Math.round(rawGst) : Math.round(rawGst) + 1;
    const lc1 = Math.round(thisBillAmt * 0.01);

    const miningRoyaltyPct = form.miningRoyaltyOption === "B15" ? 0.015 : form.miningRoyaltyOption === "C30" ? 0.03 : 0;
    const dfmtPct = form.miningRoyaltyOption === "B15" ? 0.0015 : form.miningRoyaltyOption === "C30" ? 0.003 : 0;
    const miningRoyalty = Math.round(thisBillAmt * miningRoyaltyPct);
    const dfmt = Math.round(thisBillAmt * dfmtPct);

    const totalDeductions = sd10 + it2 + gst2 + lc1 + miningRoyalty + dfmt + depV;
    const chequeAmount = thisBillAmt - totalDeductions;
    const totalCheck = totalDeductions + chequeAmount;
    const speedMoneyAmt = Math.round((chequeAmount * 0.002) / 100) * 100;

    const deductionRows: [string, string][] = [
        ["Income Tax (2%)", `Rs. ${it2.toLocaleString("en-IN")}`],
        ["GSTIN Deduction (2%)", `Rs. ${gst2.toLocaleString("en-IN")}`],
        ...(dfmt > 0 ? [["DMFT (0.15% / 0.3%)", `Rs. ${dfmt.toLocaleString("en-IN")}`] as [string, string]] : []),
        ["Labour Welfare (1%)", `Rs. ${lc1.toLocaleString("en-IN")}`],
        ...(miningRoyalty > 0 ? [["Mining Royalty", `Rs. ${miningRoyalty.toLocaleString("en-IN")}`] as [string, string]] : []),
        ["SD-II (10%)", `Rs. ${sd10.toLocaleString("en-IN")}`],
        ...(depV > 0 ? [["Deposit-V (M.D.)", `Rs. ${depV.toLocaleString("en-IN")}`] as [string, string]] : []),
        ["Cheque / Amount", `Rs. ${chequeAmount.toLocaleString("en-IN")}`],
        ["Total", `Rs. ${totalCheck.toLocaleString("en-IN")}`],
        ["Speed Money (0.20% of Cheque, rounded ₹100)", `Rs. ${speedMoneyAmt.toLocaleString("en-IN")}`],
    ];

    // ── PDF filename ──────────────────────────────────────────────────────────
    function getPdfFilename(): string {
        const effectiveContractor = form.nameOfContractor === "__custom__"
            ? form.nameOfContractorCustom
            : form.nameOfContractor;
        const contractorFirstWord = (effectiveContractor || "Contractor")
            .replace(/^M\/s\.\s*/i, "")
            .split(/\s+/)[0] || "Contractor";
        const agNo = form.agreementNo || "Agr";
        const fy = getFY(form.dateOfCommencement || todayDDMMYYYY());
        return `${contractorFirstWord} ${agNo} ${fy}.pdf`;
    }

    function handlePrint() {
        const html = buildPrintHtml(deductionRows, getPdfFilename());
        const win = window.open("", "_blank", "width=794,height=1123");
        if (!win) { alert("Please allow popups to print."); return; }
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => { win.print(); }, 600);
    }

    const inputCls = "navratri-input";
    const labelCls = "navratri-label";
    const sectionCls = "navratri-section";

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
        @keyframes floatBalloon {
          0%,100% { transform: translateY(0) rotate(-2deg); }
          50%      { transform: translateY(-14px) rotate(2deg); }
        }
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .navratri-section {
          background: linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%);
          border: 1.5px solid #e6a817;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(200,130,0,0.10);
        }
        .navratri-section h3 { color: #7B2D00; font-weight: 700; }
        .navratri-input {
          width: 100%;
          border: 1.5px solid #e6a817;
          border-radius: 8px;
          padding: 5px 10px;
          font-size: 0.85rem;
          background: #fffef7;
          color: #3a1a00;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          font-family: 'Noto Sans Devanagari','Segoe UI',sans-serif;
        }
        .navratri-input:focus {
          border-color: #c8720a;
          box-shadow: 0 0 0 3px rgba(230,168,23,0.25);
        }
        .navratri-label {
          font-size: 0.72rem;
          font-weight: 700;
          color: #7B2D00;
          margin-bottom: 3px;
          display: block;
          letter-spacing: 0.01em;
        }
      `}</style>

            <div style={{ fontFamily: "'Noto Sans Devanagari','Segoe UI',sans-serif", minHeight: "100vh", background: "linear-gradient(160deg, #fff8e1 0%, #fff3e0 40%, #fce4ec 100%)" }}>

                {/* Header */}
                <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #7B0D00 0%, #c0392b 25%, #e67e22 50%, #c0392b 75%, #7B0D00 100%)", backgroundSize: "300% auto", animation: "shimmer 8s linear infinite", borderBottom: "4px solid #FFD700" }}>
                    <Diyas />
                    <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", padding: "10px 20px 6px", gap: "12px" }}>
                        <button
                            onClick={() => navigate("/")}
                            style={{ background: "rgba(255,215,0,0.18)", border: "1.5px solid #FFD700", color: "#FFD700", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}
                        >
                            🏠 Home
                        </button>
                        <div style={{ flex: 1, textAlign: "center" }}>
                            <div style={{ color: "#FFD700", fontWeight: 900, fontSize: "1.25rem", letterSpacing: "0.08em", textShadow: "0 0 12px rgba(255,215,0,0.8), 0 2px 6px rgba(0,0,0,0.5)" }}>
                                🪔 SPEED MONEY TOOL 🪔
                            </div>
                            <div style={{ color: "#FFEAA7", fontWeight: 500, fontSize: "0.78rem", letterSpacing: "0.12em", marginTop: "2px" }}>
                                Deduction Table — Speed Money Calculation
                            </div>
                        </div>
                    </div>
                    <div style={{ background: "linear-gradient(90deg, #FFD700, #FF8C00, #FFD700)", height: "3px" }} />
                </div>

                <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-[1400px] mx-auto">

                    {/* ── Input Form ── */}
                    <div className="lg:w-1/2 flex flex-col">

                        {/* Form header */}
                        <div style={{ background: "linear-gradient(135deg, #7B0D00, #c0392b, #e67e22)", border: "2px solid #FFD700", borderRadius: "14px", padding: "12px 16px", marginBottom: "16px", boxShadow: "0 4px 20px rgba(200,80,0,0.25)" }}>
                            <h2 className="font-bold text-sm" style={{ color: "#FFD700", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                                ✦ Input Form — Speed Money Details ✦
                            </h2>
                            <p className="text-xs mt-1" style={{ color: "#FFEAA7" }}>
                                Fill details, then print the deduction table.
                            </p>
                        </div>

                        {/* Contractor & Agreement */}
                        <div className={sectionCls}>
                            <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ borderColor: "#e6a817" }}>ठेकेदार / Contractor</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className={labelCls}>ठेकेदार / Contractor</label>
                                    <input
                                        className={inputCls}
                                        value={form.contractorSearch !== "" ? form.contractorSearch : (form.nameOfContractor && form.nameOfContractor !== "__custom__" ? form.nameOfContractor : "")}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setField("contractorSearch", val);
                                            const exactMatch = CONTRACTORS.find(c => c.toLowerCase() === val.toLowerCase());
                                            if (exactMatch) setField("nameOfContractor", exactMatch);
                                            else if (val === "") setField("nameOfContractor", "");
                                        }}
                                        onFocus={() => setField("contractorSearch", "")}
                                        onBlur={() => setField("contractorSearch", "")}
                                        placeholder="Type to search contractors..."
                                        list="sm-contractor-list"
                                    />
                                    <datalist id="sm-contractor-list">
                                        {CONTRACTORS.filter(c => {
                                            const s = (form.contractorSearch || "").toLowerCase();
                                            return s === "" || c.toLowerCase().includes(s);
                                        }).map(c => <option key={c} value={c} />)}
                                        <option value="__custom__">Other (type custom name)</option>
                                    </datalist>
                                    {form.nameOfContractor === "__custom__" && (
                                        <input className={inputCls + " mt-1"} value={form.nameOfContractorCustom} onChange={set("nameOfContractorCustom")} placeholder="M/s. Name, Town" />
                                    )}
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={labelCls}>अनुबंध संख्या / Agreement No.</label>
                                        <input className={inputCls} value={form.agreementNo} onChange={set("agreementNo")} placeholder="e.g. 62/2024-25" />
                                    </div>
                                    <div>
                                        <label className={labelCls}>प्रारंभ तिथि / Date of Commencement (DD/MM/YYYY)</label>
                                        <input className={inputCls} value={form.dateOfCommencement} onChange={(e) => setField("dateOfCommencement", maskDateInput(e.target.value))} placeholder="DDMMYYYY" maxLength={10} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className={sectionCls}>
                            <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ borderColor: "#e6a817" }}>राशि / Amount</h3>
                            <div>
                                <label className={labelCls}>बिल राशि / Amount of This Bill (₹)</label>
                                <input type="number" className={inputCls} value={form.amountThisBill} onChange={set("amountThisBill")} placeholder="0" />
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className={sectionCls}>
                            <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ borderColor: "#e6a817" }}>कटौतियाँ / Deductions</h3>
                            <p className="text-xs text-gray-500 mb-3">SD(10%), IT(2%), GST(2%), LC(1%) — स्वचालित / auto-calculated.</p>

                            <div className="mb-3">
                                <label className={labelCls}>Mining Royalty — विकल्प चुनें</label>
                                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                                    {(["A0", "B15", "C30"] as const).map((opt) => {
                                        const active = form.miningRoyaltyOption === opt;
                                        const meta: Record<string, { royalty: string; dfmt: string; color: string; bg: string; border: string }> = {
                                            A0: { royalty: "0%", dfmt: "0%", color: active ? "#fff" : "#5d4037", bg: active ? "#5d4037" : "#fff8e1", border: "#8d6e63" },
                                            B15: { royalty: "1.5%", dfmt: "0.15%", color: active ? "#fff" : "#e65100", bg: active ? "#e65100" : "#fff3e0", border: "#ff8f00" },
                                            C30: { royalty: "3%", dfmt: "0.3%", color: active ? "#fff" : "#b71c1c", bg: active ? "#b71c1c" : "#fce4ec", border: "#e53935" },
                                        };
                                        const m = meta[opt];
                                        return (
                                            <button key={opt} type="button" onClick={() => setField("miningRoyaltyOption", opt)}
                                                style={{ flex: 1, padding: "8px 4px", borderRadius: "10px", border: `2px solid ${m.border}`, background: m.bg, color: m.color, fontWeight: active ? 800 : 600, fontSize: "0.72rem", cursor: "pointer", textAlign: "center", lineHeight: 1.4 }}>
                                                <div style={{ fontSize: "0.9rem", fontWeight: 900 }}>{opt}</div>
                                                <div>Royalty: {m.royalty}</div>
                                                <div>DFMT: {m.dfmt}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                {form.miningRoyaltyOption !== "A0" && thisBillAmt > 0 && (
                                    <p className="text-xs mt-2 font-semibold" style={{ color: "#e65100" }}>
                                        ▶ Mining Royalty: ₹{miningRoyalty.toLocaleString("en-IN")} &nbsp;|&nbsp; DFMT: ₹{dfmt.toLocaleString("en-IN")}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelCls}>Dep-V / M.D. (₹)</label>
                                <input type="number" className={inputCls} value={form.depV} onChange={set("depV")} />
                            </div>
                        </div>

                        {/* Print button */}
                        <button onClick={handlePrint}
                            className="w-full font-bold py-3 rounded-xl text-sm mb-6 shadow-lg"
                            style={{ background: "linear-gradient(90deg, #880e4f, #e91e63, #880e4f)", backgroundSize: "200% auto", animation: "shimmer 3s linear infinite", color: "#fff", border: "none", cursor: "pointer" }}>
                            🖨️ Print Deduction Table / Save PDF — {getPdfFilename()}
                        </button>
                    </div>

                    {/* ── Live Preview ── */}
                    <div className="lg:w-1/2">
                        <DeductionsPreview rows={deductionRows} />
                    </div>

                </div>
            </div>
        </>
    );
}
