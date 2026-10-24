import { Alert, Anchor, Button, PasswordInput, Stack } from "@mantine/core";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { AuthCard, AuthError } from "../../features/auth/components/auth-card";
import { linkError } from "../../features/auth/link-error";
import { accountPath, allowedDestination } from "../../features/auth/navigation";
import { authClient, type AuthFailure } from "../../lib/auth-client";

type Values = { password: string; confirmPassword: string };

export default function ResetPasswordPage() {
  const [search] = useSearchParams();
  return <ResetPasswordForm key={search.toString()} token={search.get("token")?.trim() ?? ""}
    callbackError={linkError(search.get("error"))} destination={allowedDestination(search.get("returnTo"))} />;
}

function ResetPasswordForm({ token, callbackError, destination }: { token: string; callbackError: AuthFailure | null; destination: string }) {
  const { t } = useTranslation();
  const [error, setError] = useState<AuthFailure | null>(callbackError ?? (token ? null : "invalidLink"));
  const [done, setDone] = useState(false);
  const invalid = error === "invalidLink" || error === "expiredLink" || error === "usedLink";
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<Values>({ defaultValues: { password: "", confirmPassword: "" } });

  async function submit({ password }: Values) {
    if (!authClient.configured || !token || invalid || isSubmitting) return;
    setError(null);
    try {
      const result = await authClient.resetPassword({ token, password });
      if (result.ok) setDone(true);
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
              label={t("publicPages.auth.newPassword")} autoComplete="new-password" required description={t("publicPages.auth.passwordHint")} error={errors.password?.message}
              {...register("password", { required: t("publicPages.auth.required"), minLength: { value: 8, message: t("publicPages.auth.shortPassword") } })} />
            <PasswordInput visibilityToggleFocusable visibilityToggleButtonProps={{ "aria-label": t("publicPages.auth.togglePassword") }}
              label={t("publicPages.auth.confirmPassword")} autoComplete="new-password" required error={errors.confirmPassword?.message}
              {...register("confirmPassword", { required: t("publicPages.auth.required"), validate: (value) => value === getValues("password") || t("publicPages.auth.passwordMismatch") })} />
            <Button type="submit" loading={isSubmitting} disabled={!authClient.configured}>{t("publicPages.auth.reset")}</Button>
          </Stack>
        </form>
      )}
      {!done && <Anchor component={Link} to={accountPath("/forgot-password", destination)}>{t("publicPages.auth.requestNew")}</Anchor>}
      <Anchor component={Link} to={accountPath("/login", destination)}>{t("common.actions.backToLogIn")}</Anchor>
    </AuthCard>
  );
}
