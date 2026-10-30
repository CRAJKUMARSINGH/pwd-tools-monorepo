/**
 * Audit Reply — Workspace
 * ───────────────────────
 * The working surface behind the landing/upload steps in `AuditReply/index.tsx`.
 *
 * Tab 1 — Existing Paras  : pre-loaded CASES with reorder (↑↓), insert-between (➕),
 *                           extra rows, reply + comments, DOCX + Print
 * Tab 2 — Fresh Para Entry : image upload, manual para fields, reply + comments, DOCX + Print
 *
 * The `#print-existing` / `#print-fresh` DOM contract, the `audit-reply-data` /
 * `audit-order` / `audit-extra-rows` / `audit-fresh-paras` storage keys and the
 * `audit-print` print scope are unchanged — the smoke harnesses pin them.
 */
import { CASES } from "@/data/audit-cases";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { useFreshParas, type FreshPara } from "@/hooks/useFreshParas";
import { generateDocx } from "@/lib/generate-docx";
import { generateFreshDocx } from "@/lib/generate-fresh-docx";
import { usePrintPage } from "@/lib/printPage";
import { transliterateLastWord } from "@/lib/roman-to-hindi";
import { saveSnapshot, VAULT_TOOL } from "@/lib/vault";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Download,
  FileText,
  ImagePlus,
  Languages,
  Plus,
  PlusCircle,
  Printer,
  Trash2,
  X
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import type { AuditTab } from "./types";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
interface CaseEntry {
  no: string;
  header: string;
  gist: string;
  resp: string;
  obs: string;
  defaultReply?: string;
}

interface ReplyData {
  reply: string;
  comments: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────
function loadFromStorage(): Record<string, ReplyData> {
  try {
    const d = localStorage.getItem('audit-reply-data');
    return d ? JSON.parse(d) : {};
  } catch {
    return {};
  }
}

function loadOrder(): string[] {
  try {
    const d = localStorage.getItem('audit-order');
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
}

function loadExtraRows(): CaseEntry[] {
  try {
    const d = localStorage.getItem('audit-extra-rows');
    return d ? JSON.parse(d) : [];
  } catch {
    return [];
  }
}

/** Seed any missing reply with the case's default reply (does not clobber edits). */
function seedDefaults(stored: Record<string, ReplyData>, cases: CaseEntry[]): Record<string, ReplyData> {
  const result = { ...stored };
  for (const c of cases) {
    if (!result[c.no]?.reply && c.defaultReply)
      result[c.no] = { reply: c.defaultReply, comments: result[c.no]?.comments ?? '' };
  }
  return result;
}

/** Apply a saved order to the case list; unknown keys fall back to source order. */
function applyOrder(cases: CaseEntry[], order: string[]): CaseEntry[] {
  if (!order.length) return cases;
  const map = new Map(cases.map(c => [c.no, c]));
  const ordered: CaseEntry[] = [];
  for (const key of order) { if (map.has(key)) ordered.push(map.get(key)!); }
  for (const c of cases) { if (!order.includes(c.no)) ordered.push(c); }
  return ordered;
}

// ─────────────────────────────────────────────────────────────────────────────
// Roman→Hindi textarea — per-instance toggle, offline dictionary conversion
// ─────────────────────────────────────────────────────────────────────────────
function HindiTextarea({ value, onChange, placeholder, bgClass }:
  { value: string; onChange: (v: string) => void; placeholder: string; bgClass: string }) {
  const [romanMode, setRomanMode] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (!romanMode) return;
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      const cursor = ref.current!.selectionStart;
      const before = value.slice(0, cursor);
      const after = value.slice(cursor);
      const converted = transliterateLastWord(before) + (e.key === 'Enter' ? '\n' : ' ');
      onChange(converted + after);
      requestAnimationFrame(() => {
        if (ref.current) { ref.current.selectionStart = converted.length; ref.current.selectionEnd = converted.length; }
      });
    }
  }

  return (
    <div className={`relative flex flex-col h-full ${bgClass}`}>
      <div className="flex items-center justify-end px-2 py-1 border-b border-border/40 print:hidden">
        <button type="button" onClick={() => setRomanMode(m => !m)}
          title={romanMode ? 'Roman→Hindi ON — click to switch off' : 'Roman→Hindi OFF — click to switch on'}
          className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded font-semibold transition-colors select-none ${romanMode
            ? 'bg-orange-500 text-white shadow'
            : 'bg-muted text-muted-foreground hover:bg-orange-100 hover:text-orange-700'}`}>
          <Languages className="w-3 h-3" />
          {romanMode ? 'रo ON' : 'रo'}
        </button>
      </div>
      <textarea ref={ref}
        className={`w-full flex-1 ${romanMode ? 'min-h-[206px]' : 'min-h-[220px]'} p-3 bg-transparent resize-y outline-none placeholder:text-foreground/30 text-sm leading-relaxed ${romanMode ? 'font-mono' : ''}`}
        placeholder={romanMode ? 'Roman mein type karein (space pe Hindi)...' : placeholder}
        value={value} onChange={e => onChange(e.target.value)} onKeyDown={handleKeyDown} />
      {romanMode && (
        <div className="px-2 py-1 text-[10px] text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-t border-orange-200 print:hidden">
          spacebar → Hindi: <code>mange</code>→मांगे <code>sanlagn</code>→संलग्न <code>nirast</code>→निरस्त
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline insert form — slides in below the clicked row to add a new para
// ─────────────────────────────────────────────────────────────────────────────
function InlineInsertForm({ afterIndex, onAdd, onCancel }:
  { afterIndex: number; onAdd: (row: CaseEntry, after: number) => void; onCancel: () => void }) {
  const [form, setForm] = useState<CaseEntry>({ no: `new-${Date.now()}`, header: '', gist: '', resp: '', obs: '' });
  function set(k: keyof CaseEntry, v: string) { setForm(p => ({ ...p, [k]: v })); }
  const cls = 'w-full border border-border rounded px-2 py-1.5 text-xs bg-background resize-none outline-none focus:ring-1 focus:ring-primary';

  return (
    <tr className="bg-emerald-50 dark:bg-emerald-950/30 border-t-2 border-emerald-400">
      <td colSpan={6} className="p-4">
        <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400 mb-3">
          ➕ नया पैरा — Insert after position {afterIndex + 1}
        </div>
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">Para ID *</label>
            <input className={cls} placeholder="e.g. 4a" value={form.no} onChange={e => set('no', e.target.value)} />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">उत्तरदायित्व</label>
            <input className={cls} placeholder="सहायक अभियंता" value={form.resp} onChange={e => set('resp', e.target.value)} />
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Header (Package/Work details) *</label>
          <textarea className={cls} rows={2} placeholder="Package No. / Contractor / W.O. No. / Amount..."
            value={form.header} onChange={e => set('header', e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">संक्षिप्त विवरण (Gist)</label>
            <textarea className={cls} rows={3} value={form.gist} onChange={e => set('gist', e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground mb-1 block">अंकेक्षण आपत्ति (Observation)</label>
            <textarea className={cls} rows={3} value={form.obs} onChange={e => set('obs', e.target.value)} />
          </div>
        </div>
        <div className="mb-3">
          <label className="text-xs font-semibold text-muted-foreground mb-1 block">Default Reply (optional)</label>
          <textarea className={cls} rows={2} value={form.defaultReply || ''} onChange={e => set('defaultReply', e.target.value)} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => { if (form.header.trim()) onAdd({ ...form, no: form.no.trim() || `new-${Date.now()}` }, afterIndex); }}
            className="bg-emerald-600 text-white text-xs px-4 py-1.5 rounded font-semibold hover:opacity-90">
            ✅ Insert Here
          </button>
          <button onClick={onCancel} className="bg-muted text-muted-foreground text-xs px-4 py-1.5 rounded hover:opacity-80">
            Cancel
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TAB 1 — Existing Paras
// ─────────────────────────────────────────────────────────────────────────────
function ExistingParasTab() {
  const [extraRows, setExtraRows] = useState<CaseEntry[]>(loadExtraRows);
  const baseCases: CaseEntry[] = [...CASES, ...extraRows];

  const [orderedCases, setOrderedCases] = useState<CaseEntry[]>(
    () => applyOrder(baseCases, loadOrder())
  );

  const [replies, setReplies] = useState<Record<string, ReplyData>>(
    () => seedDefaults(loadFromStorage(), orderedCases)
  );

  const [insertAfter, setInsertAfter] = useState<number>(-1);

  // Persist replies + vault snapshot
  useEffect(() => {
    localStorage.setItem('audit-reply-data', JSON.stringify(replies));
    const filled = Object.values(replies).filter(r => r.reply.trim() || r.comments.trim()).length;
    if (filled > 0) {
      saveSnapshot(
        VAULT_TOOL.AUDIT_REPLY,
        `Audit Reply — ${filled} para(s) filled — ${new Date().toLocaleString("en-IN")}`,
        { paras: orderedCases.length, replies },
      ).catch(() => { });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [replies]);

  // Persist row order + extra rows
  useEffect(() => { localStorage.setItem('audit-order', JSON.stringify(orderedCases.map(c => c.no))); }, [orderedCases]);
  useEffect(() => { localStorage.setItem('audit-extra-rows', JSON.stringify(extraRows)); }, [extraRows]);

  function moveUp(idx: number) {
    if (idx === 0) return;
    setOrderedCases(prev => { const n = [...prev]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n; });
  }
  function moveDown(idx: number) {
    setOrderedCases(prev => {
      if (idx >= prev.length - 1) return prev;
      const n = [...prev]; [n[idx], n[idx + 1]] = [n[idx + 1], n[idx]]; return n;
    });
  }

  function handleInsert(row: CaseEntry, afterIndex: number) {
    const isNew = !CASES.find(c => c.no === row.no);
    if (isNew) setExtraRows(prev => [...prev, row]);
    setOrderedCases(prev => { const n = [...prev]; n.splice(afterIndex + 1, 0, row); return n; });
    if (row.defaultReply && !replies[row.no]?.reply)
      setReplies(prev => ({ ...prev, [row.no]: { reply: row.defaultReply!, comments: '' } }));
    setInsertAfter(-1);
  }

  function handleDelete(no: string) {
    if (!confirm(`Para "${no}" को हटाएं?`)) return;
    setExtraRows(prev => prev.filter(r => r.no !== no));
    setOrderedCases(prev => prev.filter(c => c.no !== no));
  }

  function handleReplyChange(paraNo: string, field: 'reply' | 'comments', value: string) {
    setReplies(prev => ({ ...prev, [paraNo]: { ...prev[paraNo], [field]: value } }));
  }

  const handleDocx = async () => { await generateDocx(orderedCases as typeof CASES, replies); };

  const handlePrint = () => {
    document.title = "Audit Reply — जिला प्रभाग II उदयपुर";
    window.print();
  };

  const isExtra = (no: string) => !CASES.find(c => c.no === no);

  return (
    <div className="flex flex-col gap-0">
      {/* Tool bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted/40 border-b border-border print:hidden">
        <span className="text-xs text-muted-foreground">
          {orderedCases.length} paras loaded &nbsp;·&nbsp; Replies auto-saved &nbsp;·&nbsp;
          <span className="font-semibold">↑↓</span> reorder &nbsp;
          <span className="font-semibold">➕</span> insert &nbsp;
          <span className="font-semibold">रo</span> Roman→Hindi
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
          <thead>
            <tr className="bg-muted text-muted-foreground border-b border-border text-[11px] uppercase tracking-wider font-semibold">
              <th className="border-r border-border p-2 w-16 text-center">क्र.</th>
              <th className="border-r border-border p-2 w-[15%] text-left">संक्षिप्त विवरण</th>
              <th className="border-r border-border p-2 w-[9%] text-left">उत्तरदायित्व</th>
              <th className="border-r border-border p-2 w-[20%] text-left">अंकेक्षण आपत्ति</th>
              <th className="border-r border-border p-2 w-[22%] text-left">
                उत्तर (Reply) <span className="text-orange-500 normal-case">रo</span>
              </th>
              <th className="p-2 w-[22%] text-left">
                उच्चाधिकारी की टिप्पणी <span className="text-orange-500 normal-case">रo</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {orderedCases.map((c, idx) => (
              <React.Fragment key={c.no}>
                {/* header row */}
                <tr className="border-t-2 border-border/60">
                  <td
                    rowSpan={2}
                    className="border-r border-b border-border p-2 text-center align-top font-bold text-primary/80 bg-muted/20"
                  >
                    {/* Serial = current position; #no = stable case id */}
                    <div className="text-lg leading-none mt-0.5">{idx + 1}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5 font-normal leading-none">#{c.no}</div>

                    {/* ↑↓ reorder */}
                    <div className="flex flex-col items-center gap-0.5 mt-2 print:hidden">
                      <button onClick={() => moveUp(idx)} disabled={idx === 0}
                        title="Move up" className="p-0.5 rounded hover:bg-primary/10 disabled:opacity-20 disabled:cursor-not-allowed">
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      </button>
                      <button onClick={() => moveDown(idx)} disabled={idx === orderedCases.length - 1}
                        title="Move down" className="p-0.5 rounded hover:bg-primary/10 disabled:opacity-20 disabled:cursor-not-allowed">
                        <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      </button>
                    </div>

                    {/* ➕ insert after this row */}
                    <button onClick={() => setInsertAfter(v => v === idx ? -1 : idx)}
                      title="Insert new para after this row"
                      className={`mt-1.5 p-0.5 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 print:hidden ${insertAfter === idx ? 'bg-emerald-100' : ''}`}>
                      <PlusCircle className="w-3.5 h-3.5" />
                    </button>

                    {/* 🗑 delete (extra rows only) */}
                    {isExtra(c.no) && (
                      <button onClick={() => handleDelete(c.no)} title="Delete"
                        className="mt-1 p-0.5 rounded text-red-400 hover:text-red-600 print:hidden">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                  <td
                    colSpan={5}
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
                  <td className="border-r border-border p-3 whitespace-pre-wrap align-top text-foreground/70 font-medium text-xs">
                    {c.resp}
                  </td>
                  <td className="border-r border-border p-3 whitespace-pre-wrap align-top leading-relaxed text-xs">
                    {c.obs}
                  </td>
                  <td className="border-r border-border p-0 align-top bg-[#FFFDE7] dark:bg-[#3a3820] focus-within:ring-2 focus-within:ring-inset focus-within:ring-orange-400">
                    <HindiTextarea
                      value={replies[c.no]?.reply || ''}
                      onChange={v => handleReplyChange(c.no, 'reply', v)}
                      placeholder="यहाँ उत्तर टाइप करें… (रo ON → space = Hindi)"
                      bgClass="bg-[#FFFDE7] dark:bg-[#3a3820]"
                    />
                  </td>
                  <td className="p-0 align-top bg-[#E3F2FD] dark:bg-[#1a3a5a] focus-within:ring-2 focus-within:ring-inset focus-within:ring-blue-400">
                    <HindiTextarea
                      value={replies[c.no]?.comments || ''}
                      onChange={v => handleReplyChange(c.no, 'comments', v)}
                      placeholder="यहाँ टिप्पणी टाइप करें..."
                      bgClass="bg-[#E3F2FD] dark:bg-[#1a3a5a]"
                    />
                  </td>
                </tr>

                {/* Inline insert form — slides in below the clicked row */}
                {insertAfter === idx && (
                  <InlineInsertForm afterIndex={idx} onAdd={handleInsert} onCancel={() => setInsertAfter(-1)} />
                )}
              </React.Fragment>
            ))}

            {/* Append at end */}
            <tr className="print:hidden">
              <td colSpan={6} className="p-3 bg-muted/20 border-t-2 border-dashed border-primary/30">
                <button onClick={() => setInsertAfter(orderedCases.length - 1)}
                  className="flex items-center gap-2 text-sm text-primary font-semibold hover:underline mx-auto">
                  <PlusCircle className="w-4 h-4" /> अंत में नया पैरा जोड़ें (Append at end)
                </button>
              </td>
            </tr>
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
                  — रo Roman→Hindi
                </span>
              </label>
              <HindiTextarea
                value={para.reply}
                onChange={v => onUpdate("reply", v)}
                placeholder="यहाँ उत्तर टाइप करें… (रo ON → space = Hindi)"
                bgClass="rounded-md border border-orange-200 focus-within:border-orange-400 focus-within:ring-1 focus-within:ring-orange-300"
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

/** The fresh-para store is owned by `AuditWorkspace` so it never remounts on a
 *  tab switch — a remount would re-apply the upload seed (clobbering edits) and
 *  drop the in-memory images, which `save()` deliberately strips. */
type FreshStore = ReturnType<typeof useFreshParas>;

function FreshParasTab({ store }: { store: FreshStore }) {
  const { paras, addPara, removePara, updatePara, clearAll } = store;

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
type Props = {
  /** Which tab the workspace opens on. */
  initialTab?: AuditTab;
  /** Fresh paras handed over by the upload step. Images are in-memory only. */
  seedFresh?: FreshPara[];
  /** Return to the audit landing step (rendered by `AuditReply/index.tsx`). */
  onExit?: () => void;
};

export default function AuditWorkspace({ initialTab = "existing", seedFresh, onExit }: Props) {
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<AuditTab>(initialTab);
  // Owned here (not inside the tab) so a tab switch cannot remount the hook and
  // re-apply `seedFresh` over the user's edits, or lose their in-memory images.
  const freshStore = useFreshParas(seedFresh);

  useDocumentTitle("Audit Reply — जिला प्रभाग II उदयपुर");
  // Audit tables are wide: restore the A4 landscape @page that the app-wide
  // print fix removed (E-02). Scoped to this route only. The issuing footer is
  // passed explicitly — every other route now prints with no margin box.
  usePrintPage("landscape", "DRAFTED BY PRIYANKA JAIN, PWD UDAIPUR");

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
          {onExit && (
            <button
              onClick={onExit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/20 hover:bg-white/30 border border-white/40 text-white text-xs font-bold shrink-0 transition-colors"
              title="Back to the audit menu"
            >
              <FileText size={14} />
              Menu
            </button>
          )}
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
          ] as { id: AuditTab; label: string; sub: string }[]
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
        {tab === "fresh" && <FreshParasTab store={freshStore} />}
      </main>
    </div>
  );
}
