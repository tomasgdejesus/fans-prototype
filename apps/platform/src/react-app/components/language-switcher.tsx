import { SegmentedControl } from "@mantine/core";
import { useTranslation } from "react-i18next";
import type { SupportedLanguage } from "../i18n";

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const language: SupportedLanguage = i18n.resolvedLanguage?.startsWith("es") ? "es" : "en";

  return (
    <SegmentedControl
      aria-label={t("common.language.label")}
      data={[
        { label: t("common.language.english"), value: "en" },
        { label: t("common.language.spanish"), value: "es" },
      ]}
      value={language}
      onChange={(value) => void i18n.changeLanguage(value)}
      size="xs"
    />
  );
}
