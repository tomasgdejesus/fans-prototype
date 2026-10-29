import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { isExternalSessionChange, openSessionChannel, refreshPublicSession } from "./session";

export function SessionSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = openSessionChannel();
    if (!channel) return;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      // A different BroadcastChannel object in this tab also receives our
      // broadcasts. Only other tabs should start a second session refresh.
      if (isExternalSessionChange(event.data)) {
        // Query state retains the error so route guards can show recovery UI.
        void refreshPublicSession(queryClient).catch(() => undefined);
      }
    };
    return () => channel.close();
  }, [queryClient]);
  return null;
}
