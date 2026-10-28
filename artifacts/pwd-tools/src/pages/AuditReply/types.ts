export type AuditStep = "landing" | "upload" | "workspace";

export type UploadedInput = {
  id: string;
  file: File;
  previewUrl: string;
  name: string;
};

export type AuditDraft = {
  paraNo: string;
  paraText: string;
  replyText: string;
  imageDataUrls: string[];
  savedAt: string;
};
