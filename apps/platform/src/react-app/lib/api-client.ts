import { hc } from "hono/client";
import type { AppType } from "../../worker/app";

// Same-origin requests work in Vite development and the deployed Worker.
export const apiClient = hc<AppType>("/");
