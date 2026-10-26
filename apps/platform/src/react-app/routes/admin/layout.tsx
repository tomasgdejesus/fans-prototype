import { Anchor, AppShell, Group, NavLink, ScrollArea, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, NavLink as RouterNavLink, Outlet } from "react-router";
import { SignOutButton } from "../../features/auth/components/sign-out-button";
import { LanguageSwitcher } from "../../components/language-switcher";

const links = ["overview", "learners", "courses", "enrollments", "certificates", "orders"] as const;

export default function AdminLayout() {
  const { t } = useTranslation();
  return (
    <AppShell header={{ height: 64 }} navbar={{ width: 248, breakpoint: "sm" }} padding="lg">
      <AppShell.Header>
        <Group h="100%" px="lg" justify="space-between">
          <Anchor component={Link} to="/admin" fw={700} size="lg" underline="never">{t("routes.admin.title")}</Anchor>
          <Group><LanguageSwitcher /><SignOutButton /></Group>
        </Group>
      </AppShell.Header>
      <AppShell.Navbar p="md">
        <AppShell.Section grow component={ScrollArea}>
          <Stack component="nav" aria-label={t("routes.admin.title")} gap="xs">
            {links.map((section) => {
              const to = section === "overview" ? "/admin" : `/admin/${section}`;
              return <NavLink key={section} label={t(`routes.adminNavigation.${section}`)} renderRoot={(props) => <RouterNavLink {...props} to={to} end={section === "overview"} />} />;
            })}
          </Stack>
        </AppShell.Section>
      </AppShell.Navbar>
      <AppShell.Main><Outlet /></AppShell.Main>
    </AppShell>
  );
}