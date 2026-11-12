import { createFileRoute, redirect } from "@tanstack/react-router";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getSession } from "@/lib/auth/session.functions";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/register")({
  beforeLoad: async () => {
    const session = await getSession();
    if (session?.user) {
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: `Create Account | ${BUSINESS.name}` },
      {
        name: "description",
        content: `Create your ${BUSINESS.name} account to order digital social media marketing services.`,
      },
    ],
  }),
  component: RegisterPage,
});

function RegisterPage() {
  return (
    <AuthShell>
      <RegisterForm />
    </AuthShell>
  );
}
