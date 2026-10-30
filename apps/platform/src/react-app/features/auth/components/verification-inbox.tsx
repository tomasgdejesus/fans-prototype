import { Alert, Button, Stack, Text } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { EMAIL_VERIFICATION_EXPIRES_IN_SECONDS } from "../../../../shared/constants/auth";
import { authClient, type AuthFailure } from "../../../lib/auth-client";
import { accountPath } from "../navigation";
import { AuthError } from "./auth-card";

export function VerificationInbox({ email, destination }: { email: string; destination: string }) {
  const { t } = useTranslation();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthFailure | null>(null);

  async function resend() {
    if (!authClient.configured || pending) return;
    setPending(true);
    setSent(false);
    setError(null);
    try {
      const redirectTo = new URL(accountPath("/verify-email", destination), window.location.origin).href;
      const result = await authClient.resendVerification({ email, redirectTo });
      if (result.ok) setSent(true);
      else setError(result.reason);
    } catch { setError("failed"); }
    finally { setPending(false); }
  }

  return (
    <Stack>
      <Text>{t("publicPages.auth.verificationInbox", { email })}</Text>
      <Text size="sm" c="dimmed">{t("publicPages.auth.verificationExpiry", { minutes: EMAIL_VERIFICATION_EXPIRES_IN_SECONDS / 60 })}</Text>
      <AuthError reason={error} />
      {sent && <Alert color="teal" role="status">{t("publicPages.auth.resendSent")}</Alert>}
      <Button onClick={() => void resend()} loading={pending} disabled={!authClient.configured}>{t("publicPages.auth.resend")}</Button>
    </Stack>
  );
}
