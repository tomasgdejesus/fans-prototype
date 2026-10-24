import { Anchor, Box, Button, Container, Group, Text } from "@mantine/core";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { LanguageSwitcher } from "../components/language-switcher";
import { accountPath, allowedDestination } from "../features/auth/navigation";
import { usePublicSession } from "../features/auth/use-public-session";
import classes from "./public-layout.module.css";

export default function PublicLayout() {
  const { t } = useTranslation();
  const { pathname, search } = useLocation();
  const session = usePublicSession();
  const destination = allowedDestination(new URLSearchParams(search).get("returnTo"));

  useEffect(() => {
    const heading = document.querySelector<HTMLElement>("#public-main h1");
    document.title = heading ? `${heading.textContent} | ${t("common.brand")}` : t("common.brand");
  }, [pathname, t]);

  return (
    <Box className={classes.shell}>
      <Anchor href="#public-main" className={classes.skipLink}>{t("publicPages.navigation.skip")}</Anchor>
      <Box component="header" py="md" style={{ borderBottom: "1px solid var(--mantine-color-default-border)" }}>
        <Container size="lg">
          <Group justify="space-between" gap="md">
            <Anchor component={Link} to="/" fw={700} size="xl" underline="never">{t("common.brand")}</Anchor>
            <Group component="nav" aria-label={t("publicPages.navigation.label")} gap="md">
              <Anchor component={NavLink} to="/catalog">{t("routes.catalog.title")}</Anchor>
              {session.data ? <Button component={Link} to="/dashboard" variant="light" size="xs">{t("common.actions.dashboard")}</Button> : (
                <>
                  <Anchor component={NavLink} to={accountPath("/login", destination)}>{t("common.actions.logIn")}</Anchor>
                  <Button component={Link} to={accountPath("/register", destination)} variant="light" size="xs">{t("publicPages.navigation.register")}</Button>
                </>
              )}
            </Group>
            <LanguageSwitcher />
          </Group>
        </Container>
      </Box>
      <Container component="main" id="public-main" tabIndex={-1} size="lg" py="xl" className={classes.main}>
        <Outlet />
      </Container>
      <Box component="footer" py="lg">
        <Container size="lg">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">{t("publicPages.navigation.footer")}</Text>
            <Anchor component={Link} to="/catalog" size="sm">{t("publicPages.navigation.catalog")}</Anchor>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}
