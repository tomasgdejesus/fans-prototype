import { Button, Container, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <Container component="main" size="sm" py="xl">
      <Stack align="flex-start">
        <Text c="dimmed" fw={700}>404</Text>
        <Title order={1}>Page not found</Title>
        <Text c="dimmed">The page you requested could not be found.</Text>
        <Button component={Link} to="/">Return home</Button>
      </Stack>
    </Container>
  );
}
