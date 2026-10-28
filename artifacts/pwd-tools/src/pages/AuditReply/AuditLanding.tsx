import { ArrowLeft, FilePlus2, History, Info, Printer, Upload } from "lucide-react";
import { useLocation } from "wouter";

type Props = {
  hasDraft: boolean;
  draftLabel?: string;
  onNew: () => void;
  onResume: () => void;
};

export default function AuditLanding({ hasDraft, draftLabel, onNew, onResume }: Props) {
  const [, navigate] = useLocation();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      {/* Hero — the missing affordance, echoed at the top of the content too */}
      <div className="mb-6 flex items-start gap-3">
        <button
          type="button"
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          मुख्य पृष्ठ / Home
        </button>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold leading-tight">ऑडिट पैरा उत्तर</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          जिला प्रभाग II, उदयपुर — अंकेक्षण आपत्तियों के उत्तर तैयार करें और DOCX / PDF में निर्यात करें।
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onNew}
          className="flex flex-col items-start gap-2 rounded-xl border-2 border-primary/30 bg-card p-5 text-left shadow-sm transition-colors hover:border-primary hover:bg-muted/40"
        >
          <FilePlus2 className="h-6 w-6 text-primary" aria-hidden="true" />
          <span className="text-base font-semibold">नया उत्तर तैयार करें</span>
          <span className="text-xs text-muted-foreground">
            अंकेक्षण प्रतिवेदन की तस्वीरें अपलोड करें — प्रत्येक तस्वीर एक नया पैरा बनेगी।
          </span>
        </button>

        {hasDraft && (
          <button
            type="button"
            onClick={onResume}
            className="flex flex-col items-start gap-2 rounded-xl border-2 border-amber-300 bg-amber-50 p-5 text-left shadow-sm transition-colors hover:border-amber-500 hover:bg-amber-100"
          >
            <History className="h-6 w-6 text-amber-600" aria-hidden="true" />
            <span className="text-base font-semibold">सहेजा गया ड्राफ़्ट जारी रखें</span>
            <span className="text-xs text-amber-700">
              {draftLabel ?? "पिछली बार भरा गया कार्य जारी रखें।"}
            </span>
          </button>
        )}
      </div>

      <div className="mt-6 flex gap-2 rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        <p>
          कार्यक्षेत्र में दो टैब हैं — <strong>Existing Paras</strong> (पहले से लोड किए गए पैरा) और{" "}
          <strong>Fresh Para Entry</strong> (अपलोड किए गए पैरा)। दोनों में उत्तर भरें; प्रत्येक टैब में
          अलग-अलग Print / PDF और Download DOCX उपलब्ध हैं।
        </p>
      </div>

      <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <Upload className="h-3.5 w-3.5" aria-hidden="true" />
          JPG / PNG / WEBP तस्वीरें अपलोड करें — अधिकतम डेटा ब्राउज़र में ही रहता है।
        </li>
        <li className="flex items-center gap-2">
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          प्रिंट A4 लैंडस्केप में निकलता है ताकि चौड़ी तालिका पूरी छपे।
        </li>
      </ul>
    </div>
  );
}
