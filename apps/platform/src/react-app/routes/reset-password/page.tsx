import { Anchor } from "@mantine/core";
import { Link } from "react-router";
import { PagePlaceholder } from "../../components/page-placeholder";

export default function ResetPasswordPage() {
  return (
    <PagePlaceholder title="Reset password" description="Choose a new password for your account.">
      <Anchor component={Link} to="/login">Back to log in</Anchor>
    </PagePlaceholder>
  );
}
