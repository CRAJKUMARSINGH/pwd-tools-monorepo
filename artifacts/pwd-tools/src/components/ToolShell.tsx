import { Home as HomeIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useLocation } from "wouter";

type Props = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export default function ToolShell({ title, subtitle, actions, children }: Props) {
  const [, navigate] = useLocation();

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <header className="hide-on-print sticky top-0 z-30 flex items-center gap-3 border-b bg-primary px-3 py-2.5 text-primary-foreground">
        <button
          type="button"
          onClick={() => navigate("/")}
          aria-label="होम / Home"
          title="Home"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary-foreground/30 px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-primary-foreground/10"
        >
          <HomeIcon className="h-3.5 w-3.5" aria-hidden="true" />
          होम
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold leading-tight">{title}</h1>
          {subtitle && <p className="truncate text-[11px] opacity-75">{subtitle}</p>}
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-2">{actions}</div>
      </header>

      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}
