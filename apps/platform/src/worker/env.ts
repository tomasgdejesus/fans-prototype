import type { Auth } from "./auth";
import type { EmailBindings } from "./email/config";

export type AuthSession = Auth["$Infer"]["Session"];

export type WorkerEnv = {
  Bindings: Env & EmailBindings & {
    DATABASE_URL?: string;
    BETTER_AUTH_URL?: string;
    BETTER_AUTH_SECRET?: string;
  };
  Variables: {
    session: AuthSession | null;
  };
};
