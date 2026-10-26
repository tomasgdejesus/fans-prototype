import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { openSessionChannel, refreshPublicSession } from "./session";

export function SessionSync() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const channel = openSessionChannel();
    if (!channel) return;
    channel.onmessage = (event: MessageEvent<unknown>) => {
      if (event.data === "session-changed") {
        // Query state retains the error so route guards can show recovery UI.
        void refreshPublicSession(queryClient).catch(() => undefined);
      }
    };
    return () => channel.close();
  }, [queryClient]);
  return null;
}
