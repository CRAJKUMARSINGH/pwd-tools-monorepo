/**
 * Correspondence-Assistant (CA) — Zod request/response schemas.
 * Ported from CODE-JUNCTION/Correspondence-Assistant/lib/api-zod/src/generated/api.ts
 * All exports are prefixed with "Corr" to avoid collision with other modules.
 */
import * as zod from "zod";

// ── Query / Params ────────────────────────────────────────────────────────

export const CorrListLettersQueryParams = zod.object({
  type:   zod.enum(["new", "reply"]).optional(),
  status: zod.enum(["draft", "final"]).optional(),
});

const letterParams = zod.object({ id: zod.coerce.number().int().positive().max(2147483647) });
export const CorrGetLetterParams    = letterParams;
export const CorrUpdateLetterParams = letterParams;
export const CorrDeleteLetterParams = letterParams;
export const CorrGenerateDocxParams = letterParams;

// ── Shared letter shape ───────────────────────────────────────────────────

const bilingualFields = {
  language:           zod.enum(["hindi", "english", "both"]).optional(),
  toNameEn:           zod.string().optional(),
  toDesignationEn:    zod.string().optional(),
  toOfficeEn:         zod.string().optional(),
  subjectEn:          zod.string().optional(),
  referenceEn:        zod.string().optional(),
  bodyEn:             zod.string().optional(),
  fromNameEn:         zod.string().optional(),
  fromDesignationEn:  zod.string().optional(),
  fromOfficeEn:       zod.string().optional(),
  ccEn:               zod.string().optional(),
  toMany:             zod.string().optional(),
};

const CorrLetterRecord = zod.object({
  ...bilingualFields,
  id:              zod.number(),
  type:            zod.enum(["new", "reply"]),
  status:          zod.enum(["draft", "final"]),
  letterNumber:    zod.string(),
  date:            zod.string(),
  toName:          zod.string(),
  toDesignation:   zod.string(),
  toOffice:        zod.string(),
  subject:         zod.string(),
  reference:       zod.string().nullish(),
  body:            zod.string(),
  fromName:        zod.string(),
  fromDesignation: zod.string(),
  fromOffice:      zod.string(),
  cc:              zod.string().nullish(),
  createdAt:       zod.string(),
  updatedAt:       zod.string(),
});

// ── Responses ─────────────────────────────────────────────────────────────

export const CorrListLettersResponse    = zod.array(CorrLetterRecord);
export const CorrCreateLetterResponse   = CorrLetterRecord;
export const CorrGetLetterResponse      = CorrLetterRecord;
export const CorrUpdateLetterResponse   = CorrLetterRecord;
export const CorrDeleteLetterResponse   = zod.void();

export const CorrGetLetterStatsResponse = zod.object({
  total:        zod.number(),
  newLetters:   zod.number(),
  replyLetters: zod.number(),
  drafts:       zod.number(),
  finals:       zod.number(),
});

export const CorrGetRecentLettersResponse = zod.array(CorrLetterRecord);

export const CorrGenerateDocxResponse = zod.object({
  downloadPath: zod.string(),
  filename:     zod.string(),
});

// ── Request bodies ────────────────────────────────────────────────────────

export const CorrCreateLetterBody = zod.object({
  ...bilingualFields,
  type:            zod.enum(["new", "reply"]),
  status:          zod.enum(["draft", "final"]).optional(),
  letterNumber:    zod.string(),
  date:            zod.string(),
  toName:          zod.string(),
  toDesignation:   zod.string(),
  toOffice:        zod.string(),
  subject:         zod.string(),
  reference:       zod.string().optional(),
  body:            zod.string(),
  fromName:        zod.string(),
  fromDesignation: zod.string(),
  fromOffice:      zod.string(),
  cc:              zod.string().optional(),
});

export const CorrUpdateLetterBody = CorrCreateLetterBody.partial().refine(
  (fields) => Object.keys(fields).length > 0,
  "Provide at least one letter field to update.",
);

// ── Inferred types ────────────────────────────────────────────────────────

export type CorrLetter             = zod.infer<typeof CorrLetterRecord>;
export type CorrCreateLetterInput  = zod.infer<typeof CorrCreateLetterBody>;
export type CorrUpdateLetterInput  = zod.infer<typeof CorrUpdateLetterBody>;
export type CorrLetterStats        = zod.infer<typeof CorrGetLetterStatsResponse>;
export type CorrGenerateDocxResult = zod.infer<typeof CorrGenerateDocxResponse>;
