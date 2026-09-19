import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('PowerShell access script', () => {
  it('creates or updates users with approved roles and forced password change', () => {
    const script = readFileSync('scripts/criar-acesso.ps1', 'utf8');
    expect(script).toContain('[ValidateSet("OWNER", "ADMIN_COMERCIAL", "ADMIN_MARKETING", "ADMIN_DESENVOLVIMENTO")]');
    expect(script).toContain('bcryptjs');
    expect(script).toContain('d1 execute $Database $scope --file $sqlFile');
    expect(script).toContain('$LASTEXITCODE -ne 0');
    expect(script).toContain('INSERT INTO user_roles');
    expect(script).toContain('ON CONFLICT(username) DO UPDATE');
    expect(script).toContain('must_change_password');
    expect(script).toContain("'ATIVO'");
  });
});
