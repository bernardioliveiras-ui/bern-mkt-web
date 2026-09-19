export const ROLES = ['OWNER', 'ADMIN_COMERCIAL', 'ADMIN_MARKETING', 'ADMIN_DESENVOLVIMENTO'] as const;
export type Role = typeof ROLES[number];
export type ModuleName = 'dashboard' | 'comercial' | 'marketing' | 'desenvolvimento' | 'financeiro' | 'usuarios';
export const ROLE_LABELS: Record<Role, string> = { OWNER:'Proprietário', ADMIN_COMERCIAL:'Comercial', ADMIN_MARKETING:'Marketing', ADMIN_DESENVOLVIMENTO:'Desenvolvimento' };
const ACCESS: Record<Role, ModuleName[]> = {
  OWNER: ['dashboard', 'comercial', 'marketing', 'desenvolvimento', 'financeiro', 'usuarios'],
  ADMIN_COMERCIAL: ['dashboard', 'comercial'],
  ADMIN_MARKETING: ['dashboard', 'marketing'],
  ADMIN_DESENVOLVIMENTO: ['dashboard', 'desenvolvimento'],
};
export function canAccess(role: Role | Role[], moduleName: ModuleName): boolean {
  return (Array.isArray(role) ? role : [role]).some(r => ACCESS[r]?.includes(moduleName) ?? false);
}
export function isOwner(user: { role: Role; roles?: Role[] }): boolean {
  return (user.roles ?? [user.role]).includes('OWNER');
}
export async function getRoles(db: D1Database, user: {id: number; role: Role}): Promise<Role[]> {
  const rows = (await db.prepare('SELECT role FROM user_roles WHERE user_id = ?').bind(user.id).all<{role: Role}>()).results;
  return rows.length ? rows.map(r => r.role) : [user.role];
}
