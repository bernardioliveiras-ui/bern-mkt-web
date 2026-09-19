import { describe, expect, it } from 'vitest';
import { canAccess } from '@/lib/access';

describe('role access', () => {
  it('keeps finance owner-only', () => {
    expect(canAccess('OWNER', 'financeiro')).toBe(true);
    expect(canAccess('ADMIN_COMERCIAL', 'financeiro')).toBe(false);
    expect(canAccess('ADMIN_MARKETING', 'financeiro')).toBe(false);
    expect(canAccess('ADMIN_DESENVOLVIMENTO', 'financeiro')).toBe(false);
  });

  it('routes admins to their own work areas', () => {
    expect(canAccess('ADMIN_COMERCIAL', 'comercial')).toBe(true);
    expect(canAccess('ADMIN_MARKETING', 'marketing')).toBe(true);
    expect(canAccess('ADMIN_DESENVOLVIMENTO', 'desenvolvimento')).toBe(true);
  });
});
