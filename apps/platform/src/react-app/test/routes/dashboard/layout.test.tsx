import { screen } from "@testing-library/react";
import { createMemoryRouter } from "react-router";
import { RouterProvider } from "react-router/dom";
import { describe, expect, it } from "vitest";
import DashboardLayout from "../../../routes/dashboard/layout";
import { renderApp } from "../../helpers/render-app";

describe("DashboardLayout", () => {
  it("renders navigation and the active child route", () => {
    const router = createMemoryRouter(
      [
        {
          path: "/dashboard",
          element: <DashboardLayout />,
          children: [{ index: true, element: <p>Dashboard content</p> }],
        },
      ],
      { initialEntries: ["/dashboard"] },
    );

    renderApp(<RouterProvider router={router} />);

    expect(screen.getByRole("navigation", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Courses" })).toHaveAttribute("href", "/dashboard/courses");
    expect(screen.getByText("Dashboard content")).toBeInTheDocument();
  });
});
