/**
 * Thin fetch wrapper for the Legal-Document-Wizard API.
 * Base: VITE_API_URL/api/legal  (or /api/legal if on same origin)
 */
import type {
  LegalLetter,
  LegalCreateLetterInput,
  LegalUpdateLetterInput,
  LegalLetterStats,
  LegalStyle,
  LegalCreateStyleInput,
  LegalUpdateStyleInput,
} from "@workspace/api-zod";
import { officeApiEnabled, officeApiRequest } from "@/lib/office-api";

function req<T>(path: string, init?: RequestInit): Promise<T> {
  return officeApiRequest<T>(`/legal${path}`, init);
}

export const legalApi = {
  // Letters
  listLetters: (params?: { status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    const query = qs.toString() ? `?${qs}` : "";
    return req<LegalLetter[]>(`/letters${query}`);
  },
  getStats:       ()                              => req<LegalLetterStats>("/letters/stats"),
  getRecent:      ()                              => req<LegalLetter[]>("/letters/recent"),
  getLetter:      (id: number)                    => req<LegalLetter>(`/letters/${id}`),
  createLetter:   (data: LegalCreateLetterInput)  => req<LegalLetter>("/letters", {
    method: "POST", body: JSON.stringify(data),
  }),
  updateLetter:   (id: number, data: LegalUpdateLetterInput) => req<LegalLetter>(`/letters/${id}`, {
    method: "PATCH", body: JSON.stringify(data),
  }),
  finalizeLetter: (id: number) => req<LegalLetter>(`/letters/${id}/finalize`, { method: "PATCH" }),
  deleteLetter:   (id: number) => req<void>(`/letters/${id}`, { method: "DELETE" }),

  // Styles
  listStyles:   ()                              => req<LegalStyle[]>("/styles"),
  getStyle:     (id: number)                    => req<LegalStyle>(`/styles/${id}`),
  createStyle:  (data: LegalCreateStyleInput)   => req<LegalStyle>("/styles", {
    method: "POST", body: JSON.stringify(data),
  }),
  updateStyle:  (id: number, data: LegalUpdateStyleInput) => req<LegalStyle>(`/styles/${id}`, {
    method: "PATCH", body: JSON.stringify(data),
  }),
  deleteStyle:  (id: number) => req<void>(`/styles/${id}`, { method: "DELETE" }),
};

export const LEGAL_API_ENABLED = officeApiEnabled;
