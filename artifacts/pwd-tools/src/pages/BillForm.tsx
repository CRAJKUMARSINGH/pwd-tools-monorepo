import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { usePrintPage } from "@/lib/printPage";
import { useState } from "react";

type YesNo = "Yes" | "No";
type OrigDep = "Original" | "Deposit";
type BillType = "Running" | "Final";
type BillFormMode = "bill-note" | "speed-money";

const ORDINALS = ["1ST", "2ND", "3RD", "4TH", "5TH", "6TH", "7TH", "8TH", "9TH", "10TH"];

function getBillTitle(billNumber: number, billType: BillType): string {
  const ord = ORDINALS[billNumber - 1] ?? `${billNumber}TH`;
  if (billType === "Final") return `${ord} AND FINAL BILL SCRUTINY SHEET`;
  return `${ord} RUNNING BILL SCRUTINY SHEET`;
}

function parseDDMMYYYY(s: string): Date | null {
  const clean = s.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  const d = parseInt(clean.slice(0, 2), 10);
  const m = parseInt(clean.slice(2, 4), 10);
  const y = parseInt(clean.slice(4, 8), 10);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  const dt = new Date(y, m - 1, d);
  if (isNaN(dt.getTime())) return null;
  return dt;
}

function formatDDMMYYYY(dateStr: string): string {
  if (!dateStr) return "---";
  const d = parseDDMMYYYY(dateStr);
  if (!d) return dateStr;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function maskDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  let out = digits;
  if (digits.length > 4) out = digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
  else if (digits.length > 2) out = digits.slice(0, 2) + "/" + digits.slice(2);
  return out;
}

function daysBetween(d1: string, d2: string): number {
  const a = parseDDMMYYYY(d1);
  const b = parseDDMMYYYY(d2);
  if (!a || !b) return 0;
  return Math.round((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function todayDDMMYYYY(): string {
  const t = new Date();
  const dd = String(t.getDate()).padStart(2, "0");
  const mm = String(t.getMonth() + 1).padStart(2, "0");
  const yyyy = t.getFullYear();
  return `${dd}${mm}${yyyy}`;
}

function getFY(dateStr: string): string {
  const d = parseDDMMYYYY(dateStr);
  const now = new Date();
  if (!d) { return String(now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear()); }
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  return String(m >= 4 ? y + 1 : y);
}

const CONTRACTORS = [
  "Contractor [collapse]",
  "Laxmi Lal Dangi",
  "Charbhuja Constrution and Solutions",
  "Siddharth Sharma",
  "Aadhyashakti Infrastructure",
  "Abdul Rauf Khan",
  "Abhinav Telecom",
  "Acharya Construction",
  "Adinath Enterprises",
  "Ahada construction",
  "Alif Construction",
  "Apsara Tent House",
  "Arjun Construction",
  "Ashapura Construction",
  "Ashutosh Construction",
  "AZAD CONSTRUCTION AND SUPPLIERS",
  "B L Construction",
  "Badri Lal Menaria",
  "Bagdi Const",
  "Bahadur Singh Rao",
  "Balaji Builders And Developers",
  "BALWANT",
  "Barkat Ali Bahadur Khan",
  "BG Enterprises",
  "bhaday laxmi construction",
  "Bhagwan Stone Crusher",
  "Bhagya Laxmi Construction",
  "Bhagya shree Trading Co.",
  "Bhanwar Lal and Sons",
  "BHAWANI CONSTRUCTION",
  "BHERAV CONSTRUCITON",
  "Bheru Construction",
  "Bheru Nath Const Co",
  "Bherunath Construction",
  "BHUPENDRA SINGH RANWAT",
  "Bhwani Construction",
  "BLACK STONE",
  "BLG Construction Services PVT LTD",
  "Buildtech Engineering",
  "Chamunda Construction",
  "Chandreshwar Construction",
  "Chetak Construction",
  "Chetak Constructions",
  "CHIRAG PHOTOCOPIER",
  "Choudhary Industries",
  "choudhary industries New Sartaj",
  "Dashrath Singh Shaktawat",
  "Daya Bai Paliwal",
  "DEEP DARSHAN",
  "Dhan Laxmi Enterprises",
  "Dharam Narayan Dangi",
  "Dharti Dhan Construction",
  "DILIP KUMAR AGARAWAL",
  "Disha Construction",
  "Durga Construction Company",
  "Firoz Khan",
  "Ganpati Construction",
  "Gaurav Enbterprises",
  "Gautam Kumar",
  "Girraj Construction Col",
  "Global Vision Construction and Service",
  "Goodluck Iron Industies",
  "Gopal Kothari",
  "Gopi Shankar Menaria",
  "Govind Singh Chouhan",
  "GR Agarwal Builders and Developers",
  "Green World Design",
  "GREEN WORLD DESIGN",
  "Green World Design",
  "H.P Buildcon unkari Bai",
  "Hamza Construction",
  "Hans Projects",
  "Hanumant Sai Construction",
  "Hind Construction",
  "Hindustan Furniture",
  "hitesh patel",
  "hp enterprises",
  "HP Infrastructure",
  "HT MEDIA LIMITED",
  "Innotech Construction Pvt Ltd",
  "Jai Ambe Maa Construction",
  "Jai Bhawani Construction Company",
  "JAI BUILDCON PVT LTD",
  "Jai Enterprises",
  "JAI hanuman ENTERPRISES",
  "Jai Siya Ram Traders",
  "JAIPUR MAHANAGR TIMES",
  "Jasandeep Enterprises",
  "JAVED AKHTAR CONTRACTOR",
  "jay Enterprises",
  "Jayant Builders and Developers",
  "Jogmaya Constuction",
  "K.B. Construction Co.",
  "Kamlesh Chhatwani",
  "KGN ENGINEERS M ZAFAR",
  "KHAN CONSTRUCTION",
  "Khawahish Build State Pvt Ltd",
  "Khawaish Buildestate Private Limited",
  "Khushi Enterprises",
  "Kirti Construction",
  "Kishan Menariya",
  "KK Gupta construction Pvt Ltd",
  "KMP Consultants",
  "KS CONSTRUCTION",
  "Kumawat Construction",
  "L S Construction",
  "Lal Singh Jhala",
  "LAL SINGH JHALA VALLABHNAGAR",
  "LAXMI TRADERS",
  "LAXMI CONSTRUCTION",
  "LAXMI LAL PATEL",
  "LaXmi Narayan Paliwal",
  "lehari lal teli",
  "Lokesh Chandel",
  "M/S DAKSH CONSTRUCTION",
  "M/s Soni Enterprises",
  "M/s./Shri Laxmi Lal Patel",
  "Maa Idana Construction",
  "MAA KALIKA ENTERPRISES",
  "MAAKALIKA ENTERPRISES",
  "Madan Construction Company",
  "Madhav Engineering Services Pvt. Ltd.",
  "Madhu Lal Jhat Contractor",
  "Maestro Construction",
  "Mahadev Buildtek",
  "Mahadev Construction",
  "MAHADEV CONSTRUCTION 2",
  "Mahadev Construction Company",
  "MAHADEV CONSULTANT DEVENDER PANERI",
  "Mahalaxmi Construction",
  "Mahalxmi Construction Bandoli",
  "MAHAYAGNA INFRAPROJECTS LLP",
  "mahi construction",
  "Mahima Construction",
  "MAHIPAL SINGH KHETAWAT",
  "Mandusia Construction Company",
  "MANGI LAL CHOUDHARY",
  "Mangi Lal Choudhary",
  "MATESHWARI CONTRACTOR",
  "Mayank Construction",
  "MD Construction",
  "MD Consttruction",
  "Meera Construction",
  "Metro Enterprises",
  "MM CONSTRUCTION HATHIPOL",
  "MMM CONSTRUCTION AA CLASS HATHIPOL UDAIPUR",
  "Mohan Lal Audchiya",
  "Moon Enterprises",
  "Moti lal suthar",
  "MS Shambhave Infraprojects",
  "MS Siddharth Sharma",
  "Mudit Constructions",
  "Mukit Enterprises",
  "MULTI SOLUTION AAA",
  "N R G Infra",
  "Nalwaya Construction",
  "NAND LAL SUIther",
  "NARAYAN SEN",
  "Naresh Kumar Goyal",
  "NARESH INFRA PROJECT PVT LTD ABU ROAD",
  "NASEEB TENT AND LIGHT HOUSE",
  "Natural Cemeco Private Limited",
  "Navkar Buildcon",
  "Neel Kanth Sharma",
  "Nisha Enterprises",
  "Nitin Construction Co",
  "NITISH KUMAR GIRDHARI LAL JOSHI",
  "OM SAI CONSTRUCTION",
  "Om Shivam Construction Company",
  "OSWAL ENTERPRISES",
  "P S C Enterprises",
  "Paliwal Infra Projects",
  "Panwar Construction",
  "Paras Construction",
  "parmar construciton kherwara",
  "Parshwanath Construction",
  "parul construction",
  "Patel Enterprises",
  "Pitra Kripa Enterprises",
  "PK Construction",
  "Poorva Enterptises",
  "Popular Iron Industries",
  "Prachi construction",
  "Prem Construction Suresh Dangi",
  "Prem Construvtion",
  "Prithvi Singh Tak",
  "Pushker Lal Yagnic",
  "RACHANA CONSTRUCTION",
  "Radha Kishan Sharma",
  "Radha krishana Sen",
  "Rahil Construction",
  "Rahul Daya",
  "RAJ BUILDERS",
  "Raj Builders And Devlopers",
  "Raja Ram Construction",
  "Rajendra Kumar Kalal",
  "Rajesh P Nahar",
  "Rakesh Kumar Shrimali",
  "Ram Narayan Menariya",
  "Ramaiya Infrabuild",
  "Ramesh Chand Solanki",
  "Rameshwar Lal Choubisa",
  "RISHABH CONSTRUCTION CO",
  "ROLJACK ASIA LIMITED",
  "Roop Lal Patel",
  "Royal Infra Developers",
  "RR INFRA",
  "RUKKAYA CONSTRUCTION",
  "S K Construction",
  "S N G Infra Projects",
  "Sabri Enterprises",
  "Saddik Mohammed Sheikh",
  "Sandal Buildcon Private Limited",
  "Sanjay Mehta",
  "Sant Saheb Construction",
  "Sanwaria Construction",
  "Sarangdevot Enterprises",
  "Sayeed Iqbal",
  "Shaktawat Construction",
  "SHaktawat Construction",
  "Shanaya Dreamcity Pvt Ltd",
  "Shanti Lal Suthar",
  "Shiv Construction",
  "SHIV CONSTRUCTION AMARPURA",
  "Shiv Infra Project and Building Materials",
  "Shiv Kripa Construction",
  "shiv lal Laddha",
  "Shiv Shakti Construction",
  "Shivam Computers",
  "Shivam Enterprises",
  "Shivrajconstructioncompany Shivnarayanpaliwal",
  "Shrawan Kumar Bhakhar",
  "shree bayan maa",
  "Shree Ekling ji enterprises",
  "Shree Ji Construction",
  "SHREE KARANI KRIPA CONSTRUCTION",
  "Shree Krishna Kanaiya Traders",
  "Shree Nath Construction",
  "Shree Ram and Company",
  "SHREE RAM CONTRACTORS",
  "SHREE SIDHI VINAYAK CONSTRUCTION",
  "SHREE VINAYAK CONSTRUCTION",
  "Shri Amrit Lal Purbia",
  "Shri Anoop Kumar",
  "SHRI BHAIRAV CONSTRUCTION COMPANY",
  "Shri Chaturbhuj Sharma",
  "Shri Kallaji Construction",
  "Shri Krishna construction",
  "Shri Mahesh Construction and Suppliers",
  "Shri Rama Kathat",
  "Shubh Construction",
  "SHUBHAM CONSTRUCTION",
  "Shubham Enterprises",
  "Siddhi Enterprises",
  "Siddhi Vinayak Builders",
  "SND CONSTRUCTION",
  "sng infra",
  "SOMESHWAR INFRA PROJECTS",
  "Sunil Dhabhai",
  "Sunil dhabhi",
  "Sunita Enterprises Jaipur",
  "SURESH CHANDRA JHAT",
  "Suresh Kumar Suyal",
  "T R Construction",
  "Tol Singh",
  "UDAIPUR BUILDCOM",
  "Universal Engineering Group",
  "Utkarsh Infratec",
  "V K ENGINEERS",
  "V S Enterprises",
  "Vaibhav Buildcon",
  "VALURAM GAUTAMJI SUTHAR",
  "Vardhman Enterprises",
  "Veer Tejaji Enterprises",
  "Vikram Singh",
  "Vinay construction and Cement Bricks",
  "Vinayak Construction",
  "VINAYAK CONSTRUCTION",
  "VINAYAK CONSTRUCTION AJAY KUMAR",
  "vinayak construction Ajay kumar sharma dungarpur",
  "Vinod Enterprises",
  "Vipin Kumawat",
  "Vipin Kumawat",
  "VIRAT ENTERPRISE",
  "VISHAL PAREEK",
  "VISHAWKARMA WORK CONTRACTOR",
  "Vishnu Construction Co",
  "WINPRO INFRA SALES",
  "Yash Construciton company",
  "YOGESH KALA VITHY",
  "Zawiya Construction Private Limited"
];

const SUB_DIVISIONS = ["Udaipur", "Udaipur-I", "Udaipur-II", "Rajsamand"];

interface FormData {
  billNumber: number;
  billType: BillType;
  budgetHead: string;
  agreementNo: string;
  mbNo: string;
  subDivision: string;
  subDivisionCustom: string;
  nameOfWork: string;
  nameOfContractor: string;
  nameOfContractorCustom: string;
  originalOrDeposit: OrigDep;
  dateOfCommencement: string;
  dateOfCompletion: string;
  actualDateOfCompletion: string;
  totalWorkOrderAmount: string;
  sumPaymentLastBill: string;
  amountThisBill: string;
  uptoDateBillOverride: string;
  dateOfMeasurement: string;
  selectionItemsCheckedEE: string;
  otherInputs: string;
  isRepairMaintenance: YesNo;
  hasExtraItem: YesNo;
  extraItemAmount: string;
  hasExcessItem: YesNo;
  headWiseBifurcation: YesNo;
  sd10: string;
  it2: string;
  gst2: string;
  lc1: string;
  depV: string;
  miningRoyaltyOption: "A0" | "B15" | "C30";
  signatoryName: string;
  officeName: string;
  contractorSearch: string;
}

interface BillFormProps {
  mode?: BillFormMode;
}

interface RecentFormEntry {
  id: string;
  label: string;
  savedAt: string;
  form: FormData;
}

const defaultForm: FormData = {
  billNumber: 1,
  billType: "Running",
  budgetHead: "8443-00-108-00-00",
  agreementNo: "",
  mbNo: "",
  subDivision: "Udaipur",
  subDivisionCustom: "",
  nameOfWork: "",
  nameOfContractor: "",
  nameOfContractorCustom: "",
  originalOrDeposit: "Deposit",
  dateOfCommencement: "",
  dateOfCompletion: "",
  actualDateOfCompletion: "",
  totalWorkOrderAmount: "",
  sumPaymentLastBill: "0",
  amountThisBill: "",
  uptoDateBillOverride: "",
  dateOfMeasurement: "",
  selectionItemsCheckedEE: "",
  otherInputs: "",
  isRepairMaintenance: "No",
  hasExtraItem: "No",
  extraItemAmount: "0",
  hasExcessItem: "Yes",  // Always Yes - removed from form, auto-detected by work %
  headWiseBifurcation: "No",
  sd10: "",
  it2: "",
  gst2: "",
  lc1: "",
  depV: "0",
  miningRoyaltyOption: "A0",
  signatoryName: "AUDITOR Badgaon/Gogunda/Sayra",
  officeName: "PWD District Div.-II, Udaipur",
  contractorSearch: "",
};

const SPEED_MONEY_RECENT_STORAGE_KEY = "speed-money-tool-recent-inputs";

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

function getRecentInputLabel(form: FormData): string {
  const contractor = form.nameOfContractor === "__custom__" ? form.nameOfContractorCustom : form.nameOfContractor;
  const agreement = form.agreementNo || "No Agreement";
  const billNo = `${form.billNumber}${form.billType === "Final" ? " Final" : " Running"}`;
  return [contractor || "Unnamed Contractor", agreement, billNo].join(" • ");
}

export default function BillForm({ mode = "bill-note" }: BillFormProps) {
  useDocumentTitle("Bill Form");
  usePrintPage();
  const isSpeedMoney = mode === "speed-money";
  const [form, setForm] = useState<FormData>(defaultForm);
  const [recentInputs, setRecentInputs] = useState<RecentFormEntry[]>(() => {
    if (mode !== "speed-money") return [];
    try {
      const raw = window.localStorage.getItem(SPEED_MONEY_RECENT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as RecentFormEntry[];
      return Array.isArray(parsed) ? parsed.slice(0, 10) : [];
    } catch {
      return [];
    }
  });

  const setField = (field: keyof FormData, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const setDate = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setField(field, maskDateInput(e.target.value));
    };

  const set = (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setField(field, e.target.value);
    };

  const saveRecentInput = () => {
    if (!isSpeedMoney) return;

    const entry: RecentFormEntry = {
      // eslint-disable-next-line react-hooks/purity
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      label: getRecentInputLabel(form),
      // eslint-disable-next-line react-hooks/purity
      savedAt: new Date().toLocaleString(),
      form: { ...form, contractorSearch: "" },
    };

    setRecentInputs((prev) => {
      const next = [entry, ...prev].slice(0, 10);
      try {
        window.localStorage.setItem(SPEED_MONEY_RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage write may fail in private mode; ignore gracefully
      }
      return next;
    });
  };

  const loadRecentInput = (entry: RecentFormEntry) => {
    setForm({ ...entry.form, contractorSearch: "" });
  };

  const deleteRecentInput = (id: string) => {
    setRecentInputs((prev) => {
      const next = prev.filter((entry) => entry.id !== id);
      try {
        window.localStorage.setItem(SPEED_MONEY_RECENT_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage write may fail in private mode; ignore gracefully
      }
      return next;
    });
  };

  const effectiveSubDivision = form.subDivision === "__custom__" ? form.subDivisionCustom : form.subDivision;
  const effectiveContractor = form.nameOfContractor === "__custom__" ? form.nameOfContractorCustom : form.nameOfContractor;

  const billTitle = getBillTitle(form.billNumber, form.billType);
  const isFinal = form.billType === "Final";

  const workOrderAmt = parseFloat(form.totalWorkOrderAmount) || 0;
  const lastBillAmt = parseFloat(form.sumPaymentLastBill) || 0;
  const thisBillAmt = parseFloat(form.amountThisBill) || 0;
  const extraAmt = parseFloat(form.extraItemAmount) || 0;

  const overrideUpto = parseFloat(form.uptoDateBillOverride) || 0;
  const actualExpenditure = overrideUpto > 0 ? overrideUpto : (lastBillAmt + thisBillAmt);

  const rawBalance = workOrderAmt - actualExpenditure;
  const balanceDisplay = rawBalance < 0 ? "Nil" : `Rs. ${rawBalance.toLocaleString("en-IN")}`;

  const sd10 = form.sd10 !== "" ? parseFloat(form.sd10) : Math.round(thisBillAmt * 0.1);
  const it2 = form.it2 !== "" ? parseFloat(form.it2) : Math.round(thisBillAmt * 0.02);
  const rawGst = thisBillAmt * 0.02;
  const gstCalc = Math.round(rawGst) % 2 === 0 ? Math.round(rawGst) : Math.round(rawGst) + 1;
  const gst2 = form.gst2 !== "" ? parseFloat(form.gst2) : gstCalc;
  const lc1 = form.lc1 !== "" ? parseFloat(form.lc1) : Math.round(thisBillAmt * 0.01);
  const depV = parseFloat(form.depV) || 0;

  // Mining Royalty & DFMT (based on option A0 / B15 / C30)
  const miningRoyaltyPct = form.miningRoyaltyOption === "B15" ? 0.015 : form.miningRoyaltyOption === "C30" ? 0.03 : 0;
  const dfmtPct = form.miningRoyaltyOption === "B15" ? 0.0015 : form.miningRoyaltyOption === "C30" ? 0.003 : 0;
  const miningRoyalty = Math.round(thisBillAmt * miningRoyaltyPct);
  const dfmt = Math.round(thisBillAmt * dfmtPct);

  const totalDeductions = sd10 + it2 + gst2 + lc1 + miningRoyalty + dfmt + depV;
  const chequeAmount = thisBillAmt - totalDeductions;
  const totalCheck = totalDeductions + chequeAmount;

  const speedMoneyRaw = chequeAmount * 0.002;
  const speedMoneyAmt = Math.round(speedMoneyRaw / 100) * 100;

  const progressPct = workOrderAmt > 0 ? ((actualExpenditure / workOrderAmt) * 100).toFixed(2) : "0.00";
  const pctNum = parseFloat(progressPct);
  const extraPct = workOrderAmt > 0 ? ((extraAmt / workOrderAmt) * 100).toFixed(2) : "0.00";
  const extraExceeds5 = parseFloat(extraPct) > 5;

  const delayDays = daysBetween(form.dateOfCompletion, form.actualDateOfCompletion);
  const scheduleDuration = daysBetween(form.dateOfCommencement, form.dateOfCompletion);

  const checkingDateAEN = form.dateOfMeasurement;

  const todayStr = todayDDMMYYYY();
  const daysSinceCompletion = daysBetween(form.actualDateOfCompletion, todayStr);
  const lateSubmission = isFinal && form.actualDateOfCompletion !== "" && daysSinceCompletion >= 181;

  const showExtraItem = form.hasExtraItem === "Yes" && extraAmt > 0;

  const showExcessNote = (() => {
    if (!isFinal) return pctNum > 100;
    return pctNum < 90 || pctNum > 100;
  })();

  function generateNotePoints(): string[] {
    const pts: string[] = [];
    let n = 1;

    pts.push(`${n++}. कार्य ${progressPct} प्रतिशत संपादित हुआ है।`);

    // Deviation note logic:
    // Running bill: only if > 100%
    // Final bill: if < 90% or > 100%
    if (!isFinal) {
      // Running bill - only show deviation if > 100%
      if (pctNum > 100 && pctNum <= 105) {
        pts.push(`${n++}. जिसका डेविएशन स्टेटमेंट भी स्वीकृति हेतु प्राप्त हुआ है, OVERALL EXCESS वर्क आर्डर राशि के 5% से कम या बराबर है जिसकी स्वीकृति इसी कार्यालय के क्षेत्राधिकार में निहित है।`);
      } else if (pctNum > 105) {
        pts.push(`${n++}. जिसका डेविएशन स्टेटमेंट भी स्वीकृति हेतु प्राप्त हुआ है, OVERALL EXCESS वर्क आर्डर राशि के 5% से अधिक है जिसकी स्वीकृति Superintending Engineer, ${form.officeName} कार्यालय के क्षेत्राधिकार में निहित है।`);
      }
    } else {
      // Final bill - show deviation if < 90% or > 100%
      if (pctNum < 90) {
        pts.push(`${n++}. जिसका डेविएशन स्टेटमेंट भी स्वीकृति हेतु प्राप्त हुआ है, जिसकी स्वीकृति इसी कार्यालय के क्षेत्राधिकार में निहित है।`);
      } else if (pctNum > 100 && pctNum <= 105) {
        pts.push(`${n++}. जिसका डेविएशन स्टेटमेंट भी स्वीकृति हेतु प्राप्त हुआ है, OVERALL EXCESS वर्क आर्डर राशि के 5% से कम या बराबर है जिसकी स्वीकृति इसी कार्यालय के क्षेत्राधिकार में निहित है।`);
      } else if (pctNum > 105) {
        pts.push(`${n++}. जिसका डेविएशन स्टेटमेंट भी स्वीकृति हेतु प्राप्त हुआ है, OVERALL EXCESS वर्क आर्डर राशि के 5% से अधिक है जिसकी स्वीकृति Superintending Engineer, ${form.officeName} कार्यालय के क्षेत्राधिकार में निहित है।`);
      }
    }

    if (delayDays > 0) {
      pts.push(`${n++}. कार्य में ${delayDays} दिन की देरी हुई है।`);
      if (scheduleDuration > 0 && delayDays > scheduleDuration / 2) {
        pts.push(`${n++}. टाइम एक्सटेंशन केस Superintending Engineer, ${form.officeName} कार्यालय द्वारा अनुमोदित किया जाना है।`);
      } else {
        pts.push(`${n++}. टाइम एक्सटेंशन केस इस कार्यालय द्वारा अनुमोदित किया जाना है।`);
      }
    } else {
      pts.push(`${n++}. कार्य समय पर संपादित हुआ है।`);
    }

    if (showExtraItem) {
      if (extraExceeds5) {
        pts.push(`${n++}. कार्य सम्पादन में केवल Rs. ${extraAmt.toLocaleString("en-IN")} के अतिरिक्त आइटम सम्पादित किये गये हैं जिसकी राशि वर्क आर्डर राशि की ${extraPct}% होकर 5% से अधिक है जिसकी स्वीकृति Superintending Engineer, ${form.officeName} कार्यालय के क्षेत्राधिकार में है।`);
      } else {
        pts.push(`${n++}. कार्य सम्पादन में केवल Rs. ${extraAmt.toLocaleString("en-IN")} के अतिरिक्त आइटम सम्पादित किये गये हैं जिसकी राशि वर्क आर्डर राशि की ${extraPct}% होकर 5% से कम या बराबर है जिसकी स्वीकृति इस कार्यालय के क्षेत्राधिकार में है।`);
      }
    }

    if (form.hasExcessItem === "Yes" && showExcessNote) {
      if (!isFinal) {
        if (pctNum > 100 && pctNum <= 105) {
          const ep = (pctNum - 100).toFixed(2);
          pts.push(`${n++}. कार्य संपादन में वर्क आर्डर के जिन आइटम्स में EXCESS QUANTITY संपादित की गई है, उनका विवरण संलग्न है। कार्य में OVERALL EXCESS केवल ${ep}% होकर 5% से कम या बराबर है, जिसकी स्वीकृति इस कार्यालय के क्षेत्राधिकार में है।`);
        } else if (pctNum > 105) {
          const ep = (pctNum - 100).toFixed(2);
          pts.push(`${n++}. कार्य संपादन में वर्क आर्डर के जिन आइटम्स में EXCESS QUANTITY संपादित की गई है, उनका विवरण संलग्न है। कार्य में OVERALL EXCESS ${ep}% होकर 5% से अधिक है, जिसकी स्वीकृति Superintending Engineer, ${form.officeName} कार्यालय के क्षेत्राधिकार में है।`);
        }
      } else {
        if (pctNum < 90) {
          pts.push(`${n++}. कार्य संपादन में वर्क आर्डर के जिन आइटम्स में EXCESS QUANTITY संपादित की गई है, उनका विवरण संलग्न है। कार्य में saving है (अर्थात Overall Excess = NIL), जिसकी स्वीकृति इस कार्यालय के क्षेत्राधिकार में है।`);
        } else if (pctNum > 100 && pctNum <= 105) {
          const ep = (pctNum - 100).toFixed(2);
          pts.push(`${n++}. कार्य संपादन में वर्क आर्डर के जिन आइटम्स में EXCESS QUANTITY संपादित की गई है, उनका विवरण संलग्न है। कार्य में OVERALL EXCESS केवल ${ep}% होकर 5% से कम या बराबर है, जिसकी स्वीकृति इस कार्यालय के क्षेत्राधिकार में है।`);
        } else if (pctNum > 105) {
          const ep = (pctNum - 100).toFixed(2);
          pts.push(`${n++}. कार्य संपादन में वर्क आर्डर के जिन आइटम्स में EXCESS QUANTITY संपादित की गई है, उनका विवरण संलग्न है। कार्य में OVERALL EXCESS ${ep}% होकर 5% से अधिक है, जिसकी स्वीकृति Superintending Engineer, ${form.officeName} कार्यालय के क्षेत्राधिकार में है।`);
        }
      }
    }

    pts.push(`${n++}. गुणवत्ता नियंत्रण (Q.C.) परीक्षण रिपोर्ट संलग्न हैं।`);

    if (lateSubmission) {
      pts.push(`${n++}. कार्य समाप्ति के करीब 6 महीने बाद फाइनल बिल इस कार्यालय में प्रस्तुत किया गया है। इस अप्रत्याशित देरी के लिए सहायक अभियंता से स्पष्टीकरण मांगा जाए ऐसी प्रस्तावना है।`);
    }

    pts.push(`${n++}. बिल समुचित निर्णय हेतु प्रस्तुत है।`);

    return pts;
  }

  const notePoints = generateNotePoints();

  const outputRows: [string, string][] = [
    ["1. Budget Head", form.budgetHead || "---"],
    ["2. Agreement No.", form.agreementNo || "---"],
    ["3. MB No. & Page", form.mbNo || "---"],
    ["4. Name of Sub Division", effectiveSubDivision || "---"],
    ["5. Name of Work", form.nameOfWork || "---"],
    ["6. Name of Contractor", effectiveContractor || "---"],
    ["7. Original / Deposit", form.originalOrDeposit],
    ["8. Date of Commencement", formatDDMMYYYY(form.dateOfCommencement)],
    ["9. Date of Completion (Scheduled)", formatDDMMYYYY(form.dateOfCompletion)],
    ["10. Actual Date of Completion", isFinal ? formatDDMMYYYY(form.actualDateOfCompletion) : "Work In Progress"],
    ["11. Total Amount of Work Order", `Rs. ${workOrderAmt.toLocaleString("en-IN")}`],
    ["12A. Sum of payment up to last bill", `Rs. ${lastBillAmt.toLocaleString("en-IN")}`],
    ["12B. Amount of this bill", `Rs. ${thisBillAmt.toLocaleString("en-IN")}`],
    ["12C. Actual expenditure up to this bill (A+B)", `Rs. ${actualExpenditure.toLocaleString("en-IN")}`],
    ["13. Balance to be done = (11 − 12C)", balanceDisplay],
    ["14. Prorata Progress on the Work", "Evident from para 10 and 12 above."],
    ["15. Date of record Measurement (JEN/AEN)", formatDDMMYYYY(form.dateOfMeasurement)],
    ["16. Date of Checking & % checked by AEN", checkingDateAEN ? formatDDMMYYYY(checkingDateAEN) : "---"],
    ["17. Work wise chargeable amount", "Detailed below."],
    ["18. (A) Is it a Repair / Maintenance Work", form.isRepairMaintenance],
    ...(form.hasExtraItem === "Yes" && extraAmt > 0 ? [
      ["(B) Extra Item", "Yes"],
      ["    Amount of Extra Items", `Rs. ${extraAmt.toLocaleString("en-IN")}`],
    ] as [string, string][] : [
      ["(B) Extra Item", "No"],
    ] as [string, string][]),
    ...(form.selectionItemsCheckedEE ? [["19. No. of selection items checked by EE", form.selectionItemsCheckedEE] as [string, string]] : []),
    ...(form.otherInputs ? [["20. Other Inputs", form.otherInputs] as [string, string]] : []),
  ];

  const baseDeductionRows: [string, string][] = [
    ["Income Tax (8658-00-112-00-00)", `Rs. ${it2.toLocaleString("en-IN")}`],
    ["GSTIN Deduction (8658-00-139-00-00)", `Rs. ${gst2.toLocaleString("en-IN")}`],
    ...(dfmt > 0 ? [["PD Account (DMFT) 8342 (8342-00-120-65-00)", `Rs. ${dfmt.toLocaleString("en-IN")}`] as [string, string]] : []),
    ["Labour Welfare (0230-00-800-06-00)", `Rs. ${lc1.toLocaleString("en-IN")}`],
    ...(miningRoyalty > 0 ? [["Mines & Minerals / Royalty (0853-00-102-01-01)", `Rs. ${miningRoyalty.toLocaleString("en-IN")}`] as [string, string]] : []),
    ["Deposit-II (SD2) (8443) (8443-00-108-00-00)", `Rs. ${sd10.toLocaleString("en-IN")}`],
    ...(depV > 0 ? [["(M.D.)Deposit-Vth (MD5) (8443) (8443-00-108-00-00)", `Rs. ${depV.toLocaleString("en-IN")}`] as [string, string]] : []),
    ["Cheque / Amount", `${chequeAmount.toLocaleString("en-IN")}`],
    ["Total", `${totalCheck.toLocaleString("en-IN")}`],
  ];

  const deductionRows: [string, string][] = isSpeedMoney
    ? [
      ["Cheque / Amount", `Rs. ${chequeAmount.toLocaleString("en-IN")}`],
      ["Total", `Rs. ${totalCheck.toLocaleString("en-IN")}`],
      ["Speed Money (0.20% of Cheque, rounded to ₹100)", `Rs. ${speedMoneyAmt.toLocaleString("en-IN")}`],
    ]
    : baseDeductionRows;

  function getPdfFilename(): string {
    const contractorFirstWord = (effectiveContractor || "Contractor")
      .replace(/^M\/s\.\s*/i, "")
      .split(/\s+/)[0] || "Contractor";
    const agNo = form.agreementNo || "Agr";
    const fy = getFY(form.dateOfCommencement || todayStr);
    return `${contractorFirstWord} ${agNo} ${fy}.pdf`;
  }

  function handlePrint() {
    if (isSpeedMoney) saveRecentInput();
    const html = isSpeedMoney
      ? buildDeductionsPrintHtml("SPEED MONEY CALCULATION", deductionRows, getPdfFilename())
      : buildPrintHtml(billTitle, outputRows, deductionRows, notePoints, form.signatoryName, getPdfFilename(), form.headWiseBifurcation, thisBillAmt);
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
    <ToolShell title="Bill Form">
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
        @keyframes flameDance {
          0%,100% { transform: scaleX(1) scaleY(1) rotate(-2deg); opacity: 1; }
          50%      { transform: scaleX(0.85) scaleY(1.15) rotate(2deg); opacity: 0.85; }
        }
        @keyframes pulse-gold {
          0%,100% { box-shadow: 0 0 0 0 rgba(255,180,0,0.35); }
          50%      { box-shadow: 0 0 0 8px rgba(255,180,0,0); }
        }
        .navratri-section {
          background: linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%);
          border: 1.5px solid #e6a817;
          border-radius: 14px;
          padding: 16px;
          margin-bottom: 16px;
          box-shadow: 0 2px 12px rgba(200,130,0,0.10);
        }
        .navratri-section h3 {
          color: #7B2D00;
          border-color: #e6a817;
          font-weight: 700;
        }
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
          font-family: 'Mangal','Nirmala UI','Noto Sans Devanagari',sans-serif;
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
          font-family: 'Mangal','Nirmala UI','Noto Sans Devanagari',sans-serif;
        }
        .rangoli-divider {
          text-align: center;
          color: #e6a817;
          font-size: 1.1rem;
          letter-spacing: 0.3em;
          margin: 4px 0;
          opacity: 0.8;
        }
      `}</style>

        <div style={{ fontFamily: "'Mangal','Nirmala UI','Noto Sans Devanagari',sans-serif", minHeight: "100vh", background: "linear-gradient(160deg, #fff8e1 0%, #fff3e0 40%, #fce4ec 100%)" }}>

          {/* NAVRATRI HEADER */}
          <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #7B0D00 0%, #c0392b 25%, #e67e22 50%, #c0392b 75%, #7B0D00 100%)", backgroundSize: "300% auto", animation: "shimmer 8s linear infinite", borderBottom: "4px solid #FFD700" }}>
            <Diyas />
            <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "10px 20px 6px" }}>
              <div style={{ color: "#FFD700", fontWeight: 900, fontSize: "1.25rem", textShadow: "0 0 12px rgba(255,215,0,0.8), 0 2px 6px rgba(0,0,0,0.5)" }}>
                {isSpeedMoney ? "🪔 SPEED MONEY TOOL 🪔" : "🪔 हिंदी बिल नोट शीट जनरेटर 🪔"}
              </div>
              <div style={{ color: "#FFEAA7", fontWeight: 500, fontSize: "0.78rem", marginTop: "2px" }}>
                {isSpeedMoney
                  ? "Deduction Table Only Output &nbsp;✦&nbsp; Last 10 inputs saved"
                  : "Hindi Bill Note Sheet Generator &nbsp;✦&nbsp; नवरात्रि की शुभकामनाएं"}
              </div>
            </div>
            {/* Rangoli border strip */}
            <div style={{ background: "linear-gradient(90deg, #FFD700, #FF8C00, #FFD700)", height: "3px" }} />
          </div>

          <div className="flex flex-col lg:flex-row gap-4 p-4 max-w-[1400px] mx-auto">

            {/* INPUT FORM */}
            <div className="lg:w-1/2 flex flex-col">
              <div style={{ background: "linear-gradient(135deg, #7B0D00, #c0392b, #e67e22)", border: "2px solid #FFD700", borderRadius: "14px", padding: "12px 16px", marginBottom: "16px", boxShadow: "0 4px 20px rgba(200,80,0,0.25)" }}>
                <h2 className="font-bold text-sm" style={{ color: "#FFD700", textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>
                  {isSpeedMoney ? "✦ Input Form — Speed Money Details ✦" : "✦ इनपुट फॉर्म / Input Form — Bill Details ✦"}
                </h2>
                <p className="text-xs mt-1" style={{ color: "#FFEAA7" }}>
                  {isSpeedMoney
                    ? "Fill details, then print the deduction table. Latest 10 inputs stay available below."
                    : "विवरण भरें, नोट शीट स्वतः अपडेट होगी / Fill details, note sheet updates automatically"}
                </p>
              </div>

              {isSpeedMoney && (
                <div className={sectionCls}>
                  <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ color: "#880e4f", borderColor: "#f48fb1" }}>Recent Inputs (Last 10)</h3>
                  {recentInputs.length === 0 ? (
                    <p className="text-xs text-gray-600">No saved input data yet. It will appear here after you print or save the deduction table.</p>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {recentInputs.map((entry) => (
                        <div key={entry.id} className="rounded-lg border border-orange-200 bg-white/80 p-2">
                          <div className="text-xs font-semibold text-[#7B2D00]">{entry.label}</div>
                          <div className="text-[11px] text-gray-500 mt-1">{entry.savedAt}</div>
                          <div className="flex gap-2 mt-2">
                            <button
                              type="button"
                              onClick={() => loadRecentInput(entry)}
                              className="rounded px-3 py-1 text-xs font-bold"
                              style={{ background: "#fff3e0", color: "#7B2D00", border: "1px solid #e6a817" }}
                            >
                              Load
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteRecentInput(entry.id)}
                              className="rounded px-3 py-1 text-xs font-bold"
                              style={{ background: "#fff5f5", color: "#c0392b", border: "1px solid #f0a0a0" }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Bill Number & Type */}
              {!isSpeedMoney && (
                <div className={sectionCls}>
                  <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ color: "#880e4f", borderColor: "#f48fb1" }}>बिल पहचान / Bill Identity</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>बिल क्रमांक / Bill Number</label>
                      <select className={inputCls} value={form.billNumber} onChange={e => setField("billNumber", parseInt(e.target.value))}>
                        {ORDINALS.map((o, i) => <option key={i} value={i + 1}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>बिल प्रकार / Bill Type</label>
                      <select className={inputCls} value={form.billType} onChange={e => setField("billType", e.target.value as BillType)}>
                        <option value="Running">Running</option>
                        <option value="Final">Final</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-2 p-2 rounded text-center font-bold text-xs" style={{ background: "linear-gradient(90deg,#7B0D00,#c0392b,#e67e22,#c0392b,#7B0D00)", color: "#FFD700", border: "2px solid #FFD700", letterSpacing: "0.05em", textShadow: "0 1px 3px rgba(0,0,0,0.4)" }}>
                    {billTitle}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              {!isSpeedMoney && (
                <div className={sectionCls}>
                  <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ color: "#880e4f", borderColor: "#f48fb1" }}>मूल जानकारी / Basic Information</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>1. बजट शीर्ष / Budget Head</label>
                        <input className={inputCls} value={form.budgetHead} onChange={set("budgetHead")} />
                      </div>
                      <div>
                        <label className={labelCls}>2. अनुबंध संख्या / Agreement No.</label>
                        <input className={inputCls} value={form.agreementNo} onChange={set("agreementNo")} placeholder="e.g. 62/2024-25" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>3. एम.बी. संख्या व पृष्ठ / MB No. & Page</label>
                        <input className={inputCls} value={form.mbNo} onChange={set("mbNo")} placeholder="e.g. 813/Page 84-85" />
                      </div>
                      <div>
                        <label className={labelCls}>4. उप-खंड / Sub Division</label>
                        <select className={inputCls} value={form.subDivision} onChange={set("subDivision")}>
                          {SUB_DIVISIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          <option value="__custom__">Other (type below)</option>
                        </select>
                        {form.subDivision === "__custom__" && (
                          <input className={inputCls + " mt-1"} value={form.subDivisionCustom} onChange={set("subDivisionCustom")} placeholder="Enter sub division name" />
                        )}
                      </div>
                    </div>
                    <div>
                      <label className={labelCls}>5. कार्य का नाम / Name of Work</label>
                      <textarea className={inputCls} rows={2} value={form.nameOfWork} onChange={set("nameOfWork")} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelCls}>6. ठेकेदार / Contractor</label>
                        <input
                          className={inputCls}
                          value={form.contractorSearch !== "" ? form.contractorSearch : (form.nameOfContractor && form.nameOfContractor !== "Contractor [collapse]" ? form.nameOfContractor : "")}
                          onChange={(e) => {
                            const val = e.target.value;
                            setField("contractorSearch", val);
                            const exactMatch = CONTRACTORS.find(c => c.toLowerCase() === val.toLowerCase());
                            if (exactMatch) {
                              setField("nameOfContractor", exactMatch);
                            } else if (val === "") {
                              setField("nameOfContractor", CONTRACTORS[0]);
                            }
                          }}
                          onFocus={() => setField("contractorSearch", "")}
                          onBlur={() => setField("contractorSearch", "")}
                          placeholder="Type to search contractors..."
                          list="contractor-list"
                        />
                        <datalist id="contractor-list">
                          {CONTRACTORS
                            .filter(c => {
                              const search = (form.contractorSearch || "").toLowerCase();
                              return search === "" || c.toLowerCase().includes(search);
                            })
                            .map(c => <option key={c} value={c}>{c}</option>)
                          }
                          <option value="__custom__">Other (type custom name)</option>
                        </datalist>
                        {form.contractorSearch && form.contractorSearch !== form.nameOfContractor && !CONTRACTORS.includes(form.contractorSearch) && (
                          <div className="mt-1 max-h-32 overflow-y-auto border border-orange-300 rounded bg-white shadow-lg">
                            {CONTRACTORS
                              .filter(c => c.toLowerCase().includes(form.contractorSearch.toLowerCase()))
                              .slice(0, 10)
                              .map(c => (
                                <div
                                  key={c}
                                  className="px-2 py-1 text-xs cursor-pointer hover:bg-orange-100"
                                  onClick={() => {
                                    setField("nameOfContractor", c);
                                    setField("contractorSearch", "");
                                  }}
                                >
                                  {c}
                                </div>
                              ))
                            }
                          </div>
                        )}
                        {form.nameOfContractor === "__custom__" && (
                          <input className={inputCls + " mt-1"} value={form.nameOfContractorCustom} onChange={set("nameOfContractorCustom")} placeholder="M/s. Name, Town" />
                        )}
                      </div>
                      <div>
                        <label className={labelCls}>7. मूल / जमा / Original / Deposit</label>
                        <select className={inputCls} value={form.originalOrDeposit} onChange={set("originalOrDeposit")}>
                          <option>Original</option>
                          <option>Deposit</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Dates & Amounts */}
              <div className={sectionCls}>
                <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ color: "#880e4f", borderColor: "#f48fb1" }}>
                  {isSpeedMoney ? "राशि / Amount" : (<>तिथियाँ व राशि / Dates & Amounts <span className="font-normal text-xs">(DD/MM/YYYY)</span></>)}
                </h3>
                {isSpeedMoney ? (
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className={labelCls}>बिल राशि / Amount of This Bill (₹)</label>
                      <input type="number" className={inputCls} value={form.amountThisBill} onChange={set("amountThisBill")} placeholder="0" />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelCls}>8. प्रारंभ तिथि / Date of Commencement</label>
                        <input className={inputCls} value={form.dateOfCommencement} onChange={setDate("dateOfCommencement")} placeholder="DDMMYYYY" maxLength={10} />
                      </div>
                      <div>
                        <label className={labelCls}>9. पूर्णता तिथि (निर्धारित) / Date of Completion (Scheduled)</label>
                        <input className={inputCls} value={form.dateOfCompletion} onChange={setDate("dateOfCompletion")} placeholder="DDMMYYYY" maxLength={10} />
                      </div>
                      {isFinal && (
                        <div>
                          <label className={labelCls}>10. वास्तविक पूर्णता तिथि / Actual Completion Date</label>
                          <input className={inputCls} value={form.actualDateOfCompletion} onChange={setDate("actualDateOfCompletion")} placeholder="DDMMYYYY" maxLength={10} />
                        </div>
                      )}
                      <div>
                        <label className={labelCls}>11. कुल कार्यादेश राशि / Total Work Order Amount (₹)</label>
                        <input type="number" className={inputCls} value={form.totalWorkOrderAmount} onChange={set("totalWorkOrderAmount")} placeholder="0" />
                      </div>
                      <div>
                        <label className={labelCls}>12A. पिछले बिल तक भुगतान / Payment Upto Last Bill (₹)</label>
                        <input type="number" className={inputCls} value={form.sumPaymentLastBill} onChange={set("sumPaymentLastBill")} placeholder="0" />
                      </div>
                      <div>
                        <label className={labelCls}>12B. इस बिल की राशि / Amount of This Bill (₹)</label>
                        <input type="number" className={inputCls} value={form.amountThisBill} onChange={set("amountThisBill")} placeholder="0" />
                      </div>
                      <div>
                        <label className={labelCls}>15. माप तिथि / Date of Measurement</label>
                        <input className={inputCls} value={form.dateOfMeasurement} onChange={setDate("dateOfMeasurement")} placeholder="DDMMYYYY" maxLength={10} />
                      </div>
                    </div>
                    {isFinal && lateSubmission && (
                      <div className="mt-2 p-2 rounded text-xs font-bold text-red-700 bg-red-50 border border-red-200">
                        ⚠️ आज की तिथि में कार्य पूर्णता के {daysSinceCompletion} दिन हो चुके हैं — फाइनल बिल देरी नोट जुड़ेगा।
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Conditions */}
              {!isSpeedMoney && (
                <div className={sectionCls}>
                  <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ color: "#880e4f", borderColor: "#f48fb1" }}>शर्तें / Conditions & Flags</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>(A) मरम्मत/रखरखाव कार्य? / Repair/Maintenance?</label>
                      <select className={inputCls} value={form.isRepairMaintenance} onChange={set("isRepairMaintenance")}>
                        <option>Yes</option><option>No</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>(B) अतिरिक्त मद? / Extra Item Executed?</label>
                      <select className={inputCls} value={form.hasExtraItem} onChange={set("hasExtraItem")}>
                        <option>Yes</option><option>No</option>
                      </select>
                    </div>
                    {form.hasExtraItem === "Yes" && (
                      <div className="col-span-2">
                        <label className={labelCls}>अतिरिक्त मद राशि / Extra Items Amount (₹) <span className="font-normal text-gray-500">(0 = नोट नहीं / no note)</span></label>
                        <input type="number" className={inputCls} value={form.extraItemAmount} onChange={set("extraItemAmount")} placeholder="0" />
                        {extraAmt > 0 && (
                          <p className={`text-xs mt-1 font-semibold ${extraExceeds5 ? "text-red-600" : "text-green-700"}`}>
                            {extraPct}% — {extraExceeds5 ? "⚠️ >5%: SE approval needed" : "✓ ≤5%: Approved"}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Deductions */}
              <div className={sectionCls}>
                <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ color: "#880e4f", borderColor: "#f48fb1" }}>कटौतियाँ / Deductions</h3>
                <div className="grid grid-cols-1 gap-3">
                  <p className="text-xs text-gray-500">SD(10%), IT(2%), GST(2%), LC(1%) — स्वचालित / auto-calculated.</p>
                  <div>
                    <label className={labelCls}>Mining Royalty / खनन रॉयल्टी — विकल्प चुनें</label>
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
                          <button
                            key={opt}
                            type="button"
                            onClick={() => setField("miningRoyaltyOption", opt)}
                            style={{
                              flex: 1,
                              padding: "8px 4px",
                              borderRadius: "10px",
                              border: `2px solid ${m.border}`,
                              background: m.bg,
                              color: m.color,
                              fontWeight: active ? 800 : 600,
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              textAlign: "center",
                              boxShadow: active ? `0 0 0 3px ${m.border}55` : "none",
                              transition: "all 0.15s",
                              lineHeight: 1.4,
                            }}
                          >
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
              </div>

              {/* Head-wise Bifurcation */}
              {!isSpeedMoney && (
                <div className={sectionCls}>
                  <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ color: "#880e4f", borderColor: "#f48fb1" }}>मद वार विभाजन / Head-wise Bifurcation</h3>
                  <div className="grid grid-cols-2 gap-3 items-start">
                    <div>
                      <label className={labelCls}>क्या मद वार विभाजन आवश्यक है? / Head-wise Bifurcation Needed?</label>
                      <select className={inputCls} value={form.headWiseBifurcation} onChange={set("headWiseBifurcation")}>
                        <option value="No">No</option>
                        <option value="Yes">Yes</option>
                      </select>
                    </div>
                    {form.headWiseBifurcation === "Yes" && thisBillAmt > 0 && (
                      <div className="col-span-2">
                        <div className="rounded-lg p-2 text-xs font-semibold" style={{ background: "#fff8e1", border: "1.5px solid #e6a817", color: "#7B2D00" }}>
                          <div className="mb-1 font-bold" style={{ color: "#880e4f" }}>Present Bill Amount: ₹{thisBillAmt.toLocaleString("en-IN")}</div>
                          <div>5054 — 337 (70%) = ₹{Math.round(thisBillAmt * 0.70).toLocaleString("en-IN")}</div>
                          <div>5054 — 789 (17%) = ₹{Math.round(thisBillAmt * 0.17).toLocaleString("en-IN")}</div>
                          <div>5054 — 796 (13%) = ₹{Math.round(thisBillAmt * 0.13).toLocaleString("en-IN")}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Other Details */}
              {!isSpeedMoney && (
                <div className={sectionCls}>
                  <h3 className="font-bold text-sm mb-3 border-b pb-1" style={{ color: "#880e4f", borderColor: "#f48fb1" }}>अन्य विवरण / Other Details</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className={labelCls}>हस्ताक्षरकर्ता / Signatory Name</label>
                      <input className={inputCls} value={form.signatoryName} onChange={set("signatoryName")} />
                    </div>
                    <div>
                      <label className={labelCls}>कार्यालय नाम / Office Name</label>
                      <input className={inputCls} value={form.officeName} onChange={set("officeName")} />
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={handlePrint}
                className="w-full font-bold py-3 rounded-xl text-sm transition-all mb-6 shadow-lg"
                style={{ background: "linear-gradient(90deg, #880e4f, #e91e63, #880e4f)", backgroundSize: "200% auto", color: "#fff", animation: "shimmer 3s linear infinite", border: "none", cursor: "pointer" }}
              >
                {isSpeedMoney
                  ? `🖨️ Print Deduction Table / Save PDF — ${getPdfFilename()}`
                  : `🖨️ Print Note Sheet / Save PDF — ${getPdfFilename()}`}
              </button>
            </div>

            {/* LIVE PREVIEW */}
            <div className="lg:w-1/2">
              <div className="rounded-xl p-3 mb-4" style={{ background: "linear-gradient(135deg, #fce4ec, #f8bbd0)", border: "1px solid #f48fb1" }}>
                <h2 className="font-bold text-sm" style={{ color: "#880e4f" }}>
                  {isSpeedMoney ? "👁 Live Preview — Deduction Table Output" : "👁 Live Preview — Note Sheet Output"}
                </h2>
                <p className="text-xs mt-1" style={{ color: "#c2185b" }}>
                  {isSpeedMoney
                    ? "Only the deduction table will print on A4."
                    : "Exactly what will print on A4 with 10 mm margins."}
                </p>
              </div>
              {isSpeedMoney ? (
                <DeductionsOnlyTable billTitle="SPEED MONEY CALCULATION" deductionRows={deductionRows} />
              ) : (
                <NoteSheetTable
                  billTitle={billTitle}
                  outputRows={outputRows}
                  deductionRows={deductionRows}
                  notePoints={notePoints}
                  signatoryName={form.signatoryName}
                  headWiseBifurcation={form.headWiseBifurcation}
                  thisBillAmt={thisBillAmt}
                />
              )}
            </div>
          </div>
        </div>
      </>
    </ToolShell>
  );
}

interface TableProps {
  billTitle: string;
  outputRows: [string, string][];
  deductionRows: [string, string][];
  notePoints: string[];
  signatoryName: string;
  headWiseBifurcation?: YesNo;
  thisBillAmt?: number;
}

function NoteSheetTable({ billTitle, outputRows, deductionRows, notePoints, signatoryName, headWiseBifurcation, thisBillAmt }: TableProps) {
  const tdL = "border border-gray-500 px-2 py-1 font-semibold bg-gray-50 w-1/2 align-top text-xs";
  const tdR = "border border-gray-500 px-2 py-1 w-1/2 align-top text-xs";

  return (
    <div className="bg-white border border-gray-400 text-black text-xs overflow-auto" style={{ fontFamily: "'Mangal','Nirmala UI','Noto Sans Devanagari',sans-serif" }}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <td colSpan={2} className="border border-gray-500 text-center font-bold py-2 text-sm" style={{ background: "#fce4ec", color: "#880e4f" }}>
              {billTitle}
            </td>
          </tr>
        </thead>
        <tbody>
          {outputRows.map(([label, value], i) => (
            <tr key={i}>
              <td className={tdL}>{label}</td>
              <td className={tdR}>{value}</td>
            </tr>
          ))}
          <tr>
            <td colSpan={2} className="border border-gray-500 px-2 py-1 font-bold bg-gray-100 text-xs">
              Deductions:- &nbsp; Rs.
            </td>
          </tr>
          {deductionRows.map(([label, value], i) => (
            <tr key={i}>
              <td className={tdL + " pl-6"}>{label}</td>
              <td className={tdR}>{value}</td>
            </tr>
          ))}
          {headWiseBifurcation === "Yes" && thisBillAmt && thisBillAmt > 0 && (
            <>
              <tr>
                <td colSpan={2} className="border border-gray-500 px-2 py-1 font-bold bg-yellow-50 text-xs" style={{ color: "#7B2D00", borderTop: "2px solid #e6a817" }}>
                  मद वार विभाजन / Head-wise Bifurcation — Head 5054 (Present Bill Amount: Rs. {thisBillAmt.toLocaleString("en-IN")})
                </td>
              </tr>
              <tr>
                <td className={tdL + " pl-6"}>5054 — 337 (70%)</td>
                <td className={tdR}>Rs. {Math.round(thisBillAmt * 0.70).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td className={tdL + " pl-6"}>5054 — 789 (17%)</td>
                <td className={tdR}>Rs. {Math.round(thisBillAmt * 0.17).toLocaleString("en-IN")}</td>
              </tr>
              <tr>
                <td className={tdL + " pl-6"}>5054 — 796 (13%)</td>
                <td className={tdR}>Rs. {Math.round(thisBillAmt * 0.13).toLocaleString("en-IN")}</td>
              </tr>
            </>
          )}
        </tbody>
      </table>

      <div className="border-t border-gray-500 p-3">
        <ol className="list-none space-y-1 text-xs leading-relaxed">
          {notePoints.map((pt, i) => <li key={i}>{pt}</li>)}
        </ol>
        <div className="mt-4 text-center text-xs font-semibold">
          {signatoryName}
        </div>
      </div>
    </div>
  );
}

function DeductionsOnlyTable({ billTitle, deductionRows }: Pick<TableProps, "billTitle" | "deductionRows">) {
  const tdL = "border border-gray-500 px-2 py-1 font-semibold bg-gray-50 w-1/2 align-top text-xs";
  const tdR = "border border-gray-500 px-2 py-1 w-1/2 align-top text-xs";

  return (
    <div className="bg-white border border-gray-400 text-black text-xs overflow-auto" style={{ fontFamily: "'Mangal','Nirmala UI','Noto Sans Devanagari',sans-serif" }}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <td colSpan={2} className="border border-gray-500 text-center font-bold py-2 text-sm" style={{ background: "#fce4ec", color: "#880e4f" }}>
              {billTitle}
            </td>
          </tr>
        </thead>
        <tbody>
          {deductionRows.map(([label, value], i) => (
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

function buildPrintHtml(
  billTitle: string,
  outputRows: [string, string][],
  deductionRows: [string, string][],
  notePoints: string[],
  signatoryName: string,
  filename: string,
  headWiseBifurcation?: YesNo,
  thisBillAmt?: number,
): string {
  const totalItems = outputRows.length + deductionRows.length + notePoints.length;
  const baseFontPt = totalItems <= 30 ? 9 : totalItems <= 40 ? 8 : totalItems <= 55 ? 7.5 : 7;
  const cellPad = totalItems <= 35 ? "3px 6px" : totalItems <= 50 ? "2px 5px" : "1px 4px";

  const rowsHtml = outputRows
    .map(([l, v]) => `<tr><td class="l">${l}</td><td class="r">${v}</td></tr>`)
    .join("");
  const dedHtml = deductionRows
    .map(([l, v]) => `<tr><td class="l" style="padding-left:1.5em">${l}</td><td class="r">${v}</td></tr>`)
    .join("");
  const bifurcationHtml = (headWiseBifurcation === "Yes" && thisBillAmt && thisBillAmt > 0)
    ? `<tr><td colspan="2" class="dh" style="color:#7B2D00;background:#fffde7;border-top:2px solid #e6a817;">मद वार विभाजन / Head-wise Bifurcation &mdash; Head 5054 &nbsp;(Present Bill Amount: Rs. ${thisBillAmt.toLocaleString("en-IN")})</td></tr>` +
    `<tr><td class="l" style="padding-left:1.5em">5054 &mdash; 337 (70%)</td><td class="r">Rs. ${Math.round(thisBillAmt * 0.70).toLocaleString("en-IN")}</td></tr>` +
    `<tr><td class="l" style="padding-left:1.5em">5054 &mdash; 789 (17%)</td><td class="r">Rs. ${Math.round(thisBillAmt * 0.17).toLocaleString("en-IN")}</td></tr>` +
    `<tr><td class="l" style="padding-left:1.5em">5054 &mdash; 796 (13%)</td><td class="r">Rs. ${Math.round(thisBillAmt * 0.13).toLocaleString("en-IN")}</td></tr>`
    : "";
  const notesHtml = notePoints.map(pt => `<li>${pt}</li>`).join("");

  return `<!DOCTYPE html>
<html lang="hi">
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
  body { padding: 10mm; font-family:'Mangal','Nirmala UI','Noto Sans Devanagari',sans-serif; font-size:${baseFontPt}pt; color:#000; background:#fff; }
  table { width:100%; border-collapse:collapse; }
  td { border:1px solid #555; padding:${cellPad}; vertical-align:top; }
  .h  { text-align:center; font-weight:700; font-size:${baseFontPt + 1}pt; background:#fce4ec; color:#880e4f; padding:4px; }
  .l  { font-weight:600; background:#f5f5f5; width:50%; }
  .r  { width:50%; }
  .dh { font-weight:700; background:#ebebeb; }
  .note-section { border:1px solid #555; border-top:none; padding:6px 8px; }
  ol { list-style:none; padding:0; }
  li { margin-bottom:${totalItems <= 35 ? 3 : 2}px; line-height:${totalItems <= 40 ? 1.6 : 1.4}; }
  .sig { text-align:center; font-weight:600; margin-top:12px; }
</style>
</head>
<body>
<table>
  <tr><td colspan="2" class="h">${billTitle}</td></tr>
  ${rowsHtml}
  <tr><td colspan="2" class="dh">Deductions:- &nbsp; Rs.</td></tr>
  ${dedHtml}
  ${bifurcationHtml}
</table>
<div class="note-section">
  <ol>${notesHtml}</ol>
  <div class="sig">${signatoryName}</div>
</div>
</body>
</html>`;
}

function buildDeductionsPrintHtml(
  billTitle: string,
  deductionRows: [string, string][],
  filename: string,
): string {
  const baseFontPt = deductionRows.length <= 10 ? 9 : 8;
  const dedHtml = deductionRows
    .map(([l, v]) => `<tr><td class="l" style="padding-left:1.5em">${l}</td><td class="r">${v}</td></tr>`)
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
  body { padding: 10mm; font-family:'Mangal','Nirmala UI','Noto Sans Devanagari',sans-serif; font-size:${baseFontPt}pt; color:#000; background:#fff; }
  table { width:100%; border-collapse:collapse; }
  td { border:1px solid #555; padding:4px 6px; vertical-align:top; }
  .h  { text-align:center; font-weight:700; font-size:${baseFontPt + 1}pt; background:#fce4ec; color:#880e4f; padding:4px; }
  .l  { font-weight:600; background:#f5f5f5; width:50%; }
  .r  { width:50%; }
  .dh { font-weight:700; background:#ebebeb; }
</style>
</head>
<body>
<table>
  <tr><td colspan="2" class="h">${billTitle}</td></tr>
  ${dedHtml}
</table>
</body>
</html>`;
}
