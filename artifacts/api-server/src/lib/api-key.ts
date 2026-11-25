import { createHash, timingSafeEqual } from "node:crypto";
import type { RequestHandler } from "express";

const hash = (key: string) => createHash("sha256").update(key).digest();

export function requireApiKey(configuredKey: string | undefined): RequestHandler {
  const expected = configuredKey && /^[A-Za-z0-9_-]{32,128}$/.test(configuredKey)
    ? hash(configuredKey)
    : null;

  return (req, res, next) => {
    res.set("Cache-Control", "no-store");
    if (!expected) {
      res.status(503).json({ error: "Correspondence access is not configured." });
      return;
    }
    const key = /^Bearer ([A-Za-z0-9_-]{32,128})$/i.exec(req.get("Authorization") ?? "")?.[1];
    if (!key || !timingSafeEqual(hash(key), expected)) {
      res.set("WWW-Authenticate", 'Bearer realm="PWD Correspondence"');
      res.status(401).json({ error: "A valid access key is required." });
      return;
    }
    next();
  };
}
