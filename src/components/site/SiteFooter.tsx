import { Link } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";
import { BUSINESS, MAPS_URL } from "@/lib/business";
import { useBranding } from "./useBranding";

const QUICK_LINKS = [
  { label: "Services", to: "/", hash: "services" },
  { label: "About Us", to: "/", hash: "about" },
  { label: "How it works", to: "/", hash: "how-it-works" },
  { label: "Payment Methods", to: "/", hash: "payments" },
  { label: "FAQs", to: "/", hash: "faq" },
  { label: "Contact Us", to: "/contact" },
  { label: "Blog", to: "/blog" },
  { label: "Login", to: "/login" },
  { label: "Create Account", to: "/register" },
] as const;

const POLICIES = [
  { label: "Terms & Conditions", to: "/terms-and-conditions" },
  { label: "Privacy Policy", to: "/privacy-policy" },
  { label: "Refund Policy", to: "/refund-policy" },
  { label: "Return Policy", to: "/return-policy" },
  { label: "Digital Delivery / Service Policy", to: "/delivery-policy" },
  { label: "Contact & Business Address", to: "/contact" },
] as const;

const LINK = "text-slate-300 hover:text-white transition-colors";

export function SiteFooter() {
  const { name, email, whatsappUrl } = useBranding();

  return (
    <footer className="mt-16 bg-slate-950 text-slate-300 border-t-4 border-primary">
      <div className="max-w-7xl mx-auto px-4 pt-14 pb-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.1fr_1.3fr]">
        {/* Brand */}
        <div className="space-y-4">
          <h3 className="text-lg font-black text-white">{name}</h3>
          <p className="text-sm leading-relaxed text-slate-400">
            {name} provides digital social media marketing services for Instagram, Facebook, YouTube,
            Telegram and more. Everything is ordered and delivered online — no physical goods are
            shipped.
          </p>
          <div className="flex flex-wrap gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-bold text-white transition-colors"
            >
              <MessageCircle size={14} /> WhatsApp
            </a>
            {email ? (
              <a
                href={`mailto:${email}`}
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-bold text-white transition-colors"
              >
                <Mail size={14} /> Email Us
              </a>
            ) : (
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-lg bg-white/10 hover:bg-white/15 px-3 py-2 text-xs font-bold text-white transition-colors"
              >
                <Mail size={14} /> Contact Us
              </Link>
            )}
          </div>
          <div className="pt-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
              We accept
            </p>
            <div className="flex flex-wrap gap-2">
              {["PayFast", "Bank / Wallet Transfer"].map((m) => (
                <span
                  key={m}
                  className="rounded-lg bg-white text-slate-900 px-2.5 py-1.5 text-[11px] font-black"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">Quick Links</h3>
          <ul className="space-y-2.5 text-sm">
            {QUICK_LINKS.map((l) => (
              <li key={l.label}>
                <Link to={l.to as any} hash={"hash" in l ? l.hash : undefined} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Policies */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">Policies</h3>
          <ul className="space-y-2.5 text-sm">
            {POLICIES.map((l) => (
              <li key={l.label}>
                <Link to={l.to} className={LINK}>
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact info */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white mb-4">Contact Info</h3>
          <dl className="space-y-4 text-sm">
            <div>
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Business Name
              </dt>
              <dd className="font-semibold text-white">{BUSINESS.name}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Phone / WhatsApp
              </dt>
              <dd>
                <a href={`tel:${BUSINESS.phoneIntl}`} className="font-semibold text-white">
                  {BUSINESS.phoneDisplay}
                </a>
              </dd>
            </div>
            {email && (
              <div>
                <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  Email
                </dt>
                <dd>
                  <a href={`mailto:${email}`} className="font-semibold text-white break-all">
                    {email}
                  </a>
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Business Office Address
              </dt>
              <dd>
                <address className="not-italic font-semibold text-white leading-relaxed">
                  {BUSINESS.addressLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </address>
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-slate-400 hover:text-white underline underline-offset-2"
                >
                  View on map
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                Support Hours
              </dt>
              <dd className="font-semibold text-white">{BUSINESS.supportHours}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            © {new Date().getFullYear()} {BUSINESS.name}. All rights reserved. Prices in{" "}
            {BUSINESS.currency}.
          </span>
          <span>{BUSINESS.domain}</span>
        </div>
      </div>
    </footer>
  );
}
