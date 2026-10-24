const defaultDestination = "/dashboard";

function containsUnsafeCharacters(value: string) {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);
    return code <= 32 || code === 127 || character === "\\";
  });
}

// This is a navigation allowlist, not an authorization check. The server must
// independently authorize checkout and all account resources when implemented.
export function allowedDestination(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || containsUnsafeCharacters(value)) return defaultDestination;
  try {
    const url = new URL(value, "https://fans.invalid");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "https://fans.invalid" || containsUnsafeCharacters(path)) return defaultDestination;
    const allowed = /^\/dashboard(?:\/[a-zA-Z0-9_-]+)*\/?$/.test(path)
      || /^\/catalog(?:\/[a-zA-Z0-9_-]+)?\/?$/.test(path)
      || path === "/checkout";
    return allowed ? `${url.pathname}${url.search}${url.hash}` : defaultDestination;
  } catch {
    return defaultDestination;
  }
}

export function accountPath(path: "/login" | "/register" | "/forgot-password" | "/reset-password" | "/verify-email", destination: string) {
  const safe = allowedDestination(destination);
  return safe === defaultDestination ? path : `${path}?${new URLSearchParams({ returnTo: safe })}`;
}
