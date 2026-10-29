import { Alert, Anchor, Button, PasswordInput, Stack } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../../shared/constants/auth";
import { AuthCard, AuthError } from "../../features/auth/components/auth-card";
import { resetPasswordFormSchema, type ResetPasswordFormValues } from "../../features/auth/form-schemas";
import { broadcastSessionChange, refreshPublicSession } from "../../features/auth/session";
import { linkError } from "../../features/auth/link-error";
import { accountPath, allowedDestination } from "../../features/auth/navigation";
import { authClient, type AuthFailure } from "../../lib/auth-client";
import { validationMessage } from "../../lib/validation";

export default function ResetPasswordPage() {
  const [search] = useSearchParams();
  return <ResetPasswordForm key={search.toString()} token={search.get("token")?.trim() ?? ""}
    callbackError={linkError(search.get("error"))} destination={allowedDestination(search.get("returnTo"))} />;
}

function ResetPasswordForm({ token, callbackError, destination }: { token: string; callbackError: AuthFailure | null; destination: string }) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [error, setError] = useState<AuthFailure | null>(callbackError ?? (token ? null : "invalidLink"));
  const [done, setDone] = useState(false);
  const invalid = error === "invalidLink" || error === "expiredLink" || error === "usedLink";
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  async function submit({ password }: ResetPasswordFormValues) {
    if (!authClient.configured || !token || invalid || isSubmitting) return;
    setError(null);
    try {
      const result = await authClient.resetPassword({ token, password });
      if (result.ok) {
        setDone(true);
        broadcastSessionChange();
        await refreshPublicSession(queryClient).catch(() => undefined);
      }
      else setError(result.reason);
    } catch { setError("failed"); }
  }

  return (
    <AuthCard title={t("auth.resetPassword.title")} description={t("auth.resetPassword.description")}>
      <AuthError reason={error} />
      {done && <Alert color="teal" role="status">{t("publicPages.auth.resetDone")}</Alert>}
      {!done && !invalid && (
        <form onSubmit={handleSubmit(submit)} noValidate>
          <Stack>
            <PasswordInput visibilityToggleFocusable visibilityToggleButtonProps={{ "aria-label": t("publicPages.auth.togglePassword") }}
              label={t("publicPages.auth.newPassword")} autoComplete="new-password" required description={t("publicPages.auth.passwordHint", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH })} error={validationMessage(errors.password?.message, t)}
              {...register("password")} />
            <PasswordInput visibilityToggleFocusable visibilityToggleButtonProps={{ "aria-label": t("publicPages.auth.togglePassword") }}
              label={t("publicPages.auth.confirmPassword")} autoComplete="new-password" required error={validationMessage(errors.confirmPassword?.message, t)}
              {...register("confirmPassword")} />
            <Button type="submit" loading={isSubmitting} disabled={!authClient.configured}>{t("publicPages.auth.reset")}</Button>
          </Stack>
        </form>
      )}
      {!done && <Anchor component={Link} to={accountPath("/forgot-password", destination)}>{t("publicPages.auth.requestNew")}</Anchor>}
      <Anchor component={Link} to={accountPath("/login", destination)}>{t("common.actions.backToLogIn")}</Anchor>
    </AuthCard>
  );
}
