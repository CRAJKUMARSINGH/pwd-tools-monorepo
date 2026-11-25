import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
    calculateIfms30Bill,
    formatAmount,
    IFMS_FOOTER,
    initialIfms30BillForm,
    type Ifms30BillCalculation,
    type Ifms30BillForm,
    type MiningRoyaltyOption,
    type OutputRow,
    type YesNo,
} from "@/lib/ifms30Bill";
import { saveAs } from "file-saver";
import { useState } from "react";
import { toast } from "sonner";

const MINING_OPTIONS: Array<{
    value: MiningRoyaltyOption;
    royalty: string;
    dfmt: string;
}> = [
        { value: "A0", royalty: "0%", dfmt: "0%" },
        { value: "B15", royalty: "1.5%", dfmt: "0.15%" },
        { value: "C30", royalty: "3%", dfmt: "0.3%" },
    ];

const DIYAS = [
    { left: "4%", delay: "0s" },
    { left: "15%", delay: "0.5s" },
    { left: "28%", delay: "1.1s" },
    { left: "42%", delay: "0.2s" },
    { left: "57%", delay: "0.8s" },
    { left: "71%", delay: "0.4s" },
    { left: "85%", delay: "1.3s" },
    { left: "95%", delay: "0.7s" },
];

function Diyas() {
    return (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
            {DIYAS.map((diya) => (
                <span
                    key={diya.left}
                    style={{
                        position: "absolute",
                        bottom: "5px",
                        left: diya.left,
                        fontSize: "22px",
                        filter: "drop-shadow(0 0 6px #FFD700)",
                        animation: `ifms-float 3s ${diya.delay} ease-in-out infinite`,
                    }}
                >
                    🪔
                </span>
            ))}
            {["10%", "34%", "64%", "90%"].map((left, index) => (
                <span
                    key={left}
                    style={{
                        position: "absolute",
                        top: "8px",
                        left,
                        color: "#FFD700",
                        fontSize: "15px",
                        opacity: 0.75,
                        animation: `ifms-float 2.8s ${index * 0.4}s ease-in-out infinite`,
                    }}
                >
                    ✿
                </span>
            ))}
        </div>
    );
}

function YesNoSelect({
    id,
    label,
    value,
    onChange,
    hideLabel = false,
}: {
    id: string;
    label: string;
    value: YesNo;
    onChange: (value: YesNo) => void;
    hideLabel?: boolean;
}) {
    return (
        <div>
            {!hideLabel && <label className="ifms-label" htmlFor={id}>{label}</label>}
            <select
                id={id}
                className="ifms-input"
                aria-label={label}
                value={value}
                onChange={(event) => onChange(event.target.value as YesNo)}
            >
                <option value="no">नहीं</option>
                <option value="yes">हाँ</option>
            </select>
        </div>
    );
}

function BillOutput({ calculation }: { calculation: Ifms30BillCalculation }) {
    const cellBase: React.CSSProperties = {
        border: "1px solid #666",
        padding: "6px 8px",
        verticalAlign: "top",
        fontSize: "12px",
        lineHeight: 1.35,
    };
    const labelCell: React.CSSProperties = {
        ...cellBase,
        fontWeight: 600,
        background: "#f5f5f5",
    };
    const valueCell: React.CSSProperties = {
        ...cellBase,
        textAlign: "right",
        overflowWrap: "anywhere",
    };

    // Column 2 shows bare amounts — the "Rs." unit is declared once in the table header.
    const withoutRupeePrefix = (value: string) => value.replace(/^Rs\.\s*/, "");

    const renderRow = ([label, value]: OutputRow, index: number, emphasized = false) => (
        <tr key={`${label}-${index}`}>
            <td style={{ ...labelCell, ...(emphasized ? { background: "#fff4cf" } : {}) }}>{label}</td>
            <td style={{ ...valueCell, ...(emphasized ? { background: "#fff4cf", fontWeight: 700 } : {}) }}>{withoutRupeePrefix(value)}</td>
        </tr>
    );

    return (
        <div
            style={{
                boxSizing: "border-box",
                background: "#fff",
                color: "#000",
                fontFamily: "'Nirmala UI', 'Noto Sans Devanagari', 'Mangal', sans-serif",
            }}
        >
            <div>
                <table style={{ width: "62.5%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                    <colgroup>
                        <col />
                        <col style={{ width: "28.125%" }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <td
                                colSpan={2}
                                style={{
                                    ...cellBase,
                                    textAlign: "center",
                                    fontWeight: 700,
                                    fontSize: "13px",
                                    background: "#f5dfe5",
                                    padding: "7px 8px",
                                }}
                            >
                                Deductions:- &nbsp; Rs.
                            </td>
                        </tr>
                    </thead>
                    <tbody>
                        {calculation.deductionRows.map((row, index) => renderRow(row, index, row[0] === "Total"))}
                        {calculation.bifurcationRows.length > 0 && (
                            <>
                                <tr>
                                    <td
                                        colSpan={2}
                                        style={{
                                            ...cellBase,
                                            fontWeight: 700,
                                            background: "#fff0b3",
                                            color: "#6b3a00",
                                            padding: "7px 8px",
                                        }}
                                    >
                                        मद वार विभाजन / Head-wise Bifurcation – Head 5054 (Present Bill Amount: Rs. {formatAmount(calculation.thisBillAmount)})
                                    </td>
                                </tr>
                                {calculation.bifurcationRows.map((row, index) => renderRow(row, index))}
                            </>
                        )}
                    </tbody>
                </table>
                <div style={{ width: "62.5%", border: "1px solid #666", borderTop: "none", padding: "8px 10px" }}>
                    {calculation.notePoints.map((point) => (
                        <div key={point} style={{ fontSize: "12px", lineHeight: 1.5 }}>{point}</div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function createA4Canvas(calculation: Ifms30BillCalculation): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = 1588;
    canvas.height = 2246;

    const maybeContext = canvas.getContext("2d");
    if (!maybeContext) throw new Error("चित्र तैयार नहीं हो सका");
    const context: CanvasRenderingContext2D = maybeContext;

    context.scale(2, 2);
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 794, 1123);

    const fontFamily = "'Nirmala UI', 'Noto Sans Devanagari', 'Mangal', sans-serif";
    const startX = 42;
    const startY = 38;
    const tableWidth = 710;
    const labelWidth = 470;
    const rowHeight = 28;

    function drawText(
        text: string,
        x: number,
        y: number,
        maxWidth: number,
        options: { align?: CanvasTextAlign; font?: string; color?: string } = {},
    ) {
        context.save();
        context.font = options.font ?? `600 12px ${fontFamily}`;
        context.fillStyle = options.color ?? "#000000";
        context.textAlign = options.align ?? "left";
        context.textBaseline = "middle";
        context.fillText(text, x, y, maxWidth);
        context.restore();
    }

    function drawCell(x: number, y: number, width: number, height: number, background: string) {
        context.fillStyle = background;
        context.fillRect(x, y, width, height);
        context.strokeStyle = "#666666";
        context.lineWidth = 0.75;
        context.strokeRect(x, y, width, height);
    }

    let y = startY;
    drawCell(startX, y, tableWidth, 30, "#f5dfe5");
    drawText("Deductions:-   Rs.", startX + tableWidth / 2, y + 15, tableWidth - 16, {
        align: "center",
        font: `700 14px ${fontFamily}`,
    });
    y += 30;

    for (const [label, value] of calculation.deductionRows) {
        const emphasized = label === "Total";
        const background = emphasized ? "#fff4cf" : "#f5f5f5";
        drawCell(startX, y, labelWidth, rowHeight, background);
        drawCell(startX + labelWidth, y, tableWidth - labelWidth, rowHeight, background);
        drawText(label, startX + 8, y + rowHeight / 2, labelWidth - 16, {
            font: `${emphasized ? 700 : 600} 12px ${fontFamily}`,
        });
        drawText(value, startX + tableWidth - 8, y + rowHeight / 2, tableWidth - labelWidth - 16, {
            align: "right",
            font: `${emphasized ? 700 : 400} 12px ${fontFamily}`,
        });
        y += rowHeight;
    }

    if (calculation.bifurcationRows.length > 0) {
        const heading = `मद वार विभाजन / Head-wise Bifurcation – Head 5054 (Present Bill Amount: Rs. ${formatAmount(calculation.thisBillAmount)})`;
        drawCell(startX, y, tableWidth, 32, "#fff0b3");
        drawText(heading, startX + 8, y + 16, tableWidth - 16, {
            font: `700 12px ${fontFamily}`,
            color: "#6b3a00",
        });
        y += 32;

        for (const [label, value] of calculation.bifurcationRows) {
            drawCell(startX, y, labelWidth, rowHeight, "#f5f5f5");
            drawCell(startX + labelWidth, y, tableWidth - labelWidth, rowHeight, "#ffffff");
            drawText(label, startX + 8, y + rowHeight / 2, labelWidth - 16);
            drawText(value, startX + tableWidth - 8, y + rowHeight / 2, tableWidth - labelWidth - 16, {
                align: "right",
                font: `400 12px ${fontFamily}`,
            });
            y += rowHeight;
        }
    }

    const noteHeight = 20 + calculation.notePoints.length * 20;
    context.fillStyle = "#ffffff";
    context.fillRect(startX, y, tableWidth, noteHeight);
    context.strokeStyle = "#666666";
    context.lineWidth = 0.75;
    context.strokeRect(startX, y, tableWidth, noteHeight);
    calculation.notePoints.forEach((point, index) => {
        drawText(point, startX + 10, y + 18 + index * 20, tableWidth - 20, {
            font: `400 13px ${fontFamily}`,
        });
    });

    drawText(IFMS_FOOTER, 397, 1090, tableWidth, {
        align: "center",
        font: "400 11px Arial, sans-serif",
    });

    return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) resolve(blob);
            else reject(new Error("चित्र तैयार नहीं हो सका"));
        }, "image/png");
    });
}

export default function Ifms30BillInput() {
    useDocumentTitle("IFMS 3.0 BILL INPUT");
    const [form, setForm] = useState<Ifms30BillForm>({ ...initialIfms30BillForm });
    const [exporting, setExporting] = useState<"pdf" | "image" | null>(null);
    const calculation = calculateIfms30Bill(form);

    function updateField<K extends keyof Ifms30BillForm>(field: K, value: Ifms30BillForm[K]) {
        setForm((previous) => ({ ...previous, [field]: value }));
    }

    function filename(extension: "pdf" | "png"): string {
        const now = new Date();
        const date = [
            now.getFullYear(),
            String(now.getMonth() + 1).padStart(2, "0"),
            String(now.getDate()).padStart(2, "0"),
        ].join("-");
        return `IFMS_3.0_BILL_INPUT_${date}.${extension}`;
    }

    async function downloadPdf() {
        setExporting("pdf");
        try {
            await document.fonts.ready;
            const image = createA4Canvas(calculation).toDataURL("image/jpeg", 0.95);
            const { jsPDF } = await import("jspdf");
            const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4", compress: true });
            pdf.addImage(image, "JPEG", 0, 0, 210, 297, undefined, "FAST");
            pdf.save(filename("pdf"));
            toast.success("पीडीएफ डाउनलोड हो गया");
        } catch {
            toast.error("पीडीएफ नहीं बन सका। कृपया पुनः प्रयास करें।");
        } finally {
            setExporting(null);
        }
    }

    async function downloadImage() {
        setExporting("image");
        try {
            await document.fonts.ready;
            const image = await canvasToBlob(createA4Canvas(calculation));
            saveAs(image, filename("png"));
            toast.success("चित्र डाउनलोड हो गया");
        } catch {
            toast.error("चित्र नहीं बन सका। कृपया पुनः प्रयास करें।");
        } finally {
            setExporting(null);
        }
    }

    return (
        <ToolShell
            title="IFMS 3.0 BILL INPUT"
            homeLabel="← मुखपृष्ठ"
            homeAriaLabel="मुखपृष्ठ पर जाएँ"
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700&display=swap');
        @keyframes ifms-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes ifms-shimmer {
          0% { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
        .ifms-section {
          background: linear-gradient(135deg, #fffdf5 0%, #fff7e6 100%);
          border: 1.5px solid #e6a817;
          border-radius: 14px;
          padding: 12px 16px;
          box-shadow: 0 2px 12px rgba(200, 130, 0, 0.1);
        }
        .ifms-label {
          display: block;
          margin-bottom: 2px;
          color: #7b2d00;
          font-size: 0.78rem;
          font-weight: 700;
        }
        .ifms-input {
          width: 100%;
          min-height: 38px;
          border: 1.5px solid #e6a817;
          border-radius: 8px;
          background: #fffef9;
          padding: 6px 10px;
          color: #3a1a00;
          font-family: 'Nirmala UI', 'Noto Sans Devanagari', 'Mangal', sans-serif;
          font-size: 0.86rem;
          outline: none;
        }
        .ifms-input:focus {
          border-color: #c8720a;
          box-shadow: 0 0 0 3px rgba(230, 168, 23, 0.22);
        }
        .ifms-workspace {
          display: grid;
          grid-template-columns: minmax(280px, 1fr) minmax(320px, 1fr);
          gap: 18px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 18px;
          overflow-x: auto;
        }
      `}</style>

            <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fff8e1 0%, #fff3e0 40%, #fce4ec 100%)", fontFamily: "'Nirmala UI', 'Noto Sans Devanagari', 'Mangal', sans-serif" }}>
                <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #7b0d00 0%, #c0392b 25%, #e67e22 50%, #c0392b 75%, #7b0d00 100%)", backgroundSize: "300% auto", animation: "ifms-shimmer 8s linear infinite", borderBottom: "4px solid #ffd700" }}>
                    <Diyas />
                    <div style={{ position: "relative", zIndex: 1, padding: "14px 20px 12px", textAlign: "center" }}>
                        <div style={{ color: "#ffffff", fontSize: "1.35rem", fontWeight: 900, textShadow: "0 2px 8px rgba(0,0,0,0.5)" }}>
                            IFMS 3.0 Bill Input
                        </div>
                        <div style={{ marginTop: "3px", color: "#ffeaa7", fontSize: "0.78rem", fontWeight: 600 }}>
                            बिल कटौती व मद वार विभाजन
                        </div>
                    </div>
                    <div style={{ height: "3px", background: "linear-gradient(90deg, #ffd700, #ff8c00, #ffd700)" }} />
                </div>

                <div className="ifms-workspace">
                    <div>
                        <div className="ifms-section">
                            <h2 style={{ marginBottom: "6px", borderBottom: "1px solid #f48fb1", paddingBottom: "4px", color: "#880e4f", fontSize: "0.95rem", fontWeight: 700 }}>
                                राशि
                            </h2>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                                <div>
                                    <label className="ifms-label" htmlFor="ifms-work-order">1. कुल कार्यादेश राशि (रु.)</label>
                                    <input id="ifms-work-order" className="ifms-input" type="number" min="0" step="0.01" inputMode="decimal" value={form.totalWorkOrderAmount} onChange={(event) => updateField("totalWorkOrderAmount", event.target.value)} placeholder="0" />
                                </div>
                                <div>
                                    <label className="ifms-label" htmlFor="ifms-last-bill">2A. पिछले बिल तक भुगतान (रु.)</label>
                                    <input id="ifms-last-bill" className="ifms-input" type="number" min="0" step="0.01" inputMode="decimal" value={form.paymentUptoLastBill} onChange={(event) => updateField("paymentUptoLastBill", event.target.value)} placeholder="0" />
                                </div>
                                <div>
                                    <label className="ifms-label" htmlFor="ifms-this-bill">2B. इस बिल की राशि (रु.)</label>
                                    <input id="ifms-this-bill" className="ifms-input" type="number" min="0" step="0.01" inputMode="decimal" value={form.amountThisBill} onChange={(event) => updateField("amountThisBill", event.target.value)} placeholder="0" />
                                </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 8px", marginTop: "10px", borderTop: "1px solid #f48fb1", paddingTop: "6px" }}>
                                <h2 style={{ margin: 0, color: "#880e4f", fontSize: "0.95rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                                    कटौतियाँ
                                </h2>
                                <div className="ifms-label" style={{ marginBottom: 0 }}>खनन रॉयल्टी — विकल्प चुनें</div>
                            </div>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "6px" }}>
                                {MINING_OPTIONS.map((option) => {
                                    const active = form.miningRoyaltyOption === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            aria-pressed={active}
                                            onClick={() => updateField("miningRoyaltyOption", option.value)}
                                            style={{
                                                borderRadius: "10px",
                                                border: `2px solid ${active ? "#b71c1c" : "#e6a817"}`,
                                                background: active ? "#b71c1c" : "#fff8e1",
                                                color: active ? "#fff" : "#5d4037",
                                                padding: "9px 4px",
                                                cursor: "pointer",
                                                fontWeight: active ? 800 : 600,
                                                fontSize: "0.72rem",
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            <div style={{ fontSize: "0.9rem", fontWeight: 900 }}>{option.value}</div>
                                            <div>रॉयल्टी: {option.royalty}</div>
                                            <div>डीएफएमटी: {option.dfmt}</div>
                                        </button>
                                    );
                                })}
                            </div>
                            <div style={{ marginTop: "6px" }}>
                                <label className="ifms-label" htmlFor="ifms-dep-v">जमा-वी / एम.डी. (रु.)</label>
                                <input id="ifms-dep-v" className="ifms-input" type="number" min="0" step="0.01" inputMode="decimal" value={form.depV} onChange={(event) => updateField("depV", event.target.value)} />
                            </div>

                            <div style={{ display: "flex", alignItems: "baseline", flexWrap: "wrap", gap: "4px 8px", marginTop: "10px", borderTop: "1px solid #f48fb1", paddingTop: "6px" }}>
                                <h2 style={{ margin: 0, color: "#880e4f", fontSize: "0.95rem", fontWeight: 700, whiteSpace: "nowrap" }}>
                                    मद वार विभाजन
                                </h2>
                                <div className="ifms-label" style={{ marginBottom: 0 }}>(क्या Budget Headwise विभाजन आवश्यक है?)</div>
                            </div>
                            <YesNoSelect id="ifms-bifurcation" hideLabel label="क्या Budget Headwise विभाजन आवश्यक है?" value={form.headWiseBifurcation} onChange={(value) => updateField("headWiseBifurcation", value)} />

                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "10px", marginTop: "10px" }}>
                            <button type="button" disabled={exporting !== null} onClick={downloadPdf} style={{ border: "none", borderRadius: "10px", background: "#880e4f", color: "#fff", padding: "12px", fontWeight: 700, cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.65 : 1 }}>
                                {exporting === "pdf" ? "Preparing PDF..." : "PDF DOWNLOAD"}
                            </button>
                            <button type="button" disabled={exporting !== null} onClick={downloadImage} style={{ border: "2px solid #e67e22", borderRadius: "10px", background: "#fff8e1", color: "#7b2d00", padding: "12px", fontWeight: 700, cursor: exporting ? "wait" : "pointer", opacity: exporting ? 0.65 : 1 }}>
                                {exporting === "image" ? "Preparing Image..." : "IMAGE DOWNLOAD"}
                            </button>
                        </div>
                        </div>
                    </div>

                    <div>
                        <div style={{ marginBottom: "12px", borderRadius: "12px", border: "1px solid #f48fb1", background: "linear-gradient(135deg, #fce4ec, #f8bbd0)", padding: "12px 14px" }}>
                            <h2 style={{ color: "#880e4f", fontSize: "0.95rem", fontWeight: 700 }}>PREVIEW</h2>
                        </div>
                        <div style={{ overflowX: "auto", border: "1px solid #d7a259", borderRadius: "10px", background: "#fff", padding: "12px", boxShadow: "0 3px 14px rgba(120, 70, 0, 0.1)" }}>
                            <BillOutput calculation={calculation} />
                        </div>
                    </div>
                </div>
            </div>

        </ToolShell>
    );
}
