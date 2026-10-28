import ToolShell from "@/components/ToolShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Download } from "lucide-react";
import { useState } from "react";
interface EmdReceipt {
  payee: string;
  amount: number;
  amount_words: string;
  work: string;
  voucher_no?: string;
  cheque_no?: string;
  date?: string;
}

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

function convertNumberToWords(num: number): string {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  if (num === 0) return "Zero";

  let words = "";
  let remaining = num;

  // Crores
  if (remaining >= 10000000) {
    const crorePart = Math.floor(remaining / 10000000);
    words += convertNumberToWords(crorePart) + " Crore ";
    remaining %= 10000000;
  }

  // Lakhs
  if (remaining >= 100000) {
    const lakhPart = Math.floor(remaining / 100000);
    words += convertNumberToWords(lakhPart) + " Lakh ";
    remaining %= 100000;
  }

  // Thousands
  if (remaining >= 1000) {
    const thousandPart = Math.floor(remaining / 1000);
    words += convertNumberToWords(thousandPart) + " Thousand ";
    remaining %= 1000;
  }

  // Hundreds
  if (remaining >= 100) {
    const hundredPart = Math.floor(remaining / 100);
    words += ones[hundredPart] + " Hundred ";
    remaining %= 100;
  }

  // Tens and ones
  if (remaining > 0) {
    if (remaining < 10) {
      words += ones[remaining];
    } else if (remaining < 20) {
      words += teens[remaining - 10];
    } else {
      const tenPart = Math.floor(remaining / 10);
      const onePart = remaining % 10;
      words += tens[tenPart];
      if (onePart > 0) {
        words += " " + ones[onePart];
      }
    }
  }

  return words.trim();
}

export default function ExcelToEmd() {
  useDocumentTitle("Excel to EMD");
  const [receipts, setReceipts] = useState<EmdReceipt[]>([]);
  const [currentReceipt, setCurrentReceipt] = useState<EmdReceipt>({
    payee: "",
    amount: 0,
    amount_words: "",
    work: "",
    voucher_no: "",
    cheque_no: "",
    date: "",
  });

  const handleAddReceipt = () => {
    if (!currentReceipt.payee || !currentReceipt.amount || !currentReceipt.work) {
      alert("Please fill in Payee, Amount, and Work details");
      return;
    }

    const amountWords = convertNumberToWords(currentReceipt.amount);
    const newReceipt = {
      ...currentReceipt,
      amount_words: amountWords,
    };

    setReceipts([...receipts, newReceipt]);
    setCurrentReceipt({
      payee: "",
      amount: 0,
      amount_words: "",
      work: "",
      voucher_no: "",
      cheque_no: "",
      date: "",
    });
  };

  const handleDeleteReceipt = (index: number) => {
    setReceipts(receipts.filter((_, i) => i !== index));
  };

  const handlePrintReceipt = (receipt: EmdReceipt) => {
    const printWindow = window.open("", "_blank", "width=794,height=1123");
    if (!printWindow) {
      alert("Please allow popups to print");
      return;
    }

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Hand Receipt (RPWA 28)</title>
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
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; background: #fff; color: #000; padding: 12mm; }
    .container {
      width: 100%;
      border: 2px solid #000;
      padding: 14px;
    }
    .header { text-align: center; margin-bottom: 8px; }
    .header h2 { font-size: 14px; margin: 3px 0; }
    .header p  { font-size: 11px; margin: 2px 0; }
    .details p  { font-size: 12px; margin: 5px 0; line-height: 1.4; }
    .amount-words { font-style: italic; }
    .input-field {
      border-bottom: 1px dotted #000;
      padding: 1px 2px;
      display: inline-block;
      min-width: 220px;
    }
    .signature-area, .offices {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 11px;
    }
    .signature-area td, .offices td {
      border: 1px solid #000;
      padding: 6px 8px;
      text-align: left;
    }
    .passed-box {
      margin-top: 12px;
      border: 2px solid #000;
      padding: 8px 12px;
      display: inline-block;
      min-width: 280px;
    }
    .passed-box p { margin: 3px 0; font-size: 12px; }
    .blue-text { color: #000080; font-weight: bold; }
    .seal p { margin: 2px 0; font-size: 11px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Payable to: - ${receipt.payee}</h2>
      <h2>HAND RECEIPT (RPWA 28)</h2>
      <p>(Referred to in PWF&amp;A Rules 418, 424, 436 &amp; 438)</p>
      <p>Division - PWD District Division-II, Udaipur</p>
    </div>

    <div class="details">
      <p>(1) Cash Book Voucher No. ${receipt.voucher_no || "___________"} &nbsp;&nbsp;&nbsp; Date ${receipt.date || "___________"}</p>
      <p>(2) Cheque No. and Date ${receipt.cheque_no || "___________"}</p>
      <p>(3) Pay for ECS Rs.${receipt.amount}/- (Rupees <span class="amount-words">${receipt.amount_words} only</span>)</p>
      <p>(4) Paid by me</p>
      <p>(5) Received from The Executive Engineer PWD District Division-II, Udaipur the sum of Rs.&nbsp;${receipt.amount}/- (Rupees <span class="amount-words">${receipt.amount_words} only</span>)</p>
      <p>Name of work for which payment is made: <span class="input-field">${receipt.work}</span></p>
      <p>Chargeable to Head:- 8443 [EMD-Refund]</p>

      <table class="signature-area">
        <tr>
          <td>Witness</td>
          <td>Stamp</td>
          <td>Signature of payee</td>
        </tr>
        <tr>
          <td>Cash Book No. ___________ &nbsp; Page No. ___________</td>
          <td>&nbsp;</td>
          <td>&nbsp;</td>
        </tr>
      </table>

      <table class="offices">
        <tr>
          <td>For use in the Divisional Office</td>
          <td>For use in the Accountant General's office</td>
        </tr>
        <tr>
          <td>Checked</td>
          <td>Audited/Reviewed</td>
        </tr>
        <tr>
          <td>Accounts Clerk</td>
          <td>DA ___________ &nbsp; Auditor ___________ &nbsp; Supdt. ___________ &nbsp; G.O.</td>
        </tr>
      </table>

      <div class="passed-box">
        <p class="blue-text">Passed for Rs. ${receipt.amount}</p>
        <p class="blue-text">In Words Rupees: ${receipt.amount_words} Only</p>
        <p class="blue-text">Chargeable to Head:- 8443 [EMD-Refund]</p>
        <div class="seal" style="margin-top:8px;">
          <p>Ar. ___________</p>
          <p>D.A. ___________</p>
          <p>E.E. ___________</p>
        </div>
      </div>
    </div>
  </div>
</body>
</html>`;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <ToolShell title="Excel to EMD">
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
      `}</style>

        <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fff8e1 0%, #fff3e0 40%, #fce4ec 100%)", fontFamily: "'Noto Sans Devanagari','Segoe UI',sans-serif" }}>

          {/* Navratri Header */}
          <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #7B0D00 0%, #c0392b 25%, #e67e22 50%, #c0392b 75%, #7B0D00 100%)", backgroundSize: "300% auto", animation: "shimmer 8s linear infinite", borderBottom: "4px solid #FFD700" }}>
            <Diyas />
            <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "28px 24px 18px" }}>
              <div style={{ fontSize: "48px", marginBottom: "6px", filter: "drop-shadow(0 0 12px #FFD700)" }}>📊</div>
              <div style={{ color: "#FFD700", fontWeight: 900, fontSize: "1.8rem", letterSpacing: "0.06em", textShadow: "0 0 16px rgba(255,215,0,0.8), 0 2px 8px rgba(0,0,0,0.5)" }}>
                🪔 Excel to EMD Tool 🪔
              </div>
              <div style={{ color: "#FFEAA7", fontWeight: 500, fontSize: "0.95rem", letterSpacing: "0.08em", marginTop: "6px" }}>
                Hand Receipt Generator (RPWA 28)
              </div>
              <div style={{ color: "#FFD700", fontWeight: 500, fontSize: "0.8rem", letterSpacing: "0.12em", marginTop: "4px", opacity: 0.85 }}>
                ✦ Batch EMD Processing &nbsp;✦&nbsp; नवरात्रि की शुभकामनाएं 🌸
              </div>
            </div>
            <div style={{ background: "linear-gradient(90deg, #FFD700, #FF8C00, #FFD700)", height: "3px" }} />
          </div>

          {/* Main Content */}
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
            {/* Sample File Download Section */}
            <Card style={{ background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)", border: "2px solid #4caf50", marginBottom: "24px" }}>
              <CardContent style={{ padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#2e7d32", fontSize: "1rem", marginBottom: "4px" }}>
                    📥 Sample Input File
                  </div>
                  <div style={{ color: "#388e3c", fontSize: "0.875rem" }}>
                    Download sample Excel file for reference
                  </div>
                </div>
                <Button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = '/sample-files/sample-emd-input.xlsx';
                    link.download = 'sample-emd-input.xlsx';
                    link.click();
                  }}
                  style={{
                    background: "linear-gradient(135deg, #4caf50, #2e7d32)",
                    color: "#fff",
                    fontWeight: 600
                  }}
                >
                  <Download style={{ marginRight: "8px", width: "16px", height: "16px" }} />
                  Download Sample
                </Button>
              </CardContent>
            </Card>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

              {/* Input Form */}
              <Card style={{ background: "linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%)", border: "2px solid #e6a817" }}>
                <CardHeader>
                  <CardTitle style={{ color: "#7B0D00" }}>Add EMD Receipt</CardTitle>
                  <CardDescription style={{ color: "#6b3a00" }}>Enter details to generate hand receipt. Use sample file as reference for format.</CardDescription>
                </CardHeader>
                <CardContent style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <Label style={{ color: "#7B0D00", fontWeight: 600 }}>Payee Name *</Label>
                    <Input
                      value={currentReceipt.payee}
                      onChange={(e) => setCurrentReceipt({ ...currentReceipt, payee: e.target.value })}
                      placeholder="Enter payee name"
                      style={{ marginTop: "8px" }}
                    />
                  </div>

                  <div>
                    <Label style={{ color: "#7B0D00", fontWeight: 600 }}>Amount (₹) *</Label>
                    <Input
                      type="number"
                      value={currentReceipt.amount || ""}
                      onChange={(e) => setCurrentReceipt({ ...currentReceipt, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="Enter amount"
                      style={{ marginTop: "8px" }}
                    />
                  </div>

                  <div>
                    <Label style={{ color: "#7B0D00", fontWeight: 600 }}>Work Description *</Label>
                    <Textarea
                      value={currentReceipt.work}
                      onChange={(e) => setCurrentReceipt({ ...currentReceipt, work: e.target.value })}
                      placeholder="Enter work description"
                      style={{ marginTop: "8px", minHeight: "80px" }}
                    />
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div>
                      <Label style={{ color: "#7B0D00", fontWeight: 600 }}>Voucher No.</Label>
                      <Input
                        value={currentReceipt.voucher_no}
                        onChange={(e) => setCurrentReceipt({ ...currentReceipt, voucher_no: e.target.value })}
                        placeholder="Optional"
                        style={{ marginTop: "8px" }}
                      />
                    </div>
                    <div>
                      <Label style={{ color: "#7B0D00", fontWeight: 600 }}>Cheque No.</Label>
                      <Input
                        value={currentReceipt.cheque_no}
                        onChange={(e) => setCurrentReceipt({ ...currentReceipt, cheque_no: e.target.value })}
                        placeholder="Optional"
                        style={{ marginTop: "8px" }}
                      />
                    </div>
                  </div>

                  <div>
                    <Label style={{ color: "#7B0D00", fontWeight: 600 }}>Date</Label>
                    <Input
                      type="date"
                      value={currentReceipt.date}
                      onChange={(e) => setCurrentReceipt({ ...currentReceipt, date: e.target.value })}
                      style={{ marginTop: "8px" }}
                    />
                  </div>

                  <Button
                    onClick={handleAddReceipt}
                    style={{
                      background: "linear-gradient(135deg, #7B0D00, #c0392b)",
                      color: "#FFD700",
                      fontWeight: 700
                    }}
                  >
                    🪔 Add Receipt
                  </Button>
                </CardContent>
              </Card>

              {/* Receipts List */}
              <Card style={{ background: "linear-gradient(135deg, #fffbf0 0%, #fff8e1 100%)", border: "2px solid #e6a817" }}>
                <CardHeader>
                  <CardTitle style={{ color: "#7B0D00" }}>Generated Receipts ({receipts.length})</CardTitle>
                  <CardDescription style={{ color: "#6b3a00" }}>Click print to generate hand receipt</CardDescription>
                </CardHeader>
                <CardContent>
                  {receipts.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#6b3a00" }}>
                      <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
                      <p>No receipts added yet</p>
                      <p style={{ fontSize: "0.875rem", marginTop: "8px" }}>Add receipt details using the form</p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px", maxHeight: "500px", overflowY: "auto" }}>
                      {receipts.map((receipt, index) => (
                        <div
                          key={index}
                          style={{
                            background: "#fff",
                            border: "1px solid #e6a817",
                            borderRadius: "8px",
                            padding: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontWeight: 700, color: "#7B0D00", fontSize: "0.95rem" }}>{receipt.payee}</div>
                              <div style={{ color: "#6b3a00", fontSize: "0.875rem", marginTop: "4px" }}>₹{receipt.amount.toLocaleString("en-IN")}</div>
                              <div style={{ color: "#6b3a00", fontSize: "0.8rem", marginTop: "4px", fontStyle: "italic" }}>{receipt.amount_words}</div>
                            </div>
                            <Button
                              onClick={() => handleDeleteReceipt(index)}
                              variant="destructive"
                              size="sm"
                              style={{ fontSize: "0.75rem" }}
                            >
                              Delete
                            </Button>
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#6b3a00", marginTop: "8px" }}>
                            <strong>Work:</strong> {receipt.work}
                          </div>
                          <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                            <Button
                              onClick={() => handlePrintReceipt(receipt)}
                              size="sm"
                              style={{
                                background: "linear-gradient(135deg, #7B0D00, #c0392b)",
                                color: "#FFD700",
                                fontWeight: 600,
                                fontSize: "0.8rem"
                              }}
                            >
                              🖨️ Print Receipt
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "24px", color: "#7B2D00", fontSize: "0.85rem", borderTop: "2px solid #e6a817", background: "linear-gradient(90deg, #fffbf0, #fff8e1, #fffbf0)" }}>
            <div style={{ fontSize: "1.2rem", marginBottom: "4px" }}>🪔 ✦ 🌸 ✦ 🪔</div>
            <div style={{ fontWeight: 700, color: "#7B0D00", marginBottom: "4px" }}>🏗️ PWD Tools Suite</div>
            <div>Prepared on Initiative of Mrs. Premlata Jain, AAO | PWD Udaipur, Rajasthan</div>
          </div>
        </div>
      </>
    </ToolShell>
  );
}
