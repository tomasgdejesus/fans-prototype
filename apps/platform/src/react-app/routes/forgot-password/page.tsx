import { Anchor } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";
import { AuthCard } from "../../features/auth/components/auth-card";
import { EmailRequestForm } from "../../features/auth/components/email-request-form";
import { accountPath, allowedDestination } from "../../features/auth/navigation";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [search] = useSearchParams();
  const destination = allowedDestination(search.get("returnTo"));
  return (
    <AuthCard title={t("auth.forgotPassword.title")} description={t("auth.forgotPassword.description")}>
      <EmailRequestForm kind="recovery" destination={destination} />
      <Anchor component={Link} to={accountPath("/login", destination)}>{t("common.actions.backToLogIn")}</Anchor>
    </AuthCard>
  );
}
