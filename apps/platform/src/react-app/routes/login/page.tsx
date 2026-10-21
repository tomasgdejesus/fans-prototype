import { Anchor, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PagePlaceholder } from "../../components/page-placeholder";

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder title={t("auth.login.title")} description={t("auth.login.description")}>
      <Stack gap="xs">
        <Anchor component={Link} to="/register">{t("auth.login.createAccount")}</Anchor>
        <Anchor component={Link} to="/forgot-password">{t("auth.login.forgotPassword")}</Anchor>
      </Stack>
    </PagePlaceholder>
  );
}
