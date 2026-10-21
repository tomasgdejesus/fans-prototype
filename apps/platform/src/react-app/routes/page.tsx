import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <Stack component="section" gap="lg" py="xl">
      <div>
        <Title order={1}>{t("common.brand")}</Title>
        <Text c="dimmed" mt="sm">{t("home.tagline")}</Text>
      </div>
      <Group>
        <Button component={Link} to="/catalog">{t("routes.catalog.title")}</Button>
        <Button component={Link} to="/register" variant="light">{t("auth.register.title")}</Button>
      </Group>
    </Stack>
  );
}