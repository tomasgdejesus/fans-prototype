import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PagePlaceholder } from "../../components/page-placeholder";
import { renderApp } from "../helpers/render-app";

describe("PagePlaceholder", () => {
  it("renders its content and localized placeholder state", () => {
    renderApp(
      <PagePlaceholder title="Courses" description="Course description">
        <a href="/courses">View courses</a>
      </PagePlaceholder>,
    );

    expect(screen.getByRole("heading", { name: "Courses" })).toBeInTheDocument();
    expect(screen.getByText("Course description")).toBeInTheDocument();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View courses" })).toHaveAttribute("href", "/courses");
  });
});
