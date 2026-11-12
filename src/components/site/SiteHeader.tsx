import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  Info,
  LogIn,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  UserPlus,
} from "lucide-react";
import type { ComponentType } from "react";
import { useBranding } from "./useBranding";

export function BrandMark({ className = "" }: { className?: string }) {
  const { name, logoUrl } = useBranding();
  return (
    <Link to="/" className={`flex items-center gap-2.5 min-w-0 ${className}`}>
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-9 w-auto object-contain" />
      ) : (
        <span className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-white font-black text-base shadow-md shadow-primary/25 shrink-0">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="font-black tracking-tight text-foreground whitespace-nowrap">{name}</span>
    </Link>
  );
}

type NavItem = {
  label: string;
  to: string;
  hash?: string;
  icon: ComponentType<{ size?: number }>;
};

/** Every important page is reachable from the top bar — nothing is hidden behind a menu. */
const NAV: NavItem[] = [
  { label: "Services", to: "/", hash: "services", icon: ShoppingCart },
  { label: "About", to: "/", hash: "about", icon: Info },
  { label: "Terms", to: "/terms-and-conditions", icon: FileText },
  { label: "Privacy", to: "/privacy-policy", icon: ShieldCheck },
  { label: "Refund", to: "/refund-policy", icon: RefreshCw },
  { label: "Return", to: "/return-policy", icon: RotateCcw },
  { label: "Delivery", to: "/delivery-policy", icon: Package },
  { label: "Contact", to: "/contact", icon: Phone },
  { label: "Blog", to: "/blog", icon: BookOpen },
];

const PILL =
  "shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-white/80 border border-white px-2.5 py-1.5 text-[11px] font-bold text-foreground/80 shadow-sm hover:text-primary hover:shadow-md transition-all";

function IconTile({ icon: Icon }: { icon: ComponentType<{ size?: number }> }) {
  return (
    <span className="w-5 h-5 rounded-md bg-primary text-primary-foreground flex items-center justify-center">
      <Icon size={11} />
    </span>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
        <BrandMark className="shrink-0" />

        <nav
          aria-label="Main"
          className="flex-1 flex items-center justify-end gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <Link
            to="/login"
            className="shrink-0 inline-flex items-center gap-1.5 rounded-xl gradient-primary px-3 py-1.5 text-[11px] font-black text-white shadow-md shadow-primary/25"
          >
            <span className="w-5 h-5 rounded-md bg-white/25 flex items-center justify-center">
              <LogIn size={11} />
            </span>
            Login
          </Link>
          <Link to="/register" className={PILL}>
            <IconTile icon={UserPlus} />
            Sign Up
          </Link>
          {NAV.map((item) => (
            <Link key={item.label} to={item.to as any} hash={item.hash} className={PILL}>
              <IconTile icon={item.icon} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
