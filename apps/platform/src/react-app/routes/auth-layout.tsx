import { Container } from "@mantine/core";
import { Outlet } from "react-router";

export default function AuthLayout() {
  return (
    <Container size={480} px={0} py="lg">
      <Outlet />
    </Container>
  );
}
