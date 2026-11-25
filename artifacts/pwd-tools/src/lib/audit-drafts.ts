import { saveSnapshot, VAULT_TOOL } from "./vault";

export const REPLIES_KEY = "audit-reply-data";
export const FRESH_KEY = "audit-fresh-paras";

export type AuditReply = { reply: string; comments: string };

export interface FreshPara {
  id: string;
  no: string;
  header: string;
  gist: string;
  resp: string;
  obs: string;
  imageDataUrl?: string;
  reply: string;
  comments: string;
}

const text = (value: unknown) => typeof value === "string" ? value : "";

export function readAuditReplies(value: unknown): Record<string, AuditReply> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const records = "replies" in value && "paras" in value ? value.replies : value;
  if (!records || typeof records !== "object" || Array.isArray(records)) return {};
  const replies: [string, AuditReply][] = [];
  for (const [id, entry] of Object.entries(records)) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) continue;
    if (typeof entry.reply !== "string" && typeof entry.comments !== "string") continue;
    replies.push([id, { reply: text(entry.reply), comments: text(entry.comments) }]);
  }
  return Object.fromEntries(replies);
}

export function readFreshParas(value: unknown): FreshPara[] {
  if (!Array.isArray(value)) throw new Error("Invalid Fresh Audit draft.");
  const ids = new Set<string>();
  return value.map((para, index) => {
    if (!para || typeof para.id !== "string" || !para.id || ids.has(para.id)) {
      throw new Error("Invalid Fresh Audit paragraph.");
    }
    ids.add(para.id);
    return {
      id: para.id,
      no: text(para.no) || String(index + 1),
      header: text(para.header),
      gist: text(para.gist),
      resp: text(para.resp),
      obs: text(para.obs),
      reply: text(para.reply),
      comments: text(para.comments),
    };
  });
}

export function hasFreshParaContent(para: FreshPara): boolean {
  return [para.header, para.gist, para.resp, para.obs, para.reply, para.comments].some((field) => field.trim());
}

export function serializeFreshDraft(paras: FreshPara[]): string {
  return JSON.stringify(paras.map(({ imageDataUrl: _, ...para }) => para));
}

export async function replaceFreshDraft(paras: FreshPara[], signal?: AbortSignal): Promise<void> {
  const original = localStorage.getItem(FRESH_KEY);
  const previous = readFreshParas(JSON.parse(original ?? "[]"));
  const next = serializeFreshDraft(paras);
  if (serializeFreshDraft(previous) === next) return;
  if (previous.some(hasFreshParaContent)) {
    await saveSnapshot(VAULT_TOOL.AUDIT_FRESH, "Fresh Audit draft before replacement", previous);
    if (localStorage.getItem(FRESH_KEY) !== original) throw new Error("The draft changed in another tab.");
  }
  signal?.throwIfAborted();
  localStorage.setItem(FRESH_KEY, next);
}
