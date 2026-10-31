import type { SendEmail, EmailTask, AuthEmailKind } from "./types";

export interface AuthEmailDelivery {
  sendEmail: SendEmail;
  enqueue?: (task: EmailTask) => void;
}

export function emailChangePageURL(baseURL: string, token: string): string {
  const page = new URL("/change-email", baseURL);
  page.searchParams.set("token", token);
  return page.href;
}

export function verificationPageURL(baseURL: string, token: string, generatedURL: string): string {
  const page = new URL("/verify-email", baseURL);
  page.searchParams.set("token", token);
  // Better Auth validates callback origins; the frontend validates returnTo paths.
  const callback = new URL(generatedURL).searchParams.get("callbackURL");
  if (callback) {
    const destination = new URL(callback, baseURL);
    if (destination.origin === page.origin && destination.pathname === "/verify-email") {
      const returnTo = destination.searchParams.get("returnTo");
      if (returnTo) page.searchParams.set("returnTo", returnTo);
    }
  }
  return page.href;
}

export async function sendAuthEmail(
  delivery: AuthEmailDelivery,
  kind: AuthEmailKind,
  to: string,
  url: string,
  newEmail?: string,
): Promise<void> {
  const task = async () => {
    const { renderAuthEmail } = await import("./templates/auth");
    await delivery.sendEmail(await renderAuthEmail(kind, to, url, newEmail));
  };
  if (delivery.enqueue) delivery.enqueue(task);
  else await task();
}

// Only mail work is deferred; Better Auth database operations remain awaited.
export async function deliverEmailTasks(tasks: EmailTask[], waitUntil?: (promise: Promise<unknown>) => void): Promise<void> {
  if (!tasks.length) return;
  const completed = Promise.allSettled(tasks.map((task) => Promise.resolve().then(task))).then((results) => {
    if (results.some((result) => result.status === "rejected")) {
      console.error("Authentication email delivery failed.");
      // Surface a sanitized failure to the host; never attach the provider's error,
      // which can contain recipients, message content, or authentication links.
      throw new Error("Authentication email delivery failed.");
    }
  });
  if (waitUntil) waitUntil(completed);
  else await completed;
}
