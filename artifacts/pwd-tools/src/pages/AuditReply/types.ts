export type AuditStep = "landing" | "upload" | "workspace";

export type AuditTab = "existing" | "fresh";

/** An image the user picked in the upload step, before it becomes a para. */
export type UploadedInput = {
  id: string;
  file: File;
  /** Data URL — survives the step change, which an object URL would not. */
  previewUrl: string;
  name: string;
};
