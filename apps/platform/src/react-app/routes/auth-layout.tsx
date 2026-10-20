import { Anchor, Container, Stack } from "@mantine/core";
import { Link, Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <Container component="main" size={440} py="xl">
      <Stack gap="xl">
        <Anchor component={Link} to="/" fw={700}>FANS</Anchor>
        <Outlet />
      </Stack>
    </Container>
  );
}
