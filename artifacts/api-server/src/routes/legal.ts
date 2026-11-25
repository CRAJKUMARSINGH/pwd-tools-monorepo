/**
 * Legal-Document-Wizard routes — integrated from CODE-JUNCTION/Legal-Document-Wizard
 *
 * Mounted at /api/legal by routes/index.ts
 *
 * Letter endpoints:
 *   GET    /letters                 list (filter status/search)
 *   POST   /letters                 create
 *   GET    /letters/stats           stats
 *   GET    /letters/recent          last 5
 *   GET    /letters/:id             get one
 *   PATCH  /letters/:id             update
 *   PATCH  /letters/:id/finalize    mark final
 *   DELETE /letters/:id             delete
 *
 * Style endpoints:
 *   GET    /styles                  list
 *   POST   /styles                  create
 *   GET    /styles/:id              get one
 *   PATCH  /styles/:id              update
 *   DELETE /styles/:id              delete
 */
import { Router, type IRouter } from "express";
import { desc, eq, sql } from "drizzle-orm";
import { db, legalLettersTable, legalLetterStylesTable } from "@workspace/db";
import {
  LegalListLettersQueryParams,
  LegalCreateLetterBody,
  LegalGetLetterParams,
  LegalUpdateLetterParams,
  LegalUpdateLetterBody,
  LegalDeleteLetterParams,
  LegalFinalizeLetterParams,
  LegalCreateStyleBody,
  LegalGetStyleParams,
  LegalUpdateStyleParams,
  LegalUpdateStyleBody,
  LegalDeleteStyleParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

// ── helper: join styleName onto a letter ─────────────────────────────────

async function withStyleName(letter: typeof legalLettersTable.$inferSelect) {
  if (!letter.styleId) return { ...letter, styleName: null };
  const [style] = await db
    .select({ name: legalLetterStylesTable.name })
    .from(legalLetterStylesTable)
    .where(eq(legalLetterStylesTable.id, letter.styleId));
  return { ...letter, styleName: style?.name ?? null };
}

// ════════════════════════════════════════════════════════════════════════════
// LETTER ROUTES
// ════════════════════════════════════════════════════════════════════════════

router.get("/letters", async (req, res): Promise<void> => {
  const query = LegalListLettersQueryParams.safeParse(req.query);

  let letters = await db
    .select()
    .from(legalLettersTable)
    .orderBy(desc(legalLettersTable.createdAt));

  if (query.success && query.data.status) {
    letters = letters.filter((l) => l.status === query.data.status);
  }
  if (query.success && query.data.search) {
    const s = query.data.search.toLowerCase();
    letters = letters.filter(
      (l) =>
        l.subject.toLowerCase().includes(s) ||
        l.toAddress.toLowerCase().includes(s) ||
        (l.toName?.toLowerCase().includes(s) ?? false),
    );
  }

  const result = await Promise.all(letters.map(withStyleName));
  res.json(result);
});

router.get("/letters/stats", async (_req, res): Promise<void> => {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      draft: sql<number>`count(*) filter (where status = 'draft')::int`,
      final: sql<number>`count(*) filter (where status = 'final')::int`,
    })
    .from(legalLettersTable);
  res.json({ total: row?.total ?? 0, draft: row?.draft ?? 0, final: row?.final ?? 0 });
});

router.get("/letters/recent", async (_req, res): Promise<void> => {
  const letters = await db
    .select()
    .from(legalLettersTable)
    .orderBy(desc(legalLettersTable.updatedAt))
    .limit(5);
  const result = await Promise.all(letters.map(withStyleName));
  res.json(result);
});

router.get("/letters/:id", async (req, res): Promise<void> => {
  const raw    = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LegalGetLetterParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [letter] = await db
    .select()
    .from(legalLettersTable)
    .where(eq(legalLettersTable.id, params.data.id));

  if (!letter) { res.status(404).json({ error: "Letter not found" }); return; }
  res.json(await withStyleName(letter));
});

router.post("/letters", async (req, res): Promise<void> => {
  const parsed = LegalCreateLetterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { styleId, status, ...rest } = parsed.data;
  const [letter] = await db
    .insert(legalLettersTable)
    .values({
      ...rest,
      ...(styleId != null ? { styleId } : {}),
      status: status ?? "draft",
    })
    .returning();

  res.status(201).json(await withStyleName(letter));
});

router.patch("/letters/:id", async (req, res): Promise<void> => {
  const raw    = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LegalUpdateLetterParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = LegalUpdateLetterBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [letter] = await db
    .update(legalLettersTable)
    .set(parsed.data as Partial<typeof legalLettersTable.$inferInsert>)
    .where(eq(legalLettersTable.id, params.data.id))
    .returning();

  if (!letter) { res.status(404).json({ error: "Letter not found" }); return; }
  res.json(await withStyleName(letter));
});

router.patch("/letters/:id/finalize", async (req, res): Promise<void> => {
  const raw    = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LegalFinalizeLetterParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [letter] = await db
    .update(legalLettersTable)
    .set({ status: "final" })
    .where(eq(legalLettersTable.id, params.data.id))
    .returning();

  if (!letter) { res.status(404).json({ error: "Letter not found" }); return; }
  res.json(await withStyleName(letter));
});

router.delete("/letters/:id", async (req, res): Promise<void> => {
  const raw    = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LegalDeleteLetterParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db.delete(legalLettersTable).where(eq(legalLettersTable.id, params.data.id));
  res.sendStatus(204);
});

// ════════════════════════════════════════════════════════════════════════════
// STYLE ROUTES
// ════════════════════════════════════════════════════════════════════════════

router.get("/styles", async (_req, res): Promise<void> => {
  const styles = await db
    .select()
    .from(legalLetterStylesTable)
    .orderBy(legalLetterStylesTable.name);
  res.json(styles);
});

router.get("/styles/:id", async (req, res): Promise<void> => {
  const raw    = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LegalGetStyleParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [style] = await db
    .select()
    .from(legalLetterStylesTable)
    .where(eq(legalLetterStylesTable.id, params.data.id));

  if (!style) { res.status(404).json({ error: "Style not found" }); return; }
  res.json(style);
});

router.post("/styles", async (req, res): Promise<void> => {
  const parsed = LegalCreateStyleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  // Enforce single default
  if (parsed.data.isDefault) {
    await db.update(legalLetterStylesTable).set({ isDefault: false });
  }

  const [style] = await db
    .insert(legalLetterStylesTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(style);
});

router.patch("/styles/:id", async (req, res): Promise<void> => {
  const raw    = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LegalUpdateStyleParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = LegalUpdateStyleBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  if (parsed.data.isDefault) {
    await db.update(legalLetterStylesTable).set({ isDefault: false });
  }

  const [style] = await db
    .update(legalLetterStylesTable)
    .set(parsed.data)
    .where(eq(legalLetterStylesTable.id, params.data.id))
    .returning();

  if (!style) { res.status(404).json({ error: "Style not found" }); return; }
  res.json(style);
});

router.delete("/styles/:id", async (req, res): Promise<void> => {
  const raw    = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = LegalDeleteStyleParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  await db
    .delete(legalLetterStylesTable)
    .where(eq(legalLetterStylesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
