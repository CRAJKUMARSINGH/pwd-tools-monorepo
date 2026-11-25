import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { clearOfficeAccess, openOfficeAccess } from "@/lib/office-api";

export default function OfficeApiAccess({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [signedIn, setSignedIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pending = useRef<AbortController | null>(null);

  useEffect(() => () => {
    pending.current?.abort();
    clearOfficeAccess();
    queryClient.clear();
  }, [queryClient]);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending.current) return;
    const key = String(new FormData(event.currentTarget).get("accessKey") ?? "").trim();
    if (!/^[A-Za-z0-9_-]{32,128}$/.test(key)) {
      setError("Enter the access key provided by your administrator.");
      return;
    }
    const request = new AbortController();
    pending.current = request;
    setError("");
    setBusy(true);
    try {
      await openOfficeAccess(key, request.signal);
      if (!request.signal.aborted) setSignedIn(true);
    } catch (reason) {
      if (!request.signal.aborted) setError(reason instanceof Error ? reason.message : "Could not sign in.");
    } finally {
      pending.current = null;
      if (!request.signal.aborted) setBusy(false);
    }
  }

  function signOut() {
    clearOfficeAccess();
    setSignedIn(false);
    queryClient.clear();
  }

  if (signedIn) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="hide-on-print mx-auto flex max-w-5xl justify-end px-4 py-2">
          <button type="button" onClick={signOut} className="rounded border px-3 py-1.5 text-sm">Sign out</button>
        </div>
        {children}
      </QueryClientProvider>
    );
  }

  return (
    <form onSubmit={signIn} className="mx-auto mt-8 flex w-full max-w-md flex-col gap-3 px-4">
      <label htmlFor="office-access-key" className="text-sm font-semibold">Office access key</label>
      <input id="office-access-key" name="accessKey" type="password" autoComplete="off" required disabled={busy}
        className="rounded border bg-background px-3 py-2" />
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <button type="submit" disabled={busy} className="rounded bg-primary px-3 py-2 text-primary-foreground disabled:opacity-60">
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
