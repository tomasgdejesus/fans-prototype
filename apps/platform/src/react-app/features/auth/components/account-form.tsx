import { Alert, Anchor, Button, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router";
import { authClient, type AuthFailure } from "../../../lib/auth-client";
import { accountPath, allowedDestination } from "../navigation";
import { publicSessionKey, usePublicSession } from "../use-public-session";
import { AuthCard, AuthError } from "./auth-card";

type Values = { name: string; email: string; password: string; confirmPassword: string };

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
  const { register, handleSubmit, getValues, formState: { errors, isSubmitting } } = useForm<Values>({
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function submit(values: Values) {
    if (!authClient.configured || session.isLoading || isSubmitting) return;
    setError(null);
    try {
      const result = isRegister
        ? await authClient.register({ name: values.name.trim(), email: values.email.trim(), password: values.password })
        : await authClient.signIn({ email: values.email.trim(), password: values.password });
      if (!result.ok) { setError(result.reason); return; }
      const current = await authClient.getSession();
      queryClient.setQueryData(publicSessionKey, current);
      if (current) void navigate(destination, { replace: true });
      else if (isRegister) setRegistered(true);
      else setError("failed");
    } catch { setError("failed"); }
  }

  if (session.data) return <Navigate to={destination} replace />;

  return (
    <AuthCard title={t(`auth.${mode}.title`)} description={t(`auth.${mode}.description`)}>
      {session.isLoading && <Text role="status">{t("publicPages.auth.checking")}</Text>}
      {session.isError && <Alert color="red" role="alert">{t("publicPages.auth.sessionError")}</Alert>}
      <AuthError reason={error} />
      {error === "verificationRequired" && <Anchor component={Link} to={accountPath("/verify-email", destination)}>{t("routes.verifyEmail.title")}</Anchor>}
      {registered ? (
        <Alert color="teal" role="status">{t("publicPages.auth.registered")}</Alert>
      ) : (
        <form onSubmit={handleSubmit(submit)} noValidate>
          <Stack>
            {isRegister && <TextInput label={t("publicPages.auth.name")} autoComplete="name" required error={errors.name?.message}
              {...register("name", { validate: (value) => value.trim().length > 0 || t("publicPages.auth.required") })} />}
            <TextInput label={t("publicPages.auth.email")} type="email" autoComplete="email" required error={errors.email?.message}
              {...register("email", { required: t("publicPages.auth.required"), pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("publicPages.auth.invalidEmail") } })} />
            <PasswordInput visibilityToggleFocusable visibilityToggleButtonProps={{ "aria-label": t("publicPages.auth.togglePassword") }}
              label={t("publicPages.auth.password")} autoComplete={isRegister ? "new-password" : "current-password"} required
              description={isRegister ? t("publicPages.auth.passwordHint") : undefined} error={errors.password?.message}
              {...register("password", { required: t("publicPages.auth.required"), ...(isRegister ? { minLength: { value: 8, message: t("publicPages.auth.shortPassword") } } : {}) })} />
            {isRegister && <PasswordInput visibilityToggleFocusable visibilityToggleButtonProps={{ "aria-label": t("publicPages.auth.togglePassword") }}
              label={t("publicPages.auth.confirmPassword")} autoComplete="new-password" required error={errors.confirmPassword?.message}
              {...register("confirmPassword", { required: t("publicPages.auth.required"), validate: (value) => value === getValues("password") || t("publicPages.auth.passwordMismatch") })} />}
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
