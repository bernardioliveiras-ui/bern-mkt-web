export async function getDb(): Promise<D1Database> {
  const mod = await import('cloudflare:workers');
  return mod.env.DB;
}
