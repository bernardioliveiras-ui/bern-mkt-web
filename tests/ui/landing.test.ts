import { expect, it } from 'vitest';
import { renderLandingPage } from '@/pages';

it('renders BERN MKT landing with portal button and VSL space', () => {
  const html = renderLandingPage(new URL('https://bern-mkt.test/'));
  expect(html).toContain('BERN <span>MKT</span>');
  expect(html).toContain('href="/entrar"');
  expect(html).toContain('Trabalhe de forma inteligente');
  expect(html).toContain('Espaco reservado para VSL');
});
