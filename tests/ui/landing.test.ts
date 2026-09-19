import { expect, it } from 'vitest';
import { renderLandingPage } from '@/pages';

it('keeps the public lead form connected to the CRM and portal', () => {
  const html = renderLandingPage(new URL('https://bern-mkt.test/'));
  expect(html).toContain('BERN <span>MKT</span>');
  expect(html).toContain('href="/entrar"');
  expect(html).toContain('action="/api/public/leads"');
  for (const field of ['name','whatsapp','segment','message']) expect(html).toContain('name="'+field+'"');
  expect(html).toContain('method="post"');
  expect(html).not.toContain('Espaco reservado para VSL');
});

it('shows feedback after submitting the demonstration request', () => {
  const html=renderLandingPage(new URL('https://bern-mkt.test/?ok=1'));
  expect(html).toContain('role="status"');
  expect(html).toContain('Contato recebido.');
});
