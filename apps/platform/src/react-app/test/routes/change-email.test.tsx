import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authClient } from "../../lib/auth-client";
import ChangeEmailPage from "../../routes/change-email/page";
import { renderApp } from "../helpers/render-app";

beforeEach(() => {
  vi.spyOn(authClient, "getSession").mockResolvedValue(null);
  vi.spyOn(authClient, "getEmailChangeStatus").mockResolvedValue("confirmation");
  vi.spyOn(authClient, "verifyEmail").mockResolvedValue({ ok: true });
});
afterEach(() => { vi.restoreAllMocks(); });
function openPage(path = "/change-email?token=signed-token") {
  return renderApp(<MemoryRouter initialEntries={[path]}><ChangeEmailPage /></MemoryRouter>);
}

describe("email change links", () => {
  it("checks a link without consuming it, then approves after an explicit click", async () => {
    openPage();
    const approve = await screen.findByRole("button", { name: "Approve email change" });
    expect(authClient.verifyEmail).not.toHaveBeenCalled();
    expect(screen.queryByText(/Request approved/)).not.toBeInTheDocument();
    await userEvent.setup().click(approve);
    expect(await screen.findByRole("status")).toHaveTextContent("Check your new inbox");
    expect(authClient.verifyEmail).toHaveBeenCalledExactlyOnceWith({ token: "signed-token" });
    expect(authClient.getSession).not.toHaveBeenCalled();
  });

  it("only reports completion after Better Auth accepts the new-address verification", async () => {
    vi.mocked(authClient.getEmailChangeStatus).mockResolvedValue("verification");
    openPage();
    const verify = await screen.findByRole("button", { name: "Verify new email" });
    expect(screen.queryByText(/Your account email has been changed/)).not.toBeInTheDocument();
    await userEvent.setup().click(verify);
    expect(await screen.findByRole("status")).toHaveTextContent("Your account email has been changed");
    expect(authClient.getSession).toHaveBeenCalledOnce();
    expect(screen.getByRole("link", { name: "Go to account settings" })).toHaveAttribute("href", "/dashboard/settings");
  });

  it("does not trust success or stage query parameters", () => {
    openPage("/change-email?success=true&stage=verification");
    expect(screen.getByRole("alert")).toHaveTextContent("This email change link is invalid");
    expect(authClient.getEmailChangeStatus).not.toHaveBeenCalled();
    expect(authClient.verifyEmail).not.toHaveBeenCalled();
  });

  it("rejects a signup, expired, or consumed token without offering confirmation", async () => {
    vi.mocked(authClient.getEmailChangeStatus).mockResolvedValue("invalid");
    openPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("This email change link is invalid");
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(authClient.verifyEmail).not.toHaveBeenCalled();
  });

  it("handles a token expiring between inspection and confirmation", async () => {
    vi.mocked(authClient.verifyEmail).mockResolvedValue({ ok: false, reason: "expiredLink" });
    openPage();
    await userEvent.setup().click(await screen.findByRole("button", { name: "Approve email change" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This link has expired");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("lets a visitor retry inspection after an outage", async () => {
    vi.mocked(authClient.getEmailChangeStatus).mockRejectedValueOnce(new Error("Unavailable")).mockResolvedValue("confirmation");
    openPage();
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not check this email change link");
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: "Approve email change" })).toBeEnabled();
    expect(authClient.verifyEmail).not.toHaveBeenCalled();
  });
});
