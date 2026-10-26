import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "../../../lib/auth-client";
import LoginPage from "../../../routes/login/page";
import { renderApp } from "../../helpers/render-app";

beforeEach(() => { vi.spyOn(authClient, "getSession").mockResolvedValue(null); });
afterEach(() => { vi.restoreAllMocks(); });

describe("LoginPage", () => {
  it("shows account entry links", () => {
    renderApp(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Log in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Create an account" })).toHaveAttribute("href", "/register");
    expect(screen.getByRole("link", { name: "Forgot your password?" })).toHaveAttribute(
      "href",
      "/forgot-password",
    );
  });
});
