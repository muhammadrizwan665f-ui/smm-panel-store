import { createFileRoute } from "@tanstack/react-router";
import { MapPin, Phone, Mail, Clock, MessageCircle, Landmark, ExternalLink } from "lucide-react";
import type { ComponentType, ReactNode } from "react";
import { PublicLayout } from "@/components/site/PublicLayout";
import { useBranding } from "@/components/site/useBranding";
import { BUSINESS, MAPS_URL } from "@/lib/business";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: `Contact & Business Address | ${BUSINESS.name}` },
      {
        name: "description",
        content: `Contact ${BUSINESS.name} — business office address, phone / WhatsApp number, support hours and email.`,
      },
    ],
  }),
  component: ContactPage,
});

function InfoCard({
  icon: Icon,
  title,
  children,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="glass-white card-shadow rounded-3xl p-6 flex gap-4">
      <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
        <Icon size={22} />
      </div>
      <div className="space-y-1.5 min-w-0">
        <h2 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        <div className="text-foreground font-semibold leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function ContactPage() {
  const { name, email, whatsappUrl } = useBranding();

  return (
    <PublicLayout>
      <section className="max-w-6xl mx-auto px-4 pt-10 pb-8 text-center space-y-3">
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gradient">
          Contact &amp; Business Address
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          We are here to help with your account, orders and payments. Reach {name} by phone, WhatsApp
          or visit our business office in Lahore.
        </p>
      </section>

      <section className="max-w-6xl mx-auto px-4 grid gap-5 md:grid-cols-2">
        <InfoCard icon={MapPin} title="Business Office Address">
          <address className="not-italic">
            <span className="block">{BUSINESS.name}</span>
            {BUSINESS.addressLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </address>
          <a
            href={MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-sm font-bold text-primary"
          >
            View on Google Maps <ExternalLink size={14} />
          </a>
        </InfoCard>

        <InfoCard icon={Phone} title="Phone / Mobile">
          <a href={`tel:${BUSINESS.phoneIntl}`} className="hover:text-primary transition-colors">
            {BUSINESS.phoneDisplay}
          </a>
          <p className="text-sm font-medium text-muted-foreground">Call us during support hours.</p>
        </InfoCard>

        <InfoCard icon={MessageCircle} title="WhatsApp Support">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Chat with us on WhatsApp
          </a>
          <p className="text-sm font-medium text-muted-foreground">
            Fastest way to get help with orders and wallet funds.
          </p>
        </InfoCard>

        <InfoCard icon={Clock} title="Support Hours">
          {BUSINESS.supportHours}
        </InfoCard>

        {email && (
          <InfoCard icon={Mail} title="Email">
            <a href={`mailto:${email}`} className="hover:text-primary transition-colors break-all">
              {email}
            </a>
          </InfoCard>
        )}

        <InfoCard icon={Landmark} title="Business Details">
          <dl className="text-sm space-y-1">
            <div className="flex gap-2">
              <dt className="text-muted-foreground font-medium">Business name:</dt>
              <dd>{BUSINESS.name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground font-medium">Website:</dt>
              <dd>{BUSINESS.domain}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground font-medium">Currency:</dt>
              <dd>{BUSINESS.currency}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground font-medium">Services:</dt>
              <dd>Digital social media marketing services</dd>
            </div>
          </dl>
        </InfoCard>
      </section>

      <section className="max-w-6xl mx-auto px-4 mt-8">
        <div className="glass-white card-shadow rounded-3xl p-6 md:p-8 text-sm text-muted-foreground leading-relaxed">
          <h2 className="text-base font-black text-foreground mb-2">When you contact us</h2>
          Please keep your registered mobile number or email and, for order or payment questions, your
          order ID or transaction reference ready so we can help you faster. We normally reply within
          the same day during support hours.
        </div>
      </section>
    </PublicLayout>
  );
}
