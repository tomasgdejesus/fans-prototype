export type WorkerEnv = {
  Bindings: Env & {
    DATABASE_URL?: string;
    BETTER_AUTH_URL?: string;
    BETTER_AUTH_SECRET?: string;
  };
};
