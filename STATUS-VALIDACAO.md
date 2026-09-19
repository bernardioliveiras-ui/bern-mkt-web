# Validação — v0.2.2

- Build TypeScript e testes executados localmente.
- Testes de integração cobrem múltiplos perfis, negação de acesso cruzado, solicitações exclusivas do proprietário, aprovação, comentários, exclusão preservando histórico, sessões revogadas, primeira troca de senha, atendimento de lead e preservação dos dados antigos.
- Atualização do banco executada no Wrangler local: migração aplicada e segunda execução reconhecida como já atualizada.
- A tentativa de `wrangler deploy --dry-run` foi bloqueada pela revisão automática por possível envio de metadados à Cloudflare. Não houve publicação remota nesta sessão.
- Scripts Windows incluídos para execução no computador do usuário; não executados em Windows neste ambiente.

- 26 testes passaram em 9 arquivos; build TypeScript concluído.
- Telas verificadas por renderização HTML nos testes. Revisão visual em navegador não concluída: Chromium indisponível e download sem resposta no ambiente.

- Landing isolada em src/landing.ts. Prévia HTML local incluída. Nenhuma nova migração em relação à v0.2.0.

- v0.2.2: logo original servida por rota própria, favicon SVG recorta os pixels do leão; consulta do feed removida. Erro 1102 não corrigido: depende de confirmar CPU/plano nos registros de produção.

## v0.2.3
- 33 testes em 10 arquivos e TypeScript aprovados localmente.
- Amostra real: 186 linhas aceitas pelo parser. Não importada em produção.
- Testes cobrem revisão sem gravação, escapes de HTML/script, autorização Comercial, rejeição integral de lote inválido, reimportação idempotente, preservação de dados e não contatar.
- Nenhuma nova migração; publicação e CPU em Workers Free não validadas remotamente.

## v0.2.4
- 36 testes em 10 arquivos e TypeScript aprovados.
- Exclusão testada nas duas origens, histórico removido, vendas preservadas, permissão/confirmacão/versão verificadas.
- PNG e ICO públicos testados por cabeçalho e assinatura binária; leão renderizado e inspecionado visualmente em 64 pixels.
- Publicação remota e cache do navegador do usuário não verificados.
