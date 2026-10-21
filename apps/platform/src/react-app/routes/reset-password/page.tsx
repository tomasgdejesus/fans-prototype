import { Anchor } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PagePlaceholder } from "../../components/page-placeholder";

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder title={t("auth.resetPassword.title")} description={t("auth.resetPassword.description")}>
      <Anchor component={Link} to="/login">{t("common.actions.backToLogIn")}</Anchor>
    </PagePlaceholder>
  );
}
