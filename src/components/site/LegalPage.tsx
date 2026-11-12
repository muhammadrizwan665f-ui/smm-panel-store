import type { ReactNode, ComponentType } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BUSINESS, POLICY_LINKS } from "@/lib/business";
import { PublicLayout } from "./PublicLayout";

export type LegalSection = {
  id: string;
  title: string;
  body: ReactNode;
};

type Props = {
  /** Route path of the current page, so it is left out of "Other policies". */
  currentPath: string;
  title: string;
  intro: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  sections: LegalSection[];
};

/**
 * Shared layout for all policy pages: hero, sticky table of contents,
 * numbered sections and links to the other policies.
 */
export function LegalPage({ currentPath, title, intro, icon: Icon, sections }: Props) {
  const others = POLICY_LINKS.filter((l) => l.to !== currentPath);

  return (
    <PublicLayout>
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-8">
        <div className="glass-white card-shadow rounded-[2rem] p-7 md:p-10 flex flex-col md:flex-row md:items-center gap-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center text-white shadow-lg shadow-primary/25 shrink-0">
            <Icon size={30} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gradient">{title}</h1>
            <p className="text-muted-foreground max-w-2xl leading-relaxed">{intro}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
              Last updated: {BUSINESS.legalLastUpdated}
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 grid gap-8 lg:grid-cols-[260px_1fr] items-start">
        <aside className="hidden lg:block sticky top-24">
          <div className="glass-white card-shadow rounded-3xl p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">
              On this page
            </p>
            <ol className="space-y-1.5 text-sm">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="flex gap-2 py-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span className="text-primary/70 font-bold tabular-nums">{i + 1}.</span>
                    <span>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </aside>

        <article className="glass-white card-shadow rounded-[2rem] p-6 md:p-10 space-y-10 min-w-0">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-24 legal-prose">
              <h2 className="text-xl font-black tracking-tight text-foreground flex gap-3 items-baseline">
                <span className="text-primary/70 tabular-nums">{i + 1}.</span>
                {s.title}
              </h2>
              {s.body}
            </section>
          ))}

          <div className="rounded-2xl bg-primary/5 border border-primary/15 p-5 text-sm text-muted-foreground leading-relaxed">
            Questions about this page? Contact {BUSINESS.name} at{" "}
            <a className="font-bold text-primary" href={`tel:${BUSINESS.phoneIntl}`}>
              {BUSINESS.phoneDisplay}
            </a>{" "}
            or visit us at {BUSINESS.addressOneLine}.{" "}
            <Link to="/contact" className="font-bold text-primary">
              See all contact options
            </Link>
            .
          </div>
        </article>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-10">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-4">
          Other policies
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {others.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="glass-white rounded-2xl px-5 py-4 flex items-center justify-between text-sm font-bold text-foreground/80 hover:text-primary transition-colors card-shadow"
            >
              {l.label}
              <ArrowRight size={16} className="text-primary" />
            </Link>
          ))}
        </div>
      </section>
    </PublicLayout>
  );
}
