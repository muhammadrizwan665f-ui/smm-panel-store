import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Smartphone, 
  ArrowLeft, 
  Download, 
  CheckCircle2, 
  Share, 
  PlusSquare, 
  Monitor, 
  Globe,

  Apple,
  Info
} from "lucide-react";
import React from "react";

export const Route = createFileRoute("/_authenticated/install-app")({
  component: InstallAppPage,
});

function InstallAppPage() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  const steps = isIOS ? [
    { text: "Open this site in Safari browser", icon: Globe },
    { text: "Tap the 'Share' button at the bottom", icon: Share },
    { text: "Scroll down and tap 'Add to Home Screen'", icon: PlusSquare },
    { text: "Tap 'Add' in the top right corner", icon: CheckCircle2 },
  ] : [
    { text: "Open this site in Chrome browser", icon: Globe },
    { text: "Tap the three dots in top right", icon: Info },
    { text: "Tap 'Install App' or 'Add to Home Screen'", icon: Download },
    { text: "Confirm the installation", icon: CheckCircle2 },
  ];

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
          <h1 className="text-xl font-black text-gradient uppercase tracking-tight">Install App</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">PWA Setup Guide</p>
        </div>
      </div>

      {/* Hero Card */}
      <div className="glass-white p-8 rounded-[2.5rem] card-shadow border border-white/50 text-center space-y-6 bg-gradient-to-br from-white to-primary/5">
        <div className="w-20 h-20 gradient-primary rounded-[2rem] flex items-center justify-center text-white mx-auto shadow-xl shadow-primary/20 animate-bounce-slow">
          <Smartphone size={40} />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-black text-foreground uppercase tracking-tight">App Experience</h2>
          <p className="text-xs text-muted-foreground font-medium leading-relaxed max-w-[200px] mx-auto">
            Install our app for a faster experience and instant notifications.
          </p>
        </div>
      </div>

      {/* OS Toggle (Visual Only) */}
      <div className="flex p-1.5 glass-white rounded-[2rem] card-shadow border border-white/50">
        <div className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${!isIOS ? 'gradient-primary text-white shadow-lg' : 'text-muted-foreground'}`}>
          <Monitor size={14} />
          Android
        </div>
        <div className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1.5rem] transition-all ${isIOS ? 'gradient-primary text-white shadow-lg' : 'text-muted-foreground'}`}>
          <Apple size={14} />
          iOS (iPhone)
        </div>
      </div>

      {/* Steps List */}
      <div className="glass-white rounded-[2.5rem] overflow-hidden card-shadow border border-white/50">
        <div className="p-5 border-b border-border/30">
          <span className="text-[10px] font-black text-primary uppercase tracking-widest">Installation Steps</span>
        </div>
        {steps.map((step, index) => (
          <div 
            key={index}
            className={`flex items-center gap-4 p-5 ${index !== steps.length - 1 ? 'border-b border-border/30' : ''}`}
          >
            <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-primary font-black text-sm shrink-0">
              {index + 1}
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center text-primary shrink-0">
                <step.icon size={16} />
              </div>
              <span className="text-xs font-bold text-foreground leading-tight">{step.text}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 glass-white rounded-[2.5rem] border border-primary/20 text-center">
        <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Benefits</p>
        <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">No Storage Space • One Tap Access • Offline Mode</p>
      </div>
    </div>
  );
}
