import { Container, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";

// Shown after React starts while an initial deep-linked route is loading.
export default function RouteLoading() {
  const { t } = useTranslation();
  return <Container component="main" py="xl">
    <Text role="status">{t("common.navigation.loading")}</Text>
  </Container>;
}
