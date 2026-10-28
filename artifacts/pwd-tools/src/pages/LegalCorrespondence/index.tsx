/**
 * Legal Correspondence page — full CRUD for legal letters + style presets.
 * Self-contained inside pwd-tools; uses legalApi for data.
 * Requires VITE_API_URL to be set (shows error banner if not configured).
 */
import ToolShell from "@/components/ToolShell";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    ArrowLeft,
    CheckCircle2,
    Clock,
    Edit2,
    FileText,
    Loader2,
    Plus,
    Printer,
    Scale,
    Search,
    Settings,
    Trash2,
    WifiOff,
} from "lucide-react";
import { useState } from "react";
import { LEGAL_API_ENABLED, legalApi } from "./api";
import LetterPrintPreview from "./LetterPrintPreview";
import type { LegalLetterLocal, LegalView } from "./types";
import { DEFAULT_FROM_DESIGNATION, DEFAULT_FROM_NAME, DEFAULT_FROM_OFFICE } from "./types";

// ── Shared shell ──────────────────────────────────────────────────────────

function PageShell({ title, subtitle, onBack, actions, children }: {
    title: string; subtitle?: string;
    onBack?: () => void;
    actions?: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-indigo-900 text-white px-6 py-4 shadow">
                <div className="max-w-6xl mx-auto flex items-center gap-3">
                    {onBack && (
                        <button onClick={onBack} className="p-1.5 rounded hover:bg-indigo-800 transition-colors">
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <Scale size={20} />
                    <div className="flex-1">
                        <h1 className="font-bold text-base leading-tight">{title}</h1>
                        {subtitle && <p className="text-indigo-300 text-xs">{subtitle}</p>}
                    </div>
                    {actions}
                </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 py-6">{children}</div>
        </div>
    );
}

const LABEL = "block text-xs font-semibold text-gray-600 mb-1";
const INPUT = "w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500";
const TEXTAREA = INPUT + " resize-none";

// ── Dashboard ─────────────────────────────────────────────────────────────

function Dashboard({ onNavigate }: { onNavigate: (v: LegalView) => void }) {
    const { data: stats } = useQuery({ queryKey: ["legal", "stats"], queryFn: legalApi.getStats });
    const { data: recent = [] } = useQuery({ queryKey: ["legal", "recent"], queryFn: legalApi.getRecent });

    return (
        <PageShell title="Legal Correspondence" subtitle="Manage official legal letters and style presets"
            actions={
                <div className="flex gap-2">
                    <button onClick={() => onNavigate({ name: "styles" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 rounded text-xs font-semibold hover:bg-indigo-600">
                        <Settings size={13} /> Styles
                    </button>
                    <button onClick={() => onNavigate({ name: "new" })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-900 rounded text-xs font-semibold hover:bg-indigo-50">
                        <Plus size={13} /> New Letter
                    </button>
                </div>
            }
        >
            <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                    { label: "Total", value: stats?.total ?? "—", icon: <FileText size={18} className="text-gray-400" /> },
                    { label: "Drafts", value: stats?.draft ?? "—", icon: <Clock size={18} className="text-amber-500" /> },
                    { label: "Final", value: stats?.final ?? "—", icon: <CheckCircle2 size={18} className="text-emerald-600" /> },
                ].map((s) => (
                    <div key={s.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-4 shadow-sm">
                        {s.icon}
                        <div>
                            <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                            <div className="text-xs text-gray-500 font-medium uppercase tracking-wide">{s.label}</div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
                <div className="px-5 py-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <span className="font-semibold text-gray-800">Recent Letters</span>
                    <button onClick={() => onNavigate({ name: "list" })} className="text-xs text-indigo-600 hover:underline">View all →</button>
                </div>
                {recent.length === 0
                    ? <p className="text-center text-gray-400 text-sm py-10">No letters yet. Create one to get started.</p>
                    : recent.map((l) => (
                        <div key={l.id} className="flex items-center gap-4 px-5 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer"
                            onClick={() => onNavigate({ name: "edit", id: l.id })}>
                            <div className={`p-1.5 rounded ${l.status === "draft" ? "bg-amber-100" : "bg-emerald-100"}`}>
                                {l.status === "draft" ? <Edit2 size={13} className="text-amber-700" /> : <CheckCircle2 size={13} className="text-emerald-700" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{l.subject || "Untitled"}</p>
                                <p className="text-xs text-gray-500">{l.letterNumber ?? "—"} · {l.toName ?? l.toAddress.split("\n")[0]}</p>
                            </div>
                            <span className="text-xs text-gray-400">{l.date ?? ""}</span>
                        </div>
                    ))
                }
            </div>
        </PageShell>
    );
}

// ── Letter list ───────────────────────────────────────────────────────────

function LetterList({ onNavigate }: { onNavigate: (v: LegalView) => void }) {
    const qc = useQueryClient();
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "final">("all");
    const { data: letters = [], isLoading } = useQuery({
        queryKey: ["legal", "letters", search, statusFilter],
        queryFn: () => legalApi.listLetters({
            search: search || undefined,
            status: statusFilter !== "all" ? statusFilter : undefined,
        }),
    });
    const deleteMut = useMutation({
        mutationFn: legalApi.deleteLetter,
        onSuccess: () => qc.invalidateQueries({ queryKey: ["legal"] }),
    });

    return (
        <PageShell title="Correspondence Ledger" subtitle="All official legal letters"
            onBack={() => onNavigate({ name: "dashboard" })}
            actions={
                <button onClick={() => onNavigate({ name: "new" })}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-900 rounded text-xs font-semibold hover:bg-indigo-50">
                    <Plus size={13} /> New
                </button>
            }
        >
            <div className="flex gap-3 mb-4">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input className={INPUT + " pl-8"} placeholder="Search subject, number, recipient…"
                        value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                {(["all", "draft", "final"] as const).map((v) => (
                    <button key={v} onClick={() => setStatusFilter(v)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${statusFilter === v
                            ? "bg-indigo-700 text-white border-indigo-700" : "bg-white text-gray-600 border-gray-300 hover:border-indigo-400"}`}>
                        {v === "all" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                {isLoading
                    ? <div className="py-16 text-center text-gray-400"><Loader2 size={24} className="mx-auto animate-spin" /></div>
                    : letters.length === 0
                        ? <div className="py-16 text-center text-gray-400 text-sm">No letters found.</div>
                        : letters.map((l) => (
                            <div key={l.id} className="flex items-center gap-4 px-5 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => onNavigate({ name: "edit", id: l.id })}>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-xs font-mono text-gray-500">{l.letterNumber ?? "—"}</span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${l.status === "final"
                                            ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>
                                            {l.status}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-auto">{l.date ?? ""}</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 truncate">{l.subject}</p>
                                    <p className="text-xs text-gray-500 truncate">To: {l.toName ?? l.toAddress.split("\n")[0]}</p>
                                </div>
                                <div className="flex items-center gap-1">
                                    <button title="Print" onClick={() => onNavigate({ name: "print", id: l.id })}
                                        className="p-1.5 rounded hover:bg-indigo-50 text-gray-400 hover:text-indigo-700 transition-colors">
                                        <Printer size={14} />
                                    </button>
                                    <button title="Delete" onClick={() => {
                                        if (confirm("Delete this letter?")) deleteMut.mutate(l.id);
                                    }} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                }
            </div>
        </PageShell>
    );
}

// ── Letter form (new + edit) ──────────────────────────────────────────────

type FormState = Omit<LegalLetterLocal, "id" | "createdAt" | "updatedAt" | "styleName">;

function emptyForm(): FormState {
    return {
        letterNumber: "", date: "", toName: "", toAddress: "", subject: "",
        salutation: "Sir/Madam,", body: "", hierarchy: [], copyTo: [],
        closing: "Yours faithfully,", fromName: DEFAULT_FROM_NAME,
        fromDesignation: DEFAULT_FROM_DESIGNATION, fromOffice: DEFAULT_FROM_OFFICE,
        styleId: null, status: "draft",
    };
}

function fromApiToForm(l: LegalLetterLocal): FormState {
    return {
        letterNumber: l.letterNumber ?? null,
        date: l.date ?? "",
        toName: l.toName ?? null,
        toAddress: l.toAddress ?? "",
        subject: l.subject ?? "",
        salutation: l.salutation ?? null,
        body: l.body ?? "",
        hierarchy: l.hierarchy ?? [],
        copyTo: l.copyTo ?? [],
        closing: l.closing ?? null,
        fromName: l.fromName ?? null,
        fromDesignation: l.fromDesignation ?? null,
        fromOffice: l.fromOffice ?? null,
        styleId: l.styleId ?? null,
        status: (l.status as LegalLetterLocal["status"]) ?? "draft",
    };
}

function LetterFormView({ id, onNavigate }: { id?: number; onNavigate: (v: LegalView) => void }) {
    const qc = useQueryClient();
    const isEdit = id != null;

    const { data: existing, isLoading: loadingExisting } = useQuery({
        queryKey: ["legal", "letter", id],
        queryFn: () => legalApi.getLetter(id!),
        enabled: isEdit,
    });
    const { data: styles = [] } = useQuery({ queryKey: ["legal", "styles"], queryFn: legalApi.listStyles });
    const { data: selectedStyle } = useQuery({
        queryKey: ["legal", "style", existing?.styleId],
        queryFn: () => legalApi.getStyle(existing!.styleId!),
        enabled: !!(existing?.styleId),
    });

    const [form, setForm] = useState<FormState>(emptyForm);
    const [initialised, setInitialised] = useState(false);
    if (existing && !initialised) { setForm(fromApiToForm(existing as LegalLetterLocal)); setInitialised(true); }

    const createMut = useMutation({
        mutationFn: (data: FormState) => legalApi.createLetter({
            ...data,
            letterNumber: data.letterNumber ?? undefined,
            toName: data.toName ?? undefined,
            salutation: data.salutation ?? undefined,
            closing: data.closing ?? undefined,
            fromName: data.fromName ?? undefined,
            fromDesignation: data.fromDesignation ?? undefined,
            fromOffice: data.fromOffice ?? undefined,
            styleId: data.styleId ?? undefined,
        }),
        onSuccess: (res) => { qc.invalidateQueries({ queryKey: ["legal"] }); onNavigate({ name: "edit", id: res.id }); },
    });
    const updateMut = useMutation({
        mutationFn: (data: FormState) => legalApi.updateLetter(id!, {
            ...data,
            letterNumber: data.letterNumber ?? undefined,
            toName: data.toName ?? undefined,
            salutation: data.salutation ?? undefined,
            closing: data.closing ?? undefined,
            fromName: data.fromName ?? undefined,
            fromDesignation: data.fromDesignation ?? undefined,
            fromOffice: data.fromOffice ?? undefined,
            styleId: data.styleId ?? undefined,
        }),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["legal"] }),
    });
    const finaliseMut = useMutation({
        mutationFn: () => legalApi.finalizeLetter(id!),
        onSuccess: () => qc.invalidateQueries({ queryKey: ["legal", "letter", id] }),
    });

    function set<K extends keyof FormState>(k: K, v: FormState[K]) { setForm((p) => ({ ...p, [k]: v })); }

    const isFinal = existing?.status === "final";

    if (isEdit && loadingExisting) return (
        <PageShell title="Loading…" onBack={() => onNavigate({ name: "list" })}>
            <div className="py-20 text-center"><Loader2 size={28} className="mx-auto animate-spin text-indigo-400" /></div>
        </PageShell>
    );

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Toolbar */}
            <div className="bg-indigo-900 text-white px-6 py-3 flex items-center gap-3 shadow sticky top-0 z-20">
                <button onClick={() => onNavigate({ name: "list" })} className="p-1.5 rounded hover:bg-indigo-800"><ArrowLeft size={16} /></button>
                <Scale size={16} />
                <span className="font-bold text-sm flex-1">{isEdit ? (existing?.letterNumber || "Edit Letter") : "New Letter"}</span>
                {isFinal && <span className="text-xs bg-emerald-500 text-white px-2 py-0.5 rounded-full font-semibold">FINAL</span>}
                <div className="flex gap-2">
                    {isEdit && !isFinal && (
                        <button onClick={() => { if (confirm("Finalise this letter?")) finaliseMut.mutate(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 rounded text-xs font-semibold hover:bg-emerald-500">
                            <CheckCircle2 size={13} /> Finalise
                        </button>
                    )}
                    {isEdit && (
                        <button onClick={() => onNavigate({ name: "print", id: id! })}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 rounded text-xs font-semibold hover:bg-indigo-600">
                            <Printer size={13} /> Print
                        </button>
                    )}
                    {!isFinal && (
                        <button
                            onClick={() => isEdit ? updateMut.mutate(form) : createMut.mutate(form)}
                            disabled={createMut.isPending || updateMut.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-900 rounded text-xs font-semibold hover:bg-indigo-50 disabled:opacity-60">
                            {(createMut.isPending || updateMut.isPending) ? <Loader2 size={12} className="animate-spin" /> : null}
                            Save
                        </button>
                    )}
                </div>
            </div>
            {/* Split layout */}
            <div className="flex gap-0 h-[calc(100vh-52px)]">
                {/* Form panel */}
                <div className={`w-[420px] shrink-0 bg-white border-r border-gray-200 overflow-y-auto p-5 flex flex-col gap-4 ${isFinal ? "pointer-events-none opacity-60" : ""}`}>
                    <div className="grid grid-cols-2 gap-3">
                        <div><label className={LABEL}>Letter No.</label>
                            <input className={INPUT} value={form.letterNumber ?? ""} onChange={(e) => set("letterNumber", e.target.value)} placeholder="No./Year" /></div>
                        <div><label className={LABEL}>Date</label>
                            <input className={INPUT} value={form.date} onChange={(e) => set("date", e.target.value)} placeholder="DD.MM.YYYY" /></div>
                    </div>
                    <div><label className={LABEL}>To — Name</label>
                        <input className={INPUT} value={form.toName ?? ""} onChange={(e) => set("toName", e.target.value)} /></div>
                    <div><label className={LABEL}>To — Address</label>
                        <textarea className={TEXTAREA} rows={3} value={form.toAddress} onChange={(e) => set("toAddress", e.target.value)} /></div>
                    <div><label className={LABEL}>Subject</label>
                        <input className={INPUT} value={form.subject} onChange={(e) => set("subject", e.target.value)} /></div>
                    <div><label className={LABEL}>Salutation</label>
                        <input className={INPUT} value={form.salutation ?? ""} onChange={(e) => set("salutation", e.target.value)} /></div>
                    <div><label className={LABEL}>Body</label>
                        <textarea className={TEXTAREA} rows={10} value={form.body} onChange={(e) => set("body", e.target.value)} /></div>
                    <div><label className={LABEL}>Closing</label>
                        <input className={INPUT} value={form.closing ?? ""} onChange={(e) => set("closing", e.target.value)} /></div>
                    <div><label className={LABEL}>Copy To (one per line)</label>
                        <textarea className={TEXTAREA} rows={3} value={(form.copyTo ?? []).join("\n")}
                            onChange={(e) => set("copyTo", e.target.value.split("\n"))} /></div>
                    <div className="grid grid-cols-3 gap-3">
                        <div><label className={LABEL}>From Name</label><input className={INPUT} value={form.fromName ?? ""} onChange={(e) => set("fromName", e.target.value)} /></div>
                        <div><label className={LABEL}>Designation</label><input className={INPUT} value={form.fromDesignation ?? ""} onChange={(e) => set("fromDesignation", e.target.value)} /></div>
                        <div><label className={LABEL}>Office</label><input className={INPUT} value={form.fromOffice ?? ""} onChange={(e) => set("fromOffice", e.target.value)} /></div>
                    </div>
                    {styles.length > 0 && (
                        <div><label className={LABEL}>Style Preset</label>
                            <select className={INPUT} value={form.styleId ?? ""}
                                onChange={(e) => set("styleId", e.target.value ? Number(e.target.value) : null)}>
                                <option value="">— Default —</option>
                                {styles.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
                {/* Live preview */}
                <div className="flex-1 overflow-auto bg-gray-200 flex items-start justify-center p-8">
                    <div style={{ transform: "scale(0.9)", transformOrigin: "top center" }}>
                        <LetterPrintPreview letter={form} style={selectedStyle} />
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Print view ────────────────────────────────────────────────────────────

function PrintView({ id, onNavigate }: { id: number; onNavigate: (v: LegalView) => void }) {
    const { data: letter, isLoading } = useQuery({
        queryKey: ["legal", "letter", id], queryFn: () => legalApi.getLetter(id),
    });
    const { data: style } = useQuery({
        queryKey: ["legal", "style", letter?.styleId],
        queryFn: () => legalApi.getStyle(letter!.styleId!),
        enabled: !!(letter?.styleId),
    });

    if (isLoading) return <div className="h-screen flex items-center justify-center"><Loader2 size={28} className="animate-spin text-gray-400" /></div>;

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="no-print bg-white px-6 py-3 border-b flex items-center justify-between shadow sticky top-0 z-20">
                <div>
                    <p className="font-bold text-gray-900">Print Preview</p>
                    <p className="text-xs text-gray-500">Press Ctrl+P to print · Esc to go back</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => onNavigate({ name: "edit", id })}
                        className="px-4 py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50">Cancel</button>
                    <button onClick={() => window.print()}
                        className="px-4 py-2 bg-indigo-700 text-white rounded text-sm font-medium hover:bg-indigo-800">Print</button>
                </div>
            </div>
            <div className="flex justify-center p-8 no-print-padding">
                {letter && <LetterPrintPreview letter={letter} style={style} printMode />}
            </div>
        </div>
    );
}

// ── Styles manager ────────────────────────────────────────────────────────

function StylesManager({ onNavigate }: { onNavigate: (v: LegalView) => void }) {
    const qc = useQueryClient();
    const { data: styles = [], isLoading } = useQuery({ queryKey: ["legal", "styles"], queryFn: legalApi.listStyles });
    const createMut = useMutation({ mutationFn: legalApi.createStyle, onSuccess: () => qc.invalidateQueries({ queryKey: ["legal", "styles"] }) });
    const deleteMut = useMutation({ mutationFn: legalApi.deleteStyle, onSuccess: () => qc.invalidateQueries({ queryKey: ["legal", "styles"] }) });

    return (
        <PageShell title="Style Presets" subtitle="Margins, fonts & spacing for print output"
            onBack={() => onNavigate({ name: "dashboard" })}
            actions={
                <button onClick={() => createMut.mutate({
                    name: `Preset-${Date.now()}`, marginTopMm: 25, marginBottomMm: 25,
                    marginLeftMm: 25, marginRightMm: 25, paragraphSpacingPx: 0,
                    fontSize: "11pt", lineHeight: "1.15", fontFamily: "Mangal, serif", isDefault: false,
                })} className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-indigo-900 rounded text-xs font-semibold hover:bg-indigo-50">
                    <Plus size={13} /> New Preset
                </button>
            }
        >
            {isLoading
                ? <div className="py-16 text-center"><Loader2 size={24} className="mx-auto animate-spin text-indigo-400" /></div>
                : styles.length === 0
                    ? <p className="text-center text-gray-400 py-10 text-sm">No style presets yet.</p>
                    : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {styles.map((s) => (
                            <div key={s.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                                <div className="flex justify-between items-start mb-3">
                                    <span className="font-bold text-gray-900">{s.name}</span>
                                    <button onClick={() => { if (confirm("Delete this preset?")) deleteMut.mutate(s.id); }}
                                        className="p-1 text-red-400 hover:text-red-600 rounded hover:bg-red-50"><Trash2 size={13} /></button>
                                </div>
                                <div className="text-xs text-gray-500 space-y-1">
                                    <p>Margins: T{s.marginTopMm} B{s.marginBottomMm} L{s.marginLeftMm} R{s.marginRightMm} mm</p>
                                    <p>Font: {s.fontFamily.split(",")[0].replace(/'/g, "")} · {s.fontSize} · {s.lineHeight}lh</p>
                                </div>
                            </div>
                        ))}
                    </div>
            }
        </PageShell>
    );
}

// ── Root entry point ──────────────────────────────────────────────────────

export default function LegalCorrespondencePage() {
    useDocumentTitle("Legal Correspondence");
    const [view, setView] = useState<LegalView>({ name: "dashboard" });

    if (!LEGAL_API_ENABLED) {
        return (
            <ToolShell title="Legal Correspondence">
                <div className="min-h-[100dvh] bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <WifiOff size={40} className="mx-auto text-gray-300 mb-4" />
                        <h2 className="text-lg font-bold text-gray-700 mb-2">API Not Configured</h2>
                        <p className="text-sm text-gray-500">
                            Set the <code className="bg-gray-100 px-1 rounded">VITE_API_URL</code> environment
                            variable to the running <code className="bg-gray-100 px-1 rounded">api-server</code> origin,
                            then reload the page.
                        </p>
                    </div>
                </div>
            </ToolShell>
        );
    }

    if (view.name === "dashboard") return <ToolShell title="Legal Correspondence"><Dashboard onNavigate={setView} /></ToolShell>;
    if (view.name === "list") return <ToolShell title="Legal Correspondence"><LetterList onNavigate={setView} /></ToolShell>;
    if (view.name === "new") return <ToolShell title="Legal Correspondence"><LetterFormView onNavigate={setView} /></ToolShell>;
    if (view.name === "edit") return <ToolShell title="Legal Correspondence"><LetterFormView id={view.id} onNavigate={setView} /></ToolShell>;
    if (view.name === "print") return <ToolShell title="Legal Correspondence"><PrintView id={view.id} onNavigate={setView} /></ToolShell>;
    if (view.name === "styles") return <ToolShell title="Legal Correspondence"><StylesManager onNavigate={setView} /></ToolShell>;
    return null;
}
