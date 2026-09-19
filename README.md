# BERN MKT Web — CRM v0.2.1

Landing reformulada + gestão interna por setores. Prévia disponível em PREVIA-LANDING.html.

Comece por **LEIA-PRIMEIRO.md**. No Windows, execute **ATUALIZAR-CRM.bat**.

Recursos: usuários com múltiplas áreas, cadastro/edição/desativação/exclusão pelo proprietário, solicitações aos setores, tarefas internas, comentários, histórico, progresso, aprovação, visão por setor e fichas comerciais com retorno e demonstração.

## Desenvolvimento

Node >=22.13.0.

```sh
npm ci
npm run db:update:local
npm run dev
```

## Atualização existente

```sh
npm run build
npm run db:update
npm run deploy
```

O atualizador verifica o schema real, preserva os dados e exporta uma cópia antes de aplicar a migração. Não reaplique `0001_initial.sql` em banco já existente. Não misture execução manual das migrações com o mecanismo antigo `d1 migrations apply`.

## Cloudflare / GitHub

Build command: `npm run build`
Deploy command: `npm run deploy`
Root directory: `/`
Entry point: `src/worker.ts`
Binding do banco: `DB`

Atualize o banco antes de publicar. Sincronize o repositório externo para que o próximo deploy não restaure a versão antiga.

## Verificações

`npm test` executa os testes de permissões, fluxos HTTP, migração, tarefas, usuários, captura e acompanhamento de leads. `npm run build` verifica TypeScript. Testes de integração usam SQLite real em memória com adaptador D1; não acessam produção.
