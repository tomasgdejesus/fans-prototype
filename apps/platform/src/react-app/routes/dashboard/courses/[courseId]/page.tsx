import { Anchor } from "@mantine/core";
import { Link } from "react-router";
import { PagePlaceholder } from "../../../../components/page-placeholder";

export default function CourseDetailPage() {
  return (
    <PagePlaceholder title="Course details" description="View course content, requirements, and progress.">
      <Anchor component={Link} to="/dashboard/courses">Back to courses</Anchor>
    </PagePlaceholder>
  );
}
