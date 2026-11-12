import React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Banknote,
  Eye,
  FileText,
  Globe,
  Headphones,
  Info,
  LogIn,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { useBranding } from "@/components/site/useBranding";
import { LoginForm } from "@/components/auth/LoginForm";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { BUSINESS, MAPS_URL } from "@/lib/business";

const SERVICES = [
  { icon: Users, title: "Instagram", text: "Followers, likes, views and comments for profiles, posts and reels." },
  { icon: Globe, title: "Facebook", text: "Page likes, followers, post engagement and video views." },
  { icon: Eye, title: "YouTube", text: "Views, likes and subscribers to help your channel get discovered." },
  { icon: Send, title: "Telegram", text: "Channel members, post views and engagement for your community." },
] as const;

const FACTS = [
  { value: "Digital", label: "Ordered and delivered online — nothing is shipped" },
  { value: BUSINESS.currency, label: "Prices shown in Pakistani Rupees before you order" },
  { value: "Auto-refund", label: "Undelivered orders return to your wallet" },
  { value: "10 AM – 10 PM", label: "Call or WhatsApp support, every day" },
] as const;

const STEPS = [
  { n: "1", title: "Create your account", text: "Sign up with your mobile number or email in under a minute." },
  { n: "2", title: "Add funds", text: `Top up your wallet in ${BUSINESS.currency} with an available payment method.` },
  { n: "3", title: "Place an order", text: "Pick a service, paste your link, choose a quantity and confirm." },
  { n: "4", title: "Track delivery", text: "Follow each order from your dashboard until it shows Completed." },
] as const;

const POLICY_CARDS = [
  { icon: FileText, title: "Terms & Conditions", text: "The rules for using our website, placing orders and paying.", to: "/terms-and-conditions" },
  { icon: ShieldCheck, title: "Privacy Policy", text: "What information we collect and how we protect it.", to: "/privacy-policy" },
  { icon: RefreshCw, title: "Refund Policy", text: "When and how your money is returned.", to: "/refund-policy" },
  { icon: RotateCcw, title: "Return Policy", text: "How cancellations and order problems are handled.", to: "/return-policy" },
  { icon: Package, title: "Digital Delivery / Service Policy", text: "How and when our digital services are delivered.", to: "/delivery-policy" },
  { icon: Phone, title: "Contact & Business Address", text: "Our office address, phone, WhatsApp and support hours.", to: "/contact" },
] as const;

function faqList(name: string) {
  return [
    {
      q: `What does ${name} sell?`,
      a: `${name} sells digital social media marketing services such as followers, likes, views and engagement for Instagram, Facebook, YouTube, Telegram and other platforms. We do not sell or ship physical products.`,
    },
    {
      q: "How do I place an order?",
      a: "Create an account, add funds to your wallet, choose a service, enter your public link and quantity, and confirm. The order starts automatically and you can follow it under Orders in your dashboard.",
    },
    {
      q: "How long does an order take to start?",
      a: "Most orders start within minutes and some take up to 24 hours. Every service page shows its estimated speed. Details are in our Digital Delivery / Service Policy.",
    },
    {
      q: "Do you need my password?",
      a: "No. We never ask for your social media password. We only need the public link or username of the profile or post you want to promote.",
    },
    {
      q: "Which payment methods do you accept?",
      a: "You can add funds online through PayFast, or by bank / mobile-wallet transfer which our team verifies manually. All prices are in PKR and we never store your card details.",
    },
    {
      q: "What if my order is not delivered?",
      a: "Failed, cancelled and partially completed orders are refunded to your wallet automatically for the undelivered part. If something still looks wrong, contact us with your order ID — see our Refund Policy.",
    },
    {
      q: "Are you affiliated with Instagram, Facebook, YouTube or Telegram?",
      a: "No. We are an independent business and are not affiliated with, endorsed by or sponsored by any social media platform.",
    },
    {
      q: "Where are you located and how can I contact you?",
      a: `Our business office is at ${BUSINESS.addressOneLine}. You can call or WhatsApp us on ${BUSINESS.phoneDisplay} between ${BUSINESS.supportHours}.`,
    },
  ];
}

/** Login / Create Account tabs, shown directly on the homepage. */
function AuthCard() {
  const [tab, setTab] = React.useState<"login" | "register">("login");

  return (
    <div id="auth" className="p-6 sm:p-9 flex flex-col justify-center scroll-mt-24">
      <h2 className="text-2xl font-black tracking-tight text-foreground">
        {tab === "login" ? "Welcome back" : "Create your account"}
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {tab === "login"
          ? "Log in to manage your orders and funds."
          : "Sign up in under a minute and start ordering."}
      </p>

      <div
        role="tablist"
        className="mt-5 mb-5 grid grid-cols-2 gap-1 rounded-2xl bg-secondary p-1 text-sm font-bold"
      >
        {(["login", "register"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-xl py-2.5 transition-all ${
              tab === t ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t === "login" ? "Log In" : "Create Account"}
          </button>
        ))}
      </div>

      {tab === "login" ? <LoginForm embedded /> : <RegisterForm embedded />}

      <p className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck size={13} className="text-primary" /> Secure, encrypted login
      </p>
    </div>
  );
}

export function LandingPage() {
  const { name, whatsappUrl } = useBranding();

  return (
    <PublicLayout>
      {/* Hero + login card */}
      <section className="max-w-6xl mx-auto px-4 pt-8 md:pt-10">
        <div className="grid lg:grid-cols-2 rounded-[2rem] overflow-hidden bg-white shadow-2xl shadow-primary/10 border border-white">
          <div className="gradient-primary text-white p-8 md:p-12 flex flex-col justify-center gap-6">
            <span className="self-start inline-flex items-center gap-2 rounded-full bg-white/15 border border-white/25 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-widest">
              <ShieldCheck size={13} /> Digital marketing · Lahore, Pakistan
            </span>
            <div className="space-y-4">
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-[1.1]">
                {name} — Premium Social Media Marketing Services
              </h1>
              <p className="text-white/85 leading-relaxed">
                Your partner for Instagram, Facebook, YouTube, Telegram and other social media
                marketing services. Order online, pay in {BUSINESS.currency} and track every order
                from your dashboard.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="#auth"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-black text-primary shadow-lg active:scale-[0.98] transition-all"
              >
                Get Started Free <ArrowRight size={15} />
              </a>
              <a
                href="#services"
                className="inline-flex items-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-black hover:bg-white/10 active:scale-[0.98] transition-all"
              >
                View Services
              </a>
            </div>
            <ul className="flex flex-wrap gap-2 text-[11px] font-bold">
              {[
                { icon: Zap, t: "Orders start automatically" },
                { icon: ShieldCheck, t: "Secure payments" },
                { icon: Headphones, t: "Support 10 AM – 10 PM" },
                { icon: MapPin, t: "Office in Lahore" },
              ].map(({ icon: Icon, t }) => (
                <li
                  key={t}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-black/15 px-3 py-1.5"
                >
                  <Icon size={12} /> {t}
                </li>
              ))}
            </ul>
          </div>

          <AuthCard />
        </div>
      </section>

      {/* Facts */}
      <section className="max-w-6xl mx-auto px-4 mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FACTS.map((f) => (
          <div key={f.value} className="glass-white card-shadow rounded-2xl p-5">
            <p className="text-xl font-black text-foreground">{f.value}</p>
            <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.label}</p>
          </div>
        ))}
      </section>

      {/* Payment methods */}
      <section id="payments" className="max-w-6xl mx-auto px-4 mt-5 scroll-mt-24">
        <div className="glass-white card-shadow rounded-3xl p-6 md:p-8 grid gap-6 md:grid-cols-[1fr_1.6fr] items-center">
          <div className="space-y-1.5">
            <h2 className="text-xl font-black">Payment Methods</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Add funds to your wallet in {BUSINESS.currency} using secure online or manual payment.
              We never see or store your card details.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl bg-white border border-border p-4 flex gap-3">
              <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Wallet size={20} />
              </span>
              <div>
                <p className="font-black">PayFast</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Pay online with supported cards, bank accounts and mobile wallets on PayFast's
                  secure page.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-white border border-border p-4 flex gap-3">
              <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Banknote size={20} />
              </span>
              <div>
                <p className="font-black">Bank / Mobile Wallet Transfer</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Send the payment, submit the details and our team verifies it, normally within a
                  few hours.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section id="services" className="max-w-6xl mx-auto px-4 pt-14 scroll-mt-24">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Our Services</h2>
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
        <p className="mt-5 text-center text-xs text-muted-foreground">
          <strong>Important:</strong> service availability, speed, refill rules and prices can vary
          by category, so check the live details inside your dashboard before ordering. We are not
          affiliated with or endorsed by any social media platform.
        </p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-4 pt-14 scroll-mt-24">
        <div className="text-center mb-8 space-y-2">
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

      {/* About */}
      <section id="about" className="max-w-6xl mx-auto px-4 pt-14 scroll-mt-24">
        <div className="glass-white card-shadow rounded-[2rem] p-7 md:p-10 grid gap-8 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4">
            <h2 className="text-3xl font-black tracking-tight flex items-center gap-3">
              <Info className="text-primary" size={26} /> About {name}
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              {BUSINESS.name} is a digital marketing business based in Lahore, Pakistan. Through
              our website {BUSINESS.domain} we provide social media marketing services that are
              ordered and delivered entirely online.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Customers create an account, add funds to a wallet in {BUSINESS.currency} and place
              orders for the services they need. Each order can be tracked from the dashboard, and
              orders we cannot deliver are refunded to the wallet. Our policies are published in full
              and linked from every page so you always know what to expect.
            </p>
          </div>
          <dl className="rounded-2xl bg-white border border-border p-5 space-y-3 text-sm self-start">
            {[
              ["Business name", BUSINESS.name],
              ["Website", BUSINESS.domain],
              ["Business type", "Digital social media marketing services"],
              ["Currency", BUSINESS.currency],
              ["Phone / WhatsApp", BUSINESS.phoneDisplay],
              ["Business office", BUSINESS.addressOneLine],
              ["Support hours", BUSINESS.supportHours],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {k}
                </dt>
                <dd className="font-semibold text-foreground">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Policies */}
      <section id="policies" className="max-w-6xl mx-auto px-4 pt-14 scroll-mt-24">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Policies &amp; Information</h2>
          <p className="text-muted-foreground">
            Everything you should know before you order — one click away.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {POLICY_CARDS.map(({ icon: Icon, title, text, to }) => (
            <Link
              key={to}
              to={to}
              className="glass-white card-shadow rounded-2xl p-5 flex gap-4 hover:shadow-lg transition-all group"
            >
              <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Icon size={20} />
              </span>
              <span className="space-y-1">
                <span className="flex items-center gap-1.5 font-black text-foreground group-hover:text-primary transition-colors">
                  {title} <ArrowRight size={14} />
                </span>
                <span className="block text-xs text-muted-foreground leading-relaxed">{text}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-4xl mx-auto px-4 pt-14 scroll-mt-24">
        <div className="text-center mb-8 space-y-2">
          <h2 className="text-3xl font-black tracking-tight">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">Quick answers about our services and policies.</p>
        </div>
        <div className="space-y-3">
          {faqList(name).map((f) => (
            <details key={f.q} className="group glass-white card-shadow rounded-2xl px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold text-foreground">
                {f.q}
                <span className="w-7 h-7 shrink-0 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-lg leading-none transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Contact + CTA */}
      <section className="max-w-6xl mx-auto px-4 pt-14">
        <div className="gradient-primary rounded-[2rem] p-8 md:p-12 text-white grid gap-8 md:grid-cols-[1.4fr_1fr] md:items-center shadow-xl shadow-primary/25">
          <div className="space-y-3">
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Ready to grow your social media?
            </h2>
            <p className="text-white/85 text-sm leading-relaxed flex gap-2">
              <MapPin size={16} className="mt-0.5 shrink-0" />
              <span>
                {BUSINESS.name}, {BUSINESS.addressOneLine}.{" "}
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2"
                >
                  View on map
                </a>
              </span>
            </p>
            <p className="text-white/85 text-sm flex gap-2 items-center">
              <Phone size={16} className="shrink-0" />
              <a href={`tel:${BUSINESS.phoneIntl}`}>{BUSINESS.phoneDisplay}</a> ·{" "}
              {BUSINESS.supportHours}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row md:flex-col gap-3">
            <a
              href="#auth"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-black text-primary active:scale-[0.98] transition-all"
            >
              <LogIn size={16} /> Create Free Account
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/40 px-6 py-3.5 text-sm font-black hover:bg-white/10 active:scale-[0.98] transition-all"
            >
              <MessageCircle size={16} /> WhatsApp Us
            </a>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
