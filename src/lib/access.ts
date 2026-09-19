export type Role = 'OWNER' | 'ADMIN_COMERCIAL' | 'ADMIN_MARKETING' | 'ADMIN_DESENVOLVIMENTO';

export type ModuleName =
  | 'dashboard'
  | 'comercial'
  | 'marketing'
  | 'desenvolvimento'
  | 'financeiro'
  | 'usuarios';

const ACCESS: Record<Role, ModuleName[]> = {
  OWNER: ['dashboard', 'comercial', 'marketing', 'desenvolvimento', 'financeiro', 'usuarios'],
  ADMIN_COMERCIAL: ['dashboard', 'comercial'],
  ADMIN_MARKETING: ['dashboard', 'marketing'],
  ADMIN_DESENVOLVIMENTO: ['dashboard', 'desenvolvimento'],
};

export function canAccess(role: Role, moduleName: ModuleName): boolean {
  return ACCESS[role]?.includes(moduleName) ?? false;
}
