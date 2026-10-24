import { Alert, Anchor, Button, Text } from "@mantine/core";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { AuthCard, AuthError } from "../../features/auth/components/auth-card";
import { EmailRequestForm } from "../../features/auth/components/email-request-form";
import { linkError } from "../../features/auth/link-error";
import { accountPath, allowedDestination } from "../../features/auth/navigation";
import { authClient, type AuthFailure } from "../../lib/auth-client";

export default function VerifyEmailPage() {
  const [search] = useSearchParams();
  return <VerifyEmailForm key={search.toString()} token={search.get("token")?.trim() ?? ""}
    callbackError={linkError(search.get("error"))} destination={allowedDestination(search.get("returnTo"))} />;
}

function VerifyEmailForm({ token, callbackError, destination }: { token: string; callbackError: AuthFailure | null; destination: string }) {
  const { t } = useTranslation();
  const [error, setError] = useState<AuthFailure | null>(callbackError);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const invalid = error === "invalidLink" || error === "expiredLink" || error === "usedLink";

  async function verify() {
    if (!authClient.configured || !token || invalid || pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await authClient.verifyEmail({ token });
      if (result.ok) setDone(true);
      else setError(result.reason);
    } catch { setError("failed"); }
    finally { setPending(false); }
  }

  return (
    <AuthCard title={t("routes.verifyEmail.title")} description={t("routes.verifyEmail.description")}>
      <AuthError reason={error} />
      {done ? <Alert color="teal" role="status">{t("publicPages.auth.verifyDone")}</Alert> : (
        <>
          <Text>{t(token && !invalid ? "publicPages.auth.verifyReady" : "publicPages.auth.verifyInstructions")}</Text>
          {token && !invalid && <Button onClick={() => void verify()} loading={pending} disabled={!authClient.configured}>{t("publicPages.auth.verify")}</Button>}
          <EmailRequestForm kind="verification" destination={destination} />
        </>
      )}
      <Anchor component={Link} to={accountPath("/login", destination)}>{t("common.actions.backToLogIn")}</Anchor>
    </AuthCard>
  );
}
