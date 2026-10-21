import { useTranslation } from "react-i18next";
import { PagePlaceholder } from "../../../components/page-placeholder";

export default function CoursesPage() {
  const { t } = useTranslation();

  return <PagePlaceholder title={t("dashboard.courses.title")} description={t("dashboard.courses.description")} />;
}
