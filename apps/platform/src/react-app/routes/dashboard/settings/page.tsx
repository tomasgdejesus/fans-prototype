import { useTranslation } from "react-i18next";
import { PagePlaceholder } from "../../../components/page-placeholder";

export default function SettingsPage() {
  const { t } = useTranslation();

  return <PagePlaceholder title={t("dashboard.settings.title")} description={t("dashboard.settings.description")} />;
}
