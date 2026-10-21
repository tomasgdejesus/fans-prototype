import { Button, Card, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

const sections = [
  { key: "courses", to: "/dashboard/courses" },
  { key: "organizations", to: "/dashboard/organizations" },
  { key: "orders", to: "/dashboard/orders" },
] as const;

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <Stack gap="lg">
      <div>
        <Title order={1} size="h2">{t("dashboard.overview.title")}</Title>
        <Text c="dimmed" mt="xs">{t("dashboard.overview.description")}</Text>
      </div>
      <SimpleGrid cols={{ base: 1, md: 3 }}>
        {sections.map(({ key, to }) => (
          <Card key={to} withBorder padding="lg">
            <Stack h="100%" align="flex-start">
              <Title order={2} size="h4">{t(`dashboard.overview.sections.${key}.title`)}</Title>
              <Text c="dimmed" style={{ flexGrow: 1 }}>
                {t(`dashboard.overview.sections.${key}.description`)}
              </Text>
              <Button component={Link} to={to} variant="light">
                {t(`dashboard.overview.sections.${key}.action`)}
              </Button>
            </Stack>
          </Card>
        ))}
      </SimpleGrid>
    </Stack>
  );
}
