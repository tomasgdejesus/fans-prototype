// Local preview data only. Replace this collection with the catalog API later;
// checkout must obtain authoritative pricing and availability from the server.
export type CatalogProduct = {
  id: string;
  active: boolean;
  purchasable: boolean;
  amountMinor: number;
  currency: string;
  copyKey: "servsafe";
};

export const previewProducts: readonly CatalogProduct[] = [
  { id: "servsafe-class", active: true, purchasable: true, amountMinor: 12500, currency: "USD", copyKey: "servsafe" },
];

export function availableProducts() {
  return previewProducts.filter((product) => product.active && product.purchasable);
}

export function productPrice(product: CatalogProduct, language: string) {
  return new Intl.NumberFormat(language, { style: "currency", currency: product.currency }).format(product.amountMinor / 100);
}
