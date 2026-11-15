# F03 — autoria de exercícios e histórico de versões

Entrega local de 14 de novembro de 2026. Integra o contrato B07 do NestJS à
interface React existente, antes da B08, a pedido do usuário.

## Uso

Com a API B07 ativa, execute `./scripts/web up` e abra
**http://localhost:5173/#/exercicios**. Entre com uma conta de professor já
provisionada. A navegação autenticada tem a aba **Exercícios**. Judge0 só é
necessário para executar programas na prática livre.

- A lista mostra exercícios do autor, com busca pelo título, filtro de estado,
  contagem de casos, última publicação e paginação da API.
- **Novo exercício** abre o formulário de título, enunciado, objetivo, descrições
  de entrada/saída, restrições, código inicial Python, limites e até 20 casos públicos.
- **Salvar rascunho** cria/atualiza o registro. Entradas e saídas vazias são válidas;
  os espaços e quebras de linha dos casos são preservados.
- **Publicar versão N** exige conteúdo salvo e ao menos um caso, abre confirmação
  e usa o endpoint de publicação. O conteúdo publicado aparece somente para leitura.
- **Abrir novo rascunho** prepara a revisão. Publicações anteriores continuam
  disponíveis no histórico paginado e na página individual de versão.
- **Excluir rascunho** só aparece para registros sem publicação anterior e pede
  confirmação. Um exercício com histórico não oferece esse controle.

Rotas: `#/exercicios`, `#/exercicios/novo`, `#/exercicios/:uuid` e
`#/exercicios/:uuid/versoes/:numero`. Alunos recebem uma indicação de área docente,
sem consulta aos endpoints de exercícios. A API continua responsável por autorizar
papel e autoria, inclusive em links diretos e totais.

Publicar não distribui o exercício para turmas. F03 não cria atividades, casos
ocultos, envio de solução ou nota. Os limites preservados no exercício serão
consumidos pela avaliação futura e não alteram os limites fixos da prática E01.
O catálogo local de prática é independente dos exercícios docentes.

## Implementação

`features/questions` reúne contratos públicos, lista, formulário, prévia e
histórico. JSON é validado em runtime: identidade, metadados, conteúdo, linguagem,
limites, ordem dos casos e envelopes de paginação. Não há import do backend.

O transporte continua exclusivamente em `/api`, com cookie HttpOnly gerenciado
pelo navegador e CSRF em memória. Consultas têm cancelamento e chave por ator e
caminho. Hooks compartilhados de consultas/mutações ficam em `features/auth/hooks`;
o parser de paginação foi extraído para `shared/api/page`.

O CodeMirror agora é compartilhado em `shared/ui/CodeEditor`: a prática conserva
atalho de execução e ajuda de teclado; o formulário usa rótulo próprio e bloqueia
edição durante salvamento. Conteúdo e código são texto, sem interpretação de HTML.

O formulário compara seu estado ao último conteúdo salvo. Navegação por hash,
logout e saída da página protegem alterações pendentes; salvamento em andamento
bloqueia navegação interna e novos envios. Sucesso de criação leva ao detalhe sem
um pedido indevido de descarte. O rascunho de autoria não fica em localStorage:
até salvar no servidor, seu conteúdo existe somente na memória da página.

Falhas preservam campos/código e não repetem POST/PATCH automaticamente. Perda
de confirmação orienta consultar os dados antes de reenviar. Erros 409 têm
mensagens do contexto; 401 retira a visão privada. Publicação/exclusão usam dialog
nativo, com Escape, bloqueio durante envio e restauração de foco ao cancelar.

## Verificação

- TypeScript estrito, build Vite, formatação e sintaxe do runner aprovados.
- **53 testes Playwright com API simulada:** 21 de prática, 18 de login/turmas e
  14 de exercícios. Incluem criar/editar/publicar duas versões, histórico anterior
  preservado, CSRF, casos vazios/duplicados, limites, exclusão, busca/paginação,
  edição não salva, envio pendente, falha sem retry, contrato inválido, expiração,
  acesso discente, conteúdo hostil como texto e layout móvel.
- **1 fluxo real de exercícios**, navegador → proxy Vite → NestJS B07 → PostgreSQL
  descartável: criação com UTF-8, código e limites; reload; duas publicações;
  leitura da versão original e comparação com a nova; acesso discente negado pelo
  servidor; logout. Sem interceptação de API ou execução Judge0.
- **1 regressão real de turmas**, na mesma infraestrutura descartável, cobrindo
  criação/edição, matrícula, revogação/reativação e sessões docente/discente.
- Capturas desktop e móvel inspecionadas; viewport de 390 px sem overflow horizontal.
  A prévia integrada não estava disponível; a inspeção visual usou o navegador de teste.

```bash
npm run format:check
npm run build
npm test
npm run test:questions:real
npm run test:classrooms:real
```

Os comandos reais exigem Node 24, Docker, `../codelab-api` com B07 (ou
`CODELAB_API_CHECKOUT` explícito) e portas locais 3006/5176 livres. Executar
separadamente: o runner compartilhado `scripts/test-classrooms-real` aceita a
suíte opcional `questions`. A configuração de origem/CSRF aponta para o proxy de
teste; o PostgreSQL usa tmpfs e TEST_DATABASE_URL exclusivamente descartável.
Contas e credenciais são sintéticas/temporárias, removidas com a stack ao final.
Traces reais ficam desativados para não registrar credenciais. Não usa volumes
nem banco de desenvolvimento. Evidência de frontend não substitui testes de
isolamento do executor ou validação pedagógica.

Evidências: [F03.json](evidencias/F03.json), [editor desktop](evidencias/F03-editor-desktop.png),
[editor móvel](evidencias/F03-editor-mobile.png), [versão móvel](evidencias/F03-versao-mobile.png).
Entrega registrada em commit local próprio, sem publicação remota.
A próxima tarefa do backend permanece B08.
