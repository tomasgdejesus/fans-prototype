import { Anchor } from "@mantine/core";
import { Link } from "react-router";
import { PagePlaceholder } from "../../components/page-placeholder";

export default function ForgotPasswordPage() {
  return (
    <PagePlaceholder title="Forgot password" description="Request help resetting your password.">
      <Anchor component={Link} to="/login">Back to log in</Anchor>
    </PagePlaceholder>
  );
}
