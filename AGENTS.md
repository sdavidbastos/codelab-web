# CodeLab — interface React do TCC

- Este é o repositório local independente `codelab-web`, autorizado pelo usuário ao priorizar a interface do MVP. Backend NestJS em `../codelab-api`, executor Ruby em `../judge0`. Não recriar monorepo nem importar fontes, Prisma ou configurações privadas dos outros checkouts.
- Ler `README.md`, `docs/F01_INTERFACE_REACT.md` e as skills locais `tcc-frontend-react` e `tcc-plataforma-typescript`, incluindo suas referências pertinentes.
- Stack: React/TypeScript estrito, Vite e CodeMirror. Organização por funcionalidade; `App` compõe a página, `useExecution` controla envio/consulta e o cliente de API valida JSON em runtime. Uma tela não exige router ou store global.
- A interface consome somente `/api` do NestJS via proxy. Não chamar Judge0 diretamente, expor suas chaves/tokens ou incluir casos ocultos no bundle. Exemplos locais são públicos, uma execução por caso, sem aluno/atividade/nota.
- Auth B05 e telas de turma/professor estão pendentes por prioridade explícita do MVP. Não criar login, entrega ou indicadores docentes simulados como se fossem funcionalidades prontas.
- Preservar o snapshot enviado separadamente do rascunho editável. Resultado antigo não pertence ao código novo. Falhas operacionais/timeout não viram resposta errada; nunca repetir POST automaticamente. Retomada usa GET do ID público.
- Polling tem prazo, intervalo e cancelamento ao desmontar. Não interpretar parada da consulta como cancelamento do programa no Judge0. Rascunhos/último ID ficam neste navegador; o PostgreSQL continua sendo fonte de verdade do resultado.
- Código, stdout e diagnósticos são texto, sem `dangerouslySetInnerHTML`. Manter labels, teclado, foco, mensagens textuais e layout móvel.
- Testes normais interceptam somente `/api` e não enviam programas reais. `npm run test:real` usa a stack Docker ativa e cria apenas execuções sintéticas; distinguir sua evidência dos mocks. Checar tipos, build e formatação.
- Repositório somente local, sem remoto/commit/publicação por enquanto. Configurações privadas em `.local`/ambiente, ignoradas por Git e Docker.
