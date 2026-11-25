const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");
export const officeApiEnabled = Boolean(import.meta.env.VITE_API_URL);
export const officeApiUrl = (path: string) => `${base}/api${path}`;
let accessKey: string | undefined;

export function clearOfficeAccess() {
  accessKey = undefined;
}

export async function openOfficeAccess(key: string, signal: AbortSignal) {
  const response = await fetch(officeApiUrl("/session"), {
    headers: { Authorization: `Bearer ${key}` },
    redirect: "error",
    signal,
  });
  if (response.status === 401) throw new Error("The access key was rejected.");
  if (response.status !== 204) throw new Error("The correspondence server is unavailable.");
  signal.throwIfAborted();
  accessKey = key;
}

export async function officeApiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  if (!accessKey) throw new Error("Sign in to access the correspondence server.");
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${accessKey}`);
  if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(officeApiUrl(path), { ...init, headers, redirect: "error" });
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`API ${response.status}: ${body || response.statusText}`);
  }
  return response.status === 204 ? undefined as T : response.json() as Promise<T>;
}
