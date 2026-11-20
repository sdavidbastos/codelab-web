# F05 — atividades por turma

Integração da API B09 ao React em 20 de novembro de 2026. O professor vincula
uma versão publicada de um exercício a uma turma e controla sua abertura e
encerramento. Alunos com matrícula ativa consultam atividades abertas e encerradas.

## Abrir e testar

Com o backend B09 iniciado, execute `./scripts/web up` e abra
**http://localhost:5173/#/turmas**. Judge0 não é necessário para esta etapa.

1. Entre como professor e abra uma turma sua. A seção **Atividades da turma**
   permite buscar pelo título, filtrar estado e paginar os resultados do servidor.
2. Clique em **Nova atividade**. Preencha título e orientações opcionais;
   escolha um exercício e uma versão publicada. Busca e paginação também estão
   disponíveis nos exercícios e no histórico de publicações.
3. Exercícios nunca publicados ficam desabilitados. Um exercício em revisão
   continua permitindo escolher suas publicações anteriores. A seleção envia o
   UUID da versão, preservando o contrato escolhido mesmo após novas publicações.
4. Clique em **Criar atividade**. O detalhe mostra o **Rascunho**, ainda invisível
   para alunos. Título, orientações e vínculo são definidos na criação; B09 não
   oferece edição ou exclusão de atividades.
5. **Abrir atividade** disponibiliza o conteúdo para a turma após confirmação.
6. Entre como aluno matriculado e abra a mesma turma. A atividade apresenta
   enunciado, código inicial, limites, regra de comparação e somente casos públicos.
7. O professor pode **Encerrar atividade**, confirmando o encerramento definitivo.
   A atividade não pode ser reaberta; seu conteúdo permanece consultável enquanto
   a matrícula estiver ativa. Revogação da matrícula retira o acesso na próxima consulta.

O botão **Atualizar atividade** consulta o estado atual por GET. Datas e estados
vêm da API. Esta etapa oferece consulta de conteúdo; envio de soluções,
tentativas e avaliação pertencem às próximas tarefas B10–B13. A prática livre
continua independente das atividades.

## Contrato e implementação

- `features/activities` contém os contratos validados em runtime, a lista por
  turma, criação, seleção de versão e detalhe com ações do ciclo de vida.
- Rotas: turma existente `#/turmas/:id`, criação docente
  `#/turmas/:id/atividades/nova` e detalhe `#/atividades/:id` para ambos os papéis.
- Lista/criação consomem `/api/classrooms/:id/activities`; detalhe e ações usam
  `/api/activities/:id`, `/open` e `/close`. O seletor usa somente resumos de
  `/api/questions` e `/api/questions/:id/versions`, sem baixar conteúdo de autoria.
- O detalhe consome a projeção pública própria da B09. Reutiliza
  `StudentQuestionVersion` e `QuestionPreview` da F04, sem solicitar a versão
  docente ou a prévia restrita ao professor. Alunos não consultam endpoints de
  exercícios nem matrículas. A API autoriza cada recurso e filtra os dados.
- Parsers rejeitam estados/datas incoerentes, campos extras nos resumos de
  atividade e conteúdo de autoria/motor na projeção pública. Não há contagens
  ocultas, casos privados em storage ou import de modelos/fontes do backend.
- Sessão, CSRF, cancelamento e consultas por ator/caminho seguem os hooks
  existentes. Nenhuma escrita tem retry automático. Criação bloqueia duplicação,
  edição e navegação enquanto pendente; erros preservam campos e seleção.
  Sair com alterações pede confirmação.
- Após perda de confirmação, a criação orienta consultar as atividades da turma;
  ações de abertura/encerramento permitem consultar o mesmo ID por GET. Respostas
  das ações são resumos: a tela atualiza seus metadados mantendo o conteúdo da
  versão pública imutável já consultada. Novas consultas continuam disponíveis.
- Conteúdo é texto React, sem interpretação de HTML. Dialogs têm confirmação,
  Escape e restauração de foco; estados usam texto além de cor. Layout validado
  em 1440×1000 e 390×844, sem overflow horizontal.

## Verificação

```bash
npm run format:check
npm run build
npm test
npm run test:activities:real
```

A suíte normal inclui **85 testes com API simulada**, sendo **16 novos F05**:
criação/UUID/CSRF, raiz em revisão, paginação, filtros, troca de seleção,
proteção de alterações, envio pendente, falhas sem reenvio, retomada GET,
contrato inválido, sessão expirada, papéis, revogação, texto hostil e mobile.
As fixtures antigas de turmas agora respondem com lista vazia de atividades;
resumos simulados de exercícios/versões refletem os campos reais da API.

O teste real executa **um fluxo completo** navegador → proxy Vite → NestJS B09 →
PostgreSQL descartável: turma/matrícula, versões 1 e 2 com raiz novamente em
rascunho, criação visual vinculando v1, rascunho invisível ao aluno, abertura,
leitura pública sem dados ocultos no JSON/DOM, encerramento persistido após
reload, tentativa de reabertura negada e perda de acesso após revogar matrícula.
A preparação das versões usa HTTP real; todas as novas ações F05 usam a interface.
Não há interceptação de API nesse fluxo.

O runner exige Node 24, Docker, checkout `../codelab-api` e portas 3006/5176
livres. Usa somente TEST_DATABASE_URL e PostgreSQL/tmpfs próprios, contas
sintéticas temporárias e limpeza ao final, com traces reais desativados.
Executar separadamente dos testes reais de turmas/exercícios, que compartilham
as portas. Não usa banco de desenvolvimento ou execução Judge0.

Evidências: [F05.json](evidencias/F05.json),
[turma desktop](evidencias/F05-turma-desktop.png),
[criação móvel](evidencias/F05-criacao-mobile.png) e
[atividade móvel](evidencias/F05-atividade-mobile.png).
As capturas contêm somente fixtures sintéticas, incluindo texto hostil de teste.
Entrega registrada em commit local próprio, sem novo push nesta etapa. Próxima API: B10, adapter HTTP.
