# React: arquitetura e padrões aplicados

## Organização por funcionalidade

Estrutura de referência, sem obrigação de criar pastas vazias:

```text
src/
  app/                         # rotas, providers e composição da aplicação
  features/
    auth/
    classrooms/
    activities/
    attempts/
      components/
      hooks/
      api/
  shared/ui/                   # controles visuais reutilizados de fato
  shared/api/                  # transporte, sessão/CSRF e erros comuns
```

Uma funcionalidade mantém componentes, hooks, chamadas e testes próximos. `shared` contém elementos reutilizados, não uma coleção de regras de todas as telas. Features consomem APIs públicas umas das outras; evitar imports profundos e ciclos.

A aplicação usa contratos públicos versionados da API e não importa código do servidor ou fontes por caminho relativo de outro repositório. Compartilhar tipos não significa compartilhar modelos de persistência ou decisão de permissões.

## Estado e padrões

| Necessidade | Decisão preferida | Evitar |
| --- | --- | --- |
| Variações de apresentação | Composição de componentes por props/children | Herança de componentes e componentes com dezenas de flags incompatíveis |
| Editor, seleção de entrada e campos | Estado local/controlado | Store global para todo caractere digitado |
| Comportamento reutilizável | Custom hook focado | Hook genérico que mistura HTTP, editor, turma e regra de avaliação |
| Transições locais correlacionadas | Reducer/tipo discriminado | Flags que permitem loading e sucesso incompatíveis |
| Sessão compartilhada | Provider/Context e API de sessão | Sessões copiadas em vários estados/localStorage |
| Dados do servidor | Consulta/cache com invalidação explícita | Duplicar a mesma tentativa em caches e stores independentes |
| Valores calculáveis a partir de props/estado | Derivação em renderização | Effect que grava o mesmo valor derivado em outro estado |
| Widget externo, timer de consulta ou inscrição | Effect com cleanup e dependências corretas | Polling órfão, closure obsoleta e POST iniciado por effect |

Se ainda não existir solução de consulta, escolher e registrar uma abordagem proporcional antes de misturar bibliotecas. Memoização serve a um problema de desempenho observado ou contrato de integração específico; não envolver todo componente em `memo`, `useMemo` e `useCallback` por padrão.

Container/presentation é uma separação de responsabilidades, não um número obrigatório de arquivos. Uma página pequena pode compor UI e um hook de consulta; extrair componentes quando isso melhora compreensão, reutilização ou teste.

## Fluxo do editor e das avaliações

- Estado editável do código e snapshot da tentativa são distintos. No clique/atalho, capturar fonte e atividade/linguagem permitidas; o backend fixa a versão/casos e persiste a tentativa.
- Não associar uma resposta antiga ao código novo. Identificar tentativa, origem do resultado e alteração posterior do rascunho. Guardar dados por atividade para evitar misturar códigos ao navegar.
- Enquanto houver envio em andamento, impedir submissões duplicadas acidentais na UI; isso não substitui a idempotência do backend.
- Consultar o identificador educacional, com prazo/intervalo e encerramento nos estados finais. Ao desmontar, cancelar consultas/inscrições; não apresentar esse cancelamento como cancelamento da avaliação no servidor.
- Ao perder confirmação de POST, mostrar envio não confirmado/incompleto e consultar o estado quando houver identificador. Não criar outro POST automaticamente. Idempotency key só oferece garantia se o contrato do backend a implementar.
- Percentual oficial, política, casos previstos e vereditos vêm da API educacional. O frontend pode formatar/apresentar, mas não reavaliar código ou transformar resultados desconhecidos em reprovação.

Estados ilustrativos de UI podem usar união discriminada (`loading`, `ready`, `error`) e dados de tentativa com estados do contrato do servidor. Não inventar enum local divergente ou interpretar todo erro HTTP como erro do programa do aluno.

## Formulários, conteúdo e acessibilidade

Validar no cliente para orientar, mantendo o servidor como autoridade. Preservar campos e código após erro de validação/conexão. Não incluir dados privados em URL, mensagens de console ou monitoramento. Listas docentes e recursos do aluno usam endpoints autorizados, sem baixar dados de todos para filtrar no React.

Usar labels, botões, foco, estados desabilitados e descrições textuais. No editor, manter uma forma documentada de sair com teclado; atalhos não devem prender o foco ou sobrescrever texto inesperadamente. Tratar saída/diagnóstico como conteúdo não confiável; testes com `<img onerror=...>` devem confirmar texto, sem execução.

## Testes proporcionais

- Componentes: transições e ações observáveis com Testing Library/Vitest quando adotados, usando API fake controlada e sem gabaritos reais privados.
- Ponta a ponta: Playwright com autenticação e API reais quando a fatia estiver disponível; registrar o que é simulado. Verificar acesso permitido/negado também pelo servidor.
- Conforme a mudança: código/snapshot correto, resposta atrasada após navegação, Unicode, caso operacional/desconhecido, reconexão sem perda, rascunho por atividade, histórico reaberto, teclado, mobile e renderização segura.
- Checagem TypeScript e build separados dos testes de comportamento. Um build Vite não substitui `tsc`/comando de typecheck adotado.

Não escrever testes que apenas confirmam nomes de arquivos ou repetem o algoritmo implementado. Não declarar que os testes do protótipo estático são testes dos novos componentes React.

## Fontes primárias

- [Composição e modelo de estado React](https://react.dev/learn/thinking-in-react).
- [Quando usar effects](https://react.dev/learn/you-might-not-need-an-effect).

Conferir as versões do projeto antes de recomendar APIs e bibliotecas novas. Estas diretrizes organizam a implementação; não obrigam usar uma biblioteca global de estado ou de componentes.
