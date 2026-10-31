import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { EMAIL_VERIFICATION_EXPIRES_IN_SECONDS, PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from "../../../shared/constants/auth";
import { i18n } from "../../i18n";
import { authClient, type AuthResult } from "../../lib/auth-client";
import ForgotPasswordPage from "../../routes/forgot-password/page";
import LoginPage from "../../routes/login/page";
import RegisterPage from "../../routes/register/page";
import ResetPasswordPage from "../../routes/reset-password/page";
import VerifyEmailPage from "../../routes/verify-email/page";
import { renderApp } from "../helpers/render-app";

beforeEach(() => {
  authClient.configured = true;
  vi.spyOn(authClient, "getSession").mockResolvedValue(null);
  vi.spyOn(authClient, "getVerificationStatus").mockResolvedValue("pending");
});

afterEach(() => {
  authClient.configured = true;
  vi.restoreAllMocks();
});

describe("public account flows", () => {
  it("requires login fields before calling the service", async () => {
    const signIn = vi.spyOn(authClient, "signIn");
    renderApp(<MemoryRouter><LoginPage /></MemoryRouter>);
    const button = screen.getByRole("button", { name: "Log in" });
    await waitFor(() => expect(button).toBeEnabled());
    await userEvent.setup().click(button);
    expect(await screen.findAllByText("This field is required.")).toHaveLength(2);
    expect(signIn).not.toHaveBeenCalled();
  });

  it("passes short existing passwords through unchanged", async () => {
    const signIn = vi.spyOn(authClient, "signIn").mockResolvedValue({ ok: false, reason: "credentials" });
    renderApp(<MemoryRouter><LoginPage /></MemoryRouter>);
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Log in" });
    await waitFor(() => expect(button).toBeEnabled());
    await user.type(screen.getByLabelText(/Email address/), "learner@example.com");
    await user.type(screen.getByLabelText(/^Password/), " x ");
    await user.click(button);
    await waitFor(() => expect(signIn).toHaveBeenCalledWith({ email: "learner@example.com", password: " x " }, "/verify-email"));
  });

  it("validates email before requesting password recovery", async () => {
    const request = vi.spyOn(authClient, "requestPasswordReset");
    renderApp(<MemoryRouter><ForgotPasswordPage /></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText(/Email address/), "invalid-email");
    await user.click(screen.getByRole("button", { name: "Send reset link" }));
    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    { length: PASSWORD_MIN_LENGTH - 1, message: `Use at least ${PASSWORD_MIN_LENGTH} characters.` },
    { length: PASSWORD_MAX_LENGTH + 1, message: `Use no more than ${PASSWORD_MAX_LENGTH} characters.` },
  ])("blocks registration with a $length-character password", async ({ length, message }) => {
    const register = vi.spyOn(authClient, "register");
    renderApp(<MemoryRouter><RegisterPage /></MemoryRouter>);
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Create account" });
    await waitFor(() => expect(button).toBeEnabled());
    await user.type(screen.getByLabelText(/Email address/), "learner@example.com");
    await user.type(screen.getByLabelText(/^Password/), "x".repeat(length));
    await user.type(screen.getByLabelText(/Confirm password/), "x".repeat(length));
    await user.click(button);
    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
  });

  it("translates a visible confirmation error when the language changes", async () => {
    const register = vi.spyOn(authClient, "register");
    renderApp(<MemoryRouter><RegisterPage /></MemoryRouter>);
    const user = userEvent.setup();
    const button = screen.getByRole("button", { name: "Create account" });
    await waitFor(() => expect(button).toBeEnabled());
    await user.type(screen.getByLabelText(/Email address/), "learner@example.com");
    await user.type(screen.getByLabelText(/^Password/), "example-password");
    await user.type(screen.getByLabelText(/Confirm password/), "different-password");
    await user.click(button);
    expect(await screen.findByText("Passwords must match.")).toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
    await act(async () => { await i18n.changeLanguage("es"); });
    expect(screen.getByText("Las contraseñas deben coincidir.")).toBeInTheDocument();
    expect(screen.queryByText("Passwords must match.")).not.toBeInTheDocument();
  });

  it("requires matching reset passwords and sends only the token and exact password", async () => {
    const reset = vi.spyOn(authClient, "resetPassword").mockResolvedValue({ ok: true });
    renderApp(<MemoryRouter initialEntries={["/reset-password?token=opaque-token"]}><ResetPasswordPage /></MemoryRouter>);
    const user = userEvent.setup();
    const password = " example-password ";
    await user.type(screen.getByLabelText(/New password/), password);
    const confirmation = screen.getByLabelText(/Confirm password/);
    await user.type(confirmation, password.trim());
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByText("Passwords must match.")).toBeInTheDocument();
    expect(reset).not.toHaveBeenCalled();
    await user.clear(confirmation);
    await user.type(confirmation, password);
    await user.click(screen.getByRole("button", { name: "Reset password" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Your password has been reset.");
    expect(reset).toHaveBeenCalledExactlyOnceWith({ token: "opaque-token", password });
  });

  it("does not offer submission or pretend success without an auth service", () => {
    authClient.configured = false;
    renderApp(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Log in" })).toBeDisabled();
    expect(screen.getByText(/Account services are not available/)).toBeInTheDocument();
    expect(authClient.getSession).not.toHaveBeenCalled();
  });

  it("returns signed-in visitors to their intended checkout", async () => {
    vi.mocked(authClient.getSession).mockResolvedValue({ userId: "user-1", name: "FANS user", email: "learner@example.com", platformRole: "user", status: "active", emailVerified: true });
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
      vi.mocked(authClient.getSession).mockResolvedValue({ userId: "user-1", name: "FANS user", email: "learner@example.com", platformRole: "user", status: "active", emailVerified: true });
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
    expect(signIn).toHaveBeenCalledWith({ email: "learner@example.com", password: "example-password" }, expect.stringContaining("/verify-email?returnTo="));
  });

  it.each(["register", "login"] as const)("sends %s to verification before checkout and keeps the email for resending", async (mode) => {
    const resend = vi.spyOn(authClient, "resendVerification").mockResolvedValue({ ok: true });
    const request = mode === "register"
      ? vi.spyOn(authClient, "register").mockResolvedValue({ ok: true })
      : vi.spyOn(authClient, "signIn").mockResolvedValue({ ok: false, reason: "verificationRequired" });
    renderApp(
      <MemoryRouter initialEntries={[`/${mode}?returnTo=%2Fcheckout%3FproductId%3Dservsafe-class`]}>
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/checkout" element={<p>Authenticated checkout</p>} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    const submit = screen.getByRole("button", { name: mode === "register" ? "Create account" : "Log in" });
    await waitFor(() => expect(submit).toBeEnabled());
    expect(screen.queryByLabelText(/Full name/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue with Google" })).toBeDisabled();
    await user.type(screen.getByLabelText(/Email address/), "learner@example.com");
    await user.type(screen.getByLabelText(/^Password/), "example-password");
    if (mode === "register") await user.type(screen.getByLabelText(/Confirm password/), "example-password");
    await user.click(submit);
    expect(await screen.findByRole("button", { name: "Resend verification email" })).toBeEnabled();
    expect(screen.getByText("Check your email at learner@example.com for a verification link.")).toBeInTheDocument();
    expect(screen.getByText(`Verification links expire ${EMAIL_VERIFICATION_EXPIRES_IN_SECONDS / 60} minutes after they are issued.`)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Password/)).not.toBeInTheDocument();
    expect(screen.queryByText("Authenticated checkout")).not.toBeInTheDocument();
    const login = screen.getByRole("link", { name: "Back to log in" });
    expect(login).toHaveAttribute("href", "/login?returnTo=%2Fcheckout%3FproductId%3Dservsafe-class");
    expect(request).toHaveBeenCalledWith({ email: "learner@example.com", password: "example-password" }, expect.stringContaining("/verify-email?returnTo="));
    expect(resend).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "Resend verification email" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If verification is available for this account");
    expect(resend).toHaveBeenCalledExactlyOnceWith({
      email: "learner@example.com",
      redirectTo: new URL("/verify-email?returnTo=%2Fcheckout%3FproductId%3Dservsafe-class", window.location.origin).href,
    });
  });

  it.each([undefined, { email: "invalid-email" }, { email: 42 }])("directs a verification visitor without valid address context back to login: %j", (state) => {
    const resend = vi.spyOn(authClient, "resendVerification");
    renderApp(<MemoryRouter initialEntries={[{ pathname: "/verify-email", state }]}><VerifyEmailPage /></MemoryRouter>);
    expect(screen.getByText(/Log in to request a verification link/)).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resend verification email" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to log in" })).toHaveAttribute("href", "/login");
    expect(resend).not.toHaveBeenCalled();
  });

  it("shows a resend failure and lets the visitor try again with the remembered address", async () => {
    const resend = vi.spyOn(authClient, "resendVerification")
      .mockResolvedValueOnce({ ok: false, reason: "rateLimited" }).mockResolvedValue({ ok: true });
    renderApp(<MemoryRouter initialEntries={[{ pathname: "/verify-email", state: { email: "learner@example.com" } }]}><VerifyEmailPage /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Resend verification email" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Too many attempts");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Resend verification email" }));
    expect(await screen.findByRole("status")).toHaveTextContent("If verification is available for this account");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(resend).toHaveBeenCalledTimes(2);
    expect(resend.mock.calls.every(([input]) => input.email === "learner@example.com")).toBe(true);
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

  it("does not trust a verification success query parameter", async () => {
    renderApp(<MemoryRouter initialEntries={["/verify-email?success=true"]}><VerifyEmailPage /></MemoryRouter>);
    expect(screen.queryByText("Your email is verified. Log in to continue.")).not.toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resend verification email" })).not.toBeInTheDocument();
  });

  it("directs an expired-link visitor to login to request another email", async () => {
    vi.spyOn(authClient, "verifyEmail").mockResolvedValue({ ok: false, reason: "expiredLink" });
    renderApp(<MemoryRouter initialEntries={["/verify-email?token=expired-token&returnTo=%2Fcheckout"]}><VerifyEmailPage /></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "Verify email" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("This link has expired");
    expect(screen.queryByRole("button", { name: "Verify email" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Resend verification email" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByText(/Log in to request a verification link/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to log in" })).toHaveAttribute("href", "/login?returnTo=%2Fcheckout");
  });

  it("only reports verification success after checking with the service", async () => {
    const verify = vi.spyOn(authClient, "verifyEmail").mockResolvedValue({ ok: true });
    renderApp(<MemoryRouter initialEntries={["/verify-email?token=opaque-token&returnTo=%2Fcheckout"]}><VerifyEmailPage /></MemoryRouter>);
    expect(verify).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Resend verification email" })).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    await userEvent.setup().click(await screen.findByRole("button", { name: "Verify email" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Your email is verified");
    expect(verify).toHaveBeenCalledWith({ token: "opaque-token" });
    expect(screen.getByRole("link", { name: "Continue to log in" })).toHaveAttribute("href", "/login?returnTo=%2Fcheckout");
    expect(screen.queryByRole("button", { name: "Resend verification email" })).not.toBeInTheDocument();
  });

  it("immediately offers login when the token belongs to an already-verified account", async () => {
    vi.mocked(authClient.getVerificationStatus).mockResolvedValue("verified");
    const verify = vi.spyOn(authClient, "verifyEmail");
    renderApp(<MemoryRouter initialEntries={["/verify-email?token=verified-token&returnTo=%2Fcheckout"]}><VerifyEmailPage /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Verify email" })).not.toBeInTheDocument();
    expect(await screen.findByText("Your email is verified. Log in to continue.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Continue to log in" })).toHaveAttribute("href", "/login?returnTo=%2Fcheckout");
    expect(screen.queryByText("Confirm your email address to continue.")).not.toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
  });

  it("does not offer confirmation for a token rejected during the initial check", async () => {
    vi.mocked(authClient.getVerificationStatus).mockResolvedValue("invalid");
    const verify = vi.spyOn(authClient, "verifyEmail");
    renderApp(<MemoryRouter initialEntries={["/verify-email?token=expired-token"]}><VerifyEmailPage /></MemoryRouter>);
    expect(await screen.findByRole("alert")).toHaveTextContent("This verification link is invalid or has expired");
    expect(screen.queryByRole("button", { name: "Verify email" })).not.toBeInTheDocument();
    expect(verify).not.toHaveBeenCalled();
  });

  it("lets the visitor retry a failed read-only check without verifying automatically", async () => {
    vi.mocked(authClient.getVerificationStatus).mockRejectedValueOnce(new Error("Service unavailable")).mockResolvedValue("pending");
    const verify = vi.spyOn(authClient, "verifyEmail");
    renderApp(<MemoryRouter initialEntries={["/verify-email?token=pending-token"]}><VerifyEmailPage /></MemoryRouter>);
    expect(await screen.findByRole("alert")).toHaveTextContent("We could not check this verification link");
    expect(screen.queryByRole("button", { name: "Verify email" })).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByRole("button", { name: "Verify email" })).toBeEnabled();
    expect(verify).not.toHaveBeenCalled();
  });
});
