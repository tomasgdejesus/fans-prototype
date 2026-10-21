import { Anchor, AppShell, Burger, Container, Group, NavLink, ScrollArea, Stack, Text } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useTranslation } from "react-i18next";
import { Link, NavLink as RouterNavLink, Outlet } from "react-router";
import { LanguageSwitcher } from "../../components/language-switcher";

const links = [
  { to: "/dashboard", labelKey: "dashboard.navigation.overview", end: true },
  { to: "/dashboard/courses", labelKey: "dashboard.navigation.courses", end: false },
  { to: "/dashboard/enrollments", labelKey: "dashboard.navigation.enrollments", end: false },
  { to: "/dashboard/learners", labelKey: "dashboard.navigation.learners", end: false },
  { to: "/dashboard/orders", labelKey: "dashboard.navigation.orders", end: false },
  { to: "/dashboard/certificates", labelKey: "dashboard.navigation.certificates", end: false },
  { to: "/dashboard/settings", labelKey: "dashboard.navigation.settings", end: false },
] as const;

export default function DashboardLayout() {
  const { t } = useTranslation();
  const [opened, { toggle, close }] = useDisclosure(false);
  return (
    <AppShell header={{ height: 64 }} navbar={{ width: 248, breakpoint: "sm", collapsed: { mobile: !opened } }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" aria-label={opened ? t("dashboard.navigation.close") : t("dashboard.navigation.open")} aria-controls="dashboard-navigation" aria-expanded={opened} />
            <Anchor component={Link} to="/" fw={700} size="lg" underline="never">{t("common.brand")}</Anchor>
          </Group>
          <LanguageSwitcher />
        </Group>
      </AppShell.Header>
      <AppShell.Navbar component="div" id="dashboard-navigation" p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Stack component="nav" aria-label={t("dashboard.navigation.label")} gap="xs">
            {links.map(({ to, labelKey, end }) => <NavLink key={to} label={t(labelKey)} onClick={close} renderRoot={(props) => <RouterNavLink {...props} to={to} end={end} />} />)}
          </Stack>
        </AppShell.Section>
        <AppShell.Section pt="md"><Text size="xs" c="dimmed">{t("dashboard.tagline")}</Text></AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main><Container size="lg" px={0}><Outlet /></Container></AppShell.Main>
    </AppShell>
  );
}