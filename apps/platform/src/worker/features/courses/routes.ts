import { Hono } from "hono";
import type { WorkerEnv } from "../../env";

export const coursesRoutes = new Hono<WorkerEnv>();

export default coursesRoutes;
