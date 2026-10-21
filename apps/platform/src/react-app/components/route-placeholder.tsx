import { PagePlaceholder } from "./page-placeholder";
import { useTranslation } from "react-i18next";
import type { en } from "../i18n/resources/en";

export type RoutePlaceholderKey = {
  [Key in keyof typeof en.routes]: typeof en.routes[Key] extends {
    title: string;
    description: string;
  }
    ? Key
    : never;
}[keyof typeof en.routes];

export function RoutePlaceholder({ page }: { page: RoutePlaceholderKey }) {
  const { t } = useTranslation();
  return <PagePlaceholder title={t(`routes.${page}.title`)} description={t(`routes.${page}.description`)} />;
}
