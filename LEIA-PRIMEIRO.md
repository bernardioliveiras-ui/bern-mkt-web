# BERN CRM v0.2.4 — excluir lead e favicon

Publique o pacote completo. No GitHub envie o conteúdo da pasta na raiz que já contém package.json (versão 0.2.4), src e wrangler.jsonc. Alternativamente execute ATUALIZAR-CRM.bat na pasta extraída.

## Excluir lead

Comercial → Atender → Excluir lead → digitar EXCLUIR → Excluir definitivamente. Funciona para formulário e lista fria. Proprietário e usuários com acesso ao Comercial podem excluir. O cadastro e seu histórico são apagados definitivamente; vendas existentes são preservadas sem vínculo com o lead. Uma ficha alterada por outra pessoa precisa ser reaberta antes de excluir.

O número excluído pode voltar por nova importação ou formulário. Para manter a orientação de não abordar, conserve o cadastro em Não contatar.

## Ícone do leão

Favicon PNG de 64 pixels com endereço novo e fallback /favicon.ico com tamanhos 16, 32, 48 e 64. Renderizado a partir do recorte SVG da logo original. Sem letras. Depois de publicar, feche a aba e reabra o site. O navegador pode guardar o favicon antigo; teste também uma janela anônima. Abrir /favicon-v024.png no seu domínio deve mostrar o leão; se não aparecer, confirme que o deploy publicou a versão 0.2.4.

Não há nova migração. Todas as funções anteriores estão incluídas. O erro 1102 do login no plano gratuito permanece pendente, conforme combinado.

# BERN CRM v0.2.3 — listas frias no Comercial

## Importar

1. Publique esta versão usando ATUALIZAR-CRM.bat ou atualize os arquivos na raiz do GitHub conectado ao Cloudflare. Confirme 0.2.3 no package.json.
2. Entre com proprietário ou Comercial e clique em **Comercial → Importar lista**.
3. Dê um nome à lista, informe o segmento e escolha um responsável (opcional).
4. Selecione o CSV ou cole os telefones. Use uma opção por vez.
5. Clique em **Revisar lista**, confira os nomes, telefones e linhas rejeitadas. Nada é salvo nessa etapa.
6. Clique em **Confirmar importação**. Aguarde o resumo de novos contatos e números já cadastrados.
7. No Comercial, filtre **Origem → Prospecção fria**, e use o nome exato da lista para localizar seu lote.

Aceita CSV com Nome,Numero, nomes opcionais, cabeçalho Telefone/WhatsApp/Celular ou uma única coluna de números sem cabeçalho. Vírgula, ponto e vírgula e tabulação são aceitos. UTF-8 e Windows-1252 são lidos. Não aceita o arquivo Excel .xlsm diretamente: exporte a aba em CSV, como na amostra enviada.

Use DDD. O importador padroniza telefones brasileiros com 55, mantém DDDs diferentes e gera Contato + últimos quatro dígitos quando o nome está vazio. Validação de formato não confirma linha ativa ou WhatsApp. Limite por arquivo: 1.000 linhas / 250 KB. Para listas maiores, divida o arquivo.

O salvamento usa lotes de 20. Se interromper, lotes já confirmados permanecem; reimportar ignora números existentes. Contatos anteriores não recebem novos nomes, responsáveis, etapas ou anotações. Números existentes permanecem na lista/origem anterior. Um contato pertence à sua origem inicial; esta versão não cria múltiplas associações de listas.

A importação não envia mensagens nem faz ligações. Na ficha, atualize nome, responsável, etapa e retorno. **Não contatar** oculta ações de ligação/WhatsApp e retira o contato da fila de retornos; novas importações não sobrescrevem seu cadastro. Os históricos continuam preservados.

Não há nova migração de banco em relação à v0.2.2. O login atual foi mantido por sua escolha; o erro 1102 do Workers Free permanece pendente. Esta atualização não foi publicada remotamente por nós.

A amostra enviada foi lida pelo mesmo importador: 186 contatos aceitos, nenhum repetido ou fora do formato. O CSV pessoal não está embutido no código, no ZIP nem enviado ao banco; selecione-o no painel para importar.

# BERN CRM v0.2.2

Logo original na LP, no login e no painel. Favicon com apenas o leão, sem letras. O bloco “Últimas atualizações” e sua consulta foram retirados da visão geral. Os históricos individuais foram preservados. Não há nova migração nesta versão.

## Erro 1102 no login — diagnóstico pendente na conta

O login usa bcryptjs para verificar as senhas existentes. Na medição local com custo 12, uma senha incorreta consumiu aproximadamente 366 ms de CPU. Esse número não é uma medição do servidor de produção. O Workers Free permite 10 ms de CPU por requisição; o erro pode ocorrer antes de responder “senha inválida”. Remover o bloco do painel não corrige o processamento do login.

Esta versão habilita observabilidade. Após publicar, abra os registros do Worker no Cloudflare, reproduza o erro e confira o resultado (exceededCpu ou exceededMemory), o tempo de CPU e o plano Workers da conta. Compartilhe somente esses dados, sem senhas ou cookies.

Se confirmado exceededCpu no plano Free, manter o bcrypt atual exige hospedagem com orçamento de CPU compatível (por exemplo Workers Paid, com cobrança) ou mudança da arquitetura de autenticação. Não reduzimos o custo das senhas, não redefinimos contas e não ativamos plano pago. O erro 1102 ainda não está corrigido nem validado remotamente.

Referência: https://developers.cloudflare.com/workers/platform/limits/

## Publicação pelo GitHub

Envie o CONTEÚDO da pasta extraída para a raiz usada pela compilação. package.json, wrangler.jsonc e src devem estar no mesmo nível do projeto anterior. Confirme versão 0.2.2 em package.json e presença de src/brand.ts e src/landing.ts. O build é npm run build e a publicação é npm run deploy. Enviar uma pasta dentro do repositório pode deixar a compilação apontando para os arquivos antigos.

## Instruções de atualização

## Nova landing page

Abra **PREVIA-LANDING.html** com dois cliques para conferir a página no navegador, sem publicar. A prévia é visual: formulário e portal funcionam somente no site publicado.

A v0.2.1 reformula a apresentação pública: fundo claro, identidade vermelha, explicação da rotina, dúvidas frequentes e convite para demonstração. A VSL provisória foi retirada. O formulário continua enviando leads ao Comercial. As funções do CRM da v0.2.0 estão incluídas. Os textos das telas também foram revisados: nomes amigáveis para etapas, prioridades e situações; sem referências técnicas de instalação.

Se já aplicou a v0.2.0, não há nova alteração de banco: o atualizador reconhece a estrutura existente. Se ainda usa a versão anterior, o pacote inclui a atualização do CRM.

## Atualizar no Windows

1. Extraia o ZIP em uma nova pasta. Não execute dentro do ZIP.
2. Abra a pasta `bern-mkt-web-main` e execute **ATUALIZAR-CRM.bat** com dois cliques.
3. Entre na mesma conta Cloudflare do banco/site quando o navegador abrir.
4. O instalador instala as dependências, verifica o código, salva uma cópia do banco em `backups` e aplica a atualização sem apagar os registros.
5. Quando perguntar se deseja publicar, digite **S**. Aguarde a confirmação do Wrangler. Se houver erro, o processo para: envie a mensagem, não apague o banco.
6. Abra seu portal e atualize com Ctrl + F5. Entre com seu usuário de proprietário. Se pedir troca da senha inicial, conclua e entre novamente.

O projeto usa o banco já configurado: `2992456d-c820-4358-98cc-413c746d3907`, binding `DB`, Worker `bern-mkt-web`. Confira esses dados em `wrangler.jsonc` antes de executar caso tenha mudado de conta/banco.

Não recrie as tabelas nem execute a migração 0001 no seu banco existente. O instalador distingue banco novo, existente e já atualizado. Reexecutar o instalador em uma atualização completa é permitido. Uma estrutura parcialmente atualizada faz o processo parar para revisão.

**Se publica pelo GitHub:** substitua também os arquivos do repositório pela nova versão (inclusive `src`, `scripts`, `migrations`, `package.json` e `package-lock.json`). Não envie `node_modules`, `.wrangler`, `backups`, `.env` ou `.dev.vars`. Caso contrário, um próximo deploy do GitHub poderá restaurar o código antigo. A atualização do banco deve ocorrer antes do deploy do código novo.

## Alternativa pelo terminal

Abra o terminal na pasta extraída, onde está `package.json`. Execute um comando por vez:

```powershell
npm.cmd ci
npm.cmd run build
node node_modules/wrangler/bin/wrangler.js login
node scripts/atualizar-banco.mjs
npm.cmd run deploy
```

Execute o próximo somente se o anterior terminar sem erro. Este caminho não usa scripts PowerShell e não exige alterar sua política de execução.

## Vinicius: Comercial + Marketing

Entre como proprietário → **Usuários** → abra o cadastro de Vinicius → marque **Comercial** e **Marketing** → deixe **Proprietário** desmarcado → **Salvar usuário**. Ele precisa entrar novamente para ver os dois menus. Deixe a nova senha vazia para preservar a atual.

## Usuários pelo painel

- Cadastrar: nome, login, senha inicial e uma ou mais áreas.
- Proprietário: acesso a todas as áreas, Financeiro e gestão de usuários.
- Desativar: escolher Desativado e salvar. A pessoa perde o acesso; pode ser reativada.
- Excluir: abrir “Excluir usuário”, digitar o login exato e confirmar. A conta e as sessões são apagadas. Leads, vendas, tarefas e históricos permanecem; atribua novos responsáveis onde necessário.
- Sua própria conta não pode ser excluída nem perder o acesso de proprietário ativo.
- Alterações de cadastro/permissões encerram as sessões do usuário. Redefinir senha obriga troca no próximo login.

## Solicitações e tarefas internas

- Na Visão geral, o proprietário cria uma solicitação e escolhe Comercial, Marketing ou Desenvolvimento.
- Na ficha, define responsável, prioridade e prazo e conversa por comentários. Links dos materiais podem ser colados na mensagem.
- O setor recebe a solicitação no seu quadro, atualiza progresso e responsável e envia para Revisão/Teste.
- O proprietário aprova escolhendo Concluído/Finalizado. Para pedir ajustes, comenta e retorna a etapa para andamento.
- Cada setor pode criar tarefas internas nas próprias áreas e concluí-las; não pode enviar solicitações de gestão nem acessar setores não autorizados.
- Nas solicitações concluídas, somente o proprietário pode reabrir. Comentários continuam disponíveis.
- Todos com acesso ao setor veem seu quadro. “Minhas tarefas” filtra por responsável; não cria sigilo individual.
- Progresso é informado manualmente pela equipe. A visão geral mostra a média, concluídas, atrasos e solicitações em revisão. Não representa medição automática de horas ou produtividade.
- As atualizações aparecem ao recarregar/navegar no painel. Não há envio automático por WhatsApp/e-mail nem chat em tempo real.

## Comercial

- O formulário da landing mantém os leads existentes e novos.
- “Atender” abre mensagem original, origem, telefone e ficha de acompanhamento.
- WhatsApp abre a conversa; “Ligar” usa o aplicativo de chamadas disponível no dispositivo. O envio e a ligação são manuais.
- Selecione etapa, responsável, demonstração, próximo retorno, notas e motivo de perda quando aplicável.
- Os horários de demonstração e retorno são de São Paulo. Retornos vencidos aparecem no filtro e no resumo; não geram notificação externa.
- Cada salvamento registra autor, data e dados de atendimento no histórico. Atualizações concorrentes são recusadas para evitar sobreposição.
- Fechado identifica uma oportunidade ganha; não confirma pagamento, não emite licença e não cria automaticamente um registro financeiro.

## O que esta entrega preserva

Dados, senhas e perfis originais são migrados. A landing pública foi reformulada na v0.2.1, preservando a captura de leads. O aplicativo Android não foi alterado. Exclusão de usuário não exclui registros comerciais ou trabalho dos setores.

O script `criar-acesso.ps1` também foi corrigido para envio do SQL por arquivo, verificação de erro e suporte a vários perfis, mas o painel é o caminho recomendado para gerenciar contas.

## Requisitos e validação

Node.js 22.13 ou superior (seu Node 22.16 atende), internet para instalar dependências e acesso à conta Cloudflare correta. O `.bat` destina-se ao Windows; esta entrega foi testada em ambiente Linux com SQLite e Wrangler local. A publicação remota precisa ser executada na sua conta.

Para validar: `npm test` e `npm run build`.
