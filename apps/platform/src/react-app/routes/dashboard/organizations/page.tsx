import { useTranslation } from "react-i18next";
import { PagePlaceholder } from "../../../components/page-placeholder";

export default function OrganizationsPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder
      title={t("dashboard.organizations.title")}
      description={t("dashboard.organizations.description")}
    />
  );
}
