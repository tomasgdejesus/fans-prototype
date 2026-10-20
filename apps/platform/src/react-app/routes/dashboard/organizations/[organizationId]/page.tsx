import { Anchor } from "@mantine/core";
import { Link } from "react-router";
import { PagePlaceholder } from "../../../../components/page-placeholder";

export default function OrganizationDetailPage() {
  return (
    <PagePlaceholder title="Organization details" description="View employees and manage their training assignments.">
      <Anchor component={Link} to="/dashboard/organizations">Back to organizations</Anchor>
    </PagePlaceholder>
  );
}
