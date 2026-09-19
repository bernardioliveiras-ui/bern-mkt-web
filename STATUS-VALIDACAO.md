# Status de Validação — BERN MKT Web

Data: 2026-09-18

## Implementado

- Projeto Cloudflare Worker puro configurado, sem Vinext.
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
- `npx wrangler deploy --dry-run` com cache limpo — aprovado, upload Worker puro sem Vinext.
- Validação de clone limpo: `npm ci --ignore-scripts --progress=false && npm test && npm run build && npx wrangler deploy --dry-run` — aprovado.

Observação: o build local exibiu apenas aviso de proxy do ambiente, sem erro de aplicação.

## Deploy

No Cloudflare Workers Builds:

- build: `npm run build`
- deploy: `npm run deploy`

O build esperado no log é `tsc --noEmit`. Se aparecer `vinext build`, a versão antiga ainda está no GitHub/Cloudflare.
