import { Hono } from "hono";
import type { WorkerEnv } from "./env";

export const app = new Hono<WorkerEnv>();

export default app;
