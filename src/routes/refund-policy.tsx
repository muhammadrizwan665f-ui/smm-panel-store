import { createFileRoute, Link } from "@tanstack/react-router";
import { RefreshCw } from "lucide-react";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/refund-policy")({
  head: () => ({
    meta: [
      { title: `Refund Policy | ${BUSINESS.name}` },
      {
        name: "description",
        content: `When and how ${BUSINESS.name} refunds wallet top-ups and undelivered orders.`,
      },
    ],
  }),
  component: RefundPolicyPage,
});

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <p>
        {BUSINESS.name} sells digital services that start automatically after you place an order.
        Because of this, a service that has been delivered cannot be taken back. This policy explains
        exactly when you are entitled to a refund and how we pay it.
      </p>
    ),
  },
  {
    id: "undelivered-orders",
    title: "Failed, cancelled and partial orders",
    body: (
      <>
        <p>You are refunded automatically for any part of an order we could not deliver:</p>
        <ul>
          <li>
            <strong>Failed or cancelled orders</strong> — the full order amount is returned to your
            wallet balance.
          </li>
          <li>
            <strong>Partially completed orders</strong> — the amount for the undelivered quantity is
            returned to your wallet balance.
          </li>
        </ul>
        <p>
          Refunds of this type are credited to your wallet, usually within minutes of the order
          status changing, and appear in your Transactions history. You can use the balance for any
          other service.
        </p>
      </>
    ),
  },
  {
    id: "wallet-refunds",
    title: "Refund of wallet top-ups",
    body: (
      <>
        <p>
          Money you add to your wallet can be refunded to your original payment method if you ask for
          it within <strong>7 days</strong> of the top-up and the amount is still unused in your
          wallet. Any fee charged by the payment processor or bank for the original transaction may
          be deducted from the refund.
        </p>
        <p>Balance that has already been spent on delivered orders cannot be refunded.</p>
      </>
    ),
  },
  {
    id: "duplicate-payments",
    title: "Duplicate or incorrect payments",
    body: (
      <p>
        If you were charged twice, charged an incorrect amount or your payment was taken but not
        credited to your wallet, contact us with the transaction reference or a screenshot. After we
        verify the payment we will either credit the missing amount to your wallet or refund the extra
        amount to your original payment method in full.
      </p>
    ),
  },
  {
    id: "completed-orders",
    title: "Completed orders",
    body: (
      <>
        <p>Orders marked <strong>Completed</strong> are not refundable, including when:</p>
        <ul>
          <li>the link or username entered was wrong, or the account / post was private;</li>
          <li>the username, link or content was changed or deleted while the order was running;</li>
          <li>you ordered the same link twice at the same time;</li>
          <li>a social media platform later removed or reduced the delivered results.</li>
        </ul>
        <p>
          If a service includes a refill guarantee, request a refill instead — see the service
          description for its terms.
        </p>
      </>
    ),
  },
  {
    id: "refund-timeline",
    title: "How long refunds take",
    body: (
      <ul>
        <li>
          <strong>To your wallet:</strong> instant to a few minutes.
        </li>
        <li>
          <strong>Request review:</strong> we review refund requests within 1–3 business days.
        </li>
        <li>
          <strong>To your original payment method:</strong> approved refunds are sent within 3
          business days and normally reach your bank, card or wallet within 7–10 business days,
          depending on the bank or payment processor.
        </li>
      </ul>
    ),
  },
  {
    id: "how-to-request",
    title: "How to request a refund",
    body: (
      <>
        <p>Contact us by phone or WhatsApp on {BUSINESS.phoneDisplay} ({BUSINESS.supportHours}) or through the details on our <Link to="/contact">Contact page</Link>, and include:</p>
        <ol>
          <li>the mobile number or email used on your account,</li>
          <li>the order ID or the payment reference,</li>
          <li>the reason for the request and, if relevant, a payment screenshot.</li>
        </ol>
      </>
    ),
  },
  {
    id: "disputes",
    title: "Payment disputes and chargebacks",
    body: (
      <p>
        Please contact us before filing a dispute with your bank or card issuer — we can usually
        resolve problems faster directly. Accounts involved in fraudulent chargebacks may be
        suspended and any remaining balance held while the dispute is investigated.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        {BUSINESS.name}, {BUSINESS.addressOneLine}. Phone / WhatsApp:{" "}
        <a href={`tel:${BUSINESS.phoneIntl}`}>{BUSINESS.phoneDisplay}</a>.
      </p>
    ),
  },
];

function RefundPolicyPage() {
  return (
    <LegalPage
      currentPath="/refund-policy"
      title="Refund Policy"
      intro="Clear rules on when your money is returned — automatically for undelivered orders, and on request for eligible wallet top-ups."
      icon={RefreshCw}
      sections={sections}
    />
  );
}
