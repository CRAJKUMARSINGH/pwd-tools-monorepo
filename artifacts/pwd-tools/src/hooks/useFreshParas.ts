import { saveSnapshot, VAULT_TOOL } from "@/lib/vault";
import { useCallback, useState } from "react";

export interface FreshPara {
  id: string;            // uuid-like key
  no: string;            // display number e.g. "1", "2"
  header: string;
  gist: string;
  resp: string;
  obs: string;
  imageDataUrl?: string; // base64 preview — NOT saved to docx or vault
  reply: string;
  comments: string;
}

const STORAGE_KEY = "audit-fresh-paras";

function load(): FreshPara[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(paras: FreshPara[]) {
  // strip imageDataUrl before persisting — base64 is too large for localStorage
  const slim = paras.map(({ imageDataUrl: _, ...p }) => p);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
  // vault: non-blocking IndexedDB snapshot
  const filled = slim.filter(p => p.header.trim() || p.obs.trim()).length;
  if (filled > 0) {
    saveSnapshot(
      VAULT_TOOL.AUDIT_FRESH,
      `Fresh Paras — ${slim.length} para(s) — ${new Date().toLocaleString("en-IN")}`,
      slim,
    ).catch(() => { /* non-blocking */ });
  }
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function makeEmpty(no: number): FreshPara {
  return {
    id: uid(),
    no: String(no),
    header: "",
    gist: "",
    resp: "",
    obs: "",
    reply: "",
    comments: "",
  };
}

/**
 * Fresh-para store.
 *
 * `seed` lets a caller (the audit upload step) hand over paras that exist only
 * in memory — their `imageDataUrl` is deliberately never written to
 * localStorage, so seeding has to happen at mount rather than via storage.
 */
export function useFreshParas(seed?: FreshPara[]) {
  const [paras, setParas] = useState<FreshPara[]>(() => {
    if (seed?.length) {
      save(seed);
      return seed;
    }
    const loaded = load();
    return loaded.length > 0 ? loaded : [makeEmpty(1)];
  });

  const commit = useCallback((next: FreshPara[]) => {
    setParas(next);
    save(next);
  }, []);

  const addPara = useCallback(() => {
    setParas(prev => {
      const next = [...prev, makeEmpty(prev.length + 1)];
      save(next);
      return next;
    });
  }, []);

  const removePara = useCallback((id: string) => {
    setParas(prev => {
      const next = prev
        .filter(p => p.id !== id)
        .map((p, i) => ({ ...p, no: String(i + 1) }));
      save(next);
      return next;
    });
  }, []);

  const updatePara = useCallback(<K extends keyof FreshPara>(
    id: string, field: K, value: FreshPara[K]
  ) => {
    setParas(prev => {
      const next = prev.map(p => p.id === id ? { ...p, [field]: value } : p);
      // don't save on imageDataUrl updates — too large for vault
      if (field !== "imageDataUrl") save(next);
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    commit([makeEmpty(1)]);
  }, [commit]);

  return { paras, addPara, removePara, updatePara, clearAll };
}
