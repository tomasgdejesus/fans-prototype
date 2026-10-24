import { Button, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { usePublicSession } from "../features/auth/use-public-session";

export default function NotFoundPage() {
  const { t } = useTranslation();
  const session = usePublicSession();

  return (
    <Stack align="flex-start">
      <Text c="dimmed" fw={700}>404</Text>
      <Title order={1}>{t("errors.notFound.title")}</Title>
      <Text c="dimmed">{t("errors.notFound.description")}</Text>
      <Group>
        <Button component={Link} to="/catalog">{t("publicPages.navigation.catalog")}</Button>
        <Button component={Link} to={session.data ? "/dashboard" : "/"} variant="light">
          {t(session.data ? "common.actions.dashboard" : "common.actions.returnHome")}
        </Button>
      </Group>
    </Stack>
  );
}
