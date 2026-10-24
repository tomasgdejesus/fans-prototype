import { SimpleGrid, Stack, Text } from "@mantine/core";
import { useTranslation } from "react-i18next";
import { PageHeading } from "../../components/page-heading";
import { CatalogNotice } from "../../features/catalog/components/catalog-notice";
import { ProductCard } from "../../features/catalog/components/product-card";
import { availableProducts } from "../../features/catalog/products";

export default function CatalogPage() {
  const { t } = useTranslation();
  const products = availableProducts();
  return (
    <Stack gap="xl">
      <PageHeading title={t("routes.catalog.title")} description={t("routes.catalog.description")} />
      <CatalogNotice />
      {products.length ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </SimpleGrid>
      ) : <Text>{t("publicPages.catalog.empty")}</Text>}
    </Stack>
  );
}
