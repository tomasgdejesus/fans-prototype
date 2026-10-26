import { Alert, Anchor, Button, Container, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, Navigate, Outlet, useLocation } from "react-router";
import { accountPath } from "../navigation";
import { usePublicSession } from "../use-public-session";
import { SignOutButton } from "./sign-out-button";

// Browser navigation only. APIs must independently enforce the same policies.
export function RequireAccount({ allowedRoles }: { allowedRoles?: readonly string[] }) {
  const { t } = useTranslation();
  const location = useLocation();
  const session = usePublicSession();

  if (session.isPending && !session.isError) return (
    <Container component="main" py="xl"><Text role="status">{t("publicPages.auth.checking")}</Text></Container>
  );
  if (session.isError) return (
    <Container component="main" py="xl"><Stack>
      <Alert color="red" role="alert">{t("publicPages.auth.sessionError")}</Alert>
      <Button onClick={() => void session.refetch()} loading={session.isFetching}>{t("publicPages.auth.retry")}</Button>
      <Anchor component={Link} to="/catalog">{t("publicPages.navigation.catalog")}</Anchor>
    </Stack></Container>
  );
  if (!session.data) return <Navigate to={accountPath("/login", `${location.pathname}${location.search}${location.hash}`)} replace />;

  const inactive = session.data.status !== "active";
  if (inactive || (allowedRoles && !allowedRoles.includes(session.data.platformRole))) return (
    <Container component="main" py="xl"><Stack align="flex-start">
      <Title order={1}>{t(inactive ? "publicPages.auth.inactiveTitle" : "publicPages.auth.deniedTitle")}</Title>
      <Text>{t(inactive ? "publicPages.auth.inactiveDescription" : "publicPages.auth.deniedDescription")}</Text>
      <Anchor component={Link} to={inactive ? "/catalog" : "/dashboard"}>{t(inactive ? "publicPages.navigation.catalog" : "common.actions.dashboard")}</Anchor>
      <SignOutButton />
    </Stack></Container>
  );
  return <Outlet />;
}
