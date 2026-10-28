import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import BankCommunication from "@/pages/BankCommunication";
import BillForm from "@/pages/BillForm";
import ContractorRegistration from "@/pages/ContractorRegistration";
import EnrollmentDataForm from "@/pages/EnrollmentDataForm";
import { useLocation, useParams } from "wouter";

const TOOL_MAP: Record<string, { name: string; icon: string; htmlFile: string | null }> = {
  "bill-generator": { name: "Bill Generator", icon: "🏗️", htmlFile: "BillGenerator.html" },
  "emd-refund": { name: "EMD Refund", icon: "💸", htmlFile: "EmdRefund.html" },
  "excel-to-emd": { name: "Excel-to-EMD", icon: "📊", htmlFile: "ExcelToEmd.html" },
  "security-refund": { name: "Security Refund", icon: "🔒", htmlFile: "SecurityRefund.html" },
  "bill-note-sheet": { name: "Bill Note Sheet", icon: "📝", htmlFile: "BillNoteSheet.html" },
  "financial-progress": { name: "Liquidity Damages Calculator", icon: "📈", htmlFile: "FinancialProgressTracker.html" },
  "apg-calculator": { name: "APG Calculator", icon: "🧮", htmlFile: "ApgCalculator.html" },
  "delay-calculator": { name: "Delay Calculator", icon: "⏱️", htmlFile: "DelayCalculator.html" },
  "stamp-duty": { name: "Stamp Duty", icon: "⚖️", htmlFile: "StampDuty.html" },
  "bill-deviation-generator": { name: "Bill Deviation Generator", icon: "📋", htmlFile: "BillDeviationGenerator.html" },
  "hindi-bill-note-sheet": { name: "Hindi Bill Note Sheet", icon: "📄", htmlFile: null },
  "contractor-registration": { name: "Contractor Registration", icon: "📝", htmlFile: null },
  "bank-communication": { name: "Bank Communication", icon: "🏦", htmlFile: null },
};

const DIYAS_SMALL = [
  { left: "5%", delay: "0s", dur: "2.8s" },
  { left: "18%", delay: "0.5s", dur: "3.2s" },
  { left: "33%", delay: "0.9s", dur: "2.5s" },
  { left: "50%", delay: "0.2s", dur: "3.0s" },
  { left: "65%", delay: "0.7s", dur: "2.7s" },
  { left: "80%", delay: "0.4s", dur: "3.4s" },
  { left: "93%", delay: "1.1s", dur: "2.6s" },
];

function DiyasBar() {
  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "hidden", pointerEvents: "none" }}>
      {DIYAS_SMALL.map((d, i) => (
        <div key={i} style={{ position: "absolute", bottom: "2px", left: d.left, animation: `floatBalloon ${d.dur} ${d.delay} ease-in-out infinite` }}>
          <div style={{ fontSize: "16px", lineHeight: 1, filter: "drop-shadow(0 0 5px #FFD700) drop-shadow(0 0 8px #FF8C00)" }}>🪔</div>
        </div>
      ))}
    </div>
  );
}

export default function ToolViewer() {
  useDocumentTitle("Tool Viewer");
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();

  const tool = TOOL_MAP[id ?? ""];

  if (!tool) {
    return (
      <div style={{ padding: "48px", textAlign: "center", background: "linear-gradient(160deg, #fff8e1 0%, #fff3e0 40%, #fce4ec 100%)", minHeight: "100vh" }}>
        <div style={{ fontSize: "48px" }}>❓</div>
        <h2 style={{ color: "#7B0D00" }}>Tool not found</h2>
        <button onClick={() => navigate("/")} style={backBtnStyle}>🪔 Back to Home</button>
      </div>
    );
  }

  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <>
      <style>{`
        @keyframes floatBalloon {
          0%,100% { transform: translateY(0) rotate(-2deg); }
          50%      { transform: translateY(-10px) rotate(2deg); }
        }
        @keyframes shimmer {
          0%   { background-position: 0% center; }
          100% { background-position: 200% center; }
        }
      `}</style>
      <div style={{ display: "flex", flexDirection: "column", height: "100vh", fontFamily: "'Segoe UI',sans-serif" }}>

        {/* Navratri Top Bar */}
        <div style={{
          position: "relative",
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "10px 16px 8px",
          background: "linear-gradient(135deg, #7B0D00 0%, #c0392b 30%, #e67e22 60%, #c0392b 80%, #7B0D00 100%)",
          backgroundSize: "300% auto",
          animation: "shimmer 8s linear infinite",
          borderBottom: "3px solid #FFD700",
          flexShrink: 0,
          minHeight: "52px",
        }}>
          <DiyasBar />
          <button
            onClick={() => navigate("/")}
            style={{
              position: "relative",
              zIndex: 1,
              background: "rgba(255,215,0,0.18)",
              border: "1.5px solid #FFD700",
              color: "#FFD700",
              padding: "6px 14px",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "0.875rem",
              textShadow: "0 1px 3px rgba(0,0,0,0.4)",
              flexShrink: 0,
            }}
          >
            🏠 Home
          </button>
          <span style={{ position: "relative", zIndex: 1, fontSize: "20px", filter: "drop-shadow(0 0 4px #FFD700)" }}>{tool.icon}</span>
          <span style={{ position: "relative", zIndex: 1, fontWeight: 700, fontSize: "1rem", color: "#FFD700", textShadow: "0 0 10px rgba(255,215,0,0.7), 0 1px 4px rgba(0,0,0,0.5)", letterSpacing: "0.03em" }}>{tool.name}</span>
          <span style={{ position: "relative", zIndex: 1, marginLeft: "auto", color: "#FFEAA7", fontSize: "0.75rem", opacity: 0.85 }}>🌸 PWD Tools Suite 🌸</span>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {tool.htmlFile ? (
            <iframe
              src={`${base}/tools/${tool.htmlFile}`}
              style={{ width: "100%", height: "100%", border: "none" }}
              title={tool.name}
            />
          ) : (
            <div style={{ height: "100%", overflowY: "auto" }}>
              {(() => {
                const componentMap: Record<string, React.ReactNode> = {
                  "contractor-registration": <ContractorRegistration />,
                  "bank-communication": <BankCommunication />,
                  "enrollment-data-form": <EnrollmentDataForm />,
                  "hindi-bill-note-sheet": <BillForm />,
                };
                return componentMap[id ?? ""] ?? <BillForm />;
              })()}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const backBtnStyle: React.CSSProperties = {
  marginTop: "16px",
  padding: "10px 20px",
  background: "linear-gradient(135deg, #7B0D00, #c0392b)",
  color: "#FFD700",
  border: "2px solid #FFD700",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: "0.9rem",
};
