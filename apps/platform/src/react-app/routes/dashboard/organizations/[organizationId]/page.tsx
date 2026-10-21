import { Anchor } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PagePlaceholder } from "../../../../components/page-placeholder";

export default function OrganizationDetailPage() {
  const { t } = useTranslation();

  return (
    <PagePlaceholder
      title={t("dashboard.organizations.detailTitle")}
      description={t("dashboard.organizations.detailDescription")}
    >
      <Anchor component={Link} to="/dashboard/organizations">{t("common.actions.backToOrganizations")}</Anchor>
    </PagePlaceholder>
  );
}
