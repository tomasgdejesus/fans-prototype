import { Body, Head, Heading, Html, Link, Preview, Text, render, toPlainText } from "react-email";
import { EMAIL_VERIFICATION_EXPIRES_IN_SECONDS } from "../../../shared/constants/auth";
import type { AuthEmailKind, EmailMessage } from "../types";

const copy = {
  verification: { subject: "Verify your FANS email address", action: "Verify email address", description: "Confirm this email address for your FANS account." },
  passwordReset: { subject: "Reset your FANS password", action: "Reset password", description: "Use this link to choose a new password for your FANS account." },
  welcome: { subject: "Welcome to FANS", action: "Log in", description: "Your email address has been verified. You can now log in to your FANS account." },
  emailChangeConfirmation: { subject: "Approve your FANS email change", action: "Review email change", description: "Approve the request to change your FANS account email. After approval, a verification link will be sent to the new address. Your account email stays the same until the new address is verified." },
  emailChangeVerification: { subject: "Verify your new FANS email address", action: "Verify new email address", description: "Verify this address to complete your FANS account email change." },
};

export async function renderAuthEmail(kind: AuthEmailKind, to: string, url: string, newEmail?: string): Promise<EmailMessage> {
  const message = copy[kind];
  const html = await render(
    <Html lang="en">
      <Head />
      <Preview>{message.subject}</Preview>
      <Body>
        <Heading>{message.subject}</Heading>
        <Text>{message.description}</Text>
        {kind === "emailChangeConfirmation" && newEmail && <Text>{`Requested new address: ${newEmail}`}</Text>}
        <Link href={url}>{message.action}</Link>
        {(kind === "verification" || kind === "emailChangeConfirmation" || kind === "emailChangeVerification") && <Text>{`Verification link will expire in ${EMAIL_VERIFICATION_EXPIRES_IN_SECONDS / 60} minutes.`}</Text>}
        {kind !== "welcome" && <Text>If you did not request this email, you can ignore it.</Text>}
      </Body>
    </Html>,
  );
  return { to, subject: message.subject, html, text: toPlainText(html) };
}
