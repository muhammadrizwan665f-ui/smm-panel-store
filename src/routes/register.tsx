import { createFileRoute, redirect } from "@tanstack/react-router";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { getSession } from "@/lib/auth/session.functions";

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session?.user) {
      throw redirect({ to: "/dashboard" });
    }
  },

  component: RegisterPage,
});

function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px]" />
      
      <RegisterForm />
    </div>
  );
}
