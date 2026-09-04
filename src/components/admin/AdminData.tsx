import React from "react";
import { RefreshCw, AlertTriangle, Inbox } from "lucide-react";

export function useAdminData<T = any>(loader: () => Promise<string>, deps: any[] = []) {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const run = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const raw = await loader();
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (parsed && parsed.success === false) {
        setError(parsed.message || "Request failed");
        setData((parsed.data ?? null) as T);
      } else {
        setData((parsed?.data !== undefined ? parsed.data : parsed) as T);
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  React.useEffect(() => {
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run]);

  return { data, loading, error, reload: run };
}

export function AdminState({
  loading,
  error,
  empty,
  emptyLabel = "No records found.",
  errorLabel = "Failed to load data",
  onRetry,
  children,
}: {
  loading: boolean;
  error: string | null;
  empty: boolean;
  emptyLabel?: string;
  errorLabel?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  if (loading) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
        <RefreshCw className="animate-spin" size={22} />
        <span className="text-xs font-bold uppercase tracking-widest">Loading…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-center">
        <AlertTriangle className="text-destructive" size={26} />
        <p className="text-sm font-black uppercase tracking-widest">{errorLabel}</p>
        <p className="text-xs text-muted-foreground max-w-lg break-words">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-black uppercase tracking-widest"
          >
            Retry
          </button>
        )}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="py-16 flex flex-col items-center gap-3 text-muted-foreground">
        <Inbox size={26} />
        <p className="text-xs font-black uppercase tracking-widest">{emptyLabel}</p>
      </div>
    );
  }
  return <>{children}</>;
}
