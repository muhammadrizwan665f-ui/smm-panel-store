import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  Globe,
  MapPin,
  Phone,
  Send,
  ShieldCheck,
  Users,
  Wallet,
  Zap,
  MessageCircle,
} from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { useBranding } from "@/components/site/useBranding";
import { BUSINESS, POLICY_LINKS } from "@/lib/business";

const SERVICES = [
  { icon: Users, title: "Instagram", text: "Followers, likes, views and comments for profiles, posts and reels." },
  { icon: Globe, title: "Facebook", text: "Page likes, followers, post engagement and video views." },
  { icon: Eye, title: "YouTube", text: "Views, likes and subscribers to help your channel get discovered." },
  { icon: Send, title: "Telegram", text: "Channel members, post views and engagement for your community." },
] as const;

const STEPS = [
  { n: "1", title: "Create your account", text: "Sign up with your mobile number or email in under a minute." },
  { n: "2", title: "Add funds", text: `Top up your wallet in ${BUSINESS.currency} using the available payment methods.` },
  { n: "3", title: "Place an order", text: "Pick a service, paste your link, choose a quantity and confirm." },
  { n: "4", title: "Track delivery", text: "Follow every order live from your dashboard until it is completed." },
] as const;

const BENEFITS = [
  { icon: Zap, title: "Orders start automatically", text: "No waiting for approval — your order is placed and starts right away." },
  { icon: Wallet, title: `Transparent ${BUSINESS.currency} pricing`, text: "The full price is shown before you confirm. No hidden fees." },
  { icon: ShieldCheck, title: "Safe payments", text: "We never ask for your social media password and never store your card details." },
  { icon: MessageCircle, title: "Real human support", text: `Call or WhatsApp us ${BUSINESS.supportHours}.` },
] as const;

export function LandingPage() {
  const { name, whatsappUrl } = useBranding();

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-14 md:pt-24 pb-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-4 py-1.5 text-xs font-black uppercase tracking-widest">
          <ShieldCheck size={14} /> Digital marketing services · {BUSINESS.currency} pricing
        </span>
        <h1 className="mt-6 text-4xl md:text-6xl font-black tracking-tight leading-[1.08] text-foreground">
          Grow your social media presence with <span className="text-gradient">{name}</span>
        </h1>
        <p className="mt-5 max-w-2xl mx-auto text-muted-foreground text-base md:text-lg leading-relaxed">
          Order followers, likes, views and engagement for your social media profiles. Everything is
          digital — you order online and we deliver online. Nothing is shipped.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-white gradient-primary shadow-lg shadow-primary/25 hover:shadow-primary/40 active:scale-[0.98] transition-all"
          >
            Get started <ArrowRight size={16} />
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-4 rounded-2xl text-sm font-black uppercase tracking-widest text-primary glass-white card-shadow active:scale-[0.98] transition-all"
          >
            Login
          </Link>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-20">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-3xl font-black tracking-tight">What we offer</h2>
          <p className="text-muted-foreground">
            Social media marketing services for the platforms your audience uses.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="glass-white card-shadow rounded-3xl p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl gradient-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
                <Icon size={22} />
              </div>
              <h3 className="font-black text-lg">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">
          Available services, minimum / maximum quantities and live prices are shown inside your
          account. We are not affiliated with or endorsed by any social media platform.
        </p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 py-12 scroll-mt-20">
        <div className="text-center mb-10 space-y-2">
          <h2 className="text-3xl font-black tracking-tight">How it works</h2>
          <p className="text-muted-foreground">Four simple steps from sign-up to delivery.</p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <div key={s.n} className="glass-white card-shadow rounded-3xl p-6 space-y-3">
              <span className="w-10 h-10 rounded-full bg-primary/10 text-primary font-black flex items-center justify-center">
                {s.n}
              </span>
              <h3 className="font-black">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="glass-white card-shadow rounded-[2rem] p-7 md:p-12 grid gap-8 md:grid-cols-2">
          <div className="space-y-3 md:pr-6">
            <h2 className="text-3xl font-black tracking-tight">Why customers choose us</h2>
            <p className="text-muted-foreground leading-relaxed">
              We keep things simple, clear and honest — from the first order to the last.
            </p>
            <ul className="pt-3 space-y-2.5 text-sm text-foreground/80 font-medium">
              {["Clear delivery, refund and return policies", "Automatic refund to wallet for undelivered orders", "Business office in Lahore, Pakistan"].map(
                (t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <CheckCircle2 size={18} className="text-primary shrink-0" />
                    {t}
                  </li>
                ),
              )}
            </ul>
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <Icon size={19} />
                </div>
                <h3 className="font-black text-sm">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Policies */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Policies &amp; information</h2>
          <p className="text-muted-foreground">Everything you should know before you order.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {POLICY_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="glass-white card-shadow rounded-2xl px-5 py-4 flex items-center justify-between text-sm font-bold text-foreground/80 hover:text-primary transition-colors"
            >
              {l.label}
              <ArrowRight size={16} className="text-primary" />
            </Link>
          ))}
        </div>
      </section>

      {/* Contact strip */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="gradient-primary rounded-[2rem] p-8 md:p-12 text-white flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-xl shadow-primary/25">
          <div className="space-y-3 max-w-md">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">Questions? Talk to us.</h2>
            <p className="text-white/80 text-sm leading-relaxed flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              {BUSINESS.name}, {BUSINESS.addressOneLine}
            </p>
            <p className="text-white/80 text-sm flex gap-2 items-center">
              <Phone size={16} className="shrink-0" />
              {BUSINESS.phoneDisplay} · {BUSINESS.supportHours}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-primary text-sm font-black uppercase tracking-widest active:scale-[0.98] transition-all"
            >
              <MessageCircle size={16} /> WhatsApp
            </a>
            <Link
              to="/contact"
              className="inline-flex items-center justify-center px-6 py-3.5 rounded-2xl border border-white/40 text-sm font-black uppercase tracking-widest hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              Contact page
            </Link>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
