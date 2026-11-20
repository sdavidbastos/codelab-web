# F04 — visibilidade dos casos e prévia do aluno

Integração da B08 ao React, em 19 de novembro de 2026. Mantém a autoria,
publicação e histórico F03 e acrescenta os controles de casos públicos/ocultos.

## Abrir e testar

É necessário o backend B08 ativo. Execute `../codelab-api/scripts/api up` e,
neste repositório, `./scripts/web up`. Abra **http://localhost:5173/#/exercicios**
e entre como professor. Judge0 não é necessário para esta funcionalidade.

1. Crie um exercício ou abra um rascunho existente.
2. Em **Casos de teste**, use **Adicionar caso**. O padrão é Público; selecione
   **Oculto — apenas para o professor** quando necessário. Cada caso tem indicação
   textual de visibilidade, além da cor, e a bateria mostra as duas contagens.
3. Preencha entrada, saída esperada e explicação. Strings vazias são válidas;
   não repita a mesma entrada entre casos, mesmo com visibilidades diferentes.
4. **Salvar rascunho** grava todos os casos com visibilidade explícita. Publicar
   exige ao menos um caso público salvo; alterar a seleção gera edição não salva.
5. **Publicar versão** confirma também quantos casos são públicos e ocultos.
6. No exercício publicado ou no detalhe de uma versão do histórico, abra
   **Prévia do aluno**. Ela mostra somente o conteúdo da versão e casos públicos
   retornados pela projeção da API. Voltar à versão docente recupera a visão completa.

A prévia é uma ferramenta do professor autor, não uma sessão ou atividade de aluno.
Ela não representa o rascunho: para mostrar mudanças, publique outra versão.
Versões anteriores preservam sua própria visibilidade, mesmo quando um caso
oculto passa a público em uma revisão. A distribuição às turmas depende da B09.

O limite continua sendo 20 casos no total. Listas e histórico docente mostram
**casos de teste**, pois a contagem da API inclui públicos e ocultos.

## Comparação

O formulário e as versões mostram **Comparação das saídas**, explicando a política
textual B08. A única política atual é `judge0_text_rstrip_v1`; o cliente envia esse
identificador e rejeita outro valor no JSON de resposta. A interface não julga
programas nem implementa outro comparador. A prévia usa a descrição da API.

Espaços ASCII ao final das linhas/saída são ignorados; espaços iniciais/internos,
maiúsculas, acentos e representações numéricas continuam significativos.
O exemplo visual destaca que `7` e `7.0` são diferentes. A definição técnica
completa permanece no contrato B08 do backend.

## Contrato e privacidade

`api.ts` valida linguagem, política, metadados, limites e cada caso em runtime.
Na autoria, `visibility` é obrigatória na resposta e aceita somente PUBLIC/HIDDEN;
um servidor antigo ou valor desconhecido não é tratado como Público por omissão.
Criação/PATCH enviam explicitamente a visibilidade de cada caso e a política.

A nova rota hash é `#/exercicios/:uuid/versoes/:numero/previa`. Seu componente
consulta exclusivamente GET `/api/questions/:id/versions/:versionNumber/preview`,
com a sessão existente. Não busca a versão docente para esconder os casos no
navegador. O backend filtra a projeção e renumera os casos públicos.

`StudentQuestionVersion` tem contrato próprio. O parser da prévia rejeita campos
extras de autoria/motor, visibilidade em casos, índices inválidos e políticas
desconhecidas antes de renderizar. O componente compartilhado recebe esse tipo
separado para a visão discente. Isso verifica o contrato recebido; autorização e
proteção efetiva dos dados continuam sendo responsabilidades do servidor.

Casos e descrições são texto React. Não há gravação de casos ocultos em
localStorage/sessionStorage, import de fontes do backend ou dados reais no bundle.
O aluno não recebe a rota de prévia: a área continua restrita ao professor e a
API também nega seu acesso. Login, CSRF, expiração, cancelamento de consultas,
bloqueio de escrita pendente e proteção de rascunho não salvo foram preservados.
Falhas de consulta oferecem novo GET; escritas nunca são repetidas automaticamente.

## Verificação

- TypeScript estrito, build Vite e formatação aprovados.
- **69 testes com API simulada:** 21 de prática, 18 de login/turmas, 14 de
  exercícios/versionamento e 16 novos de visibilidade/prévia.
- Cobertura de visibilidade explícita no payload/CSRF, salvamento de bateria
  mista, bloqueio de publicação só oculta, edição pendente, preservação após
  falha sem retry, entradas duplicadas entre visibilidades, acesso por papel,
  resposta inválida, projeção inesperada, expiração e histórico independente.
- **2 fluxos reais** navegador → proxy Vite → NestJS B08 → PostgreSQL descartável:
  regressão pública F03 e novo fluxo misto, com reload, publicação, prévia sem
  valores ocultos no DOM/JSON, acesso discente negado pela API e mudança de
  visibilidade em versão 2 sem alterar a prévia da versão 1.
- Capturas desktop 1440×1000 e móvel 390×844 inspecionadas, sem overflow horizontal.
  Fixtures e capturas são sintéticas; não representam dados de professores/alunos.

```bash
npm run format:check
npm run build
npm test
npm run test:questions:real
```

O teste real usa o runner já existente com Node 24, Docker, checkout irmão
`codelab-api` e portas 3006/5176 livres. Usa somente TEST_DATABASE_URL em stack
PostgreSQL/tmpfs própria, criada e removida pelo runner; traces reais desativados.
Não usa banco de desenvolvimento nem envia programas ao Judge0. Chamadas GET
abortadas/recriadas pelo StrictMode no desenvolvimento não são novas escritas.

Evidências: [F04.json](evidencias/F04.json), [editor desktop](evidencias/F04-editor-desktop.png),
[editor móvel](evidencias/F04-editor-mobile.png), [prévia móvel](evidencias/F04-previa-mobile.png).
Esta entrega não acrescenta atividades, tentativas ou nota. Próxima tarefa: B09.
Entrega registrada em commit local próprio, sem novo push nesta etapa.
