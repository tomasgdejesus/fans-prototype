import { Anchor, Container, Group, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router";
import { LanguageSwitcher } from "../components/language-switcher";

export default function PublicLayout() {
  const { t } = useTranslation();
  return (
    <Container component="main" size="lg" py="lg">
      <Stack gap="xl">
        <Group component="header" justify="space-between">
          <Group>
            <Anchor component={Link} to="/" fw={700} size="lg" underline="never">{t("common.brand")}</Anchor>
            <Anchor component={Link} to="/catalog">{t("routes.catalog.title")}</Anchor>
            <Anchor component={Link} to="/login">{t("common.actions.logIn")}</Anchor>
          </Group>
          <LanguageSwitcher />
        </Group>
        <Outlet />
      </Stack>
    </Container>
  );
}