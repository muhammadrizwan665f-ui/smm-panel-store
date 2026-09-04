import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";
import React from "react";
import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { getSession } from "@/lib/auth/session.functions";

export const Route = createFileRoute("/management/login")({
  ssr: false, 
  validateSearch: (search: Record<string, unknown>) => {
    return {
      redirect: (search['redirect'] as string) || undefined,
    }
  },
  beforeLoad: async () => {
    const sessionResult = await getSession();
    if (sessionResult?.user && sessionResult.role === 'admin') {
      throw redirect({ to: "/management" });
    }
  },
  component: ManagementLoginPage,
});

export function ManagementLoginPage() {
  const navigate = useNavigate();
  
  React.useEffect(() => {
    const checkRedirect = async () => {
       const sessionResult = await getSession();
       if (sessionResult?.user && sessionResult.role === 'admin') {
          navigate({ to: "/management" as any });
       }
    };
    
    checkRedirect();
    const interval = setInterval(checkRedirect, 2000);
    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 relative overflow-hidden text-gray-900">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-3xl border shadow-sm relative z-10">
        <div className="text-center space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest mb-2">
            Admin Access Only
          </div>
          <h1 className="text-3xl font-black tracking-tighter text-gray-900 uppercase">
            Manage<span className="text-blue-600">ment</span>
          </h1>
          <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mt-1">
            Control Center Authentication
          </p>
        </div>

        <div className="mt-8">
          <LoginForm />
        </div>

        <div className="text-center mt-6">
          <a 
            href="/dashboard"
            className="text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
          >
            ← Back to User Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}

