/**
 * Correspondence Page — dual-mode orchestrator
 *
 * • When VITE_API_URL is set  →  uses the real REST API (React Query)
 * • Otherwise                 →  falls back to localStorage (fully offline)
 *
 * All child components (LetterList, LetterForm, LetterDetail) are unchanged —
 * they receive the same props regardless of which data source is active.
 */
import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Mail, WifiOff } from "lucide-react";
import { useCallback, useState } from "react";
import { API_ENABLED, correspondenceApi } from "./api";
import LetterDetail from "./LetterDetail";
import LetterForm from "./LetterForm";
import LetterList from "./LetterList";
import { loadLetters, deleteLetter as lsDelete, getLetter as lsGet, updateLetter as lsUpdate, saveLetter } from "./storage";
import type { Letter, LetterFormData, View } from "./types";

// ── helpers to bridge CorrLetter (numeric id) ↔ Letter (string id) ────────

function apiLetterToLocal(l: {
  id: number; type: string; status: string; letterNumber: string; date: string;
  toName: string; toDesignation: string; toOffice: string;
  subject: string; reference?: string | null; body: string;
  fromName: string; fromDesignation: string; fromOffice: string;
  cc?: string | null; createdAt: string; updatedAt: string;
}): Letter {
  return {
    id: String(l.id),
    type: l.type as Letter["type"],
    status: l.status as Letter["status"],
    language: "hindi",           // API only stores Hindi fields
    letterNumber: l.letterNumber,
    date: l.date,
    toName: l.toName,
    toDesignation: l.toDesignation,
    toOffice: l.toOffice,
    toNameEn: "",
    toDesignationEn: "",
    toOfficeEn: "",
    subject: l.subject,
    subjectEn: "",
    reference: l.reference ?? "",
    referenceEn: "",
    body: l.body,
    bodyEn: "",
    fromName: l.fromName,
    fromDesignation: l.fromDesignation,
    fromOffice: l.fromOffice,
    fromNameEn: "",
    fromDesignationEn: "",
    fromOfficeEn: "",
    cc: l.cc ?? "",
    ccEn: "",
    createdAt: l.createdAt,
    updatedAt: l.updatedAt,
  };
}

function localToApiInput(data: LetterFormData) {
  return {
    type: data.type,
    status: data.status,
    letterNumber: data.letterNumber,
    date: data.date,
    toName: data.toName,
    toDesignation: data.toDesignation,
    toOffice: data.toOffice,
    subject: data.subject,
    reference: data.reference || undefined,
    body: data.body,
    fromName: data.fromName,
    fromDesignation: data.fromDesignation,
    fromOffice: data.fromOffice,
    cc: data.cc || undefined,
  };
}

// ── API-backed mode ───────────────────────────────────────────────────────

function CorrespondencePageAPI() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ name: "list" });

  const { data: apiLetters = [], isLoading, isError } = useQuery({
    queryKey: ["correspondence", "letters"],
    queryFn: () => correspondenceApi.listLetters(),
  });
  const letters: Letter[] = apiLetters.map(apiLetterToLocal);

  const createMut = useMutation({
    mutationFn: (data: LetterFormData) => correspondenceApi.createLetter(localToApiInput(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["correspondence"] }); setView({ name: "list" }); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LetterFormData }) =>
      correspondenceApi.updateLetter(id, localToApiInput(data)),
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: ["correspondence"] });
      setView({ name: "detail", id: String(id) });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => correspondenceApi.deleteLetter(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["correspondence"] }); setView({ name: "list" }); },
  });

  function handleCreate(data: LetterFormData) { createMut.mutate(data); }
  function handleUpdate(id: string, data: LetterFormData) { updateMut.mutate({ id: Number(id), data }); }
  function handleDelete(id: string) { deleteMut.mutate(Number(id)); }

  const currentLetter = view.name === "detail" || view.name === "edit"
    ? letters.find((l) => l.id === view.id) ?? null
    : null;

  return (
    <PageShell apiMode>
      {isLoading && <div className="py-20 text-center text-gray-400 text-sm">लोड हो रहा है…</div>}
      {isError && <div className="py-20 text-center text-red-500 text-sm">API से डेटा लाने में त्रुटि। localStorage मोड पर जाएं।</div>}
      {!isLoading && !isError && (
        <>
          {view.name === "list" && (
            <LetterList letters={letters} onNavigate={setView} onDelete={handleDelete} />
          )}
          {view.name === "new" && (
            <LetterForm initialType="new" onSubmit={handleCreate} onBack={() => setView({ name: "list" })} />
          )}
          {view.name === "reply" && (
            <LetterForm initialType="reply" onSubmit={handleCreate} onBack={() => setView({ name: "list" })} />
          )}
          {view.name === "edit" && currentLetter && (
            <LetterForm
              initialType={currentLetter.type}
              existing={currentLetter}
              onSubmit={(data) => handleUpdate(view.id, data)}
              onBack={() => setView({ name: "detail", id: view.id })}
            />
          )}
          {view.name === "detail" && currentLetter && (
            <LetterDetail letter={currentLetter} onNavigate={setView} onDelete={handleDelete} />
          )}
        </>
      )}
    </PageShell>
  );
}

// ── localStorage-backed mode (original, unchanged logic) ─────────────────

function CorrespondencePageLocal() {
  const [view, setView] = useState<View>({ name: "list" });
  const [letters, setLetters] = useState(() => loadLetters());
  const refresh = useCallback(() => setLetters(loadLetters()), []);

  function handleCreate(data: LetterFormData) { saveLetter(data); refresh(); setView({ name: "list" }); }
  function handleUpdate(id: string, data: LetterFormData) { lsUpdate(id, data); refresh(); setView({ name: "detail", id }); }
  function handleDelete(id: string) { lsDelete(id); refresh(); setView({ name: "list" }); }

  return (
    <PageShell apiMode={false}>
      {view.name === "list" && (
        <LetterList letters={letters} onNavigate={setView} onDelete={handleDelete} />
      )}
      {view.name === "new" && (
        <LetterForm initialType="new" onSubmit={handleCreate} onBack={() => setView({ name: "list" })} />
      )}
      {view.name === "reply" && (
        <LetterForm initialType="reply" onSubmit={handleCreate} onBack={() => setView({ name: "list" })} />
      )}
      {view.name === "edit" && (() => {
        const letter = lsGet(view.id);
        if (!letter) { setView({ name: "list" }); return null; }
        return (
          <LetterForm
            initialType={letter.type}
            existing={letter}
            onSubmit={(data) => handleUpdate(view.id, data)}
            onBack={() => setView({ name: "detail", id: view.id })}
          />
        );
      })()}
      {view.name === "detail" && (() => {
        const letter = lsGet(view.id);
        if (!letter) { setView({ name: "list" }); return null; }
        return <LetterDetail letter={letter} onNavigate={setView} onDelete={handleDelete} />;
      })()}
    </PageShell>
  );
}

// ── Shared page shell ─────────────────────────────────────────────────────

function PageShell({ children, apiMode }: { children: React.ReactNode; apiMode: boolean }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-blue-800 text-white px-6 py-4 shadow">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <Mail size={22} />
          <div>
            <h1 className="font-bold text-lg leading-tight">पत्र-व्यवहार प्रबंधन</h1>
            <p className="text-blue-200 text-xs">
              कार्यालय अधिशासी अभियंता, सा.नि.वि., जिला खण्ड–II, उदयपुर
            </p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {!apiMode && (
              <span
                title="API not configured — using browser localStorage"
                className="flex items-center gap-1 text-xs text-blue-300"
              >
                <WifiOff size={12} /> Offline
              </span>
            )}
            <span className="text-xs text-blue-300 hidden sm:block">
              सार्वजनिक निर्माण विभाग, राजस्थान सरकार
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6">{children}</div>
    </div>
  );
}

// ── Entry point — picks mode at import time ───────────────────────────────

export default function CorrespondencePage() {
  useDocumentTitle("Correspondence");
  return (
    <ToolShell title="Correspondence">
      {API_ENABLED ? <CorrespondencePageAPI /> : <CorrespondencePageLocal />}
    </ToolShell>
  );
}
