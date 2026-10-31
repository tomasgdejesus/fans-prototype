import { Alert, Anchor, Button, Stack, Text } from "@mantine/core";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import type { EmailChangeStatus } from "../../../shared/contracts/auth";
import { AuthCard, AuthError } from "../../features/auth/components/auth-card";
import { broadcastSessionChange, refreshPublicSession } from "../../features/auth/session";
import { authClient, type AuthFailure } from "../../lib/auth-client";

export default function ChangeEmailPage() {
  const [search] = useSearchParams();
  return <EmailChangeForm key={search.toString()} token={search.get("token")?.trim() ?? ""} />;
}

function EmailChangeForm({ token }: { token: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<AuthFailure | null>(null);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState<Exclude<EmailChangeStatus, "invalid"> | null>(null);
  const status = useQuery({
    queryKey: ["auth", "email-change-status", token],
    queryFn: ({ signal }) => authClient.getEmailChangeStatus(token, signal),
    enabled: authClient.configured && Boolean(token) && !done,
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
  const invalid = !token || status.data === "invalid" || error === "invalidLink" || error === "expiredLink" || error === "usedLink";

  async function confirm() {
    const stage = status.data;
    if (!authClient.configured || pending || done || invalid || status.isError || !stage || stage === "invalid") return;
    setPending(true);
    setError(null);
    try {
      // Only Better Auth can establish success; reading a token never consumes it.
      const result = await authClient.verifyEmail({ token });
      if (!result.ok) { setError(result.reason); return; }
      setDone(stage);
      if (stage === "verification") {
        broadcastSessionChange();
        await refreshPublicSession(queryClient).catch(() => undefined);
      }
    } catch { setError("failed"); }
    finally { setPending(false); }
  }

  return (
    <AuthCard title={t("emailChange.title")} description={t("emailChange.description")}>
      <AuthError reason={error} />
      {done ? <Alert color="teal" role="status">{t(done === "confirmation" ? "emailChange.approved" : "emailChange.completed")}</Alert>
        : invalid ? !error && <Alert color="red" role="alert">{t("emailChange.invalid")}</Alert>
        : status.isError ? <Alert color="red" role="alert"><Stack gap="xs">
          {t("emailChange.checkFailed")}
          <Button onClick={() => void status.refetch()} loading={status.isFetching}>{t("publicPages.auth.retry")}</Button>
        </Stack></Alert>
        : status.isPending ? <Text role="status">{t("publicPages.auth.verificationChecking")}</Text>
        : <Stack>
          <Text>{t(status.data === "confirmation" ? "emailChange.confirmPrompt" : "emailChange.verifyPrompt")}</Text>
          <Button onClick={() => void confirm()} loading={pending} disabled={!authClient.configured}>
            {t(status.data === "confirmation" ? "emailChange.approve" : "emailChange.verify")}
          </Button>
        </Stack>}
      <Anchor component={Link} to="/dashboard/settings">{t("emailChange.settings")}</Anchor>
    </AuthCard>
  );
}
