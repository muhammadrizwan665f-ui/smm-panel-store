import React from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle } from "lucide-react";

type Props = { children: React.ReactNode };
type State = { error: Error | null };

export class AdminErrorBoundary extends React.Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[Management] component crashed", error, info.componentStack);
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="p-8 bg-white rounded-3xl border shadow-sm flex flex-col items-center gap-4 text-center">
        <AlertTriangle className="text-destructive" size={28} />
        <h2 className="text-lg font-black uppercase tracking-widest">This page crashed</h2>
        <p className="text-xs text-muted-foreground max-w-xl break-words">{this.state.error.message}</p>
        <div className="flex gap-3">
          <button
            onClick={() => this.setState({ error: null })}
            className="px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest"
          >
            Retry
          </button>
          <Link
            to="/management"
            onClick={() => this.setState({ error: null })}
            className="px-5 py-2 rounded-xl border text-xs font-black uppercase tracking-widest"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }
}
