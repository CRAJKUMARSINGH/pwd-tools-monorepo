/**
 * Audit Reply Page
 * ─────────────────
 * Tab 1 — Existing Paras  : pre-loaded CASES, reply + comments input, DOCX + Print
 * Tab 2 — Fresh Para Entry : image upload, manual para fields, reply + comments, DOCX + Print
 */
import { CASES } from "@/data/audit-cases";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFreshParas, type FreshPara } from "@/hooks/useFreshParas";
import { useTransliterate } from "@/hooks/useTransliterate";
import { generateDocx } from "@/lib/generate-docx";
import { generateFreshDocx } from "@/lib/generate-fresh-docx";
import { usePrintPage } from "@/lib/printPage";
import { saveSnapshot, VAULT_TOOL } from "@/lib/vault";
import {
  ArrowLeft,
  Download,
  FileText,
  ImagePlus,
  Languages,
  Plus,
  Printer,
  Trash2,
  X
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────
function loadReplies() {
  try {
    const d = localStorage.getItem("audit-reply-data");
    return d ? JSON.parse(d) : {};
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ReplyBox — textarea with per-instance Roman→Hindi toggle
// ─────────────────────────────────────────────────────────────────────────────
interface ReplyBoxProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  bgClass: string;
  /** Show the HI/EN transliteration toggle (reply column only) */
  withTranslit?: boolean;
  minHeight?: string;
}

function ReplyBox({
  value,
  onChange,
  placeholder,
  bgClass,
  withTranslit = false,
  minHeight = "min-h-[220px]",
}: ReplyBoxProps) {
  const [hi, setHi] = useState(withTranslit); // ON by default for reply cols
  const { handleKeyDown } = useTransliterate(value, onChange);

  return (
    <div className={`relative w-full h-full ${bgClass}`}>
      {withTranslit && (
        <button
          type="button"
          title={hi ? "Roman→Hindi ON — click to switch off" : "Roman→Hindi OFF — click to switch on"}
          onClick={() => setHi(p => !p)}
          className={`absolute top-2 right-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border transition-colors select-none ${hi
            ? "bg-orange-500 text-white border-orange-600 shadow"
            : "bg-gray-100 text-gray-500 border-gray-300"
            }`}
        >
          <Languages className="w-3 h-3" />
          {hi ? "HI" : "EN"}
        </button>
      )}
      <textarea
        className={`w-full h-full ${minHeight} p-3 pr-14 bg-transparent resize-y outline-none placeholder:text-foreground/30 text-sm leading-relaxed`}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={hi ? handleKeyDown : undefined}
        lang={hi ? "hi" : undefined}
        spellCheck={false}
      />
      {hi && (
        <span className="absolute bottom-1.5 left-3 text-[9px] text-orange-400 pointer-events-none select-none">
          Roman type → Space / Enter = Hindi
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shared table chrome
// ─────────────────────────────────────────────────────────────────────────────
function TableHead({ showTranslitHint = false }: { showTranslitHint?: boolean }) {
  return (
    <thead>
      <tr className="bg-muted text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
        <th className="border-r border-border p-2 w-14 text-center">Para</th>
        <th className="border-r border-border p-2 w-[17%] text-left">संक्षिप्त विवरण</th>
        <th className="border-r border-border p-2 w-[22%] text-left">अंकेक्षण आपत्ति</th>
        <th className="border-r border-border p-2 w-[24%] text-left">
          उत्तर (Reply)
          {showTranslitHint && (
            <span className="ml-1 normal-case font-normal text-orange-400 tracking-normal">
              — Roman→Hindi
            </span>
          )}
        </th>
        <th className="p-2 w-[33%] text-left">उच्चाधिकारी की टिप्पणी</th>
      </tr>
    </thead>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — Existing Paras
// ─────────────────────────────────────────────────────────────────────────────
function ExistingParasTab() {
  const [replies, setReplies] = useState<Record<string, { reply: string; comments: string }>>(
    loadReplies
  );

  // Persist to localStorage + vault on every change
  useEffect(() => {
    localStorage.setItem("audit-reply-data", JSON.stringify(replies));
    const filled = Object.values(replies).filter(r => r.reply.trim() || r.comments.trim()).length;
    if (filled > 0) {
      saveSnapshot(
        VAULT_TOOL.AUDIT_REPLY,
        `Audit Reply — ${filled} para(s) filled — ${new Date().toLocaleString("en-IN")}`,
        { paras: CASES.length, replies },
      ).catch(() => { });
    }
  }, [replies]);

  const setField = useCallback((no: string, field: "reply" | "comments", v: string) => {
    setReplies(prev => ({ ...prev, [no]: { ...prev[no], [field]: v } }));
  }, []);

  const handleDocx = async () => { await generateDocx(CASES, replies); };

  const handlePrint = () => {
    document.title = "Audit Reply — जिला प्रभाग II उदयपुर";
    window.print();
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Tool bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border print:hidden">
        <span className="text-xs text-muted-foreground">
          {CASES.length} paras loaded &nbsp;·&nbsp; Replies auto-saved
        </span>
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold shadow transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
          <button
            onClick={handleDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download DOCX
          </button>
        </div>
      </div>

      {/* Table */}
      <div id="print-existing" className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <TableHead showTranslitHint />
          <tbody>
            {CASES.map(c => (
              <React.Fragment key={c.no}>
                {/* header row */}
                <tr className="border-t-2 border-border/60">
                  <td
                    rowSpan={2}
                    className="border-r border-b border-border p-2 text-center align-top font-bold text-lg text-primary/80 bg-muted/20"
                  >
                    {c.no}
                  </td>
                  <td
                    colSpan={4}
                    className="border-b border-border p-2 bg-muted/10 font-medium whitespace-pre-wrap text-[11px] text-foreground/75 leading-relaxed font-mono"
                  >
                    {c.header}
                  </td>
                </tr>
                {/* data row */}
                <tr className="border-b border-border">
                  <td className="border-r border-border p-3 font-semibold whitespace-pre-wrap align-top text-foreground/90 leading-relaxed text-xs">
                    {c.gist}
                  </td>
                  <td className="border-r border-border p-3 whitespace-pre-wrap align-top leading-relaxed text-xs">
                    {c.obs}
                  </td>
                  <td className="border-r border-border p-0 align-top">
                    <ReplyBox
                      value={replies[c.no]?.reply || ""}
                      onChange={v => setField(c.no, "reply", v)}
                      placeholder="यहाँ उत्तर टाइप करें… (Roman → Space = Hindi)"
                      bgClass="bg-[#FFFDE7] dark:bg-[#3a3820] focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-400"
                      withTranslit
                    />
                  </td>
                  <td className="p-0 align-top bg-[#E3F2FD] dark:bg-[#1a3a5a] focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-400">
                    <textarea
                      className="w-full min-h-[220px] p-3 bg-transparent resize-y outline-none placeholder:text-foreground/30 text-sm leading-relaxed"
                      placeholder="यहाँ टिप्पणी टाइप करें..."
                      value={replies[c.no]?.comments || ""}
                      onChange={e => setField(c.no, "comments", e.target.value)}
                    />
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 2 — Fresh Para Entry
// ─────────────────────────────────────────────────────────────────────────────

/** Single fresh-para card: image + 4 text fields + reply + comments */
function FreshParaCard({
  para,
  onUpdate,
  onRemove,
}: {
  para: FreshPara;
  onUpdate: <K extends keyof FreshPara>(field: K, value: FreshPara[K]) => void;
  onRemove: () => void;
}) {
  const imgRef = useRef<HTMLInputElement>(null);

  const handleImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      onUpdate("imageDataUrl", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="rounded-xl border-2 border-amber-200 bg-white shadow-sm overflow-hidden mb-6 print:break-inside-avoid">
      {/* Para header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200">
        <span className="font-bold text-amber-900 text-base">Para {para.no}</span>
        <button
          onClick={onRemove}
          title="Remove this para"
          className="p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-700 transition-colors print:hidden"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4">
        {/* ── Left: image upload ──────────────────────────────────────── */}
        <div className="fresh-image-col flex flex-col gap-2">
          <div
            className="relative flex items-center justify-center rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 cursor-pointer overflow-hidden print:hidden"
            style={{ minHeight: 180 }}
            onClick={() => imgRef.current?.click()}
          >
            {para.imageDataUrl ? (
              <>
                <img
                  src={para.imageDataUrl}
                  alt={`Para ${para.no} source`}
                  className="w-full h-full object-contain max-h-[260px]"
                />
                <button
                  type="button"
                  title="Remove image"
                  onClick={e => { e.stopPropagation(); onUpdate("imageDataUrl", undefined); }}
                  className="absolute top-1.5 right-1.5 bg-white/90 rounded-full p-0.5 shadow hover:bg-red-100 text-red-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-amber-500 py-6 px-4 text-center">
                <ImagePlus className="w-8 h-8" />
                <span className="text-xs font-medium">Click to upload audit para image</span>
                <span className="text-[10px] text-amber-400">JPG / PNG / WEBP</span>
              </div>
            )}
          </div>
          <input
            ref={imgRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImage}
          />
          <p className="text-[10px] text-gray-400 text-center print:hidden">
            Image stays in browser only — not saved to DOCX
          </p>
        </div>

        {/* ── Right: form fields ──────────────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {/* Header */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              Package / Work Header
            </label>
            <textarea
              className="w-full rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-mono leading-relaxed resize-y outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 min-h-[72px]"
              placeholder="Package No. / Contractor / W.O. No. / Agreement / Amount / Dates …"
              value={para.header}
              onChange={e => onUpdate("header", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Gist */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                संक्षिप्त विवरण (Gist)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-200 bg-[#fff9e6] px-3 py-2 text-xs leading-relaxed resize-y outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 min-h-[72px]"
                placeholder="आपत्ति का संक्षिप्त विवरण..."
                value={para.gist}
                onChange={e => onUpdate("gist", e.target.value)}
              />
            </div>
            {/* Responsibility */}
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                उत्तरदायित्व (Responsibility)
              </label>
              <textarea
                className="w-full rounded-md border border-gray-200 bg-[#fff9e6] px-3 py-2 text-xs leading-relaxed resize-y outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 min-h-[72px]"
                placeholder="सहायक अभियंता / खण्डीय लेखाकार ..."
                value={para.resp}
                onChange={e => onUpdate("resp", e.target.value)}
              />
            </div>
          </div>

          {/* Observation */}
          <div>
            <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              अंकेक्षण आपत्ति (Observation)
            </label>
            <textarea
              className="w-full rounded-md border border-gray-200 bg-[#fff9e6] px-3 py-2 text-xs leading-relaxed resize-y outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-300 min-h-[88px]"
              placeholder="अंकेक्षण टीम की पूर्ण आपत्ति यहाँ टाइप करें..."
              value={para.obs}
              onChange={e => onUpdate("obs", e.target.value)}
            />
          </div>

          {/* Reply + Comments side-by-side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                उत्तर (Reply)
                <span className="ml-1 normal-case font-normal text-orange-400 tracking-normal">
                  — Roman→Hindi
                </span>
              </label>
              <ReplyBox
                value={para.reply}
                onChange={v => onUpdate("reply", v)}
                placeholder="यहाँ उत्तर टाइप करें… (Roman → Space = Hindi)"
                bgClass="rounded-md border border-orange-200 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-300"
                withTranslit
                minHeight="min-h-[100px]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                उच्चाधिकारी की टिप्पणी (Comments)
              </label>
              <textarea
                className="w-full rounded-md border border-blue-200 bg-[#E3F2FD] dark:bg-[#1a3a5a] px-3 py-2 text-xs leading-relaxed resize-y outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-300 min-h-[100px]"
                placeholder="यहाँ टिप्पणी टाइप करें..."
                value={para.comments}
                onChange={e => onUpdate("comments", e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FreshParasTab() {
  const { paras, addPara, removePara, updatePara, clearAll } = useFreshParas();

  const handleDocx = async () => { await generateFreshDocx(paras); };

  const handlePrint = () => {
    document.title = "Fresh Audit Reply — जिला प्रभाग II उदयपुर";
    window.print();
  };

  return (
    <div className="flex flex-col gap-0">
      {/* Tool bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2 bg-amber-50 border-b border-amber-200 print:hidden">
        <span className="text-xs text-amber-700 font-medium">
          {paras.length} para{paras.length !== 1 ? "s" : ""} &nbsp;·&nbsp; Data auto-saved
        </span>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={addPara}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-white text-xs font-semibold shadow transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Para
          </button>
          <button
            onClick={() => {
              if (window.confirm("Clear all fresh paras? This cannot be undone.")) clearAll();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold shadow transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear All
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs font-semibold shadow transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print / PDF
          </button>
          <button
            onClick={handleDocx}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold shadow transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download DOCX
          </button>
        </div>
      </div>

      {/* Para cards */}
      <div id="print-fresh" className="p-4">
        {paras.map(p => (
          <FreshParaCard
            key={p.id}
            para={p}
            onUpdate={(field, value) => updatePara(p.id, field, value)}
            onRemove={() => {
              if (paras.length === 1) return; // keep at least one
              removePara(p.id);
            }}
          />
        ))}

        {/* Bottom add button */}
        <button
          onClick={addPara}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-amber-300 text-amber-600 hover:bg-amber-50 font-semibold text-sm transition-colors print:hidden"
        >
          <Plus className="w-4 h-4" />
          Add Another Para
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root page
// ─────────────────────────────────────────────────────────────────────────────
type Tab = "existing" | "fresh";

export default function AuditReplyPage() {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<Tab>("existing");

  useDocumentTitle("Audit Reply — जिला प्रभाग II उदयपुर");
  // Audit tables are wide: restore the A4 landscape @page that the app-wide
  // print fix removed (E-02). Scoped to this route only.
  usePrintPage("landscape");

  return (
    <div className="audit-print min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* ── Sticky header ────────────────────────────────────────────── */}
      <header className="bg-primary text-primary-foreground py-3 px-5 shadow-md sticky top-0 z-20 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xs font-bold shrink-0 transition-colors"
            title="Back to Home"
          >
            <ArrowLeft size={14} />
            Home
          </button>
          <FileText className="w-5 h-5 shrink-0 opacity-80" />
          <h1 className="text-base font-bold tracking-tight leading-tight">
            अंकेक्षण प्रतिवेदन उत्तर / Audit Reply Tool — जिला प्रभाग II, उदयपुर
          </h1>
        </div>
      </header>

      {/* ── Tab bar ──────────────────────────────────────────────────── */}
      <div className="flex border-b border-border bg-card sticky top-[52px] z-10 print:hidden">
        {(
          [
            { id: "existing", label: "📂 Existing Paras", sub: `${CASES.length} paras` },
            { id: "fresh", label: "🆕 Fresh Para Entry", sub: "upload + fill" },
          ] as { id: Tab; label: string; sub: string }[]
        ).map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-start px-6 py-2.5 border-b-2 transition-colors text-left ${tab === t.id
              ? "border-primary text-primary font-semibold"
              : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
          >
            <span className="text-sm">{t.label}</span>
            <span className="text-[10px] opacity-70">{t.sub}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ──────────────────────────────────────────────── */}
      <main className="flex-1 overflow-auto">
        {tab === "existing" && <ExistingParasTab />}
        {tab === "fresh" && <FreshParasTab />}
      </main>
    </div>
  );
}