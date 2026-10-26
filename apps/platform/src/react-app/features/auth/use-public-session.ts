import { useQuery, useQueryClient } from "@tanstack/react-query";
import { publicSessionOptions } from "./session";

export function usePublicSession() {
  const queryClient = useQueryClient();
  return useQuery(publicSessionOptions(queryClient));
}
