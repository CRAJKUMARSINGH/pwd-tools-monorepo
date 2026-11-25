import { beforeEach, describe, expect, it, vi } from "vitest";
import { FRESH_KEY, hasFreshParaContent, readAuditReplies, readFreshParas, replaceFreshDraft } from "./audit-drafts";
import { saveSnapshot, VAULT_TOOL } from "./vault";

vi.mock("./vault", () => ({
  saveSnapshot: vi.fn(),
  VAULT_TOOL: { AUDIT_FRESH: "audit-fresh-paras" },
}));

const storage = new Map<string, string>();
const backup = vi.mocked(saveSnapshot);

describe("audit draft recovery", () => {
  beforeEach(() => {
    storage.clear();
    backup.mockReset().mockResolvedValue(1);
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => storage.set(key, value),
    });
  });

  it("reads replies from an older Vault export and ignores invalid entries", () => {
    expect(readAuditReplies({
      paras: 3,
      replies: { first: { reply: "Saved" }, second: { comments: "Note" }, third: null },
    })).toEqual({ first: { reply: "Saved", comments: "" }, second: { reply: "", comments: "Note" } });
  });

  it("backs up comments-only drafts before starting with a new image", async () => {
    const current = [{ id: "first", comments: "Keep this" }];
    storage.set(FRESH_KEY, JSON.stringify(current));
    const replacement = [{ ...readFreshParas([{ id: "next" }])[0], imageDataUrl: "data:image/png;base64,example" }];

    expect(hasFreshParaContent(readFreshParas(current)[0])).toBe(true);
    await replaceFreshDraft(replacement);

    expect(backup).toHaveBeenCalledWith(VAULT_TOOL.AUDIT_FRESH, expect.any(String), readFreshParas(current));
    expect(JSON.parse(storage.get(FRESH_KEY)!)).toEqual(readFreshParas(replacement));
  });

  it("keeps the previous draft when its backup fails", async () => {
    const original = JSON.stringify([{ id: "first", resp: "Keep this response" }]);
    storage.set(FRESH_KEY, original);
    backup.mockRejectedValueOnce(new Error("Storage unavailable"));

    await expect(replaceFreshDraft(readFreshParas([{ id: "next" }]))).rejects.toThrow("Storage unavailable");
    expect(storage.get(FRESH_KEY)).toBe(original);
  });

  it("preserves an edit made from another tab during backup", async () => {
    storage.set(FRESH_KEY, JSON.stringify([{ id: "first", reply: "Old" }]));
    const edited = JSON.stringify([{ id: "first", reply: "New" }]);
    backup.mockImplementationOnce(async () => {
      storage.set(FRESH_KEY, edited);
      return 1;
    });

    await expect(replaceFreshDraft(readFreshParas([{ id: "next" }]))).rejects.toThrow("another tab");
    expect(storage.get(FRESH_KEY)).toBe(edited);
  });
});
