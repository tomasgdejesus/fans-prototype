import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { LanguageSwitcher } from "../components/language-switcher";

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Container component="main" size="sm" py="xl">
      <Stack align="flex-start">
        <LanguageSwitcher />
        <Text c="dimmed" fw={700}>404</Text>
        <Title order={1}>{t("errors.notFound.title")}</Title>
        <Text c="dimmed">{t("errors.notFound.description")}</Text>
        <Button component={Link} to="/">{t("common.actions.returnHome")}</Button>
      </Stack>
    </Container>
  );
}
