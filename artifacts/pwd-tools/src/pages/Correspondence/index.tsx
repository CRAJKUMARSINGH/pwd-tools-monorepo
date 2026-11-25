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
import OfficeApiAccess from "@/components/OfficeApiAccess";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CorrLetter } from "@workspace/api-zod";
import { Mail, WifiOff } from "lucide-react";
import { useCallback, useState } from "react";
import { API_ENABLED, correspondenceApi } from "./api";
import LetterDetail from "./LetterDetail";
import LetterForm from "./LetterForm";
import LetterList from "./LetterList";
import { loadLetters, deleteLetter as lsDelete, updateLetter as lsUpdate, saveLetter } from "./storage";
import type { Letter, LetterFormData, View } from "./types";

// ── helpers to bridge CorrLetter (numeric id) ↔ Letter (string id) ────────

function apiLetterToLocal(l: CorrLetter): Letter {
  return {
    ...l,
    id: String(l.id),
    language: l.language ?? "hindi",
    toNameEn: l.toNameEn ?? "",
    toDesignationEn: l.toDesignationEn ?? "",
    toOfficeEn: l.toOfficeEn ?? "",
    subjectEn: l.subjectEn ?? "",
    reference: l.reference ?? "",
    referenceEn: l.referenceEn ?? "",
    bodyEn: l.bodyEn ?? "",
    fromNameEn: l.fromNameEn ?? "",
    fromDesignationEn: l.fromDesignationEn ?? "",
    fromOfficeEn: l.fromOfficeEn ?? "",
    cc: l.cc ?? "",
    ccEn: l.ccEn ?? "",
    toMany: l.toMany ?? "",
  };
}

function showSaveError() {
  toast({
    title: "पत्र सहेजा नहीं जा सका / Could not save the letter",
    description: "Your entries are still in the form. Please try again.",
    variant: "destructive",
  });
}

const lettersQueryKey = ["correspondence", "letters"];

// ── API-backed mode ───────────────────────────────────────────────────────

function CorrespondencePageAPI() {
  const qc = useQueryClient();
  const [view, setView] = useState<View>({ name: "list" });

  const { data: apiLetters, isLoading, isError, refetch } = useQuery({
    queryKey: lettersQueryKey,
    queryFn: () => correspondenceApi.listLetters(),
  });
  const letters = (apiLetters ?? []).map(apiLetterToLocal);

  const createMut = useMutation({
    mutationFn: correspondenceApi.createLetter,
    onSuccess: (saved) => {
      qc.setQueryData<CorrLetter[]>(lettersQueryKey, current => [saved, ...(current ?? []).filter(letter => letter.id !== saved.id)]);
      setView({ name: "list" });
      void qc.invalidateQueries({ queryKey: lettersQueryKey });
    },
    onError: showSaveError,
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: LetterFormData }) =>
      correspondenceApi.updateLetter(id, data),
    onSuccess: saved => {
      qc.setQueryData<CorrLetter[]>(lettersQueryKey, current => (current ?? []).map(letter => letter.id === saved.id ? saved : letter));
      setView({ name: "detail", id: String(saved.id) });
      void qc.invalidateQueries({ queryKey: lettersQueryKey });
    },
    onError: showSaveError,
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => correspondenceApi.deleteLetter(id),
    onSuccess: (_result, id) => {
      qc.setQueryData<CorrLetter[]>(lettersQueryKey, current => (current ?? []).filter(letter => letter.id !== id));
      setView({ name: "list" });
      void qc.invalidateQueries({ queryKey: lettersQueryKey });
    },
    onError: () => toast({ title: "Could not delete the letter. Please try again.", variant: "destructive" }),
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
      {isError && !apiLetters && (
        <div className="space-y-3 py-12 text-center">
          <p role="alert" className="text-sm text-red-700">पत्र लोड नहीं हुए / Could not load the letters.</p>
          <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => void refetch()}>Try again</button>
        </div>
      )}
      {apiLetters && (
        <>
          {view.name === "list" && (
            <LetterList letters={letters} onNavigate={setView} onDelete={handleDelete} />
          )}
          {view.name === "new" && (
            <LetterForm initialType="new" onSubmit={handleCreate} saving={createMut.isPending} onBack={() => setView({ name: "list" })} />
          )}
          {view.name === "reply" && (
            <LetterForm initialType="reply" onSubmit={handleCreate} saving={createMut.isPending} onBack={() => setView({ name: "list" })} />
          )}
          {view.name === "edit" && currentLetter && (
            <LetterForm
              initialType={currentLetter.type}
              existing={currentLetter}
              saving={updateMut.isPending}
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

// ── localStorage-backed mode ─────────────────────────────────────────────

function CorrespondencePageLocal() {
  const [view, setView] = useState<View>({ name: "list" });
  const [letters, setLetters] = useState(() => loadLetters());
  const refresh = useCallback(() => setLetters(loadLetters()), []);

  function handleCreate(data: LetterFormData) {
    try {
      saveLetter(data);
      refresh();
      setView({ name: "list" });
    } catch {
      showSaveError();
    }
  }

  function handleUpdate(id: string, data: LetterFormData) {
    try {
      if (!lsUpdate(id, data)) {
        toast({ title: "This letter was removed. Your entries are still in the form.", variant: "destructive" });
        return;
      }
      refresh();
      setView({ name: "detail", id });
    } catch {
      showSaveError();
    }
  }

  function handleDelete(id: string) {
    try {
      lsDelete(id);
      refresh();
      setView({ name: "list" });
    } catch {
      toast({ title: "Could not delete the letter. Please try again.", variant: "destructive" });
    }
  }

  const currentLetter = view.name === "detail" || view.name === "edit"
    ? letters.find(letter => letter.id === view.id)
    : undefined;
  const showList = view.name === "list" || ((view.name === "edit" || view.name === "detail") && !currentLetter);

  return (
    <PageShell apiMode={false}>
      {showList && (
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
      {API_ENABLED
        ? <OfficeApiAccess><CorrespondencePageAPI /></OfficeApiAccess>
        : <CorrespondencePageLocal />}
    </ToolShell>
  );
}
