import { Alert, Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { apiClient } from "../lib/api-client";

export default function HomePage() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async () => {
      const response = await apiClient.api.health.$get();
      if (!response.ok) throw new Error("API health check failed");
      return response.json();
    },
    retry: false,
  });

  return (
    <Container component="main" size="sm" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>FANS</Title>
          <Text c="dimmed" mt="sm">Food safety training and certificate management.</Text>
        </div>
        <Alert
          title="Service status"
          color={health.isError ? "red" : "teal"}
          role="status"
          aria-live="polite"
        >
          API: {health.isPending ? "checking" : health.isError ? "unavailable" : health.data.status}
        </Alert>
        <Group component="nav" aria-label="Main">
          <Button component={Link} to="/login">Log in</Button>
          <Button component={Link} to="/dashboard" variant="light">Dashboard</Button>
        </Group>
      </Stack>
    </Container>
  );
}
