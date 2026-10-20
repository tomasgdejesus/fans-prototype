import { Anchor, Stack } from "@mantine/core";
import { Link } from "react-router";
import { PagePlaceholder } from "../../components/page-placeholder";

export default function LoginPage() {
  return (
    <PagePlaceholder title="Log in" description="Sign in to access your training and account.">
      <Stack gap="xs">
        <Anchor component={Link} to="/register">Create an account</Anchor>
        <Anchor component={Link} to="/forgot-password">Forgot your password?</Anchor>
      </Stack>
    </PagePlaceholder>
  );
}
