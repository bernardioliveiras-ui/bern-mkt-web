import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('project configuration', () => {
  it('uses plain Cloudflare Worker deployment scripts', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    expect(pkg.scripts.build).toBe('tsc --noEmit');
    expect(pkg.scripts.deploy).toBe('npx wrangler deploy');
  });

  it('uses DB as the D1 binding', () => {
    const wrangler = readFileSync('wrangler.jsonc', 'utf8');
    expect(wrangler).toContain('"binding": "DB"');
    expect(wrangler).toContain('"main": "./src/worker.ts"');
  });
});
