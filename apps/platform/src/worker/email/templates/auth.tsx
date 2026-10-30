import { Body, Head, Heading, Html, Link, Preview, Text, render, toPlainText } from "react-email";
import type { EmailMessage } from "../types";

type AuthEmailKind = "verification" | "passwordReset";
const copy = {
  verification: { subject: "Verify your FANS email address", action: "Verify email address", description: "Confirm this email address for your FANS account." },
  passwordReset: { subject: "Reset your FANS password", action: "Reset password", description: "Use this link to choose a new password for your FANS account." },
};

export async function renderAuthEmail(kind: AuthEmailKind, to: string, url: string): Promise<EmailMessage> {
  const message = copy[kind];
  const html = await render(
    <Html lang="en">
      <Head />
      <Preview>{message.subject}</Preview>
      <Body>
        <Heading>{message.subject}</Heading>
        <Text>{message.description}</Text>
        <Link href={url}>{message.action}</Link>
        <Text>If you did not request this email, you can ignore it.</Text>
      </Body>
    </Html>,
  );
  return { to, subject: message.subject, html, text: toPlainText(html) };
}
