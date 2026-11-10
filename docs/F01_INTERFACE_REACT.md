# F01 — interface React de prática

Entrega local de 7 de novembro de 2026. O usuário priorizou a interface do MVP
depois da rota E01 e antes da autenticação. O novo projeto `codelab-web` é um
repositório local independente, ao lado de `codelab-api` e `judge0`; não altera
a organização interna ou o histórico deles.

## Entrega observável

- Workspace escuro com enunciado/exemplos à esquerda, editor Python à direita,
  console de entrada/resultado, métricas e ação de executar.
- React 19.3.1, TypeScript 5.9.3, Vite 8.3.6 e CodeMirror 6. Dependências no
  lockfile próprio; imagens Node 24.22.2 e Nginx 1.30.6 fixadas por digest.
- Três exemplos locais e públicos: hello, soma e maior de três. Cada execução
  testa um caso, permitindo entrada personalizada e esperado vazio/omitido.
- Editor com sintaxe, indentação, números de linha, histórico de edição e
  atalho de execução. Rascunhos por exemplo e último ID/snapshot neste navegador.
- Saída e erros renderizados como texto, sem HTML. Veredito vem do NestJS;
  React não avalia a solução nem calcula percentual oficial.
- Comportamento no desktop e no celular, labels, foco, saída do editor pelo
  teclado, ajuda em dialog e confirmação antes de restaurar rascunho.

## Arquitetura e estado

```text
src/
  app/                       # composição e estilos do workspace
  features/practice/
    api/executions.ts        # contrato público e validação de JSON em runtime
    components/              # enunciado, editor e apresentação de resultado
    hooks/useExecution.ts    # envio/consulta, snapshot e estados da operação
    exercises.ts             # catálogo público de prática, sem casos ocultos
    storage.ts               # rascunhos e última execução local
  shared/ui/Icon.tsx         # ícones SVG da interface
infra/nginx.conf             # arquivos estáticos e proxy /api
```

Uma tela não exige React Router, store global ou biblioteca de consulta. Estado
de edição fica no React; o hook controla a operação com união discriminada.
O editor é carregado sob demanda em um chunk separado. Eventos de usuário
iniciam POST; effects apenas sincronizam editor/saúde e limpam recursos.

No clique, fonte, entrada e esperado são copiados em um snapshot. O rascunho
pode mudar durante a execução; o resultado permanece ligado ao snapshot. Ao
trocar de exemplo, cada rascunho/último ID é recuperado separadamente.

O frontend usa somente `/api/executions` e `/api/health/ready` do NestJS.
Nginx/Vite fazem proxy; não há chamadas do navegador ao motor, importação de
Prisma ou fontes de outro checkout. Contratos públicos estão tipados e validados
contra o formato da E01; geração a partir de OpenAPI pertence à B14 futura.

POST não tem retry automático. Depois de obter ID público, polling GET tem
intervalo, prazo e cancelamento ao desmontar. Falha de leitura pausa a consulta;
retomada e reload usam somente GET. Se o POST falhar com ID conhecido, ele é
preservado. Sem confirmação, a tela explica a incerteza e preserva o código.
Parar consultas não cancela programas já aceitos no Judge0.

LocalStorage é apenas conveniência local, não histórico acadêmico, sessão ou
fonte de verdade dos resultados. Falha no armazenamento não impede execução.
Sessões, usuários na interface, turmas e casos ocultos continuam pendentes.

## Verificação

| Escopo                      | Evidência                                                                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TypeScript e build          | Aprovados no host e no build Docker                                                                                                                                            |
| Playwright com API simulada | **21 testes aprovados**, incluindo snapshot durante edição, GET de retomada, POST não repetido, estados desconhecidos, UTF-8/texto seguro, rascunhos, teclado e viewport móvel |
| Fluxo real no navegador     | **1 teste aprovado, com 2 execuções reais**, via React → Nginx → NestJS → Judge0; hello e stdin com acentos/emoji                                                              |
| Rede do navegador           | A verificação real não observou requisições diretas às portas 2358 ou 3001                                                                                                     |
| Inspeção visual             | Capturas desktop e móvel; sem overflow horizontal a 390 px                                                                                                                     |
| Operação                    | UI em `127.0.0.1:5173`, Nginx sem privilégios, stack e volumes anteriores preservados                                                                                          |

Capturas e identificadores sintéticos estão em `docs/evidencias`. Os testes
simulados não são apresentados como prova de execução real ou isolamento.
Não houve commit, remoto, publicação nem execução remota da CI.

## Recorte do MVP

Não foram implementados login, turmas, autoria docente, bateria oculta ou nota.
O catálogo local é demonstração de prática; não representa avaliação protegida.
O backend mantém limites, linguagem e tokens sob seu controle. Autenticação
continua como próxima fatia do produto quando retomada.

Fontes de implementação: [React com Vite/TypeScript](https://react.dev/learn/build-a-react-app-from-scratch),
[CodeMirror básico](https://codemirror.net/examples/basic/) e
[teclado/Tab](https://codemirror.net/examples/tab/). As skills do projeto guiaram
composição por funcionalidade, hooks, snapshots e fronteiras com o backend.
