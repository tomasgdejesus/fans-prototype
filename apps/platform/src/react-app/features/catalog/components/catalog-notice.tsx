import { Alert } from "@mantine/core";
import { useTranslation } from "react-i18next";

export function CatalogNotice() {
  const { t } = useTranslation();
  return <Alert color="yellow" title={t("publicPages.catalog.preview")}>{t("publicPages.catalog.notice")}</Alert>;
}
