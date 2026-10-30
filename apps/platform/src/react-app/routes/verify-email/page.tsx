import { Alert, Anchor, Button, Text } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useSearchParams } from "react-router";
import { AuthCard, AuthError } from "../../features/auth/components/auth-card";
import { EmailRequestForm } from "../../features/auth/components/email-request-form";
import { broadcastSessionChange, refreshPublicSession } from "../../features/auth/session";
import { linkError } from "../../features/auth/link-error";
import { accountPath, allowedDestination } from "../../features/auth/navigation";
import { authClient, type AuthFailure } from "../../lib/auth-client";

export default function VerifyEmailPage() {
  const [search] = useSearchParams();
  const location = useLocation();
  const state: unknown = location.state;
  const email = typeof state === "object" && state !== null && "email" in state && typeof state.email === "string" ? state.email : "";
  return <VerifyEmailForm key={location.key} initialEmail={email} token={search.get("token")?.trim() ?? ""}
    callbackError={linkError(search.get("error"))} destination={allowedDestination(search.get("returnTo"))} />;
}

function VerifyEmailForm({ token, callbackError, destination, initialEmail }: { token: string; callbackError: AuthFailure | null; destination: string; initialEmail: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
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
      if (result.ok) {
        setDone(true);
        broadcastSessionChange();
        await refreshPublicSession(queryClient).catch(() => undefined);
      }
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
          <EmailRequestForm kind="verification" destination={destination} initialEmail={initialEmail} />
        </>
      )}
      <Anchor component={Link} to={accountPath("/login", destination)}>{t("common.actions.backToLogIn")}</Anchor>
    </AuthCard>
  );
}
