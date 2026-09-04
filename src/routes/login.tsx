import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session.functions";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ search }) => {
    const session = await getSession();
    if (session?.user) {
      // If there is a redirect search param, honor it (e.g. going back to /management)
      const redirectTo = (search as any)?.redirect;
      if (redirectTo && redirectTo.includes('/management')) {
         throw redirect({ to: redirectTo });
      }
      throw redirect({ to: "/dashboard" });
    }
  },

  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      
      <LoginForm />
    </div>
  );
}
