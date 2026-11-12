
import { createFileRoute, redirect } from "@tanstack/react-router";
import { LandingPage } from "@/components/landing/LandingPage";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/")({
  beforeLoad: async () => {
    if (typeof window !== "undefined" && window.location.pathname.startsWith("/management")) {
      return;
    }

    const { getSession } = await import("@/lib/auth/session.functions");
    const session = await getSession();

    if (session?.user) {
      if (session.role === "admin") {
        throw redirect({ to: "/management" });
      }
      throw redirect({ to: "/dashboard" });
    }
  },

  head: () => ({
    meta: [
      {
        title: "Noorix Digital Lab | Social Media Marketing Services in Pakistan",
      },
      {
        name: "description",
        content:
          "Grow your social media presence with Noorix Digital Lab. Get Instagram followers, Facebook engagement, YouTube views and Telegram growth services. Based in Lahore, Pakistan.",
      },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: BUSINESS.name },
      {
        property: "og:title",
        content: "Noorix Digital Lab | Social Media Marketing Services",
      },
      {
        property: "og:description",
        content:
          "Professional social media marketing services for Instagram, Facebook, YouTube and Telegram. Based in Lahore, Pakistan.",
      },
      { property: "og:url", content: BUSINESS.url },
      { name: "twitter:card", content: "summary" },
      {
        "script:ld+json": {
          "@context": "https://schema.org",
          "@type": "ProfessionalService",
          name: BUSINESS.name,
          url: BUSINESS.url,
          telephone: BUSINESS.phoneIntl,
          address: {
            "@type": "PostalAddress",
            streetAddress: BUSINESS.addressOneLine,
            addressLocality: "Lahore",
            addressRegion: "Punjab",
            addressCountry: "PK",
          },
          areaServed: {
            "@type": "Country",
            name: "Pakistan",
          },
          description:
            "Digital social media marketing services for Instagram, Facebook, YouTube and Telegram.",
        },
      },
    ],
    links: [
      {
        rel: "canonical",
        href: BUSINESS.url,
      },
    ],
  }),

  component: LandingPage,
});
