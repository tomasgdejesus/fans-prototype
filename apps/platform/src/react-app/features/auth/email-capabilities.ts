import { useQuery } from "@tanstack/react-query";
import { authClient } from "../../lib/auth-client";

export function useEmailCapabilities() {
  return useQuery({
    queryKey: ["auth", "email-capabilities"],
    queryFn: ({ signal }) => authClient.getEmailCapabilities(signal),
    enabled: authClient.configured,
    retry: false,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
}
