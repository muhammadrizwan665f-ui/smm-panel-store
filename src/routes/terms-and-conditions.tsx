import { createFileRoute, Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/terms-and-conditions")({
  head: () => ({
    meta: [
      { title: `Terms & Conditions | ${BUSINESS.name}` },
      {
        name: "description",
        content: `The terms that apply when you create an account and place orders with ${BUSINESS.name}.`,
      },
    ],
  }),
  component: TermsPage,
});

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    body: (
      <p>
        These Terms &amp; Conditions form a binding agreement between you and {BUSINESS.name}
        ("we", "us"). By creating an account, adding funds or placing an order on{" "}
        {BUSINESS.domain} you confirm that you have read, understood and agree to these terms, our{" "}
        <Link to="/privacy-policy">Privacy Policy</Link>, <Link to="/refund-policy">Refund Policy</Link>,{" "}
        <Link to="/return-policy">Return Policy</Link> and{" "}
        <Link to="/delivery-policy">Digital Delivery / Service Policy</Link>. If you do not agree,
        please do not use the website.
      </p>
    ),
  },
  {
    id: "our-services",
    title: "Our services",
    body: (
      <p>
        {BUSINESS.name} sells digital social media marketing services — for example followers,
        likes, views and engagement for social media profiles and content. Services are delivered
        online and nothing is shipped physically. The description, price, minimum / maximum quantity
        and estimated speed of every service are shown on the service page before you order.
      </p>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility and your account",
    body: (
      <ul>
        <li>You must be at least 18 years old and able to enter into a binding contract.</li>
        <li>You must provide accurate registration details and keep them up to date.</li>
        <li>
          You are responsible for keeping your password confidential and for all activity under your
          account. Tell us immediately if you suspect unauthorised use.
        </li>
        <li>One person may not operate multiple accounts to abuse offers or refunds.</li>
      </ul>
    ),
  },
  {
    id: "orders",
    title: "Placing orders",
    body: (
      <>
        <p>
          When you place an order you confirm that the link, username and quantity you entered are
          correct. Please check the following before ordering:
        </p>
        <ul>
          <li>The profile, page or post must be <strong>public</strong> for the whole delivery time.</li>
          <li>Do not change the username or delete the content while the order is running.</li>
          <li>Do not place a second order for the same link until the first one is finished.</li>
        </ul>
        <p>
          Orders placed with a wrong link, a private account or a changed username may be marked
          completed even if nothing was delivered, and cannot be refunded.
        </p>
      </>
    ),
  },
  {
    id: "pricing-payments",
    title: "Prices, wallet and payments",
    body: (
      <ul>
        <li>All prices are displayed in {BUSINESS.currency} and may change without notice. The price shown when you place an order is the price you pay.</li>
        <li>
          Orders are paid from your wallet balance. You can top up your wallet using the payment
          methods offered on the Add Funds page, including online payment through our payment
          processor and manual bank / mobile-wallet transfer.
        </li>
        <li>
          Wallet funds are credited after the payment is confirmed. Manual payments are verified by
          our team and must match the details you submit.
        </li>
        <li>
          Wallet balance is for purchasing services on this website only and cannot be transferred
          to another person or exchanged for cash except as described in our{" "}
          <Link to="/refund-policy">Refund Policy</Link>.
        </li>
        <li>You are responsible for any fees charged by your bank or payment provider.</li>
      </ul>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to use our services to:</p>
        <ul>
          <li>promote illegal activity, fraud, hate speech, violence or adult / explicit content;</li>
          <li>infringe anyone's intellectual property or privacy rights;</li>
          <li>attempt to hack, overload or disrupt the website, or use bots to access it;</li>
          <li>make fraudulent payments, file false payment disputes or abuse our refund system.</li>
        </ul>
        <p>
          We may cancel orders, suspend accounts and withhold balances connected to a violation of
          these rules.
        </p>
      </>
    ),
  },
  {
    id: "third-party-platforms",
    title: "Third-party platforms",
    body: (
      <p>
        We are not affiliated with, endorsed by or sponsored by Instagram, Facebook, YouTube,
        Telegram, TikTok or any other social media platform. Those platforms have their own rules
        and may change their systems or remove content and accounts at any time. Because we do not
        control them, we cannot guarantee that delivered results will remain permanently, and you use
        our services at your own risk. Where a service is marked with a refill guarantee, the refill
        terms stated on that service apply.
      </p>
    ),
  },
  {
    id: "delivery-refunds",
    title: "Delivery and refunds",
    body: (
      <p>
        Delivery times are estimates and are explained in our{" "}
        <Link to="/delivery-policy">Digital Delivery / Service Policy</Link>. Refunds, cancellations
        and undelivered orders are handled according to our{" "}
        <Link to="/refund-policy">Refund Policy</Link> and{" "}
        <Link to="/return-policy">Return Policy</Link>.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Service availability",
    body: (
      <p>
        We work to keep the website available at all times, but we do not promise uninterrupted
        access. The site or individual services may be unavailable for maintenance, upgrades or
        reasons outside our control (for example a supplier or a social platform being down).
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <p>
        To the fullest extent permitted by law, {BUSINESS.name} is not liable for indirect or
        consequential loss, loss of profit or reputation, or any action taken by a social media
        platform against your account or content. Our total liability for any claim relating to an
        order is limited to the amount you paid for that order.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <p>
        You may stop using the website and request deletion of your account at any time. We may
        suspend or close an account that breaks these terms or that we reasonably believe is used for
        fraud or abuse. Any unused, legitimately paid wallet balance is handled as described in the{" "}
        <Link to="/refund-policy">Refund Policy</Link>.
      </p>
    ),
  },
  {
    id: "governing-law",
    title: "Governing law",
    body: (
      <p>
        These terms are governed by the laws of the Islamic Republic of Pakistan. Any dispute that
        cannot be resolved amicably will be subject to the jurisdiction of the courts of Lahore,
        Pakistan.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms from time to time. The "Last updated" date shows the latest
        version, and continuing to use the website after a change means you accept the updated terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        {BUSINESS.name}, {BUSINESS.addressOneLine}. Phone / WhatsApp:{" "}
        <a href={`tel:${BUSINESS.phoneIntl}`}>{BUSINESS.phoneDisplay}</a>. See our{" "}
        <Link to="/contact">Contact page</Link> for all support options.
      </p>
    ),
  },
];

function TermsPage() {
  return (
    <LegalPage
      currentPath="/terms-and-conditions"
      title="Terms & Conditions"
      intro="Please read these terms carefully. They explain the rules for using our website, placing orders and paying for services."
      icon={FileText}
      sections={sections}
    />
  );
}
