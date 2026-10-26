import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { authClient, type AuthResult } from "../../lib/auth-client";
import ForgotPasswordPage from "../../routes/forgot-password/page";
import LoginPage from "../../routes/login/page";
import RegisterPage from "../../routes/register/page";
import ResetPasswordPage from "../../routes/reset-password/page";
import VerifyEmailPage from "../../routes/verify-email/page";
import { renderApp } from "../helpers/render-app";

beforeEach(() => {
  authClient.configured = true;
  authClient.canResendVerification = true;
  authClient.canRequestPasswordReset = true;
  vi.spyOn(authClient, "getSession").mockResolvedValue(null);
});

afterEach(() => {
  authClient.configured = true;
  authClient.canResendVerification = false;
  authClient.canRequestPasswordReset = false;
  vi.restoreAllMocks();
});

describe("public account flows", () => {
  it("does not offer submission or pretend success without an auth service", () => {
    authClient.configured = false;
    renderApp(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();
    expect(screen.getByText(/Account services are not available/)).toBeInTheDocument();
    expect(authClient.getSession).not.toHaveBeenCalled();
  });

  it("returns signed-in visitors to their intended checkout", async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({ userId: "user-1", platformRole: "user", status: "active", emailVerified: false });
    renderApp(
      <MemoryRouter initialEntries={["/login?returnTo=%2Fcheckout%3FproductId%3Dservsafe-class"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/checkout" element={<p>Intended checkout</p>} />
        </Routes>
      </MemoryRouter>,
    );
    expect(await screen.findByText("Intended checkout")).toBeInTheDocument();
  });

  it("shows a neutral recovery confirmation only after the service accepts the request", async () => {
    const request = vi.spyOn(authClient, "requestPasswordReset").mockResolvedValue({ ok: true });
    renderApp(<MemoryRouter initialEntries={["/forgot-password?returnTo=%2Fcheckout%3FproductId%3Dservsafe-class"]}><ForgotPasswordPage /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email address/), "learner@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If an account can receive password recovery emails");
    const redirect = new URL(request.mock.calls[0][0].redirectTo);
    expect(redirect.pathname).toBe("/reset-password");
    expect(redirect.searchParams.get("returnTo")).toBe("/checkout?productId=servsafe-class");
  });

  it("logs in before continuing to the intended destination", async () => {
    const signIn = vi.spyOn(authClient, "signIn").mockImplementation(async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({ userId: "user-1", platformRole: "user", status: "active", emailVerified: false });
      return { ok: true };
    });
    renderApp(
      <MemoryRouter initialEntries={["/login?returnTo=%2Fcheckout%3FproductId%3Dservsafe-class"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/checkout" element={<p>Authenticated checkout</p>} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getByRole("button", { name: "Log in" })).toBeEnabled());
    await user.type(screen.getByLabelText(/Email address/), "learner@example.com");
    await user.type(screen.getByLabelText(/^Password/), "example-password");
    await user.click(screen.getByRole("button", { name: "Log in" }));
    expect(await screen.findByText("Authenticated checkout")).toBeInTheDocument();
    expect(signIn).toHaveBeenCalledWith({ email: "learner@example.com", password: "example-password" });
  });

  it("registers with email and passwords before continuing checkout", async () => {
    const register = vi.spyOn(authClient, "register").mockImplementation(async () => {
      vi.mocked(authClient.getSession).mockResolvedValue({ userId: "new-user", platformRole: "user", status: "active", emailVerified: false });
      return { ok: true };
    });
    renderApp(
      <MemoryRouter initialEntries={["/register?returnTo=%2Fcheckout%3FproductId%3Dservsafe-class"]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/checkout" element={<p>Registered checkout</p>} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await waitFor(() => expect(screen.getByRole("button", { name: "Create account" })).toBeEnabled());
    expect(screen.queryByLabelText(/Full name/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
    await user.type(screen.getByLabelText(/Email address/), "learner@example.com");
    await user.type(screen.getByLabelText(/^Password/), "example-password");
    await user.type(screen.getByLabelText(/Confirm password/), "example-password");
    await user.click(screen.getByRole("button", { name: "Create account" }));
    expect(await screen.findByText("Registered checkout")).toBeInTheDocument();
    expect(register).toHaveBeenCalledWith({ email: "learner@example.com", password: "example-password" });
  });

  it("disables recovery requests while email delivery is unavailable", () => {
    authClient.canRequestPasswordReset = false;
    renderApp(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Send reset link" })).toBeDisabled();
    expect(screen.getByText(/Password recovery is not available yet/)).toBeInTheDocument();
  });

  it("does not claim an email was sent when the request fails", async () => {
    vi.spyOn(authClient, "requestPasswordReset").mockRejectedValue(new Error("Network unavailable"));
    renderApp(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email address/), "learner@example.com");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not complete that request");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("rejects a missing recovery token without displaying a password form", () => {
    renderApp(<MemoryRouter><ResetPasswordPage /></MemoryRouter>);
    expect(screen.getByRole("alert")).toHaveTextContent("This link is invalid or missing");
    expect(screen.queryByLabelText(/New password/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Request a new reset link" })).toHaveAttribute("href", "/forgot-password");
  });

  it.each([
    ["expiredLink", "This link has expired"],
    ["usedLink", "This link has already been used"],
    ["invalidLink", "This link is invalid or missing"],
  ] as const)("uses the service result for a recovery token: %s", async (reason, message) => {
    vi.spyOn(authClient, "resetPassword").mockResolvedValue({ ok: false, reason } satisfies AuthResult);
    renderApp(<MemoryRouter initialEntries={["/reset-password?token=opaque-token"]}><ResetPasswordPage /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/New password/), "example-password");
    await user.type(screen.getByLabelText(/Confirm password/), "example-password");
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByRole("button", { name: "Reset password" })).not.toBeInTheDocument();
  });

  it("does not trust a verification success query parameter", () => {
    renderApp(<MemoryRouter initialEntries={["/verify-email?success=true"]}><VerifyEmailPage /></MemoryRouter>);
    expect(screen.queryByText("Your email has been verified. Log in to continue.")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Resend verification email" })).toBeEnabled();
  });

  it("only reports verification success after checking with the service", async () => {
    const verify = vi.spyOn(authClient, "verifyEmail").mockResolvedValue({ ok: true });
    renderApp(<MemoryRouter initialEntries={["/verify-email?token=opaque-token"]}><VerifyEmailPage /></MemoryRouter>);
    expect(verify).not.toHaveBeenCalled();
    await userEvent.setup().click(screen.getByRole("button", { name: "Verify email" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Your email has been verified");
    expect(verify).toHaveBeenCalledWith({ token: "opaque-token" });
  });
});
