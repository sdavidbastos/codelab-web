---
name: tcc-plataforma-typescript
description: Planejar e integrar a plataforma educacional do TCC em repositórios separados, com backend NestJS/TypeScript, frontend React/TypeScript e execução pelo Judge0. Use para arquitetura, contratos, organização de tarefas e mudanças que atravessam backend e frontend.
---

# Plataforma educacional: NestJS, React e Judge0

## Contexto vigente

O usuário escolheu NestJS para autenticação, professores, turmas e avaliação; React para a interface; Judge0 para executar programas. O público confirmado é ensino superior, Linguagem de Programação 1, com Python 3 como primeira linguagem das soluções. Ruby pertence ao executor. A aplicação Rails educacional anterior é material de transição, não a base para novas funcionalidades.

1. Identificar o repositório ativo e ler seu `AGENTS.md` e seus planos em `docs/tcc`. A solução tem repositórios locais independentes: `judge0` (executor), `codelab-api` (NestJS) e `codelab-web` (React, criado na etapa da interface solicitada pelo usuário). Não recriar workspaces dentro do fork.
2. Para backend, usar `tcc-backend-nestjs`; para interface, `tcc-frontend-react`; para o motor, `tcc-judge0-ruby`. Ler somente as referências pertinentes. Objetivos de ensino e protocolo de pesquisa pertencem a `tcc-programacao-pedagogia`.
3. Preservar alterações existentes, histórico do fork, arquivos privados e volumes ao reorganizar. Manter Git, lockfile, CI e Docker próprios em cada repositório. Não adicionar o backend ao fork nem usar Git aninhado; as dependências e os dados do executor continuam próprios.
4. Implementar a fatia autorizada com contrato, comportamento e evidência verificáveis. Registrar mudanças de arquitetura sem ampliar silenciosamente o MVP.

## Arquitetura e fronteiras

- Monólito modular NestJS com API HTTP; worker próprio foi adiado pelo usuário para depois do MVP. React é cliente da API educacional. HTTP é a fronteira com Judge0; não consultar seu PostgreSQL/Redis a partir da plataforma.
- PostgreSQL educacional é fonte de verdade. Prisma gerencia seus dados. O MVP envia/consulta diretamente pela API Judge0; BullMQ/Redis próprios e outbox foram adiados e não são pré-requisitos. Confirmar versões/configuração no checkout antes de gerar código.
- Contratos públicos/clientes tipados serão derivados ou verificados contra OpenAPI e distribuídos por artefato versionado; não importar fontes de outro checkout como dependência implícita. Não compartilhar modelos Prisma, credenciais ou dados de casos ocultos com o frontend.
- Identidade, autorização por recurso, testes, gabaritos, linguagem e limites são determinados no backend. Nunca executar soluções de alunos no NestJS ou no navegador.
- Usar SOLID para separar responsabilidades e dependências reais; priorizar KISS/YAGNI. Criar uma abstração quando ela protege uma fronteira ou uma variação demonstrada, não para cumprir uma lista de padrões.
- Não introduzir microsserviços por entidade, event sourcing, barramento CQRS ou um segundo backend de interface sem requisito concreto e decisão registrada.

Para tentativas, estados, recuperação, visibilidade e critérios de aceite, ler [domínio e avaliação](references/dominio-e-avaliacao.md). Regras de negócio compartilhadas entre tarefas têm uma definição no servidor; não duplicar julgamento no React.

## Verificação da entrega

Distinguir checagem de tipos, unidade, API/componentes simulados e integração real. Validar autorização, dados persistidos, falhas e recuperação conforme a mudança. Não atribuir ao Nest/React resultados de testes antigos do Rails ou do protótipo estático. Relatar o que foi executado e as limitações, sem afirmar que planejamento ou scaffolding entregam uma funcionalidade.
