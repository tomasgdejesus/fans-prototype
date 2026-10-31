import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authClient, type PublicSession } from "../../../lib/auth-client";
import SettingsPage from "../../../routes/dashboard/settings/page";
import { renderApp } from "../../helpers/render-app";

const profile: PublicSession = { userId: "user-1", name: "FANS user", email: "learner@example.com", platformRole: "user", status: "active", emailVerified: true };
beforeEach(() => {
  vi.spyOn(authClient, "getSession").mockResolvedValue(profile);
});
afterEach(() => { vi.restoreAllMocks(); });

async function openSettings() {
  renderApp(<MemoryRouter><SettingsPage /></MemoryRouter>);
  return screen.findByLabelText(/Display name/);
}

describe("account settings", () => {
  it("saves a trimmed name and refreshes the displayed profile", async () => {
    const update = vi.spyOn(authClient, "updateDisplayName").mockImplementation(async ({ name }) => {
      vi.mocked(authClient.getSession).mockResolvedValue({ ...profile, name });
      return { ok: true };
    });
    const field = await openSettings();
    const user = userEvent.setup();
    await user.clear(field);
    await user.type(field, "  Tomás De Jesús  ");
    await user.click(screen.getByRole("button", { name: "Save display name" }));
    expect(await screen.findByText("Your display name has been saved.")).toBeInTheDocument();
    expect(update).toHaveBeenCalledExactlyOnceWith({ name: "Tomás De Jesús" });
    await waitFor(() => expect(authClient.getSession).toHaveBeenCalledTimes(2));
    expect(field).toHaveValue("Tomás De Jesús");
  });

  it.each(["   ", "x".repeat(101)])("rejects an invalid display name before submitting", async (name) => {
    const update = vi.spyOn(authClient, "updateDisplayName");
    const field = await openSettings();
    const user = userEvent.setup();
    await user.clear(field);
    await user.type(field, name);
    await user.click(screen.getByRole("button", { name: "Save display name" }));
    expect(await screen.findByText(name.trim() ? "Use no more than 100 characters." : "This field is required.")).toBeInTheDocument();
    expect(update).not.toHaveBeenCalled();
  });

  it("requests an email change while keeping the current address visible", async () => {
    const change = vi.spyOn(authClient, "changeEmail").mockResolvedValue({ ok: true });
    await openSettings();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/New email address/), "  new@example.com  ");
    await user.click(screen.getByRole("button", { name: "Request email change" }));
    expect(await screen.findByText(/If the change can proceed/)).toHaveTextContent(profile.email);
    expect(change).toHaveBeenCalledExactlyOnceWith({ email: "new@example.com" });
    expect(screen.getByText(`Current email: ${profile.email}`)).toBeInTheDocument();
  });

  it("rejects an unchanged email address", async () => {
    const change = vi.spyOn(authClient, "changeEmail");
    await openSettings();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/New email address/), "LEARNER@example.com");
    await user.click(screen.getByRole("button", { name: "Request email change" }));
    expect(await screen.findByText("Enter a different email address.")).toBeInTheDocument();
    expect(change).not.toHaveBeenCalled();
  });

  it("sends password recovery to the session email and returns to settings after login", async () => {
    const reset = vi.spyOn(authClient, "requestPasswordReset").mockResolvedValue({ ok: true });
    await openSettings();
    await userEvent.setup().click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText(/If an account can receive password recovery emails/)).toBeInTheDocument();
    expect(reset).toHaveBeenCalledExactlyOnceWith({
      email: profile.email,
      redirectTo: new URL("/reset-password?returnTo=%2Fdashboard%2Fsettings", window.location.origin).href,
    });
  });

  it("does not report success when an email change fails", async () => {
    vi.spyOn(authClient, "changeEmail").mockResolvedValue({ ok: false, reason: "reauthenticationRequired" });
    await openSettings();
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/New email address/), "new@example.com");
    await user.click(screen.getByRole("button", { name: "Request email change" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sign out and log in again");
    expect(screen.queryByText(/If the change can proceed/)).not.toBeInTheDocument();
  });
});
