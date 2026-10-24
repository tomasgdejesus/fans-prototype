import { Button, Paper, Stack, Text, Title } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { productPrice, type CatalogProduct } from "../products";

export function ProductCard({ product }: { product: CatalogProduct }) {
  const { t, i18n } = useTranslation();
  return (
    <Paper component="article" withBorder p="lg">
      <Stack align="flex-start">
        <div>
          <Title order={2} size="h3">{t(`publicPages.products.${product.copyKey}.title`)}</Title>
          <Text c="dimmed" mt="xs">{t(`publicPages.products.${product.copyKey}.summary`)}</Text>
        </div>
        <Text size="sm">{t(`publicPages.products.${product.copyKey}.delivery`)}</Text>
        <Text fw={700}>{t("publicPages.catalog.price", { price: productPrice(product, i18n.resolvedLanguage ?? "en") })}</Text>
        <Button component={Link} to={`/catalog/${encodeURIComponent(product.id)}`}>{t("publicPages.catalog.details")}</Button>
      </Stack>
    </Paper>
  );
}
