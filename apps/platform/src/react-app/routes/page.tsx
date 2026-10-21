import { Alert, Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { LanguageSwitcher } from "../components/language-switcher";
import { apiClient } from "../lib/api-client";

export default function HomePage() {
  const { t } = useTranslation();
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await apiClient.api.health.$get();
      if (!response.ok) throw new Error(t("home.healthCheckError"));
      return response.json();
    },
    retry: false,
  });

  return (
    <Container component="main" size="sm" py="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="flex-start">
          <div>
            <Title order={1}>{t("common.brand")}</Title>
            <Text c="dimmed" mt="sm">{t("home.tagline")}</Text>
          </div>
          <LanguageSwitcher />
        </Group>
        <Alert
          title={t("home.serviceStatus")}
          color={health.isError ? "red" : "teal"}
          role="status"
          aria-live="polite"
        >
          {t("home.apiStatus", {
            status: health.isPending
              ? t("home.status.checking")
              : health.isError
                ? t("home.status.unavailable")
                : t("home.status.available"),
          })}
        </Alert>
        <Group component="nav" aria-label={t("common.navigation.main")}>
          <Button component={Link} to="/login">{t("common.actions.logIn")}</Button>
          <Button component={Link} to="/dashboard" variant="light">{t("common.actions.dashboard")}</Button>
        </Group>
      </Stack>
    </Container>
  );
}
