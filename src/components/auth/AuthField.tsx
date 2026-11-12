import type { ComponentType, ReactNode } from "react";

type Props = {
  label: string;
  htmlFor: string;
  icon: ComponentType<{ size?: number }>;
  error?: string;
  /** Element rendered on the right inside the input, e.g. a show/hide button. */
  right?: ReactNode;
  children: ReactNode;
};

/** Label + icon + error wrapper around a native <input> (pass the input as children). */
export function AuthField({ label, htmlFor, icon: Icon, error, right, children }: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="text-sm font-semibold ml-1 text-foreground/80">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-primary">
          <Icon size={18} />
        </div>
        {children}
        {right && <div className="absolute inset-y-0 right-0 pr-4 flex items-center">{right}</div>}
      </div>
      {error && <p className="text-xs text-destructive ml-1">{error}</p>}
    </div>
  );
}

export const AUTH_INPUT_CLASS =
  "block w-full pl-12 pr-12 py-3.5 bg-white/80 border border-border rounded-2xl focus:ring-4 focus:ring-primary/15 focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 text-foreground";
