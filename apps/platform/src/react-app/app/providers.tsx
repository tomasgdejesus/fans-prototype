import { MantineProvider } from "@mantine/core";
import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { SessionSync } from "../features/auth/session-sync";
import { queryClient } from "../lib/query-client";
import { theme } from "./theme";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <QueryClientProvider client={queryClient}>
        <SessionSync />
        {children}
      </QueryClientProvider>
    </MantineProvider>
  );
}
