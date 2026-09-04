import { createFileRoute, Link, useLoaderData } from "@tanstack/react-router";
import { 
  MessageSquare, 
  ArrowLeft, 
  ExternalLink, 
  Send, 
  Clock,
  ShieldCheck,
  Zap,
  Phone,
  Users
} from "lucide-react";
import React from "react";

export const Route = createFileRoute("/_authenticated/support")({
  component: SupportPage,
});

function SupportPage() {
  const branding = useLoaderData({ from: "__root__" }) as
    | { whatsapp_number?: string; whatsapp_group_url?: string }
    | undefined;

  const waNumber = (branding?.whatsapp_number || "").replace(/[^0-9]/g, "");
  const groupUrl = (branding?.whatsapp_group_url || "").trim();

  const supportOptions = [
    {
      title: "WhatsApp Support",
      description: "Fastest way to get help with your orders and funds.",
      icon: Phone,
      color: "bg-green-500",
      action: "Chat on WhatsApp",
      link: waNumber ? `https://wa.me/${waNumber}` : "",
      highlight: "Online 10 AM - 10 PM"
    },
    ...(groupUrl
      ? [
          {
            title: "WhatsApp Group",
            description: "Join our community group for updates and promo codes.",
            icon: Users,
            color: "bg-emerald-600",
            action: "Join Group",
            link: groupUrl,
            highlight: "Community"
          }
        ]
      : [])
  ].filter((o) => o.link);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <div className="flex items-center gap-4">
        <Link 
          to="/dashboard"
          className="w-10 h-10 glass-white rounded-full flex items-center justify-center text-primary shadow-sm border border-white/50 transition-all active:scale-90"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-gradient uppercase tracking-tight">Support</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Help Center</p>
        </div>
      </div>

      {/* Stats Card */}
      <div className="glass-white p-6 rounded-[2.5rem] card-shadow border border-white/50 grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center gap-2 text-center p-2">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Clock size={20} />
          </div>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Response Time</span>
          <span className="text-sm font-black text-foreground">Under 15 Mins</span>
        </div>
        <div className="flex flex-col items-center gap-2 text-center p-2 border-l border-border/50">
          <div className="w-10 h-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
            <ShieldCheck size={20} />
          </div>
          <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Support Status</span>
          <span className="text-sm font-black text-foreground">Live Now</span>
        </div>
      </div>

      <div className="space-y-4">
        {supportOptions.map((option) => (
          <a
            key={option.title}
            href={option.link}
            target="_blank"
            rel="noopener noreferrer"
            className="block glass-white p-6 rounded-[2.5rem] card-shadow border border-white/50 transition-all active:scale-[0.98] group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`w-14 h-14 ${option.color} rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:rotate-6`}>
                <option.icon size={28} />
              </div>
              <div className="bg-secondary/50 px-3 py-1 rounded-full">
                <span className="text-[9px] font-black text-primary uppercase tracking-widest">{option.highlight}</span>
              </div>
            </div>
            
            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-black text-foreground uppercase tracking-tight">{option.title}</h3>
              <p className="text-xs text-muted-foreground font-medium leading-relaxed">
                {option.description}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 w-full py-4 bg-secondary/50 rounded-[1.5rem] text-xs font-black uppercase tracking-widest text-foreground group-hover:bg-primary group-hover:text-white transition-all">
              {option.action}
              <ExternalLink size={14} />
            </div>
          </a>
        ))}
      </div>

      {/* FAQ Banner */}
      <div className="glass-white p-6 rounded-[2.5rem] card-shadow border border-white/50 flex items-center gap-4 bg-gradient-to-r from-white to-primary/5">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
          <Zap size={20} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-foreground uppercase tracking-tight">Check FAQs first</span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Most answers are already there</span>
        </div>
        <ChevronRight className="ml-auto text-muted-foreground/30" />
      </div>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      width="18" 
      height="18" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="m9 18 6-6-6-6"/>
    </svg>
  );
}
