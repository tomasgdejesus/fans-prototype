import { Badge, Paper, Stack, Text, Title } from "@mantine/core";
import type { ReactNode } from "react";

interface PagePlaceholderProps {
  title: string;
  description: string;
  children?: ReactNode;
}

export function PagePlaceholder({ title, description, children }: PagePlaceholderProps) {
  return (
    <Stack gap="lg">
      <div>
        <Title order={1} size="h2">{title}</Title>
        <Text c="dimmed" mt="xs">{description}</Text>
      </div>
      <Paper withBorder p="lg">
        <Stack align="flex-start" gap="md">
          <Badge variant="light">Coming soon</Badge>
          <Text c="dimmed">This section is being built.</Text>
          {children}
        </Stack>
      </Paper>
    </Stack>
  );
}
