import { Alert, Anchor, Button, Grid, List, Paper, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router";
import { PageHeading } from "../../../components/page-heading";
import { accountPath } from "../../../features/auth/navigation";
import { usePublicSession } from "../../../features/auth/use-public-session";
import { CatalogNotice } from "../../../features/catalog/components/catalog-notice";
import { availableProducts, productPrice } from "../../../features/catalog/products";

export default function ProductPage() {
  const { t, i18n } = useTranslation();
  const { productId } = useParams();
  const session = usePublicSession();
  const product = availableProducts().find((candidate) => candidate.id === productId);
  if (!product) return (
    <Stack align="flex-start">
      <PageHeading title={t("publicPages.catalog.missing")} description={t("publicPages.catalog.missingDescription")} />
      <Button component={Link} to="/catalog">{t("publicPages.catalog.back")}</Button>
    </Stack>
  );

  const prefix = `publicPages.products.${product.copyKey}` as const;
  const checkout = `/checkout?${new URLSearchParams({ productId: product.id })}`;
  return (
    <Stack gap="xl">
      <Anchor component={Link} to="/catalog">{t("publicPages.catalog.back")}</Anchor>
      <PageHeading title={t(`${prefix}.title`)} description={t(`${prefix}.summary`)} />
      <CatalogNotice />
      <Grid gap="xl">
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Stack gap="xl">
            <section>
              <Title order={2} size="h3" mb="sm">{t("publicPages.catalog.inclusions")}</Title>
              <List spacing="xs">
                <List.Item>{t(`${prefix}.studyGuide`)}</List.Item>
                <List.Item>{t(`${prefix}.practice`)}</List.Item>
                <List.Item>{t(`${prefix}.classExam`)}</List.Item>
              </List>
            </section>
            <section><Title order={2} size="h3" mb="sm">{t("publicPages.catalog.delivery")}</Title><Text>{t(`${prefix}.delivery`)}</Text></section>
            <section><Title order={2} size="h3" mb="sm">{t("publicPages.catalog.location")}</Title><Text>{t(`${prefix}.location`)}</Text></section>
            <section><Title order={2} size="h3" mb="sm">{t("publicPages.catalog.prerequisites")}</Title><Text>{t(`${prefix}.prerequisites`)}</Text></section>
            <section><Title order={2} size="h3" mb="sm">{t("publicPages.catalog.policies")}</Title><Text>{t(`${prefix}.policies`)}</Text></section>
          </Stack>
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="lg">
            <Stack>
              <Text size="xl" fw={700}>{t("publicPages.catalog.price", { price: productPrice(product, i18n.resolvedLanguage ?? "en") })}</Text>
              {session.isError && <Alert color="red" role="alert">{t("publicPages.auth.sessionError")}</Alert>}
              {session.isLoading || session.isError ? (
                <Button disabled loading={session.isLoading}>{t("publicPages.catalog.continue")}</Button>
              ) : (
                <Button component={Link} to={session.data ? checkout : accountPath("/login", checkout)}>{t("publicPages.catalog.continue")}</Button>
              )}
            </Stack>
          </Paper>
        </Grid.Col>
      </Grid>
    </Stack>
  );
}
