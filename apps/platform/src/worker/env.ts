export type WorkerEnv = {
  Bindings: Env & {
    DATABASE_URL?: string;
  };
};
