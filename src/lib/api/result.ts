export type DBResult<T, E extends string> =
  | {
      ok: false;
      code: E;
      error: string;
      detail?: unknown;
    }
  | ({ ok: true } & T);
