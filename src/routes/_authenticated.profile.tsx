import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  User, 
  ArrowLeft, 
  Smartphone, 
  Calendar, 
  Wallet, 
  ChevronRight, 
  LogOut, 
  ShieldCheck,
  Lock
} from "lucide-react";
import React from "react";
import { getSession } from "@/lib/auth/session.functions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { signOut } from "@/lib/auth/auth.functions";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { data: session } = useSuspenseQuery({
    queryKey: ['session'],
    queryFn: () => getSession()
  });

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  const profileData = [
    { label: "Mobile Number", value: session?.user?.mobile_number || "N/A", icon: Smartphone },
    { label: "Wallet Balance", value: `Rs.${(session?.user?.wallet_balance ?? 0).toFixed(2)}`, icon: Wallet, color: "text-primary" },
    { label: "Account Status", value: "Verified", icon: ShieldCheck, color: "text-green-500" },
    { label: "Member Since", value: session?.user?.created_at ? new Date(session.user.created_at).toLocaleDateString() : "N/A", icon: Calendar },
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
          <h1 className="text-xl font-black text-gradient uppercase tracking-tight">My Profile</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Account Details</p>
        </div>
      </div>

      {/* Profile Header Card */}
      <div className="glass-white p-8 rounded-[2.5rem] card-shadow border border-white/50 text-center space-y-4">
        <div className="w-24 h-24 gradient-primary rounded-[2rem] flex items-center justify-center text-white text-3xl font-black mx-auto shadow-xl shadow-primary/20">
          {session?.user?.mobile_number?.slice(-2) || "U"}
        </div>
        <div>
          <h2 className="text-xl font-black text-foreground">{session?.user?.mobile_number}</h2>
          <span className="text-[10px] font-black text-primary bg-primary/5 px-3 py-1 rounded-full uppercase tracking-widest">Standard Tier</span>
        </div>
      </div>

      {/* Info List */}
      <div className="glass-white rounded-[2.5rem] overflow-hidden card-shadow border border-white/50">
        {profileData.map((item, index) => (
          <div 
            key={item.label}
            className={`flex items-center justify-between p-5 ${index !== profileData.length - 1 ? 'border-b border-border/30' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-secondary rounded-xl flex items-center justify-center text-muted-foreground">
                <item.icon size={20} />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{item.label}</span>
                <span className={`text-sm font-black ${item.color || 'text-foreground'}`}>{item.value}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button className="w-full flex items-center justify-between p-5 glass-white rounded-[2rem] card-shadow border border-white/50 transition-all active:scale-[0.98] group">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-indigo-500/10 text-indigo-500 rounded-xl flex items-center justify-center">
              <Lock size={20} />
            </div>
            <span className="text-sm font-black uppercase tracking-wider text-foreground">Change Password</span>
          </div>
          <ChevronRight size={18} className="text-muted-foreground/30" />
        </button>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-5 glass-white rounded-[2rem] card-shadow border border-white/50 transition-all active:scale-[0.98] group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-destructive/10 text-destructive rounded-xl flex items-center justify-center">
              <LogOut size={20} />
            </div>
            <span className="text-sm font-black uppercase tracking-wider text-destructive">Logout Account</span>
          </div>
          <ChevronRight size={18} className="text-muted-foreground/30" />
        </button>
      </div>
    </div>
  );
}
