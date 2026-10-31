import { Alert, Button, Paper, Stack, Text, TextInput, Title } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { displayNameInputSchema, emailInputSchema, type DisplayNameInput, type EmailInput } from "../../../../shared/contracts/auth";
import { PageHeading } from "../../../components/page-heading";
import { AuthError } from "../../../features/auth/components/auth-card";
import { accountPath } from "../../../features/auth/navigation";
import { broadcastSessionChange, refreshPublicSession } from "../../../features/auth/session";
import { usePublicSession } from "../../../features/auth/use-public-session";
import { authClient, type AuthFailure, type PublicSession } from "../../../lib/auth-client";
import { validationMessage } from "../../../lib/validation";

export default function SettingsPage() {
  const { t } = useTranslation();
  const session = usePublicSession();
  // The parent RequireAccount handles signed-out, inactive and unavailable states.
  if (!session.data) return null;
  return <Stack gap="lg">
    <PageHeading title={t("dashboard.settings.title")} description={t("dashboard.settings.description")} />
    <SettingsForms key={`${session.data.userId}:${session.data.email}`} profile={session.data} />
  </Stack>;
}

function SettingsForms({ profile }: { profile: PublicSession }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [nameError, setNameError] = useState<AuthFailure | null>(null);
  const [nameSaved, setNameSaved] = useState(false);
  const [emailError, setEmailError] = useState<AuthFailure | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [resetError, setResetError] = useState<AuthFailure | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [resetPending, setResetPending] = useState(false);
  const nameForm = useForm<DisplayNameInput>({
    resolver: zodResolver(displayNameInputSchema),
    values: { name: profile.name },
    resetOptions: { keepDirtyValues: true },
  });
  const emailForm = useForm<EmailInput>({ resolver: zodResolver(emailInputSchema), defaultValues: { email: "" } });

  async function saveName(values: DisplayNameInput) {
    if (!authClient.configured) return;
    setNameError(null);
    setNameSaved(false);
    try {
      const result = await authClient.updateDisplayName(values);
      if (!result.ok) { setNameError(result.reason); return; }
      nameForm.reset(values, {keepDirtyValues: false});
      setNameSaved(true);
      broadcastSessionChange();
      await refreshPublicSession(queryClient).catch(() => undefined);
    } catch { setNameError("failed"); }
  }

  async function changeEmail(values: EmailInput) {
    if (!authClient.configured) return;
    setEmailError(null);
    setEmailSent(false);
    if (values.email.toLowerCase() === profile.email.toLowerCase()) {
      emailForm.setError("email", { message: "validation.emailUnchanged" });
      return;
    }
    try {
      const result = await authClient.changeEmail(values);
      if (result.ok) setEmailSent(true);
      else setEmailError(result.reason);
    } catch { setEmailError("failed"); }
  }

  async function requestReset() {
    if (!authClient.configured || resetPending) return;
    setResetPending(true);
    setResetError(null);
    setResetSent(false);
    try {
      const result = await authClient.requestPasswordReset({
        email: profile.email,
        redirectTo: new URL(accountPath("/reset-password", "/dashboard/settings"), window.location.origin).href,
      });
      if (result.ok) setResetSent(true);
      else setResetError(result.reason);
    } catch { setResetError("failed"); }
    finally { setResetPending(false); }
  }

  return <>
    <Paper withBorder p="lg"><Stack>
      <Title order={2}>{t("dashboard.settings.profileTitle")}</Title>
      <AuthError reason={nameError} />
      {nameSaved && <Alert color="teal" role="status">{t("dashboard.settings.nameSaved")}</Alert>}
      <form onSubmit={nameForm.handleSubmit(saveName)} noValidate><Stack>
        <TextInput label={t("dashboard.settings.displayName")} autoComplete="nickname" required
          error={validationMessage(nameForm.formState.errors.name?.message, t)} {...nameForm.register("name")} />
        <Button type="submit" loading={nameForm.formState.isSubmitting} disabled={!authClient.configured}>{t("dashboard.settings.saveName")}</Button>
      </Stack></form>
    </Stack></Paper>
    <Paper withBorder p="lg"><Stack>
      <Title order={2}>{t("dashboard.settings.emailTitle")}</Title>
      <Text>{t("dashboard.settings.currentEmail", { email: profile.email })}</Text>
      <Text>{t("dashboard.settings.emailDescription")}</Text>
      <AuthError reason={emailError} />
      {emailSent && <Alert color="teal" role="status">{t("dashboard.settings.emailRequested", { email: profile.email })}</Alert>}
      <form onSubmit={emailForm.handleSubmit(changeEmail)} noValidate><Stack>
        <TextInput label={t("dashboard.settings.newEmail")} type="email" autoComplete="email" required
          error={validationMessage(emailForm.formState.errors.email?.message, t)} {...emailForm.register("email")} />
        <Button type="submit" loading={emailForm.formState.isSubmitting} disabled={!authClient.configured}>{t("dashboard.settings.changeEmail")}</Button>
      </Stack></form>
    </Stack></Paper>
    <Paper withBorder p="lg"><Stack>
      <Title order={2}>{t("dashboard.settings.passwordTitle")}</Title>
      <Text>{t("dashboard.settings.passwordDescription", { email: profile.email })}</Text>
      <AuthError reason={resetError} />
      {resetSent && <Alert color="teal" role="status">{t("publicPages.auth.recoverySent")}</Alert>}
      <Button onClick={() => void requestReset()} loading={resetPending} disabled={!authClient.configured}>{t("publicPages.auth.sendReset")}</Button>
    </Stack></Paper>
  </>;
}
