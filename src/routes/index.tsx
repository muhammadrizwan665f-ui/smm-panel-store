import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // During module load, detect if we are client-side and on a management path
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/management')) {
      console.log("[RootIndex] Client-side bypass for management path");
      return;
    }

    const { getSession } = await import("@/lib/auth/session.functions");
    const session = await getSession();
    
    if (session?.user) {
      if (session.role === 'admin') {
        throw redirect({ to: "/management" });
      }
      throw redirect({ to: "/dashboard" });
    } else {
      throw redirect({ to: "/login" });
    }
  },
});
