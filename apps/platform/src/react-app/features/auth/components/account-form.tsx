import { Alert, Anchor, Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { zodResolver } from "@hookform/resolvers/zod";
import { CancelledError, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import type { z } from "zod";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../../../shared/constants/auth";
import { loginInputSchema, type LoginInput } from "../../../../shared/contracts/auth";
import { authClient, type AuthFailure } from "../../../lib/auth-client";
import { validationMessage } from "../../../lib/validation";
import { registrationFormSchema, type RegistrationFormValues } from "../form-schemas";
import { accountPath, allowedDestination } from "../navigation";
import { usePublicSession } from "../use-public-session";
import { broadcastSessionChange, refreshPublicSession } from "../session";
import { AuthCard, AuthError } from "./auth-card";
import { OAuthButtons } from "./oauth-buttons";

type Values = LoginInput | RegistrationFormValues;

export function AccountForm({ mode }: { mode: "login" | "register" }) {
  const { t } = useTranslation();
  const [search] = useSearchParams();
  const destination = allowedDestination(search.get("returnTo"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const session = usePublicSession();
  const [error, setError] = useState<AuthFailure | null>(null);
  const [registered, setRegistered] = useState(false);
  const isRegister = mode === "register";
  const schema: z.ZodType<Values, Values> = isRegister ? registrationFormSchema : loginInputSchema;
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: isRegister ? { email: "", password: "", confirmPassword: "" } : { email: "", password: "" },
  });

  async function submit(values: Values) {
    if (!authClient.configured || session.isLoading || isSubmitting) return;
    setError(null);
    try {
      const result = isRegister
        ? await authClient.register({ email: values.email, password: values.password })
        : await authClient.signIn({ email: values.email, password: values.password });
      if (!result.ok) { setError(result.reason); return; }
      broadcastSessionChange();
      const current = await refreshPublicSession(queryClient);
      if (current) void navigate(destination, { replace: true });
      else if (isRegister) setRegistered(true);
      else setError("failed");
    } catch (cause) {
      // Another authoritative refresh may supersede this one. Cancellation is
      // not a rejected sign-in; the shared session query owns the next result.
      if (!(cause instanceof CancelledError)) setError("failed");
    }
  }

  if (session.data) return <Navigate to={destination} replace />;

  return (
    <AuthCard title={t(`auth.${mode}.title`)} description={t(`auth.${mode}.description`)}>
      {session.isLoading && <Text role="status">{t("publicPages.auth.checking")}</Text>}
      {session.isError && <Alert color="red" role="alert">
        <Stack gap="xs">
          {t("publicPages.auth.sessionError")}
          <Button onClick={() => void session.refetch()} loading={session.isFetching}>{t("publicPages.auth.retry")}</Button>
        </Stack>
      </Alert>}
      <AuthError reason={error} />
      {error === "verificationRequired" && <Anchor component={Link} to={accountPath("/verify-email", destination)}>{t("routes.verifyEmail.title")}</Anchor>}
      {!registered && <OAuthButtons providers={[{ id: "google", label: t("publicPages.auth.oauth.google") }]} />}
      {registered ? (
        <Alert color="teal" role="status">{t("publicPages.auth.registered")}</Alert>
      ) : (
        <form onSubmit={handleSubmit(submit)} noValidate>
          <Stack>
            <TextInput label={t("publicPages.auth.email")} type="email" autoComplete="email" required error={validationMessage(errors.email?.message, t)}
              {...register("email")} />
            <PasswordInput visibilityToggleFocusable visibilityToggleButtonProps={{ "aria-label": t("publicPages.auth.togglePassword") }}
              label={t("publicPages.auth.password")} autoComplete={isRegister ? "new-password" : "current-password"} required
              description={isRegister ? t("publicPages.auth.passwordHint", { min: PASSWORD_MIN_LENGTH, max: PASSWORD_MAX_LENGTH }) : undefined} error={validationMessage(errors.password?.message, t)}
              {...register("password")} />
            {isRegister && <PasswordInput visibilityToggleFocusable visibilityToggleButtonProps={{ "aria-label": t("publicPages.auth.togglePassword") }}
              label={t("publicPages.auth.confirmPassword")} autoComplete="new-password" required error={validationMessage("confirmPassword" in errors ? errors.confirmPassword?.message : undefined, t)}
              {...register("confirmPassword")} />}
            <Button type="submit" loading={isSubmitting} disabled={!authClient.configured || session.isLoading || session.isError}>{t(isRegister ? "publicPages.auth.register" : "publicPages.auth.signIn")}</Button>
          </Stack>
        </form>
      )}
      <Stack gap="xs">
        <Anchor component={Link} to={accountPath(isRegister ? "/login" : "/register", destination)}>{t(isRegister ? "auth.register.existingAccount" : "auth.login.createAccount")}</Anchor>
        {!isRegister && <Anchor component={Link} to={accountPath("/forgot-password", destination)}>{t("auth.login.forgotPassword")}</Anchor>}
      </Stack>
    </AuthCard>
  );
}
