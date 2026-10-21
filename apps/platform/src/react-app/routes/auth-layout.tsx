import { Anchor, Container, Group, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, Outlet } from "react-router";
import { LanguageSwitcher } from "../components/language-switcher";

export default function AuthLayout() {
  const { t } = useTranslation();

  return (
    <Container component="main" size={440} py="xl">
      <Stack gap="xl">
        <Group justify="space-between">
          <Anchor component={Link} to="/" fw={700}>{t("common.brand")}</Anchor>
          <LanguageSwitcher />
        </Group>
        <Outlet />
      </Stack>
    </Container>
  );
}
