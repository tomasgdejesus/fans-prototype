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

export function EmailRequestForm({ destination }: { destination: string }) {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<AuthFailure | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<EmailInput>({
    resolver: zodResolver(emailInputSchema),
    defaultValues: { email: "" },
  });

  async function submit({ email }: EmailInput) {
    if (!authClient.configured || isSubmitting) return;
    setError(null);
    try {
      const redirectTo = new URL(accountPath("/reset-password", destination), window.location.origin).href;
      const result = await authClient.requestPasswordReset({ email, redirectTo });
      if (result.ok) setSent(true);
      else setError(result.reason);
    } catch { setError("failed"); }
  }

  if (sent) return <Alert color="teal" role="status">{t("publicPages.auth.recoverySent")}</Alert>;

  return (
    <Stack>
      <AuthError reason={error} />
      <form onSubmit={handleSubmit(submit)} noValidate>
        <Stack>
          <TextInput label={t("publicPages.auth.email")} type="email" autoComplete="email" required error={validationMessage(errors.email?.message, t)}
            {...register("email")} />
          <Button type="submit" loading={isSubmitting} disabled={!authClient.configured}>{t("publicPages.auth.sendReset")}</Button>
        </Stack>
      </form>
    </Stack>
  );
}
