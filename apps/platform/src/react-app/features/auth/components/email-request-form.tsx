import { Alert, Button, Stack, TextInput } from "@mantine/core";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { authClient, type AuthFailure } from "../../../lib/auth-client";
import { accountPath } from "../navigation";
import { AuthError } from "./auth-card";

export function EmailRequestForm({ kind, destination }: { kind: "recovery" | "verification"; destination: string }) {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthFailure | null>(null);
  const permitted = authClient.configured && (kind === "recovery" || authClient.canResendVerification);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<{ email: string }>({ defaultValues: { email: "" } });

  async function submit({ email }: { email: string }) {
    if (!permitted || isSubmitting) return;
    setError(null);
    try {
      const redirectTo = new URL(accountPath(kind === "recovery" ? "/reset-password" : "/verify-email", destination), window.location.origin).href;
      const result = kind === "recovery"
        ? await authClient.requestPasswordReset({ email: email.trim(), redirectTo })
        : await authClient.resendVerification({ email: email.trim(), redirectTo });
      if (result.ok) setSent(true);
      else setError(result.reason);
    } catch { setError("failed"); }
  }

  if (sent) return <Alert color="teal" role="status">{t(kind === "recovery" ? "publicPages.auth.recoverySent" : "publicPages.auth.resendSent")}</Alert>;

  return (
    <Stack>
      <AuthError reason={error} />
      {kind === "verification" && authClient.configured && !permitted && <Alert>{t("publicPages.auth.resendUnavailable")}</Alert>}
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Stack>
          <TextInput label={t("publicPages.auth.email")} type="email" autoComplete="email" required error={errors.email?.message}
            {...register("email", { required: t("publicPages.auth.required"), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("publicPages.auth.invalidEmail") } })} />
          <Button type="submit" loading={isSubmitting} disabled={!permitted}>{t(kind === "recovery" ? "publicPages.auth.sendReset" : "publicPages.auth.resend")}</Button>
        </Stack>
      </form>
    </Stack>
  );
}
