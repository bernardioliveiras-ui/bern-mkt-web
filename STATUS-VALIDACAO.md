# Status de Validação — BERN MKT Web

Data: 2026-09-18

## Implementado

- Projeto Cloudflare/Vinext configurado.
- Landing SEO com VSL placeholder.
- Captura pública de leads para D1.
- Portal interno com módulos principais.
- Perfis e permissões base.
- Comercial, Marketing, Desenvolvimento, Financeiro e Usuários.
- Script `scripts/criar-acesso.ps1`.
- Schema D1 em `migrations/0001_initial.sql`.

## Validação

- `npm test` — 6 arquivos, 9 testes, aprovado.
- `npm run typecheck` — aprovado.
- `npm run build` — aprovado.

Observação: o build local exibiu apenas aviso de proxy do ambiente, sem erro de aplicação.

## Deploy

No Cloudflare Workers Builds:

- build: `npm run build`
- deploy: `npm run deploy`

Não usar `npx wrangler deploy` diretamente.
