import { Stack, Text, Title } from "@mantine/core";

export function PageHeading({ title, description }: { title: string; description?: string }) {
  return (
    <Stack gap="xs">
      <Title order={1}>{title}</Title>
      {description && <Text c="dimmed">{description}</Text>}
    </Stack>
  );
}
