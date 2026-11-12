import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck } from "lucide-react";
import { LegalPage, type LegalSection } from "@/components/site/LegalPage";
import { BUSINESS } from "@/lib/business";

export const Route = createFileRoute("/privacy-policy")({
  head: () => ({
    meta: [
      { title: `Privacy Policy | ${BUSINESS.name}` },
      {
        name: "description",
        content: `How ${BUSINESS.name} collects, uses and protects your personal information.`,
      },
    ],
  }),
  component: PrivacyPolicyPage,
});

const sections: LegalSection[] = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          {BUSINESS.name} ("we", "us", "our") operates the website {BUSINESS.domain} and provides
          digital social media marketing services. Our business office is located at{" "}
          {BUSINESS.addressOneLine}. This Privacy Policy explains what personal information we
          collect, why we collect it and how we protect it.
        </p>
        <p>By creating an account or using our website you agree to the practices described here.</p>
      </>
    ),
  },
  {
    id: "information-we-collect",
    title: "Information we collect",
    body: (
      <>
        <p>We only collect information needed to run your account and deliver your orders:</p>
        <ul>
          <li>
            <strong>Account details:</strong> your mobile number and/or email address and your
            password. Passwords are stored in hashed form and are never visible to our staff.
          </li>
          <li>
            <strong>Order details:</strong> the links, usernames, quantities and comments you submit
            when placing an order, and the status history of each order.
          </li>
          <li>
            <strong>Payment and wallet records:</strong> the amount, date, status and reference of
            each top-up or refund. We do <strong>not</strong> store your card number, CVV or PIN —
            card and wallet payments are handled by our payment processor.
          </li>
          <li>
            <strong>Support messages:</strong> information you share when you contact us by phone,
            WhatsApp or email.
          </li>
          <li>
            <strong>Technical data:</strong> IP address, browser type, device type and basic usage
            logs, used for security and to keep the service working.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "how-we-use",
    title: "How we use your information",
    body: (
      <ul>
        <li>To create and manage your account and let you sign in securely.</li>
        <li>To process your orders and deliver the services you purchased.</li>
        <li>To process payments, wallet top-ups and refunds.</li>
        <li>To send order, payment and account notifications and to answer support requests.</li>
        <li>To detect fraud, abuse and unauthorised access, and to keep our platform secure.</li>
        <li>To meet our legal, tax and accounting obligations.</li>
      </ul>
    ),
  },
  {
    id: "payments",
    title: "Payments",
    body: (
      <>
        <p>
          Online payments are processed by third-party payment processors such as PayFast, and
          manual payments (bank or mobile-wallet transfer) are verified by our team. Your payment
          credentials are entered on the processor's secure page and are governed by that
          processor's own privacy policy. We receive only the confirmation details needed to credit
          your wallet — for example the amount, status and transaction reference.
        </p>
      </>
    ),
  },
  {
    id: "sharing",
    title: "Who we share information with",
    body: (
      <>
        <p>We do not sell your personal information. We share it only when necessary:</p>
        <ul>
          <li>
            <strong>Service providers:</strong> to fulfil an order, the link or username you submit
            is passed to the providers that carry out the service. We do not send them your
            password or payment details.
          </li>
          <li>
            <strong>Payment processors</strong> that handle your payment.
          </li>
          <li>
            <strong>Infrastructure providers</strong> that host our website and database under
            confidentiality and security obligations.
          </li>
          <li>
            <strong>Authorities</strong> when required by law, court order or to protect our rights
            and the safety of our users.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <p>
        We use cookies and browser storage only for essential purposes: keeping you signed in,
        remembering your session and keeping the website secure. We do not use advertising or
        cross-site tracking cookies. You can clear or block cookies in your browser, but you may not
        be able to stay signed in if you do.
      </p>
    ),
  },
  {
    id: "third-party-login",
    title: "Sign-in with third-party accounts",
    body: (
      <p>
        If we offer sign-in with Google or another third-party account, we receive only the basic
        profile information you authorise (such as your name and email address) and use it solely to
        create and secure your account here. We never receive your third-party account password.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep information",
    body: (
      <p>
        We keep account, order and payment records for as long as your account is active and for a
        reasonable period afterwards to meet legal, tax, fraud-prevention and dispute-resolution
        needs. When information is no longer required it is deleted or anonymised.
      </p>
    ),
  },
  {
    id: "security",
    title: "How we protect your information",
    body: (
      <p>
        All traffic to our website is encrypted with HTTPS. Passwords are hashed, access to
        administrative tools is restricted to authorised staff and our database applies access
        controls so users can only see their own data. No method of transmission or storage is 100%
        secure, so we also encourage you to use a strong, unique password and to never share it.
      </p>
    ),
  },
  {
    id: "your-rights",
    title: "Your choices and rights",
    body: (
      <>
        <p>You may at any time ask us to:</p>
        <ul>
          <li>give you a copy of the personal information we hold about you,</li>
          <li>correct information that is inaccurate,</li>
          <li>delete your account and personal data (subject to records we must legally keep).</li>
        </ul>
        <p>
          To make a request, contact us using the details on our{" "}
          <Link to="/contact">Contact page</Link>. We may need to verify your identity first.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children's privacy",
    body: (
      <p>
        Our services are intended for people aged 18 and over. We do not knowingly collect personal
        information from children. If you believe a child has given us information, contact us and
        we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We may update this policy from time to time. The "Last updated" date at the top shows when
        it last changed. Continued use of the website after an update means you accept the revised
        policy.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact us",
    body: (
      <p>
        {BUSINESS.name}, {BUSINESS.addressOneLine}. Phone / WhatsApp:{" "}
        <a href={`tel:${BUSINESS.phoneIntl}`}>{BUSINESS.phoneDisplay}</a>.
      </p>
    ),
  },
];

function PrivacyPolicyPage() {
  return (
    <LegalPage
      currentPath="/privacy-policy"
      title="Privacy Policy"
      intro="We respect your privacy. This policy explains what information we collect, how we use it and the choices you have."
      icon={ShieldCheck}
      sections={sections}
    />
  );
}
