import { screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { i18n } from "../../i18n";
import CatalogPage from "../../routes/catalog/page";
import ProductPage from "../../routes/catalog/[productId]/page";
import { renderApp } from "../helpers/render-app";

describe("public catalog", () => {
  it("falls back to English for deferred Spanish product labels", async () => {
    await i18n.changeLanguage("es");
    renderApp(<MemoryRouter><CatalogPage /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "ServSafe class and exam" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View class details" })).toHaveAttribute("href", "/catalog/servsafe-class");
    expect(screen.getByText(/These are sample offerings and prices/)).toBeInTheDocument();
  });

  it("preserves the selected product through account entry", () => {
    renderApp(
      <MemoryRouter initialEntries={["/catalog/servsafe-class"]}>
        <Routes><Route path="/catalog/:productId" element={<ProductPage />} /></Routes>
      </MemoryRouter>,
    );
    const href = screen.getByRole("link", { name: "Continue with this class" }).getAttribute("href")!;
    const url = new URL(href, "https://fans.invalid");
    expect(url.pathname).toBe("/login");
    expect(url.searchParams.get("returnTo")).toBe("/checkout?productId=servsafe-class");
    expect(screen.getByRole("heading", { name: "Booking policies" })).toBeInTheDocument();
  });

  it("does not offer purchase for an unknown product", () => {
    renderApp(
      <MemoryRouter initialEntries={["/catalog/missing"]}>
        <Routes><Route path="/catalog/:productId" element={<ProductPage />} /></Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "Product not found" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Continue with this class" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to catalog" })).toHaveAttribute("href", "/catalog");
  });
});
