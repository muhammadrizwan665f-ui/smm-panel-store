import { createFileRoute, redirect } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    // During module load, detect if we are client-side and on a management path
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/management")) {
      console.log("[RootIndex] Client-side bypass for management path");
      return;
    }

    const { getSession } = await import("@/lib/auth/session.functions");
    const session = await getSession();

    // Signed-in users go straight to their workspace. Visitors who are not signed in
    // now see the public landing page (services, policies, business address)
    // instead of being bounced to /login — payment-gateway reviewers and new
    // customers need to be able to see the business information.
    if (session?.user) {
      if (session.role === "admin") {
        throw redirect({ to: "/management" });
      }
      throw redirect({ to: "/dashboard" });
    }
  },
  head: () => ({
    meta: [
      { title: `${BUSINESS.name} — Digital Social Media Marketing Services` },
      {
        name: "description",
        content: `${BUSINESS.name} (Lahore, Pakistan) provides digital social media marketing services. Order online, pay in ${BUSINESS.currency}, track delivery from your dashboard.`,
      },
    ],
  }),
  component: LandingPage,
});
