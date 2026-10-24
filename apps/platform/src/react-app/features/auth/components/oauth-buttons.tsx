import { Button, Divider, Stack } from "@mantine/core";
import { useTranslation } from "react-i18next";

type OAuthProvider = { id: string; label: string };

interface OAuthButtonsProps {
  providers: readonly OAuthProvider[];
  disabled?: boolean;
  onSignIn?: (providerId: string) => void;
}

// Presentation only. A future caller owns the OAuth request, pending/error
// state, and allowed return destination. Missing handlers keep buttons disabled.
export function OAuthButtons({ providers, disabled = true, onSignIn }: OAuthButtonsProps) {
  const { t } = useTranslation();
  if (providers.length === 0) return null;

  return (
    <Stack gap="sm">
      {providers.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="default"
          fullWidth
          disabled={disabled || !onSignIn}
          onClick={() => onSignIn?.(provider.id)}
        >
          {provider.label}
        </Button>
      ))}
      <Divider label={t("publicPages.auth.oauth.emailAlternative")} labelPosition="center" />
    </Stack>
  );
}
