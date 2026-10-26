import type { Auth } from "./auth";

export type AuthSession = Auth["$Infer"]["Session"];

export type WorkerEnv = {
  Bindings: Env & {
    DATABASE_URL?: string;
    BETTER_AUTH_URL?: string;
    BETTER_AUTH_SECRET?: string;
  };
  Variables: {
    session: AuthSession | null;
  };
};
