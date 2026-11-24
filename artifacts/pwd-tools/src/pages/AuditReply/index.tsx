import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import type { FreshPara } from "@/hooks/useFreshParas";
import { ArrowLeft, FileText } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import AuditLanding from "./AuditLanding";
import AuditUploadStep from "./AuditUploadStep";
import AuditWorkspace from "./AuditWorkspace";
import type { AuditStep, AuditTab, UploadedInput } from "./types";

const REPLIES_KEY = "audit-reply-data";
const FRESH_KEY = "audit-fresh-paras";

type DraftSummary = { hasDraft: boolean; label?: string; tab: AuditTab };

/** What localStorage already holds, so the landing can offer "resume". */
function readDraftSummary(): DraftSummary {
  try {
    const replies = JSON.parse(localStorage.getItem(REPLIES_KEY) || "{}") as Record<
      string,
      { reply?: string; comments?: string } | undefined
    >;
    const filled = Object.values(replies).filter((r) => r?.reply?.trim() || r?.comments?.trim()).length;

    const fresh = JSON.parse(localStorage.getItem(FRESH_KEY) || "[]") as FreshPara[];
    const freshFilled = fresh.filter(
      (p) => p.header?.trim() || p.gist?.trim() || p.obs?.trim() || p.reply?.trim(),
    ).length;

    if (!filled && !freshFilled) return { hasDraft: false, tab: "existing" };

    const parts: string[] = [];
    if (filled) parts.push(`${filled} existing para${filled === 1 ? "" : "s"} filled`);
    if (freshFilled) parts.push(`${freshFilled} fresh para${freshFilled === 1 ? "" : "s"} filled`);

    return {
      hasDraft: true,
      label: parts.join(" · "),
      tab: filled || !freshFilled ? "existing" : "fresh",
    };
  } catch {
    /* localStorage can be unavailable (Safari private mode) */
    return { hasDraft: false, tab: "existing" };
  }
}

/** One uploaded image → one fresh para card. */
function toFreshParas(inputs: UploadedInput[]): FreshPara[] {
  return inputs.map((input, i) => ({
    id: input.id,
    no: String(i + 1),
    header: "",
    gist: "",
    resp: "",
    obs: "",
    imageDataUrl: input.previewUrl,
    reply: "",
    comments: "",
  }));
}

/**
 * Routed page for `/audit-reply` — a thin shell over the three steps.
 *
 * `AuditWorkspace` is the ported original page and still owns the landscape
 * `@page` rule and the `audit-print` scope, so nothing is injected here.
 */
export default function AuditReplyPage() {
  useDocumentTitle("Audit Reply — जिला प्रभाग II उदयपुर");
  const [, navigate] = useLocation();
  const [step, setStep] = useState<AuditStep>("landing");
  const [tab, setTab] = useState<AuditTab>("existing");
  const [seedFresh, setSeedFresh] = useState<FreshPara[] | undefined>(undefined);
  const [draft, setDraft] = useState<DraftSummary>(readDraftSummary);

  // Workspace is full-screen. We render ONE authoritative sticky header here
  // so there is never a competing header inside AuditWorkspace fighting for
  // top-0 — that was the root cause of the Back-to-Home bar being obscured.
  if (step === "workspace") {
    const handleExit = () => {
      setDraft(readDraftSummary());
      setStep("landing");
    };
    return (
      <>
        {/* ── Single combined sticky header — Back to Home + Menu ── */}
        <header
          className="hide-on-print sticky top-0 z-40 flex items-center gap-2 border-b bg-primary px-3 py-2 text-primary-foreground shadow-md"
          style={{ minHeight: "41px" }}
        >
          <button
            type="button"
            onClick={() => navigate("/home")}
            aria-label="Back to Home"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary-foreground/40 bg-white/15 px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/30 active:bg-white/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            ← Back to Home
          </button>
          <button
            type="button"
            onClick={handleExit}
            aria-label="Back to audit menu"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary-foreground/30 bg-white/10 px-3 py-1.5 text-xs font-semibold transition-colors hover:bg-white/20"
            title="Back to the audit menu"
          >
            <FileText className="h-3.5 w-3.5" aria-hidden="true" />
            Menu
          </button>
          <span className="truncate text-xs font-semibold opacity-80">
            Audit Reply — जिला प्रभाग II, उदयपुर
          </span>
        </header>
        <AuditWorkspace
          initialTab={tab}
          seedFresh={seedFresh}
          onExit={handleExit}
        />
      </>
    );
  }

  return (
    <ToolShell
      title="अंकेक्षण प्रतिवेदन उत्तर"
      subtitle="Audit Reply Tool — जिला प्रभाग II, उदयपुर"
    >
      {step === "upload" ? (
        <AuditUploadStep
          onBack={() => setStep("landing")}
          onDone={(inputs) => {
            setSeedFresh(toFreshParas(inputs));
            setTab("fresh");
            setStep("workspace");
          }}
        />
      ) : (
        <AuditLanding
          hasDraft={draft.hasDraft}
          draftLabel={draft.label}
          onNew={() => {
            setSeedFresh(undefined);
            setTab("existing");
            setStep("upload");
          }}
          onResume={() => {
            setSeedFresh(undefined);
            setTab(draft.tab);
            setStep("workspace");
          }}
        />
      )}
    </ToolShell>
  );
}
