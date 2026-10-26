import { Button, Stack } from "@mantine/core";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { authClient, type AuthFailure } from "../../../lib/auth-client";
import { broadcastSessionChange, clearPublicSession } from "../session";
import { AuthError } from "./auth-card";

export function SignOutButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<AuthFailure | null>(null);

  async function signOut() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const result = await authClient.signOut();
      if (!result.ok) { setError(result.reason); return; }
      await clearPublicSession(queryClient);
      broadcastSessionChange();
      void navigate("/login", { replace: true });
    } catch { setError("failed"); }
    finally { setPending(false); }
  }

  return (
    <Stack gap="xs">
      <AuthError reason={error} />
      <Button variant="subtle" size="xs" loading={pending} onClick={() => void signOut()}>{t("publicPages.auth.signOut")}</Button>
    </Stack>
  );
}
