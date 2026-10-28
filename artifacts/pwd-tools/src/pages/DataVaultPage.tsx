/**
 * Data Vault — organised storage for all tool inputs
 *
 * Shows every IndexedDB snapshot grouped by tool.
 * Per-entry: view data (JSON), restore to localStorage, delete.
 * Global: export-all JSON, import JSON, clear-all per tool.
 */
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import {
  clearToolSnapshots,
  deleteSnapshot,
  exportAllAsJson,
  importFromJson,
  loadAllSnapshots,
  VAULT_TOOL,
  type VaultSnapshot,
} from "@/lib/vault";
import {
  Archive,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  RotateCcw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";

// ── Tool display metadata ─────────────────────────────────────────────────

const TOOL_META: Record<string, { name: string; icon: string; lsKey?: string }> = {
  [VAULT_TOOL.AUDIT_REPLY]: { name: "Audit Reply Tool", icon: "🗂️", lsKey: "audit-reply-data" },
  [VAULT_TOOL.AUDIT_FRESH]: { name: "Fresh Audit Paras", icon: "📋", lsKey: "audit-fresh-paras" },
  [VAULT_TOOL.SPEED_MONEY]: { name: "Speed Money Tool", icon: "💰", lsKey: "speed-money-tool-recent-inputs" },
  [VAULT_TOOL.BILL_NOTE]: { name: "Bill Note Sheet", icon: "🧾" },
  [VAULT_TOOL.CORRESPONDENCE]: { name: "Correspondence Assistant", icon: "✉️", lsKey: "pwd_correspondence_letters" },
  [VAULT_TOOL.EOT]: { name: "EOT Letter", icon: "📅" },
  [VAULT_TOOL.NOTICE]: { name: "Notice Generator", icon: "🔔" },
  [VAULT_TOOL.WORK_ORDER]: { name: "Work Order Generator", icon: "📋" },
  [VAULT_TOOL.RESCISSION]: { name: "Rescission Notice", icon: "🔨" },
  [VAULT_TOOL.BANK_COMM]: { name: "Bank Communication", icon: "🏦" },
};

function toolName(tool: string): string {
  return TOOL_META[tool]?.name ?? tool;
}
function toolIcon(tool: string): string {
  return TOOL_META[tool]?.icon ?? "🗃️";
}

// ── Formatting helpers ────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ── Toast ─────────────────────────────────────────────────────────────────

function useToast() {
  const [msg, setMsg] = useState<string | null>(null);
  const show = useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 3000);
  }, []);
  return { msg, show };
}

// ── JSON viewer modal ─────────────────────────────────────────────────────

function JsonModal({ snapshot, onClose }: { snapshot: VaultSnapshot; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div>
            <p className="font-bold text-sm text-gray-800">{snapshot.label}</p>
            <p className="text-xs text-gray-500">{fmtDate(snapshot.savedAt)}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-200">
            <X className="w-4 h-4" />
          </button>
        </div>
        <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-gray-700 bg-white leading-relaxed">
          {JSON.stringify(snapshot.data, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ── Snapshot row ──────────────────────────────────────────────────────────

function SnapshotRow({
  snap,
  onView,
  onRestore,
  onDelete,
}: {
  snap: VaultSnapshot;
  onView: (s: VaultSnapshot) => void;
  onRestore: (s: VaultSnapshot) => void;
  onDelete: (s: VaultSnapshot) => void;
}) {
  const lsKey = TOOL_META[snap.tool]?.lsKey;

  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-gray-100 hover:bg-amber-50/50 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate">{snap.label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{fmtDate(snap.savedAt)}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        {/* View JSON */}
        <button
          onClick={() => onView(snap)}
          title="View raw data"
          className="p-1.5 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-800"
        >
          <FileText className="w-4 h-4" />
        </button>
        {/* Restore to localStorage */}
        {lsKey && (
          <button
            onClick={() => onRestore(snap)}
            title={`Restore to ${lsKey}`}
            className="p-1.5 rounded hover:bg-green-100 text-green-600 hover:text-green-800"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}
        {/* Delete */}
        <button
          onClick={() => onDelete(snap)}
          title="Delete this snapshot"
          className="p-1.5 rounded hover:bg-red-100 text-red-400 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ── Tool group ────────────────────────────────────────────────────────────

function ToolGroup({
  tool,
  snaps,
  onView,
  onRestore,
  onDelete,
  onClearTool,
}: {
  tool: string;
  snaps: VaultSnapshot[];
  onView: (s: VaultSnapshot) => void;
  onRestore: (s: VaultSnapshot) => void;
  onDelete: (s: VaultSnapshot) => void;
  onClearTool: (tool: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-amber-200 overflow-hidden shadow-sm mb-4">
      {/* Header */}
      <button
        className="w-full flex items-center gap-3 px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
        onClick={() => setOpen((p) => !p)}
      >
        <span className="text-xl">{toolIcon(tool)}</span>
        <div className="flex-1">
          <span className="font-bold text-sm text-amber-900">{toolName(tool)}</span>
          <span className="ml-2 text-xs text-amber-600 font-medium">
            {snaps.length} snapshot{snaps.length !== 1 ? "s" : ""}
          </span>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-amber-600" />
        ) : (
          <ChevronRight className="w-4 h-4 text-amber-600" />
        )}
        {/* Clear all for this tool */}
        <span
          role="button"
          tabIndex={0}
          title={`Clear all snapshots for ${toolName(tool)}`}
          onClick={(e) => { e.stopPropagation(); onClearTool(tool); }}
          onKeyDown={(e) => e.key === "Enter" && (e.stopPropagation(), onClearTool(tool))}
          className="ml-2 p-1 rounded hover:bg-red-100 text-red-400 hover:text-red-700"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </span>
      </button>

      {/* Rows */}
      {open && (
        <div className="bg-white divide-y divide-gray-50">
          {snaps.length === 0 ? (
            <p className="px-4 py-3 text-xs text-gray-400">No snapshots yet.</p>
          ) : (
            snaps.map((s) => (
              <SnapshotRow
                key={s.id}
                snap={s}
                onView={onView}
                onRestore={onRestore}
                onDelete={onDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────

export default function DataVaultPage() {
  useDocumentTitle("Data Vault");
  const [, navigate] = useLocation();
  const [snapshots, setSnapshots] = useState<VaultSnapshot[]>([]);
  const [viewing, setViewing] = useState<VaultSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const { msg: toast, show: showToast } = useToast();
  const importRef = useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    const all = await loadAllSnapshots();
    setSnapshots(all);
    setLoading(false);
  }, []);

  useEffect(() => { reload(); }, [reload]);

  // Group by tool, preserve order
  const grouped = snapshots.reduce<Record<string, VaultSnapshot[]>>((acc, s) => {
    if (!acc[s.tool]) acc[s.tool] = [];
    acc[s.tool].push(s);
    return acc;
  }, {});

  // ── handlers ──────────────────────────────────────────────────────────

  const handleDelete = useCallback(async (s: VaultSnapshot) => {
    if (!s.id) return;
    await deleteSnapshot(s.id);
    showToast("Snapshot deleted.");
    reload();
  }, [reload, showToast]);

  const handleRestore = useCallback((s: VaultSnapshot) => {
    const lsKey = TOOL_META[s.tool]?.lsKey;
    if (!lsKey) return;
    try {
      localStorage.setItem(lsKey, JSON.stringify(s.data));
      showToast(`Restored to localStorage key "${lsKey}". Reload the tool to see it.`);
    } catch {
      showToast("Restore failed — localStorage may be full.");
    }
  }, [showToast]);

  const handleClearTool = useCallback(async (tool: string) => {
    if (!window.confirm(`Delete ALL snapshots for "${toolName(tool)}"? This cannot be undone.`)) return;
    await clearToolSnapshots(tool);
    showToast(`All snapshots for ${toolName(tool)} cleared.`);
    reload();
  }, [reload, showToast]);

  const handleExport = useCallback(async () => {
    const json = await exportAllAsJson();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pwd-vault-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("Vault exported.");
  }, [showToast]);

  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const count = await importFromJson(text);
      showToast(`Imported ${count} snapshot(s) successfully.`);
      reload();
    } catch (err: unknown) {
      showToast(`Import failed: ${err instanceof Error ? err.message : "Invalid file."}`);
    } finally {
      if (importRef.current) importRef.current.value = "";
    }
  }, [reload, showToast]);

  // ── render ─────────────────────────────────────────────────────────────

  const totalSnaps = snapshots.length;
  const toolCount = Object.keys(grouped).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 font-sans">

      {/* Header */}
      <div className="sticky top-0 z-20 bg-gradient-to-r from-[#7B0D00] via-[#c0392b] to-[#e67e22] shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Archive className="w-6 h-6 text-yellow-300" />
            <div>
              <h1 className="text-white font-bold text-lg leading-tight">
                PWD Data Vault
              </h1>
              <p className="text-amber-200 text-xs">
                {loading ? "Loading…" : `${totalSnaps} snapshot${totalSnaps !== 1 ? "s" : ""} across ${toolCount} tool${toolCount !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Export */}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-amber-900 font-semibold text-xs shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Export JSON
            </button>
            {/* Import */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white font-semibold text-xs shadow cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              Import JSON
              <input
                ref={importRef}
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleImport}
              />
            </label>
            {/* Back */}
            <button
              onClick={() => navigate("/")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold text-xs shadow transition-colors"
            >
              ← Home
            </button>
          </div>
        </div>
        <div className="h-0.5 bg-gradient-to-r from-yellow-400 via-orange-400 to-yellow-400" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-800 text-white text-sm px-5 py-2.5 rounded-full shadow-xl animate-pulse">
          {toast}
        </div>
      )}

      {/* JSON modal */}
      {viewing && (
        <JsonModal snapshot={viewing} onClose={() => setViewing(null)} />
      )}

      {/* Body */}
      <div className="max-w-4xl mx-auto px-4 py-8">

        {loading ? (
          <div className="text-center py-24 text-amber-700 text-sm">Loading vault…</div>
        ) : totalSnaps === 0 ? (
          <div className="text-center py-24">
            <Archive className="w-16 h-16 text-amber-300 mx-auto mb-4" />
            <p className="text-amber-800 font-semibold text-lg">Vault is empty</p>
            <p className="text-amber-600 text-sm mt-2">
              Use any tool — your inputs will be automatically saved here.
            </p>
            <p className="text-amber-500 text-xs mt-4">
              You can also import a previous export using the button above.
            </p>
          </div>
        ) : (
          <>
            {/* Quick stats bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              {Object.entries(grouped).slice(0, 4).map(([tool, snaps]) => (
                <div
                  key={tool}
                  className="bg-white rounded-xl border border-amber-200 px-4 py-3 shadow-sm"
                >
                  <div className="text-2xl mb-1">{toolIcon(tool)}</div>
                  <div className="text-xs font-semibold text-amber-900 truncate">{toolName(tool)}</div>
                  <div className="text-lg font-bold text-amber-600">{snaps.length}</div>
                  <div className="text-[10px] text-gray-400">snapshot{snaps.length !== 1 ? "s" : ""}</div>
                </div>
              ))}
            </div>

            {/* Grouped tool sections */}
            {Object.entries(grouped).map(([tool, snaps]) => (
              <ToolGroup
                key={tool}
                tool={tool}
                snaps={snaps}
                onView={setViewing}
                onRestore={handleRestore}
                onDelete={handleDelete}
                onClearTool={handleClearTool}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
