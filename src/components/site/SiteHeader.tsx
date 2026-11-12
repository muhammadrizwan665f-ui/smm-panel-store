import { Link } from "@tanstack/react-router";
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
      <span className="font-black tracking-tight text-foreground truncate">{name}</span>
    </Link>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/70 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <BrandMark />

        <nav className="hidden md:flex items-center gap-7 text-sm font-semibold text-muted-foreground">
          <Link to="/" hash="services" className="hover:text-primary transition-colors">
            Services
          </Link>
          <Link to="/" hash="how-it-works" className="hover:text-primary transition-colors">
            How it works
          </Link>
          <Link to="/blog" className="hover:text-primary transition-colors">
            Blog
          </Link>
          <Link to="/contact" className="hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            to="/login"
            className="px-4 py-2 rounded-xl text-sm font-bold text-foreground/80 hover:text-primary transition-colors"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-4 py-2 rounded-xl text-sm font-bold text-white gradient-primary shadow-md shadow-primary/25 active:scale-[0.97] transition-all"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  );
}
