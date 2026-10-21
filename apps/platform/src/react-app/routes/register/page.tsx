import { Anchor } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PagePlaceholder } from "../../components/page-placeholder";

export default function RegisterPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder title={t("auth.register.title")} description={t("auth.register.description")}>
      <Anchor component={Link} to="/login">{t("auth.register.existingAccount")}</Anchor>
    </PagePlaceholder>
  );
}
