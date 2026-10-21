import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { LanguageSwitcher } from "../../components/language-switcher";
import { i18n } from "../../i18n";
import { renderApp } from "../helpers/render-app";

describe("LanguageSwitcher", () => {
  beforeEach(async () => {
    localStorage.clear();
    await i18n.changeLanguage("en");
  });

  it("switches to Spanish and persists the preference", async () => {
    const user = userEvent.setup();
    renderApp(<LanguageSwitcher />);

    await user.click(screen.getByText("Español"));

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "es");
    });
    expect(localStorage.getItem("fans.language")).toBe("es");
    expect(screen.getByLabelText("Idioma")).toBeInTheDocument();
  });
});
