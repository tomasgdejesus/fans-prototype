import { screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HomePage from "../../routes/page";
import { renderApp } from "../helpers/render-app";

const { healthGet } = vi.hoisted(() => ({ healthGet: vi.fn() }));

vi.mock("../../lib/api-client", () => ({
  apiClient: { api: { health: { $get: healthGet } } },
}));

describe("HomePage", () => {
  beforeEach(() => {
    healthGet.mockReset();
  });

  it("shows an available API status", async () => {
    healthGet.mockResolvedValue(
      new Response(JSON.stringify({ status: "ok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    renderApp(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("API: available")).toBeInTheDocument();
  });

  it("shows an unavailable API status", async () => {
    healthGet.mockResolvedValue(new Response(null, { status: 503 }));

    renderApp(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );

    expect(await screen.findByText("API: unavailable")).toBeInTheDocument();
  });
});
