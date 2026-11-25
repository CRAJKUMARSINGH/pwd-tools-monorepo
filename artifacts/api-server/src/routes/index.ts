import { json, Router, urlencoded, type IRouter } from "express";
import { requireApiKey } from "../lib/api-key";
import correspondenceRouter from "./correspondence";
import healthRouter from "./health";
import legalRouter from "./legal";

const router: IRouter = Router();
const authenticate = requireApiKey(process.env.PWD_CORRESPONDENCE_API_KEY);
const parseBody = [json(), urlencoded({ extended: true })];

// ── Core ──────────────────────────────────────────────────────────────────
router.use(healthRouter);
router.get("/session", authenticate, (_req, res) => { res.status(204).end(); });

// ── Correspondence-Assistant  →  /api/correspondence/* ────────────────────
router.use("/correspondence", authenticate, parseBody, correspondenceRouter);

// ── Legal-Document-Wizard    →  /api/legal/* ──────────────────────────────
router.use("/legal", authenticate, parseBody, legalRouter);

export default router;
