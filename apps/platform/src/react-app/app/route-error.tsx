import { Anchor, Button, Container, Group, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";

export default function RouteError() {
  const { t } = useTranslation();
  return <Container component="main" py="xl"><Stack align="flex-start">
    <Title order={1}>{t("errors.route.title")}</Title>
    <Text role="alert">{t("errors.route.description")}</Text>
    <Group>
      <Button onClick={() => window.location.reload()}>{t("errors.route.reload")}</Button>
      <Anchor href="/">{t("common.actions.returnHome")}</Anchor>
    </Group>
  </Stack></Container>;
}
