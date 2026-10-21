import { Anchor } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PagePlaceholder } from "../../../../components/page-placeholder";

export default function CourseDetailPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder title={t("dashboard.courses.detailTitle")} description={t("dashboard.courses.detailDescription")}>
      <Anchor component={Link} to="/dashboard/courses">{t("common.actions.backToCourses")}</Anchor>
    </PagePlaceholder>
  );
}
