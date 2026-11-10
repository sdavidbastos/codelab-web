---
name: tcc-frontend-react
description: Implementar e revisar a interface educacional do TCC em React com TypeScript, incluindo composição de componentes, organização por funcionalidade, estado, formulários, editor e integração com a API NestJS. Use para arquitetura, padrões e testes do frontend; regras de avaliação e autorização pertencem ao backend.
---

# Frontend React do TCC

## Arquitetura adotada

SPA React/TypeScript no repositório independente `codelab-web`, com Vite. O usuário priorizou o workspace de prática antes de login/turmas. Há uma tela no MVP; acrescentar roteamento quando houver navegação entre páginas reais. Judge0 e backend NestJS permanecem separados. Organizar por funcionalidade, com componentes compostos, hooks e cliente da API educacional. Reaproveitar o CodeLab sem manter um segundo editor completo ou usar o catálogo estático como avaliação oficial.

Antes de editar, ler `AGENTS.md`, a tarefa vigente, manifests/lockfile, rotas, estilos e testes relacionados. Respeitar o contexto confirmado: ensino superior, Linguagem de Programação 1, primeira linguagem de solução Python 3. Não gerar telas Rails/ERB ou um segundo backend em Next.js para esta interface.

## Procedimento e padrões

1. Modelar estados observáveis da tela antes de montar componentes: carregamento, vazio, erro, processamento, conclusão e avaliação incompleta. Identificar quais dados são locais e quais são de autoridade do servidor.
2. Aplicar composição por props/children e limites de funcionalidade. Separar apresentação de orquestração quando a complexidade justificar; não exigir um arquivo container para cada componente simples.
3. Manter estado de formulário/editor próximo de quem o utiliza. Usar hooks para comportamento reutilizável e reducer para transições locais realmente relacionadas. Context atende dados compartilhados como sessão; não mover todo estado para uma store global por padrão.
4. Centralizar HTTP e contratos da API NestJS. Para dados remotos, usar o mecanismo de consulta/cache adotado no projeto; evitar cópias concorrentes em estado global e local. Não adicionar uma biblioteca de estado apenas para fazer um GET.
5. Derivar valores durante renderização quando possível. Eventos iniciam ações do usuário; effects sincronizam sistemas externos e têm cleanup. Não usar effect para copiar props em estado ou iniciar envios avaliativos a cada render.

Estrutura, exemplos de decisões e critérios de teste estão em [arquitetura e padrões React](references/arquitetura-e-padroes.md). Usar [domínio e avaliação](../tcc-plataforma-typescript/references/dominio-e-avaliacao.md) para a semântica dos resultados, mantendo a regra oficial no servidor.

## Integração, editor e exposição

- React chama `/api` do NestJS. Não chamar Judge0 diretamente, importar Prisma, carregar chave do executor ou incluir casos ocultos/gabaritos privados no bundle.
- O contrato TypeScript não valida JSON em runtime nem autoriza um recurso. Consumir projeções autorizadas; guards de rota são experiência de navegação, não proteção de dados.
- Seguir a sessão do backend via cookies HttpOnly e protocolo CSRF/multiplicidade de origem definidos. Não armazenar sessão/token em localStorage; ele pode apoiar rascunhos, sem ser a fonte oficial do histórico/resultado.
- Capturar a versão do código no ato de enviar. Mostrar resultado vinculado à tentativa/snapshot retornados e sinalizar quando o editor mudou. Diferenciar Executar (prática) de Enviar solução (avaliação).
- Não aplicar retry automático a POST avaliativo, marcar timeout como resposta incorreta ou concluir percentual pelo número de respostas recebidas. A consulta da tentativa pode ser cancelada ao sair da tela; o trabalho durável continua no backend.
- Renderizar código/saída/erro como texto. Para enunciado Markdown/HTML, usar renderizador e sanitização apropriados; não inserir conteúdo não confiável com `dangerouslySetInnerHTML`.

## Verificação

Testar comportamento por papéis/labels, não detalhes internos de hooks. Cobrir código efetivamente enviado, teclado/saída do editor, rascunho, reconexão, carregamento/erro, estados incompletos e mobile conforme a alteração. Testes de UI com API simulada não comprovam execução/isolamento real. Preservar texto após falha e apresentar resultados compreensíveis sem depender só de cor.
