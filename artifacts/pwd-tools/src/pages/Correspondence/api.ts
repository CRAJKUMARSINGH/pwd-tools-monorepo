/**
 * Thin fetch wrapper for the Correspondence API.
 * Base URL is read from VITE_API_URL env var (set to your api-server origin).
 * Falls back to relative path (same origin) when unset — useful for Netlify
 * Functions or when api-server is reverse-proxied at /api.
 */
import type { CorrLetter, CorrCreateLetterInput, CorrUpdateLetterInput, CorrLetterStats } from "@workspace/api-zod";
import { officeApiEnabled, officeApiRequest } from "@/lib/office-api";

function req<T>(path: string, init?: RequestInit): Promise<T> {
  return officeApiRequest<T>(`/correspondence${path}`, init);
}

export const correspondenceApi = {
  listLetters:   (params?: { type?: string; status?: string }) => {
    const qs = new URLSearchParams();
    if (params?.type)   qs.set("type",   params.type);
    if (params?.status) qs.set("status", params.status);
    const query = qs.toString() ? `?${qs}` : "";
    return req<CorrLetter[]>(`/letters${query}`);
  },
  getStats:      ()                           => req<CorrLetterStats>("/letters/stats"),
  getRecent:     ()                           => req<CorrLetter[]>("/letters/recent"),
  getLetter:     (id: number)                 => req<CorrLetter>(`/letters/${id}`),
  createLetter:  (data: CorrCreateLetterInput) => req<CorrLetter>("/letters", {
    method: "POST", body: JSON.stringify(data),
  }),
  updateLetter:  (id: number, data: CorrUpdateLetterInput) => req<CorrLetter>(`/letters/${id}`, {
    method: "PATCH", body: JSON.stringify(data),
  }),
  deleteLetter:  (id: number)                 => req<void>(`/letters/${id}`, { method: "DELETE" }),
  generateDocx:  (id: number)                 => req<{ downloadPath: string; filename: string }>(
    `/letters/${id}/generate-docx`, { method: "POST" }
  ),
};

/** True when VITE_API_URL is explicitly set (production / staging with backend) */
export const API_ENABLED = officeApiEnabled;
