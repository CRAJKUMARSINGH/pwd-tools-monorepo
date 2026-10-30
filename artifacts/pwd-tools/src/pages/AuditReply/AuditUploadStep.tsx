import { ArrowLeft, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { UploadedInput } from "./types";

type Props = {
  /** Back to the landing step. */
  onBack: () => void;
  /** Hand the picked images to the workspace (each becomes one fresh para). */
  onDone: (inputs: UploadedInput[]) => void;
};

const uid = () => Math.random().toString(36).slice(2, 10);

/** Android pickers sometimes report an empty `type` for a real image. */
const looksLikeImage = (file: File) =>
  file.type.startsWith("image/") || (file.type === "" && /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name));

/**
 * Step 2 — pick the audit-report images. Each image becomes one "Fresh Para"
 * card in the workspace; the data URL is held in memory (never persisted).
 */
export default function AuditUploadStep({ onBack, onDone }: Props) {
  const [inputs, setInputs] = useState<UploadedInput[]>([]);
  const [rejected, setRejected] = useState(0);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const readAsDataUrl = (file: File) =>
    new Promise<UploadedInput>((resolve) => {
      const reader = new FileReader();
      const settle = (previewUrl: string) =>
        resolve({ id: uid(), file, previewUrl, name: file.name });
      reader.onload = () => settle(String(reader.result ?? ""));
      reader.onerror = () => settle("");
      reader.readAsDataURL(file);
    });

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    const all = Array.from(files);
    const images = all.filter(looksLikeImage);
    setRejected(all.length - images.length);
    if (!images.length) return;

    setBusy(true);
    const next = await Promise.all(images.map(readAsDataUrl));
    setInputs((prev) => [...prev, ...next]);
    setBusy(false);
  }

  const remove = (id: string) => setInputs((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          मेनू / Menu
        </button>
      </div>

      <h1 className="text-xl font-bold leading-tight">अंकेक्षण प्रतिवेदन की तस्वीरें चुनें</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        प्रत्येक तस्वीर कार्यक्षेत्र में एक नया <strong>Fresh Para</strong> बनेगी। फिर हर पैरा में
        विवरण एवं उत्तर भरें।
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => fileRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") fileRef.current?.click();
        }}
        className="mt-5 flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-primary/40 bg-muted/30 px-6 py-10 text-center transition-colors hover:border-primary hover:bg-muted/50"
      >
        <Upload className="h-7 w-7 text-primary" aria-hidden="true" />
        <span className="text-sm font-semibold">तस्वीरें चुनें / Click to select images</span>
        <span className="text-xs text-muted-foreground">JPG / PNG / WEBP — एक से अधिक चुन सकते हैं</span>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          void addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {rejected > 0 && (
        <p className="mt-2 text-xs text-amber-700">
          {rejected} फ़ाइल छोड़ दी गई — केवल तस्वीरें स्वीकार्य हैं।
        </p>
      )}

      {inputs.length > 0 && (
        <>
          <p className="mt-6 text-xs font-semibold text-muted-foreground">
            {inputs.length} तस्वीर{inputs.length !== 1 ? "ें" : ""} चुनी गई{inputs.length !== 1 ? "ं" : ""}
          </p>
          <ul className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {inputs.map((input) => (
              <li key={input.id} className="relative overflow-hidden rounded-lg border bg-card">
                <img src={input.previewUrl} alt={input.name} className="h-32 w-full object-contain" />
                <button
                  type="button"
                  onClick={() => remove(input.id)}
                  title="हटाएं / Remove"
                  className="absolute right-1.5 top-1.5 rounded-full bg-white/90 p-1 text-red-500 shadow hover:bg-red-100"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
                <p className="truncate border-t px-2 py-1 text-[10px] text-muted-foreground">{input.name}</p>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={busy || inputs.length === 0}
          onClick={() => onDone(inputs)}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          कार्यक्षेत्र खोलें / Continue
        </button>
        <button
          type="button"
          onClick={() => setInputs([])}
          disabled={inputs.length === 0}
          className="rounded-md border px-4 py-2 text-sm font-semibold hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
