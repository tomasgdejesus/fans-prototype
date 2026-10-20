import { Anchor, AppShell, Burger, Container, Group, NavLink, ScrollArea, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Link, NavLink as RouterNavLink, Outlet } from "react-router";

const links = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/courses", label: "Courses" },
  { to: "/dashboard/organizations", label: "Organizations" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/settings", label: "Settings" },
];

export default function DashboardLayout() {
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 248, breakpoint: "sm", collapsed: { mobile: !opened } }}
      padding="lg"
    >
      <AppShell.Header>
        <Group h="100%" px="lg">
          <Burger
            opened={opened}
            onClick={toggle}
            hiddenFrom="sm"
            size="sm"
            aria-label={opened ? "Close navigation" : "Open navigation"}
            aria-controls="dashboard-navigation"
            aria-expanded={opened}
          />
          <Anchor component={Link} to="/" fw={700} size="lg" underline="never">
            FANS
          </Anchor>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar component="div" id="dashboard-navigation" p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Stack component="nav" aria-label="Dashboard" gap="xs">
            {links.map(({ to, label, end }) => (
              <NavLink
                key={to}
                label={label}
                onClick={close}
                renderRoot={(props) => (
                  <RouterNavLink {...props} to={to} end={end} />
                )}
              />
            ))}
          </Stack>
        </AppShell.Section>
        <AppShell.Section pt="md">
          <Text size="xs" c="dimmed">Food safety training and certificates</Text>
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Container size="lg" px={0}>
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
