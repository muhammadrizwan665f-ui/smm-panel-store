import { createFileRoute, redirect } from "@tanstack/react-router";
import { LoginForm } from "@/components/auth/LoginForm";
import { AuthShell } from "@/components/auth/AuthShell";
import { getSession } from "@/lib/auth/session.functions";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/login")({
  beforeLoad: async ({ search }) => {
    const session = await getSession();
    if (session?.user) {
      // If there is a redirect search param, honor it (e.g. going back to /management)
      const redirectTo = (search as any)?.redirect;
      if (redirectTo && redirectTo.includes("/management")) {
        throw redirect({ to: redirectTo });
      }
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: `Login | ${BUSINESS.name}` },
      {
        name: "description",
        content: `Sign in to your ${BUSINESS.name} account to place orders and manage your wallet.`,
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  );
}
