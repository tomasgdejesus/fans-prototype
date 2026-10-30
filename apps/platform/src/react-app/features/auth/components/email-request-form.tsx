import { Alert, Button, Stack, TextInput } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { emailInputSchema, type EmailInput } from "../../../../shared/contracts/auth";
import { authClient, type AuthFailure } from "../../../lib/auth-client";
import { validationMessage } from "../../../lib/validation";
import { accountPath } from "../navigation";
import { AuthError } from "./auth-card";
import { useEmailCapabilities } from "../email-capabilities";

export function EmailRequestForm({ kind, destination }: { kind: "recovery" | "verification"; destination: string }) {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthFailure | null>(null);
  const capabilities = useEmailCapabilities();
  const permitted = authClient.configured && (kind === "recovery" ? capabilities.data?.passwordReset : capabilities.data?.emailVerification) === true;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailInput>({
    resolver: zodResolver(emailInputSchema),
    defaultValues: { email: "" },
  });

  async function submit({ email }: EmailInput) {
    if (!permitted || isSubmitting) return;
    setError(null);
    try {
      const redirectTo = new URL(accountPath(kind === "recovery" ? "/reset-password" : "/verify-email", destination), window.location.origin).href;
      const result = kind === "recovery"
        ? await authClient.requestPasswordReset({ email, redirectTo })
        : await authClient.resendVerification({ email, redirectTo });
      if (result.ok) setSent(true);
      else setError(result.reason);
    } catch { setError("failed"); }
  }

  if (sent) return <Alert color="teal" role="status">{t(kind === "recovery" ? "publicPages.auth.recoverySent" : "publicPages.auth.resendSent")}</Alert>;

  return (
    <Stack>
      <AuthError reason={error} />
      {authClient.configured && capabilities.isPending && <Alert role="status">{t("publicPages.auth.emailChecking")}</Alert>}
      {capabilities.isError && <Alert color="red" role="alert">
        {t("publicPages.auth.emailStatusError")}
        <Button onClick={() => void capabilities.refetch()} loading={capabilities.isFetching}>{t("publicPages.auth.retry")}</Button>
      </Alert>}
      {authClient.configured && capabilities.isSuccess && !permitted && <Alert>{t(kind === "recovery" ? "publicPages.auth.recoveryUnavailable" : "publicPages.auth.resendUnavailable")}</Alert>}
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Stack>
          <TextInput label={t("publicPages.auth.email")} type="email" autoComplete="email" required error={validationMessage(errors.email?.message, t)}
            {...register("email")} />
          <Button type="submit" loading={isSubmitting} disabled={!permitted}>{t(kind === "recovery" ? "publicPages.auth.sendReset" : "publicPages.auth.resend")}</Button>
        </Stack>
      </form>
    </Stack>
  );
}
