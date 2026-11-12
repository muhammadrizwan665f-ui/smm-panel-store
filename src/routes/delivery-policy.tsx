import { createFileRoute, Link } from "@tanstack/react-router";
import { Package } from "lucide-react";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/delivery-policy")({
  head: () => ({
    meta: [
      { title: `Digital Delivery / Service Policy | ${BUSINESS.name}` },
      {
        name: "description",
        content: `How and when ${BUSINESS.name} delivers its digital services after you place an order.`,
      },
    ],
  }),
  component: DeliveryPolicyPage,
});

const sections: LegalSection[] = [
  {
    id: "nature",
    title: "Nature of our services",
    body: (
      <p>
        Everything sold by {BUSINESS.name} is a digital service. There is no physical product and no
        shipping, courier or delivery address involved. Services are delivered online directly to the
        social media link or profile you enter when ordering.
      </p>
    ),
  },
  {
    id: "how-delivery-works",
    title: "How delivery works",
    body: (
      <ol>
        <li>You create an account and add funds to your wallet.</li>
        <li>You choose a service, enter your link and quantity and confirm the order.</li>
        <li>The order is placed instantly and starts automatically — no further action is needed.</li>
        <li>
          You can follow the progress under <strong>Orders</strong> in your dashboard until it shows
          Completed.
        </li>
      </ol>
    ),
  },
  {
    id: "start-and-speed",
    title: "Start time and speed",
    body: (
      <>
        <p>
          Most orders begin within minutes and many start instantly. Some services take up to
          <strong> 24 hours</strong> to start. Each service page shows its estimated speed (for
          example "per day") and any special delivery notes.
        </p>
        <p>
          Estimates are not guarantees: speed can vary with the size of the order, the platform's
          current load and the quality of the link provided.
        </p>
      </>
    ),
  },
  {
    id: "wallet-funding",
    title: "Wallet top-up delivery",
    body: (
      <ul>
        <li>
          <strong>Online payments</strong> are credited to your wallet automatically once the payment
          is confirmed, usually within a few minutes.
        </li>
        <li>
          <strong>Manual payments</strong> (bank / mobile-wallet transfer) are credited after our
          team verifies them, normally within a few hours during support hours ({BUSINESS.supportHours}).
        </li>
        <li>
          If a confirmed payment has not appeared in your wallet after 24 hours, contact us with the
          transaction reference.
        </li>
      </ul>
    ),
  },
  {
    id: "your-responsibilities",
    title: "What we need from you",
    body: (
      <ul>
        <li>A correct, public link or username for the profile or content being promoted.</li>
        <li>The account or post must stay public and unchanged until the order is completed.</li>
        <li>Do not place multiple orders for the same link at the same time.</li>
      </ul>
    ),
  },
  {
    id: "statuses",
    title: "Order statuses",
    body: (
      <ul>
        <li><strong>Pending</strong> — received and waiting to start.</li>
        <li><strong>In progress</strong> — delivery has started.</li>
        <li><strong>Completed</strong> — the full quantity has been delivered.</li>
        <li><strong>Partial</strong> — only part could be delivered; the rest is refunded to your wallet.</li>
        <li><strong>Cancelled / Refunded</strong> — the order could not be delivered and the amount was returned to your wallet.</li>
      </ul>
    ),
  },
  {
    id: "delays",
    title: "Delays and problems",
    body: (
      <p>
        Delays can happen when a supplier or a social media platform is slow or unavailable. If your
        order has not started within 24 hours or looks stuck, contact us with the order ID and we
        will check it. Orders we are unable to deliver are refunded as explained in our{" "}
        <Link to="/refund-policy">Refund Policy</Link>.
      </p>
    ),
  },
  {
    id: "support",
    title: "Support",
    body: (
      <p>
        Need help with an order? Call or message us on WhatsApp at{" "}
        <a href={`tel:${BUSINESS.phoneIntl}`}>{BUSINESS.phoneDisplay}</a> ({BUSINESS.supportHours}),
        or see the <Link to="/contact">Contact page</Link>.
      </p>
    ),
  },
];

function DeliveryPolicyPage() {
  return (
    <LegalPage
      currentPath="/delivery-policy"
      title="Digital Delivery / Service Policy"
      intro="Our services are delivered online, instantly or within a short time after you order. Here is exactly how delivery works."
      icon={Package}
      sections={sections}
    />
  );
}
