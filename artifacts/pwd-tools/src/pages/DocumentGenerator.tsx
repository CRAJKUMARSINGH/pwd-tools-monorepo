import ToolShell from '@/components/ToolShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { usePrintPage } from '@/lib/printPage';
import { FileDown, Printer, RefreshCw } from 'lucide-react';
import { useRef, useState } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────
type DocumentData = {
  // Office (fixed)
  officeName: string;
  departmentName: string;
  regNo: string;

  // Contractor (user fills)
  contractorName: string;
  address: string;
  panNo: string;
  gstNo: string;
  email: string;
  phone: string;
  copyCity: string;

  // Enlistment code — user enters just the serial number (e.g. "4")
  enlistmentSerial: string;  // raw user input, 1-2 digits
  fiscalYear: string;        // e.g. "2026-27"
  enlistmentFiscalYear: string; // optional; blank → falls back to fiscalYear

  // Table fields
  classOfEnlistment: string;
  statusOfEnlistment: string;
  statusOfFirm: string;
  partners: string;
  powerOfAttorney: string;
  tenderLimit: string;
  techPersonnel: string;
  // Security — broken into 3 parts
  securityType: 'BG' | 'FDR' | 'NSC';
  securityBankName: string;
  securityNumberDate: string;
  securityAmount: string;
  prevEnlistmentRef: string;
  taxClearance: string;

  // Footer
  signatureDate: string;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Strips a leading "M/s", "MS", "M/s." … so it is never duplicated. */
const stripMs = (v: string) => v.trim().replace(/^m\/?s\.?\s*/i, '');

/** "7" + "2026-27" → "D-07/26-27 (T)" */
function formatRegNo(serial: string, fiscalYear: string): string {
  const n = parseInt(serial.trim(), 10);
  if (isNaN(n)) return '';
  const [y1, y2] = fiscalYear.split('-');
  if (!y1 || !y2) return '';
  return `D-${String(n).padStart(2, '0')}/${y1.slice(2)}-${y2.slice(-2)} (T)`;
}

/** "7" + "2026-27" → "D-07(T) EE/PWD/DISTT II/UDR/2026-27" */
function formatEnlistmentCode(serial: string, fiscalYear: string): string {
  const n = parseInt(serial.trim(), 10);
  if (isNaN(n)) return '';
  return `D-${String(n).padStart(2, '0')}(T) EE/PWD/DISTT II/UDR/${fiscalYear}`;
}

/** Current fiscal year string (April-start) */
function currentFiscalYear(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 1-indexed
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(2)}`;
  } else {
    return `${year - 1}-${String(year).slice(2)}`;
  }
}

const defaultData: DocumentData = {
  officeName: 'OFFICE OF THE EXECUTIVE ENGINEER',
  departmentName: 'P.W.D. DISTT. DN. II UDAIPUR',
  regNo: '',

  contractorName: '',
  address: '',
  panNo: '',
  gstNo: '',
  email: '',
  phone: '',
  copyCity: 'UDAIPUR (RAJ.)',

  enlistmentSerial: '',
  fiscalYear: currentFiscalYear(),
  enlistmentFiscalYear: '',

  classOfEnlistment: '"D" Class for Civil Work',
  statusOfEnlistment: '(TEMPORARY) VALADITY FOR ONE YEAR',
  statusOfFirm: '............NA...........',
  partners: '............NA...........',
  powerOfAttorney: '............NA...........',
  tenderLimit: '"D" Class up to 30 Lacs',
  techPersonnel: '............NA...........',
  securityType: 'FDR',
  securityBankName: '',
  securityNumberDate: '',
  securityAmount: '75000',
  prevEnlistmentRef: '---------- / ------------',
  taxClearance: 'Shall be produced every year by the end of September month.',

  signatureDate: '',
};

type TableRowSpec = { no: string; label: string; value: string };

function buildSecurityString(d: DocumentData): string {
  const type = d.securityType;                       // BG | FDR | NSC
  const parts: string[] = [];
  if (d.securityAmount) parts.push(`${d.securityAmount}/-`);
  if (type) parts.push(`${type} NO`);
  if (d.securityNumberDate) parts.push(d.securityNumberDate);
  const line1 = parts.join(' ').trim();
  const line2 = d.securityBankName ? d.securityBankName.toUpperCase() : '';
  return [line1, line2].filter(Boolean).join('\n');
}

function getTableRows(d: DocumentData): TableRowSpec[] {
  const codeYear = d.enlistmentFiscalYear.trim() || d.fiscalYear;
  const enlistCode = formatEnlistmentCode(d.enlistmentSerial, codeYear);
  return [
    { no: '1', label: 'Name of Contract/Firm', value: `: M/s ${stripMs(d.contractorName)}` },
    { no: '', label: '(i) Full Address', value: `: ${d.address}` },
    { no: '', label: '(ii) E-Mail-ID', value: `: ${d.email}` },
    { no: '', label: '(iii) Phone Nos. Land Line Mobile', value: `: ${d.phone}` },
    { no: '2', label: 'Enlistment Code', value: `: ${enlistCode}` },
    { no: '3', label: 'Class of Enlistment', value: `: ${d.classOfEnlistment}` },
    { no: '4', label: 'Status of Enlistment', value: `: ${d.statusOfEnlistment}` },
    { no: '5', label: 'Status of Firm', value: `: ${d.statusOfFirm}` },
    { no: '6', label: 'Name of Partners /Directors/ Proprietors', value: `: ${d.partners}` },
    { no: '', label: 'Name of person holding the power of Attorney', value: `: ${d.powerOfAttorney}` },
    { no: '7', label: 'Extent up to Which qualified to tender', value: `: ${d.tenderLimit}` },
    { no: '8', label: 'Name of Technical Personal', value: `: ${d.techPersonnel}` },
    { no: '9', label: 'Security Deposited', value: `: ${buildSecurityString(d)}` },
    { no: '10', label: 'Ref. of previous enlistment', value: `: ${d.prevEnlistmentRef}` },
    { no: '11', label: 'Sales Tax Clearance Certificate', value: `: ${d.taxClearance}` },
  ];
}

function getCopyItems(d: DocumentData): string[] {
  return [
    'Add. Chief Engineer PWD Zone Udaipur.',
    'The Superintending Engineer P.W.D. City Circle Udaipur.',
    'Executive Engineer PWD City Dn /Distt. Dn-I Udaipur/ Dn- Kherwara/Slumber/Vallabhnagar/Kotra Distt.',
    `M/s ${stripMs(d.contractorName) || '[Contractor Name]'}, ${d.copyCity || '[City]'}`,
    'Cashier.',
  ];
}

// ─── Build standalone export HTML ────────────────────────────────────────────
function buildStandaloneHtml(d: DocumentData): string {
  const esc = (v: string) =>
    (v || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br/>');

  const regNoCode = formatRegNo(d.enlistmentSerial, d.fiscalYear);

  const rows = getTableRows(d)
    .map(
      (r) => `
      <tr>
        <td style="border:1px solid #000;padding:5px 6px;text-align:center;vertical-align:top;">${esc(r.no)}</td>
        <td style="border:1px solid #000;padding:5px 6px;vertical-align:top;">${esc(r.label)}</td>
        <td style="border:1px solid #000;padding:5px 6px;white-space:pre-wrap;vertical-align:top;">${esc(r.value)}</td>
      </tr>`
    )
    .join('');

  const copyHtml = getCopyItems(d)
    .map((item, i) => `${i + 1}) ${esc(item)}<br/>`)
    .join('');

  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta charset="utf-8"/>
<title>Contractor Enlistment Order</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
  /* Word has no browser chrome, so it needs a real page margin. */
  @page {
    size: A4 portrait;
    margin: 15mm;
  }
  body { font-family: 'Times New Roman', Times, serif; font-size: 12px; line-height: 1.35; color: #000; margin:0; padding: 0; }
  .wrap { max-width: 180mm; margin: 0 auto; }
  table { border-collapse: collapse; width: 100%; }
  .hdr-title { font-family: Arial, Helvetica, sans-serif; font-size:14px; font-weight:bold; text-transform:uppercase; }
  .doc-title { font-family: Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; text-decoration:underline; }
</style>
</head>
<body>
<div class="wrap contractor-output">
  <div style="text-align:left;margin-bottom:6px;">
    <div class="hdr-title">${esc(d.officeName)} ${esc(d.departmentName)}</div>
  </div>

  <div style="font-size:12px;margin-bottom:6px;">
    <span style="display:inline-block;width:30%;">NO.-</span><span>Date:- ${esc(d.signatureDate)}</span>
  </div>

  <table style="border:none;margin-bottom:18px;width:100%;">
    <tr>
      <td style="border:none;vertical-align:top;">
        <table style="border-collapse:collapse;font-size:11px;">
          <tr><td style="border:1px solid #000;padding:2px 6px;font-weight:bold;width:90px;">Reg. No.:</td><td style="border:1px solid #000;padding:2px 6px;font-family:monospace;width:150px;">${esc(regNoCode) || '&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;'}</td></tr>
          <tr><td style="border:1px solid #000;padding:2px 6px;font-weight:bold;">PAN No.:</td><td style="border:1px solid #000;padding:2px 6px;font-family:monospace;">${esc(d.panNo) || '&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;'}</td></tr>
          <tr><td style="border:1px solid #000;padding:2px 6px;font-weight:bold;">GST IN No.:</td><td style="border:1px solid #000;padding:2px 6px;font-family:monospace;">${esc(d.gstNo) || '&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;'}</td></tr>
          <tr><td style="border:1px solid #000;padding:2px 6px;font-weight:bold;">Mob No.:</td><td style="border:1px solid #000;padding:2px 6px;">${esc(d.phone) || '&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;&hellip;'}</td></tr>
        </table>
      </td>
      <td style="border:none;text-align:right;vertical-align:top;">
        <div style="display:inline-block;border:1px solid #000;width:30mm;height:28mm;"></div>
      </td>
    </tr>
  </table>

  <div style="text-align:center;margin-bottom:14px;">
    <span class="doc-title">CONTRACTOR ENLISTMENT ORDER</span>
  </div>

  <p style="text-align:justify;margin-bottom:14px;font-size:12px;">
    In accordance to the Govt. Of Rajasthan enlistment rules F.2(3) FD/Exp. III/97 part dated 24.05.99 (4)
    FD/Exp.III/99 Dated 23.03.2001 the following firm / Company is hereby enlisted as under:-
  </p>

  <table style="margin-bottom:14px;">
    <colgroup>
      <col style="width:36px">
      <col style="width:240px">
      <col>
    </colgroup>
    <tr>
      <td style="border:1px solid #000;padding:5px 6px;font-weight:bold;text-align:center;">Sr. No.</td>
      <td style="border:1px solid #000;padding:5px 6px;font-weight:bold;">Particulars</td>
      <td style="border:1px solid #000;padding:5px 6px;font-weight:bold;">&nbsp;</td>
    </tr>
    ${rows}
  </table>

  <p style="margin-bottom:16px;font-size:11px;">
    <strong>Note: -</strong> The Contractor/Firm shall follow the provisions laid down under "Rules for Enlistment of contractor in PWD"
    (Appendix XVI rules 334 of PWF &amp; AR) and modified to time.
  </p>

  <table style="border:none;margin-bottom:10px;">
    <tr>
      <td style="border:none;"></td>
      <td style="border:none;width:220px;text-align:center;">
        <div style="height:36px;"></div>
        <div>Executive Engineer</div>
        <div>P.W.D. Distt. Dn. II Udaipur</div>
      </td>
    </tr>
  </table>

  <div style="font-size:12px;">
    <div><span style="display:inline-block;width:30%;">No</span><span>Date:- ${esc(d.signatureDate)}</span></div>
    <div style="margin-top:4px;">Copy Submitted to:-</div>
    <div style="margin-top:3px;line-height:1.7;">${copyHtml}</div>
    <div style="text-align:right;margin-top:10px;">
      <div>Executive Engineer</div>
      <div>P.W.D. Distt. Dn. II Udaipur</div>
    </div>
  </div>
</div>
</body>
</html>`;
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

// ─── Table Row (Preview) ──────────────────────────────────────────────────────
function TableRow({
  no,
  label,
  value,
}: {
  no: string;
  label: string;
  value: string;
}) {
  return (
    <>
      <div className="border-b border-r doc-border-black p-1.5 text-center break-words min-w-0">{no}</div>
      <div className="border-b border-r doc-border-black p-1.5 break-words min-w-0">{label}</div>
      <div className="border-b border-r doc-border-black p-1.5 break-words min-w-0 whitespace-pre-wrap">
        {value}
      </div>
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DocumentGenerator() {
  useDocumentTitle("Document Generator");
  usePrintPage();
  const [data, setData] = useState<DocumentData>(defaultData);
  const pageRef = useRef<HTMLDivElement>(null);

  function update<K extends keyof DocumentData>(key: K, value: DocumentData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  const handlePrint = () => {
    const prev = document.title;
    document.title = `Contractor Enlistment Order - ${data.contractorName || 'Draft'}`;
    window.print();
    document.title = prev;
  };

  const handleReset = () => setData(defaultData);

  const handleDownloadDoc = () => {
    const html = buildStandaloneHtml(data);
    const name = (data.contractorName || 'enlistment-order').trim().replace(/[^a-zA-Z0-9 _-]/g, '') || 'enlistment-order';
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

  const codeYear = data.enlistmentFiscalYear.trim() || data.fiscalYear;
  const regNoCode = formatRegNo(data.enlistmentSerial, data.fiscalYear);
  const enlistCode = formatEnlistmentCode(data.enlistmentSerial, codeYear);

  return (
    <ToolShell title="Document Generator">
      <div className="flex min-h-[100dvh] w-full bg-background overflow-hidden">
        {/* ── LEFT PANEL: FORM ── */}
        <div className="w-[420px] flex flex-col border-r bg-card shadow-md hide-on-print z-10 flex-shrink-0">
          {/* Header */}
          <div className="px-4 py-3 border-b bg-primary text-primary-foreground">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-bold text-base leading-tight">ठेकेदार सूचीबद्धता आदेश</h1>
                <p className="text-xs text-primary-foreground/75 mt-0.5">Contractor Enlistment Order — P.W.D. Distt. Dn.-II Udaipur</p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleReset}
                title="सब साफ करें / Reset"
                className="h-8 px-2 text-xs mt-0.5 shrink-0"
              >
                <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reset
              </Button>
            </div>
            <p className="mt-2 text-[11px] text-primary-foreground/80 bg-primary-foreground/10 rounded px-2 py-1 leading-relaxed">
              📋 नीचे जानकारी भरें — दाईं तरफ कागज़ अपने आप तैयार होगा।<br />
              <span className="text-primary-foreground/60">Fill the boxes below. The document on the right updates automatically.</span>
            </p>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-4 space-y-6 pb-10">

              {/* ── STEP 1: Contractor ── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">1</span>
                  <div>
                    <p className="text-sm font-bold leading-none">ठेकेदार की जानकारी</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Contractor Details</p>
                  </div>
                </div>

                <Field label="फर्म / ठेकेदार का नाम" hint="Firm / Contractor Name">
                  <Input
                    value={data.contractorName}
                    onChange={(e) => update('contractorName', e.target.value)}
                    placeholder="जैसे: हेतल एंटरप्राइजेज (M/s. अपने आप जुड़ेगा)"
                    className="h-10"
                  />
                </Field>

                <Field label="पूरा पता" hint="Full Address">
                  <Textarea
                    value={data.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder="गाँव/शहर, तहसील, जिला, राज."
                    className="min-h-[72px] resize-none"
                  />
                </Field>

                <Field label="ई-मेल आईडी" hint="E-Mail ID">
                  <Input
                    type="email"
                    value={data.email}
                    onChange={(e) => {
                      const [local, domain] = e.target.value.split('@');
                      update('email', domain ? `${local}@${domain.toUpperCase()}` : e.target.value);
                    }}
                    placeholder="example@gmail.com"
                    className="h-10"
                  />
                </Field>

                <Field label="मोबाइल / फोन नंबर" hint="Mobile / Phone No.">
                  <Input
                    value={data.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    placeholder="जैसे: 9876543210"
                    className="h-10 font-mono tracking-wide"
                  />
                </Field>

                <Field label="पैन नंबर" hint="PAN No.">
                  <Input
                    value={data.panNo}
                    onChange={(e) => update('panNo', e.target.value.toUpperCase())}
                    placeholder="जैसे: ABCDE1234F"
                    maxLength={10}
                    className="h-10 font-mono tracking-widest uppercase"
                  />
                </Field>

                <Field label="GST नंबर" hint="GST IN No.">
                  <Input
                    value={data.gstNo}
                    onChange={(e) => update('gstNo', e.target.value.toUpperCase())}
                    placeholder="जैसे: 08ABCDE1234F1Z5"
                    maxLength={15}
                    className="h-10 font-mono tracking-widest uppercase"
                  />
                </Field>

                <Field label="प्रतिलिपि शहर" hint="Copy-list City">
                  <Input
                    value={data.copyCity}
                    onChange={(e) => update('copyCity', e.target.value)}
                    placeholder="UDAIPUR (RAJ.)"
                    className="h-10"
                  />
                </Field>
              </section>

              {/* ── STEP 2: Registration Number ── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">2</span>
                  <div>
                    <p className="text-sm font-bold leading-none">सूचीबद्धता क्रमांक</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Registration Number</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground bg-muted/50 rounded px-3 py-2 leading-relaxed">
                  ✏️ सिर्फ क्रमांक लिखें — कोड अपने आप बनेगा।<br />
                  <span className="text-muted-foreground/70">Enter only the serial number; code is auto-formatted.</span>
                </p>

                <div className="flex gap-3 items-end">
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-sm font-semibold">क्रमांक <span className="text-muted-foreground font-normal text-xs">(Serial No.)</span></Label>
                    <Input
                      type="number"
                      min={1}
                      max={99}
                      value={data.enlistmentSerial}
                      onChange={(e) => update('enlistmentSerial', e.target.value)}
                      placeholder="जैसे: 4"
                      className="h-12 text-xl font-bold font-mono text-center"
                    />
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <Label className="text-sm font-semibold">वित्त वर्ष <span className="text-muted-foreground font-normal text-xs">(Fiscal Year)</span></Label>
                    <Input
                      value={data.fiscalYear}
                      onChange={(e) => update('fiscalYear', e.target.value)}
                      placeholder="2026-27"
                      className="h-12 text-lg font-mono text-center"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">
                    पत्र दिनांक <span className="text-muted-foreground font-normal text-xs">(Order Date)</span>
                  </Label>
                  <Input
                    value={data.signatureDate}
                    onChange={(e) => update('signatureDate', e.target.value)}
                    placeholder="जैसे: 27/10/2026"
                    className="h-10 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm font-semibold">
                    सूचीबद्धता वर्ष <span className="text-muted-foreground font-normal text-xs">(Enlistment Year — optional)</span>
                  </Label>
                  <Input
                    value={data.enlistmentFiscalYear}
                    onChange={(e) => update('enlistmentFiscalYear', e.target.value)}
                    placeholder="खाली छोड़ें तो वित्त वर्ष ही लगेगा"
                    className="h-10 font-mono"
                  />
                </div>

                {(regNoCode || enlistCode) ? (
                  <div className="rounded-md border-2 border-primary/40 bg-primary/5 px-4 py-2.5 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Reg. No.</span>
                      <span className="font-bold font-mono text-sm">{regNoCode}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Enlistment Code</span>
                      <span className="font-bold font-mono text-xs">{enlistCode}</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed px-4 py-2.5 text-center text-xs text-muted-foreground">
                    क्रमांक डालने पर कोड यहाँ दिखेगा
                  </div>
                )}
              </section>

              {/* ── STEP 3: Security Details ── */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 border-b pb-1.5">
                  <span className="bg-primary text-primary-foreground text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0">3</span>
                  <div>
                    <p className="text-sm font-bold leading-none">सुरक्षा जमा विवरण</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Security Deposit Details (Fixed Amount: Rs. 75,000/-)</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <Field label="प्रकार / Type">
                    <select
                      className="h-10 w-full border border-input rounded-md px-3 bg-background"
                      value={data.securityType}
                      onChange={(e) => update('securityType', e.target.value as 'BG' | 'FDR' | 'NSC')}
                    >
                      <option value="BG">BG — Bank Guarantee</option>
                      <option value="FDR">FDR — Fixed Deposit Receipt</option>
                      <option value="NSC">NSC — National Savings Certificate</option>
                    </select>
                  </Field>
                </div>

                <Field label="बैंक का नाम / Bank Name">
                  <Input
                    value={data.securityBankName}
                    onChange={(e) => update('securityBankName', e.target.value)}
                    placeholder="जैसे: STATE BANK OF INDIA, GOGUNDA"
                    className="h-10"
                  />
                </Field>

                <Field label="संख्या और तिथि / Number & Date">
                  <Input
                    value={data.securityNumberDate}
                    onChange={(e) => update('securityNumberDate', e.target.value)}
                    placeholder="जैसे: Date 27/10/2026"
                    className="h-10"
                  />
                </Field>

                <div className="rounded-md border border-primary/40 bg-primary/5 px-3 py-2 text-xs whitespace-pre-wrap">
                  <span className="font-semibold text-primary">Preview:</span> {buildSecurityString(data)}
                </div>
              </section>

              {/* ── Actions ── */}
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
        <div className="flex-1 overflow-auto bg-slate-100 p-8 print-wrap">
          {/* Toolbar (hidden on print) */}
          <div className="max-w-[210mm] mx-auto mb-4 flex flex-wrap items-center justify-between gap-2 hide-on-print">
            <p className="text-xs text-muted-foreground">
              Disable &quot;Headers and footers&quot; in the print dialog for best output.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={handlePrint}>
                <Printer className="mr-1.5 h-3.5 w-3.5" /> Print / PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadDoc}>
                <FileDown className="mr-1.5 h-3.5 w-3.5" /> Word (.doc)
              </Button>
            </div>
          </div>

          {/* ── THE A4 PAGE ── */}
          <div ref={pageRef} className="a4-page contractor-output doc-font text-[12px] leading-snug">

            {/* Office Header */}
            <div className="text-left mb-2">
              <h1 className="text-[14px] font-bold uppercase leading-tight doc-header-font">
                {data.officeName} {data.departmentName}
              </h1>
            </div>

            {/* NO.- / Date:- line */}
            <div className="grid grid-cols-[30%_1fr] text-[12px] mb-2">
              <span>NO.-</span>
              <span>Date:- {data.signatureDate}</span>
            </div>

            {/* Top Info: PAN/GST/Mob box LEFT, seal image RIGHT */}
            <div className="flex justify-between items-start mb-5">
              {/* Left: particulars | details — 4-row × 2-col */}
              <table className="border border-black border-collapse text-[11px]">
                <tbody>
                  <tr>
                    <td className="border border-black px-2 py-0.5 font-bold w-[90px]">Reg. No.:</td>
                    <td className="border border-black px-2 py-0.5 font-mono tracking-wider w-[160px]">{regNoCode || '………………………'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 font-bold">PAN No.:</td>
                    <td className="border border-black px-2 py-0.5 font-mono tracking-wider">{data.panNo || '………………………'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 font-bold">GST IN No.:</td>
                    <td className="border border-black px-2 py-0.5 font-mono tracking-wider">{data.gstNo || '………………………'}</td>
                  </tr>
                  <tr>
                    <td className="border border-black px-2 py-0.5 font-bold">Mob No.:</td>
                    <td className="border border-black px-2 py-0.5">{data.phone || '………………………'}</td>
                  </tr>
                </tbody>
              </table>
              {/* Right: Department seal — plain empty rectangle */}
              <div className="border border-black w-[30mm] h-[28mm]" />
            </div>

            {/* Document Title */}
            <div className="text-center mb-4">
              <h3 className="text-[14px] font-bold underline underline-offset-4 tracking-wide doc-header-font">
                CONTRACTOR ENLISTMENT ORDER
              </h3>
            </div>

            {/* Intro */}
            <div className="mb-4 text-justify text-[11.5px]">
              <p>
                In accordance to the Govt. Of Rajasthan enlistment rules F.2(3) FD/Exp. III/97 part dated 24.05.99 (4)
                FD/Exp.III/99 Dated 23.03.2001 the following firm / Company is hereby enlisted as under:-
              </p>
            </div>

            {/* Data Table */}
            <div className="mb-4 w-full border doc-border-black border-b-0 border-r-0">
              <div className="grid grid-cols-[36px_240px_1fr]">
                {/* Header */}
                <div className="border-b border-r doc-border-black p-1.5 font-bold text-center text-[11px]">Sr. No.</div>
                <div className="border-b border-r doc-border-black p-1.5 font-bold text-[11px]">Particulars</div>
                <div className="border-b border-r doc-border-black p-1.5 font-bold text-[11px]"></div>
                {/* Rows */}
                {getTableRows(data).map((r, i) => (
                  <TableRow key={i} no={r.no} label={r.label} value={r.value} />
                ))}
              </div>
            </div>

            {/* Note paragraph */}
            <p className="mb-4 text-[11px]">
              <span className="font-bold">Note: -</span> The Contractor/Firm shall follow the provisions
              laid down under &quot;Rules for Enlistment of contractor in PWD&quot; (Appendix XVI rules 334
              of PWF &amp; AR) and modified to time.
            </p>

            {/* Signature Block */}
            <div className="flex justify-end mb-3">
              <div className="text-center w-[220px]">
                <div className="h-10"></div>
                <div className="leading-snug">Executive Engineer</div>
                <div className="leading-snug">P.W.D. Distt. Dn. II Udaipur</div>
              </div>
            </div>

            {/* Copy Submitted To */}
            <div>
              <div className="grid grid-cols-[30%_1fr] text-[12px]">
                <span>No</span>
                <span>Date:- {data.signatureDate}</span>
              </div>
              <div className="mt-2 mb-1">Copy Submitted to:-</div>
              <div className="leading-[1.7]">
                {getCopyItems(data).map((item, i) => (
                  <div key={i}>{i + 1}) {item}</div>
                ))}
              </div>
              <div className="flex justify-end mt-3">
                <div className="text-center w-[220px]">
                  <div>Executive Engineer</div>
                  <div>P.W.D. Distt. Dn. II Udaipur</div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </ToolShell>
  );
}
