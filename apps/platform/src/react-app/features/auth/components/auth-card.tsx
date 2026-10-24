import { Alert, Paper, Stack } from "@mantine/core";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { PageHeading } from "../../../components/page-heading";
import { authClient, type AuthFailure } from "../../../lib/auth-client";

export function AuthCard({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  const { t } = useTranslation();
  return (
    <Stack gap="lg">
      <PageHeading title={title} description={description} />
      {!authClient.configured && <Alert color="yellow">{t("publicPages.auth.unavailable")}</Alert>}
      <Paper withBorder p="lg"><Stack>{children}</Stack></Paper>
    </Stack>
  );
}

export function AuthError({ reason }: { reason: AuthFailure | null }) {
  const { t } = useTranslation();
  if (!reason) return null;
  const message = reason === "invalidLink" || reason === "expiredLink" || reason === "usedLink"
    ? t(`publicPages.auth.${reason}`)
    : t(`publicPages.auth.errors.${reason}`);
  return <Alert color="red" role="alert">{message}</Alert>;
}
