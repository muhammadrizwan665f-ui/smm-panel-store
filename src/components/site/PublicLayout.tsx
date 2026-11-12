import type { ReactNode } from "react";
import { SiteHeader } from "./SiteHeader";
import { SiteFooter } from "./SiteFooter";

/** Header + page content + footer, used by every public (logged-out) page. */
export function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background relative overflow-x-hidden flex flex-col">
      <div className="pointer-events-none absolute top-[-8%] right-[-10%] w-[45%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute top-[30%] left-[-12%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <SiteHeader />
      <main className="relative flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
