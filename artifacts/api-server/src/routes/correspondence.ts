/**
 * Correspondence-Assistant routes — integrated from CODE-JUNCTION/Correspondence-Assistant
 *
 * Mounted at /api/correspondence by routes/index.ts
 *
 * Endpoints:
 *   GET    /letters           list (filter type/status)
 *   POST   /letters           create
 *   GET    /letters/stats     stats
 *   GET    /letters/recent    last 5
 *   GET    /letters/:id       get one
 *   PATCH  /letters/:id       update
 *   DELETE /letters/:id       delete
 *   POST   /letters/:id/generate-docx   produce Word file
 *   GET    /letters/:id/download        download produced Word file
 */
import { Router, type IRouter } from "express";
import { and, count, desc, eq } from "drizzle-orm";
import { db, correspondenceLettersTable } from "@workspace/db";
import {
  CorrListLettersQueryParams,
  CorrCreateLetterBody,
  CorrGetLetterParams,
  CorrUpdateLetterParams,
  CorrUpdateLetterBody,
  CorrDeleteLetterParams,
  CorrGenerateDocxParams,
  CorrListLettersResponse,
  CorrCreateLetterResponse,
  CorrGetLetterStatsResponse,
  CorrGetRecentLettersResponse,
  CorrGetLetterResponse,
  CorrUpdateLetterResponse,
  CorrGenerateDocxResponse,
} from "@workspace/api-zod";
import {
  AlignmentType,
  BorderStyle,
  Document,
  LineRuleType,
  Packer,
  PageOrientation,
  Paragraph,
  TabStopType,
  TextRun,
} from "docx";

const router: IRouter = Router();

// ── helpers ───────────────────────────────────────────────────────────────

function fmt(letter: typeof correspondenceLettersTable.$inferSelect) {
  return {
    ...letter,
    createdAt: letter.createdAt.toISOString(),
    updatedAt: letter.updatedAt.toISOString(),
  };
}

// ── Page layout constants (standing spec) ────────────────────────────────
const A4_WIDTH_TWIPS  = 11906; // 210 mm
const A4_HEIGHT_TWIPS = 16838; // 297 mm
const MARGIN_TWIPS    = 1417;  // 25 mm
const ZERO            = 0;

function para(
  runs: ConstructorParameters<typeof TextRun>[0][],
  opts: {
    alignment?: (typeof AlignmentType)[keyof typeof AlignmentType];
    indent?: { firstLine?: number; left?: number };
  } = {}
) {
  return new Paragraph({
    children: runs.map((r) => new TextRun(r)),
    alignment: opts.alignment ?? AlignmentType.JUSTIFIED,
    spacing: { before: ZERO, after: ZERO, line: 276, lineRule: LineRuleType.AUTO },
    ...(opts.indent ? { indent: opts.indent } : {}),
  });
}

function blankLine() {
  return new Paragraph({
    children: [],
    spacing: { before: ZERO, after: ZERO, line: 276, lineRule: LineRuleType.AUTO },
  });
}

// ── List ─────────────────────────────────────────────────────────────────

router.get("/letters", async (req, res): Promise<void> => {
  const params = CorrListLettersQueryParams.safeParse(req.query);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const conditions = [];
  if (params.data.type)   conditions.push(eq(correspondenceLettersTable.type,   params.data.type));
  if (params.data.status) conditions.push(eq(correspondenceLettersTable.status, params.data.status));

  const letters = await db
    .select()
    .from(correspondenceLettersTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(correspondenceLettersTable.createdAt));

  res.json(CorrListLettersResponse.parse(letters.map(fmt)));
});

// ── Create ───────────────────────────────────────────────────────────────

router.post("/letters", async (req, res): Promise<void> => {
  const parsed = CorrCreateLetterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [letter] = await db
    .insert(correspondenceLettersTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(CorrCreateLetterResponse.parse(fmt(letter)));
});

// ── Stats ────────────────────────────────────────────────────────────────

router.get("/letters/stats", async (_req, res): Promise<void> => {
  const t = correspondenceLettersTable;
  const [total]  = await db.select({ count: count() }).from(t);
  const [newL]   = await db.select({ count: count() }).from(t).where(eq(t.type,   "new"));
  const [replyL] = await db.select({ count: count() }).from(t).where(eq(t.type,   "reply"));
  const [drafts] = await db.select({ count: count() }).from(t).where(eq(t.status, "draft"));
  const [finals] = await db.select({ count: count() }).from(t).where(eq(t.status, "final"));

  res.json(CorrGetLetterStatsResponse.parse({
    total:        total?.count  ?? 0,
    newLetters:   newL?.count   ?? 0,
    replyLetters: replyL?.count ?? 0,
    drafts:       drafts?.count ?? 0,
    finals:       finals?.count ?? 0,
  }));
});

// ── Recent ───────────────────────────────────────────────────────────────

router.get("/letters/recent", async (_req, res): Promise<void> => {
  const letters = await db
    .select()
    .from(correspondenceLettersTable)
    .orderBy(desc(correspondenceLettersTable.createdAt))
    .limit(5);
  res.json(CorrGetRecentLettersResponse.parse(letters.map(fmt)));
});

// ── Get one ──────────────────────────────────────────────────────────────

router.get("/letters/:id", async (req, res): Promise<void> => {
  const params = CorrGetLetterParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const letter = await findLetter(params.data.id);

  if (!letter) { res.status(404).json({ error: "Letter not found" }); return; }
  res.json(CorrGetLetterResponse.parse(fmt(letter)));
});

// ── Update ───────────────────────────────────────────────────────────────

router.patch("/letters/:id", async (req, res): Promise<void> => {
  const params = CorrUpdateLetterParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = CorrUpdateLetterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [letter] = await db
    .update(correspondenceLettersTable)
    .set(parsed.data)
    .where(eq(correspondenceLettersTable.id, params.data.id))
    .returning();

  if (!letter) { res.status(404).json({ error: "Letter not found" }); return; }
  res.json(CorrUpdateLetterResponse.parse(fmt(letter)));
});

// ── Delete ───────────────────────────────────────────────────────────────

router.delete("/letters/:id", async (req, res): Promise<void> => {
  const params = CorrDeleteLetterParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [deleted] = await db
    .delete(correspondenceLettersTable)
    .where(eq(correspondenceLettersTable.id, params.data.id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Letter not found" }); return; }
  res.sendStatus(204);
});

function letterParagraphs(letter: typeof correspondenceLettersTable.$inferSelect, english: boolean): Paragraph[] {
  const toName = english ? letter.toNameEn : letter.toName;
  const toDesignation = english ? letter.toDesignationEn : letter.toDesignation;
  const toOffice = english ? letter.toOfficeEn : letter.toOffice;
  const fromName = english ? letter.fromNameEn : letter.fromName;
  const fromDesignation = english ? letter.fromDesignationEn : letter.fromDesignation;
  const fromOffice = english ? letter.fromOfficeEn : letter.fromOffice;
  const subject = english ? letter.subjectEn : letter.subject;
  const reference = english ? letter.referenceEn : letter.reference;
  const body = english ? letter.bodyEn : letter.body;
  const cc = english ? letter.ccEn : letter.cc;

  return [
    // ── Office header ────────────────────────────────────────────
    para([{ text: english ? "Government of Rajasthan" : "राजस्थान सरकार", bold: true, size: 28, font: "Mangal" }],
         { alignment: AlignmentType.CENTER }),
    para([{ text: english ? fromDesignation + ", Public Works Department" : fromDesignation + ", सार्वजनिक निर्माण विभाग", bold: true, size: 26, font: "Mangal" }],
         { alignment: AlignmentType.CENTER }),
    para([{ text: fromOffice, bold: true, size: 24, font: "Mangal" }],
         { alignment: AlignmentType.CENTER }),
    blankLine(),

    // ── क्रमांक / दिनांक ─────────────────────────────────────────
    new Paragraph({
      children: [
        new TextRun({ text: `${english ? "No.:" : "क्रमांकः"} ${letter.letterNumber}`, size: 22, font: "Mangal" }),
        new TextRun({ text: "\t", size: 22, font: "Mangal" }),
        new TextRun({ text: `${english ? "Date:" : "दिनांकः"} ${letter.date}`, size: 22, font: "Mangal" }),
      ],
      alignment: AlignmentType.LEFT,
      spacing: { before: ZERO, after: ZERO, line: 276, lineRule: LineRuleType.AUTO },
      tabStops: [{ type: TabStopType.RIGHT, position: A4_WIDTH_TWIPS - MARGIN_TWIPS * 2 }],
    }),
    blankLine(),

    // ── Addressee ────────────────────────────────────────────────
    para([{ text: english ? "To," : "सेवा में,",                           size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
    para([{ text: `${toDesignation},`,            size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
    para([{ text: `${toName},`,                   size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
    para([{ text: `${toOffice}${english ? "." : "।"}`,                 size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
    blankLine(),

    // ── विषय ─────────────────────────────────────────────────────
    para([
      { text: english ? "Subject: " : "विषयः– ", bold: true, size: 22, font: "Mangal" },
      { text: subject,         size: 22, font: "Mangal" },
    ]),
    blankLine(),

    // ── संदर्भ (optional) ─────────────────────────────────────────
    ...(reference ? [
      para([
        { text: english ? "Reference: " : "संदर्भः– ", bold: true, size: 22, font: "Mangal" },
        { text: reference,     size: 22, font: "Mangal" },
      ]),
      blankLine(),
    ] : []),

    // ── महोदय ────────────────────────────────────────────────────
    para([{ text: english ? "Sir/Madam," : "महोदय,", size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
    blankLine(),

    // ── Body ──────────────────────────────────────────────────────
    ...body.split("\n").map((line) =>
      para([{ text: line, size: 22, font: "Mangal" }],
           { indent: { firstLine: 720 } })
    ),
    blankLine(),

    // ── भवदीय ────────────────────────────────────────────────────
    para([{ text: english ? "Yours faithfully," : "भवदीय,", size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
    blankLine(), blankLine(), blankLine(),

    // ── Signature ────────────────────────────────────────────────
    para([{ text: `(${fromName})`,    size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
    para([{ text: fromDesignation,    size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
    para([{ text: fromOffice,         size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),

    // ── CC (optional) ─────────────────────────────────────────────
    ...(cc ? [
      blankLine(),
      new Paragraph({
        children: [],
        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
        spacing: { before: ZERO, after: ZERO },
      }),
      para([{ text: english ? "Copy to:" : "प्रतिलिपि सूचनार्थ एवं आवश्यक कार्यवाही हेतु प्रेषित:", bold: true, size: 22, font: "Mangal" }],
           { alignment: AlignmentType.LEFT }),
      blankLine(),
      ...cc.split("\n").map((line, i) =>
        para([{ text: `${i + 1}. ${line}`, size: 22, font: "Mangal" }],
             { indent: { left: 360 } })
      ),
      blankLine(), blankLine(),
      para([{ text: `(${fromName})`, size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
      para([{ text: fromDesignation, size: 22, font: "Mangal" }], { alignment: AlignmentType.LEFT }),
    ] : []),
  ];
}

function letterFilename(letter: typeof correspondenceLettersTable.$inferSelect): string {
  const safeNumber = letter.letterNumber.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120);
  return `patra_${safeNumber}_${letter.id}.docx`;
}

async function findLetter(id: number) {
  const [letter] = await db.select().from(correspondenceLettersTable)
    .where(eq(correspondenceLettersTable.id, id));
  return letter;
}

// ── Generate DOCX ────────────────────────────────────────────────────────

router.post("/letters/:id/generate-docx", async (req, res): Promise<void> => {
  const params = CorrGenerateDocxParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const letter = await findLetter(params.data.id);

  if (!letter) { res.status(404).json({ error: "Letter not found" }); return; }

  res.json(CorrGenerateDocxResponse.parse({
    downloadPath: `/api/correspondence/letters/${letter.id}/download`,
    filename: letterFilename(letter),
  }));
});

// Render the current record on demand, including across server restarts.
router.get("/letters/:id/download", async (req, res): Promise<void> => {
  const params = CorrGenerateDocxParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const letter = await findLetter(params.data.id);
  if (!letter) { res.status(404).json({ error: "Letter not found" }); return; }

  const versions = letter.language === "both" ? [false, true] : [letter.language === "english"];
  const doc = new Document({
    sections: versions.map(english => ({
      properties: {
        page: {
          size: { orientation: PageOrientation.PORTRAIT, width: A4_WIDTH_TWIPS, height: A4_HEIGHT_TWIPS },
          margin: { top: MARGIN_TWIPS, right: MARGIN_TWIPS, bottom: MARGIN_TWIPS, left: MARGIN_TWIPS, header: ZERO, footer: ZERO },
        },
      },
      children: letterParagraphs(letter, english),
    })),
  });
  const buffer = await Packer.toBuffer(doc);
  res.attachment(letterFilename(letter)).send(buffer);
});

export default router;
