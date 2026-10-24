import { useQuery } from "@tanstack/react-query";
import { authClient } from "../../lib/auth-client";

export const publicSessionKey = ["auth", "session"] as const;

export function usePublicSession() {
  return useQuery({
    queryKey: publicSessionKey,
    queryFn: () => authClient.getSession(),
    enabled: authClient.configured,
    retry: false,
    staleTime: 30_000,
  });
}
