import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ShieldCheck, Zap, Wallet, MapPin, Phone } from "lucide-react";
import { BUSINESS, POLICY_LINKS } from "@/lib/business";
import { BrandMark } from "@/components/site/SiteHeader";
import { useBranding } from "@/components/site/useBranding";

const HIGHLIGHTS = [
  { icon: Zap, title: "Fast order start", text: "Orders are placed instantly and start automatically." },
  { icon: Wallet, title: `Clear ${BUSINESS.currency} pricing`, text: "See the exact price before every order. No hidden charges." },
  { icon: ShieldCheck, title: "Secure payments", text: "Pay safely online — we never store your card details." },
] as const;

/**
 * Split-screen frame for the Login / Register pages: brand story on the left
 * (desktop only), the form on the right, policy links underneath.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { name } = useBranding();

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      <div className="pointer-events-none absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />

      <div className="relative flex-1 grid lg:grid-cols-[1.05fr_1fr]">
        <aside className="hidden lg:flex flex-col justify-between gradient-primary text-white p-12 xl:p-16">
          <Link to="/" className="flex items-center gap-3 font-black text-xl tracking-tight">
            <span className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              {name.charAt(0).toUpperCase()}
            </span>
            {name}
          </Link>

          <div className="space-y-8 max-w-md">
            <div className="space-y-3">
              <h2 className="text-4xl xl:text-5xl font-black leading-[1.1] tracking-tight">
                Grow your social media presence.
              </h2>
              <p className="text-white/80 leading-relaxed">
                Digital social media marketing services, ordered online and delivered straight to
                your profile.
              </p>
            </div>

            <ul className="space-y-5">
              {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center shrink-0">
                    <Icon size={20} />
                  </span>
                  <span>
                    <span className="block font-bold">{title}</span>
                    <span className="block text-sm text-white/75">{text}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="text-sm text-white/80 space-y-1.5">
            <p className="flex items-start gap-2">
              <MapPin size={15} className="mt-0.5 shrink-0" />
              {BUSINESS.addressOneLine}
            </p>
            <p className="flex items-center gap-2">
              <Phone size={15} className="shrink-0" />
              {BUSINESS.phoneDisplay}
            </p>
          </div>
        </aside>

        <main className="flex flex-col items-center justify-center p-4 py-10 sm:p-8">
          <div className="lg:hidden mb-6">
            <BrandMark />
          </div>
          {children}
        </main>
      </div>

      <footer className="relative border-t border-white/60 bg-white/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {BUSINESS.name} · {BUSINESS.addressOneLine}
          </span>
          <nav className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 font-semibold">
            {POLICY_LINKS.map((l) => (
              <Link key={l.to} to={l.to} className="hover:text-primary transition-colors">
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
