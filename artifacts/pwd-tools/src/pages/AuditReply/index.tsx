import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { FRESH_KEY, REPLIES_KEY, hasFreshParaContent, readAuditReplies, readFreshParas, replaceFreshDraft, type FreshPara } from "@/lib/audit-drafts";
import { FileText } from "lucide-react";
import { useState } from "react";
import AuditLanding from "./AuditLanding";
import AuditUploadStep from "./AuditUploadStep";
import AuditWorkspace, { AuditWorkspaceTabs } from "./AuditWorkspace";
import type { AuditStep, AuditTab, UploadedInput } from "./types";

type DraftSummary = { hasDraft: boolean; label?: string; tab: AuditTab };

/** What localStorage already holds, so the landing can offer "resume". */
function readDraftSummary(): DraftSummary {
  try {
    const replies = readAuditReplies(JSON.parse(localStorage.getItem(REPLIES_KEY) || "{}"));
    const filled = Object.values(replies).filter((r) => r.reply.trim() || r.comments.trim()).length;
    const fresh = readFreshParas(JSON.parse(localStorage.getItem(FRESH_KEY) || "[]"));
    const freshFilled = fresh.filter(hasFreshParaContent).length;

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
  const [step, setStep] = useState<AuditStep>("landing");
  const [tab, setTab] = useState<AuditTab>("existing");
  const [seedFresh, setSeedFresh] = useState<FreshPara[] | undefined>(undefined);
  const [draft, setDraft] = useState<DraftSummary>(readDraftSummary);

  const handleExit = () => {
    setDraft(readDraftSummary());
    setStep("landing");
  };
  const inWorkspace = step === "workspace";

  return (
    <ToolShell
      festive
      title="अंकेक्षण प्रतिवेदन उत्तर"
      subtitle="Audit Reply Tool — जिला प्रभाग II, उदयपुर"
      toolbar={inWorkspace && <AuditWorkspaceTabs tab={tab} onChange={setTab} />}
      actions={
        inWorkspace && (
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
        )
      }
    >
      {inWorkspace ? (
        <AuditWorkspace tab={tab} seedFresh={seedFresh} />
      ) : step === "upload" ? (
        <AuditUploadStep
          onBack={() => setStep("landing")}
          onDone={async (inputs, signal) => {
            const fresh = toFreshParas(inputs);
            await replaceFreshDraft(fresh, signal);
            if (signal.aborted) return;
            setSeedFresh(fresh);
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
