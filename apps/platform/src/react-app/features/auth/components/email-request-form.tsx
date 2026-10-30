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

export function EmailRequestForm({ kind, destination, initialEmail = "" }: { kind: "recovery" | "verification"; destination: string; initialEmail?: string }) {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthFailure | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailInput>({
    resolver: zodResolver(emailInputSchema),
    defaultValues: { email: initialEmail },
  });

  async function submit({ email }: EmailInput) {
    if (!authClient.configured || isSubmitting) return;
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
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Stack>
          <TextInput label={t("publicPages.auth.email")} type="email" autoComplete="email" required error={validationMessage(errors.email?.message, t)}
            {...register("email")} />
          <Button type="submit" loading={isSubmitting} disabled={!authClient.configured}>{t(kind === "recovery" ? "publicPages.auth.sendReset" : "publicPages.auth.resend")}</Button>
        </Stack>
      </form>
    </Stack>
  );
}
