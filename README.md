# BERN MKT Web

Landing SEO e painel interno para operação comercial do BERN MKT.

## O que tem

- Landing pública com o topo `BERN MKT` e botão `Acesse Portal`.
- Hero com `Trabalhe de forma inteligente`.
- Espaço reservado para VSL.
- Formulário público para capturar leads.
- Portal interno em `/entrar`.
- Painel com Comercial, Marketing, Desenvolvimento, Financeiro e Usuários.
- Financeiro e usuários pensados para acesso Owner.
- Script PowerShell para criar acessos no D1.

## Cloudflare

Use no Workers Builds:

```txt
Build command:
npm run build

Deploy command:
npm run deploy

Root directory:
/
```

Este pacote agora roda como Cloudflare Worker puro em TypeScript. No log correto do Cloudflare, o build deve mostrar:

```txt
> bern-mkt-web@0.1.0 build
> tsc --noEmit
```

Se aparecer `vinext build`, o GitHub ainda está com a versão antiga.

## D1

Crie o banco:

```powershell
npx wrangler d1 create bern-mkt-web
```

Cole o `database_id` retornado no `wrangler.jsonc`.

Depois aplique as migrations:

```powershell
npm run db:migrate
```

Se quiser aplicar pelo painel da Cloudflare, abra o D1, entre no console/studio do banco e cole o conteúdo de `migrations/0001_initial.sql`.

## Criar acesso pelo PowerShell

Depois de `npm install` e `npx wrangler login`:

```powershell
.\scripts\criar-acesso.ps1 -Nome "Guedes" -Usuario "guedes" -Senha "Senha@2026" -Perfil OWNER
```

Perfis aceitos:

```txt
OWNER
ADMIN_COMERCIAL
ADMIN_MARKETING
ADMIN_DESENVOLVIMENTO
```

Para banco local:

```powershell
.\scripts\criar-acesso.ps1 -Nome "Teste" -Usuario "teste" -Senha "Senha@2026" -Perfil ADMIN_COMERCIAL -Local
```

## Validação local

```bash
npm test
npm run typecheck
npm run build
```
