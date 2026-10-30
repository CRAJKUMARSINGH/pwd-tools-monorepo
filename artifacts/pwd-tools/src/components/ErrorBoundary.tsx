import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render-time errors from any tool so a single crashed page cannot
 * white-screen the whole suite. Keyed by route in App.tsx, so navigating
 * away remounts the boundary and the app recovers without a full reload.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Tool crashed:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="p-8">
        <h1 className="text-lg font-bold">कुछ गड़बड़ हो गई / Something broke</h1>
        <pre className="mt-3 whitespace-pre-wrap text-xs text-destructive">{this.state.error.message}</pre>
        <div className="mt-4 flex gap-2">
          <button className="rounded border px-3 py-1.5 text-sm font-semibold" onClick={() => location.reload()}>
            Reload
          </button>
          <button
            className="rounded border px-3 py-1.5 text-sm font-semibold"
            onClick={() => {
              location.href = "/";
            }}
          >
            Home
          </button>
        </div>
      </div>
    );
  }
}
