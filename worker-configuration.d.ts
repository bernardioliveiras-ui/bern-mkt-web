interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(): Promise<T | null>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean; meta: Record<string, unknown> }>;
}

interface D1Database {
  batch(statements: D1PreparedStatement[]): Promise<{ success: boolean; meta: Record<string, unknown> }[]>;
  prepare(query: string): D1PreparedStatement;
}

interface Env {
  DB: D1Database;
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

declare module 'cloudflare:workers' {
  export const env: Env;
}
