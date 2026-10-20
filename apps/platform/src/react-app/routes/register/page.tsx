import { Anchor } from "@mantine/core";
import { Link } from "react-router";
import { PagePlaceholder } from "../../components/page-placeholder";

export default function RegisterPage() {
  return (
    <PagePlaceholder title="Create an account" description="Get started with FANS training.">
      <Anchor component={Link} to="/login">Already have an account? Log in</Anchor>
    </PagePlaceholder>
  );
}
