import { Alert, Anchor, Button, Text } from "@mantine/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useSearchParams } from "react-router";
import { emailInputSchema } from "../../../shared/contracts/auth";
import { AuthCard, AuthError } from "../../features/auth/components/auth-card";
import { VerificationInbox } from "../../features/auth/components/verification-inbox";
import { broadcastSessionChange, refreshPublicSession } from "../../features/auth/session";
import { linkError } from "../../features/auth/link-error";
import { accountPath, allowedDestination } from "../../features/auth/navigation";
import { authClient, type AuthFailure } from "../../lib/auth-client";

export default function VerifyEmailPage() {
  const [search] = useSearchParams();
  const location = useLocation();
  const state: unknown = location.state;
  const parsed = emailInputSchema.safeParse({ email: typeof state === "object" && state !== null && "email" in state ? state.email : undefined });
  const email = parsed.success ? parsed.data.email : "";
  return <VerifyEmailForm key={location.key} initialEmail={email} token={search.get("token")?.trim() ?? ""}
    callbackError={linkError(search.get("error"))} destination={allowedDestination(search.get("returnTo"))} />;
}

function VerifyEmailForm({ token, callbackError, destination, initialEmail }: { token: string; callbackError: AuthFailure | null; destination: string; initialEmail: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<AuthFailure | null>(callbackError);
  const [done, setDone] = useState(false);
  const [pending, setPending] = useState(false);
  const inspect = Boolean(authClient.configured && token && !callbackError && !done);
  const status = useQuery({
    queryKey: ["auth", "verification-status", token],
    queryFn: ({ signal }) => authClient.getVerificationStatus(token, signal),
    enabled: inspect,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const invalidStatus = inspect && !status.isError && status.data === "invalid";
  const invalid = error === "invalidLink" || error === "expiredLink" || error === "usedLink" || invalidStatus;
  const verified = done || (inspect && status.data === "verified");

  async function verify() {
    if (!authClient.configured || !token || invalid || pending || status.data !== "pending" || status.isError) return;
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
      <AuthError reason={verified ? null : error} />
      {!verified && !error && invalidStatus && <Alert color="red" role="alert">{t("publicPages.auth.verificationLinkUnavailable")}</Alert>}
      {verified ? <Alert color="teal" role="status">{t("publicPages.auth.verifyDone")}</Alert> : inspect && status.isPending ? (
        <Text role="status">{t("publicPages.auth.verificationChecking")}</Text>
      ) : inspect && status.isError ? (
        <Alert color="red" role="alert">
          {t("publicPages.auth.verificationCheckError")}
          <Button onClick={() => void status.refetch()} loading={status.isFetching}>{t("publicPages.auth.retry")}</Button>
        </Alert>
      ) : (
        <>
          {token && !invalid ? (
            <>
              <Text>{t("publicPages.auth.verifyReady")}</Text>
              <Button onClick={() => void verify()} loading={pending} disabled={!authClient.configured}>{t("publicPages.auth.verify")}</Button>
            </>
          ) : initialEmail ? (
            <VerificationInbox email={initialEmail} destination={destination} />
          ) : <Text>{t("publicPages.auth.verifyInstructions")}</Text>}
        </>
      )}
      <Anchor component={Link} to={accountPath("/login", destination)}>{t(verified ? "publicPages.auth.continueLogin" : "common.actions.backToLogIn")}</Anchor>
    </AuthCard>
  );
}
