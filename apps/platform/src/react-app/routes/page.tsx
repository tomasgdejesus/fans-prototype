import { Anchor, Button, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export default function HomePage() {
  const { t } = useTranslation();
  return (
    <Stack component="section" gap="lg" py="xl">
      <div>
        <Text fw={600} c="teal" mb="sm">{t("publicPages.home.eyebrow")}</Text>
        <Title order={1}>{t("publicPages.home.title")}</Title>
        <Text c="dimmed" mt="sm" maw={600}>{t("publicPages.home.description")}</Text>
      </div>
      <Group>
        <Button component={Link} to="/catalog">{t("routes.catalog.title")}</Button>
        <Button component={Link} to="/register" variant="light">{t("auth.register.title")}</Button>
      </Group>
      <Anchor component={Link} to="/login">{t("publicPages.home.account")}</Anchor>
    </Stack>
  );
}
