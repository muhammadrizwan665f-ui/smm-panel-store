import { Link } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { BUSINESS, POLICY_LINKS } from "@/lib/business";
import { BrandMark } from "./SiteHeader";
import { useBranding } from "./useBranding";

export function SiteFooter() {
  const { name, email } = useBranding();

  return (
    <footer className="mt-16 border-t border-white/60 bg-white/60 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-12 grid gap-10 md:grid-cols-[1.4fr_1fr_1.2fr]">
        <div className="space-y-4">
          <BrandMark />
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            {name} provides digital social media marketing services. Orders are delivered online —
            no physical goods are shipped.
          </p>
          <p className="text-xs text-muted-foreground/80">
            All prices are shown in {BUSINESS.currency}.
          </p>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground/70 mb-4">
            Policies
          </h3>
          <ul className="space-y-2.5 text-sm">
            {POLICY_LINKS.map((l) => (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-foreground/70 mb-4">
            Business Office
          </h3>
          <ul className="space-y-3 text-sm text-muted-foreground">
            <li className="flex gap-2.5">
              <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
              <address className="not-italic leading-relaxed">
                {BUSINESS.addressLines.map((line) => (
                  <span key={line} className="block">
                    {line}
                  </span>
                ))}
              </address>
            </li>
            <li className="flex gap-2.5 items-center">
              <Phone size={16} className="text-primary shrink-0" />
              <a href={`tel:${BUSINESS.phoneIntl}`} className="hover:text-primary transition-colors">
                {BUSINESS.phoneDisplay}
              </a>
            </li>
            {email && (
              <li className="flex gap-2.5 items-center">
                <Mail size={16} className="text-primary shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-primary transition-colors break-all">
                  {email}
                </a>
              </li>
            )}
            <li className="flex gap-2.5 items-center">
              <Clock size={16} className="text-primary shrink-0" />
              <span>{BUSINESS.supportHours}</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
          </span>
          <span>{BUSINESS.domain}</span>
        </div>
      </div>
    </footer>
  );
}
