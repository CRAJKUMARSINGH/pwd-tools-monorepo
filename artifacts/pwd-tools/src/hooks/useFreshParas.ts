import { toast } from "@/hooks/use-toast";
import { FRESH_KEY, hasFreshParaContent, readFreshParas, serializeFreshDraft, type FreshPara } from "@/lib/audit-drafts";
import { saveDraftSnapshot, VAULT_TOOL } from "@/lib/vault";
import { useCallback, useEffect, useRef, useState } from "react";

export type { FreshPara } from "@/lib/audit-drafts";

function makeEmpty(): FreshPara {
  return {
    id: Math.random().toString(36).slice(2, 10),
    no: "1",
    header: "",
    gist: "",
    resp: "",
    obs: "",
    reply: "",
    comments: "",
  };
}

function loadDraft(): FreshPara[] {
  try {
    return readFreshParas(JSON.parse(localStorage.getItem(FRESH_KEY) ?? "[]"));
  } catch {
    return [];
  }
}

export function useFreshParas(seed?: FreshPara[]) {
  const [paras, setParas] = useState<FreshPara[]>(() => {
    const loaded = seed?.length ? seed : loadDraft();
    return loaded.length ? loaded : [makeEmpty()];
  });
  const serialized = serializeFreshDraft(paras);
  const persisted = useRef(serialized);

  useEffect(() => {
    if (persisted.current === serialized) return;
    try {
      localStorage.setItem(FRESH_KEY, serialized);
      persisted.current = serialized;
    } catch {
      toast({ title: "Fresh Audit draft could not be saved in this browser.", variant: "destructive" });
    }
    const draft = readFreshParas(JSON.parse(serialized));
    if (draft.some(hasFreshParaContent)) {
      void saveDraftSnapshot(VAULT_TOOL.AUDIT_FRESH, "Fresh Audit autosave", draft).catch(() => {
        toast({ title: "Fresh Audit Vault backup could not be saved.", variant: "destructive" });
      });
    }
  }, [serialized]);

  const addPara = useCallback(() => {
    const para = makeEmpty();
    setParas(prev => [...prev, { ...para, no: String(prev.length + 1) }]);
  }, []);

  const removePara = useCallback((id: string) => {
    setParas(prev => prev.filter(para => para.id !== id).map((para, index) => ({
      ...para,
      no: String(index + 1),
    })));
  }, []);

  const updatePara = useCallback(<K extends keyof FreshPara>(
    id: string, field: K, value: FreshPara[K],
  ) => {
    setParas(prev => prev.map(para => para.id === id ? { ...para, [field]: value } : para));
  }, []);

  const clearAll = useCallback(() => setParas([makeEmpty()]), []);

  return { paras, addPara, removePara, updatePara, clearAll };
}
