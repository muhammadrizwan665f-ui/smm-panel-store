import { createFileRoute, Link } from "@tanstack/react-router";
import { RotateCcw } from "lucide-react";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/return-policy")({
  head: () => ({
    meta: [
      { title: `Return Policy | ${BUSINESS.name}` },
      {
        name: "description",
        content: `Return and cancellation rules for the digital services sold by ${BUSINESS.name}.`,
      },
    ],
  }),
  component: ReturnPolicyPage,
});

const sections: LegalSection[] = [
  {
    id: "digital-services",
    title: "We sell digital services only",
    body: (
      <p>
        {BUSINESS.name} does not sell or ship physical products, so there is nothing to send back to
        us. Every order is a digital service that is delivered online to a social media link or
        profile you provide. This page explains what you can do if something goes wrong.
      </p>
    ),
  },
  {
    id: "cancelling",
    title: "Cancelling an order",
    body: (
      <>
        <p>
          Orders start automatically, so they can normally be cancelled only while they are still
          <strong> Pending</strong>. If you need to cancel, contact us immediately with your order ID.
          If the order has not started we will cancel it and return the full amount to your wallet.
        </p>
        <p>Orders that are <strong>In progress</strong> or <strong>Completed</strong> cannot be cancelled or returned.</p>
      </>
    ),
  },
  {
    id: "wrong-details",
    title: "Wrong link or username",
    body: (
      <p>
        Please double-check the link and quantity before confirming. If you notice a mistake before
        the order starts, contact us straight away and we will try to correct or cancel it. Once
        delivery has begun, an order placed with a wrong or private link cannot be reversed.
      </p>
    ),
  },
  {
    id: "service-problems",
    title: "If the service does not match what you ordered",
    body: (
      <>
        <p>If an order shows as completed but the result is missing or lower than ordered:</p>
        <ol>
          <li>Check that the profile or post is public and the link has not changed.</li>
          <li>Wait a short time — some results appear gradually after the order is marked complete.</li>
          <li>
            If the problem remains, contact us within <strong>7 days</strong> with the order ID. We
            will investigate with our supplier and, depending on the outcome, re-deliver the
            service, apply the refill guarantee where the service has one, or refund the undelivered
            part to your wallet.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: "no-return-of-delivery",
    title: "Delivered results are not returnable",
    body: (
      <p>
        Because delivered likes, followers, views and similar results cannot be handed back, orders
        that were delivered correctly are final. Money matters — wallet top-ups, duplicate charges
        and undelivered orders — are covered in our <Link to="/refund-policy">Refund Policy</Link>.
      </p>
    ),
  },
  {
    id: "contact",
    title: "How to reach us",
    body: (
      <p>
        Phone / WhatsApp: <a href={`tel:${BUSINESS.phoneIntl}`}>{BUSINESS.phoneDisplay}</a> (
        {BUSINESS.supportHours}). Office: {BUSINESS.addressOneLine}. More options on our{" "}
        <Link to="/contact">Contact page</Link>.
      </p>
    ),
  },
];

function ReturnPolicyPage() {
  return (
    <LegalPage
      currentPath="/return-policy"
      title="Return Policy"
      intro="We sell digital services, not physical goods — here is how cancellations and problems with an order are handled."
      icon={RotateCcw}
      sections={sections}
    />
  );
}
