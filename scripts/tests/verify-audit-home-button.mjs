/** Verifies the shared Audit Reply header and its Home destination. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) =>
  readFileSync(new URL("../../artifacts/pwd-tools/src/" + file, import.meta.url), "utf8");

const page = read("pages/AuditReply/index.tsx");
const workspace = read("pages/AuditReply/AuditWorkspace.tsx");
const shell = read("components/ToolShell.tsx");
const app = read("App.tsx");

assert.match(page, /return\s*\(\s*<ToolShell\b[\s\S]*?<AuditWorkspace\b[\s\S]*?<AuditUploadStep\b[\s\S]*?<AuditLanding\b[\s\S]*?<\/ToolShell>/);
assert.match(page, /toolbar=\{inWorkspace && <AuditWorkspaceTabs tab=\{tab\} onChange=\{setTab\}/);
assert.match(page, /onClick=\{handleExit\}\s+aria-label="Back to audit menu"/);
assert.match(shell, /<header[^>]*hide-on-print sticky top-0[^>]*>[\s\S]*?navigate\("\/home"\)[\s\S]*?\{toolbar\}[\s\S]*?<\/header>/);
assert.match(app, /<Route path="\/home" component=\{Home\}/);
assert.doesNotMatch(workspace, /<header\b|\bsticky\b/);
assert.match(workspace, /className="audit-print\b/);
assert.match(workspace, /usePrintPage\("landscape"/);

console.log("PASS — Audit Reply has one sticky Home header across the workflow");
