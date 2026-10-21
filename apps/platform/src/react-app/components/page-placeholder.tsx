import { Badge, Paper, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

interface PagePlaceholderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  const { t } = useTranslation();

  return (
    <Stack gap="lg">
      <div>
        <Title order={1} size="h2">{title}</Title>
        <Text c="dimmed" mt="xs">{description}</Text>
      </div>
      <Paper withBorder p="lg">
        <Stack align="flex-start" gap="md">
          <Badge variant="light">{t("common.placeholder.comingSoon")}</Badge>
          <Text c="dimmed">{t("common.placeholder.beingBuilt")}</Text>
          {children}
        </Stack>
      </Paper>
    </Stack>
  );
}
