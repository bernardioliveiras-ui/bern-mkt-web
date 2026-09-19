import { expect, it } from 'vitest';
import { canAccess } from '@/lib/access';
it('combines sector access without granting owner capabilities', () => {
  const roles = ['ADMIN_COMERCIAL', 'ADMIN_MARKETING'] as any;
  expect(canAccess(roles, 'comercial')).toBe(true);
  expect(canAccess(roles, 'marketing')).toBe(true);
  expect(canAccess(roles, 'desenvolvimento')).toBe(false);
  expect(canAccess(roles, 'usuarios')).toBe(false);
  expect(canAccess(roles, 'financeiro')).toBe(false);
});
it('fails closed for unrecognized roles', () => {
  expect(canAccess(['invalid'] as any, 'marketing')).toBe(false);
});
