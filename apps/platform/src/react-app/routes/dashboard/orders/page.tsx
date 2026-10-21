import { useTranslation } from "react-i18next";
import { PagePlaceholder } from "../../../components/page-placeholder";

export default function OrdersPage() {
  const { t } = useTranslation();

  return <PagePlaceholder title={t("dashboard.orders.title")} description={t("dashboard.orders.description")} />;
}
