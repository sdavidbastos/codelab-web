---
name: tcc-backend-nestjs
description: Implementar e revisar a API educacional do TCC em NestJS com TypeScript, incluindo autenticação, autorização, turmas, atividades, Prisma/PostgreSQL e integração HTTP com Judge0. Use para arquitetura e padrões do backend; alterações internas do sandbox pertencem à skill Judge0.
---

# Backend NestJS do TCC

## Arquitetura adotada

Monólito modular organizado por funcionalidade na raiz de `codelab-api`, com código em `src/`. O MVP usa API HTTP e PostgreSQL próprios. O usuário adiou Redis/BullMQ, worker e outbox; não reintroduzir essas estruturas como dependência do MVP. A integração com Judge0 será por envio/consulta HTTP diretos. Usar camadas de aplicação e portas/adaptadores nas fronteiras que precisam de isolamento; não exigir uma Clean Architecture completa para um CRUD simples.

Antes de editar, ler `AGENTS.md`, o plano ativo, manifests/lockfile, módulos, schema/migrações, configuração e testes relevantes. Respeitar a etapa autorizada e as versões fixadas. A implementação Rails anterior não define convenções para este backend.

## Procedimento e padrões

1. Identificar o caso de uso, ator, vínculo de autorização, transação e projeção de saída. O controller cuida de HTTP e delega; regras educacionais não ficam em decorators, controllers extensos ou processors de fila.
2. Aplicar injeção de dependências Nest no composition root do módulo. Interfaces TypeScript são apagadas em runtime: usar token explícito ou classe abstrata para portas injetadas. Exportar apenas providers necessários; não usar service locator global ou `forwardRef` para disfarçar dependência circular.
3. Encapsular Judge0 em um adapter; manter Prisma na infraestrutura; BullMQ pertence somente a uma evolução futura autorizada. Usar repositories orientados ao caso de uso/agregado quando protegem a transação ou desacoplam regra relevante; não criar um repository genérico que apenas repete toda a API Prisma.
4. Manter cálculo/transições determinísticos em funções ou objetos de domínio testáveis. Usar Strategy quando houver políticas realmente diferentes; não criar um registro de estratégias para um único comparador. Usar mapper/projeção para selecionar campos públicos e autorizados.
5. No MVP, persistir tentativa/casos antes do envio HTTP e salvar tokens no servidor; consultar/persistir resultados quando solicitado pela interface. Não executar tarefas soltas em memória após responder. SQL + HTTP não são atômicos: registrar envio incerto e não repetir POST cegamente. Fechar a página pausa a consulta educacional, mas o Judge0 continua execuções aceitas. Fila/outbox e recuperação automática ficam para evolução posterior.

Exemplos de estrutura, critérios dos padrões e fronteiras de transação estão em [arquitetura e padrões Nest](references/arquitetura-e-padroes.md). Para invariantes educacionais, ler [domínio e avaliação](../tcc-plataforma-typescript/references/dominio-e-avaliacao.md).

## Contratos e segurança de negócio

- TypeScript `strict`; tratar entrada externa como `unknown` até validar. DTO de transporte, tipo de domínio, modelo Prisma e resposta autorizada têm responsabilidades distintas. Não usar casts/`any` para contornar um contrato indefinido.
- Aplicar validação em runtime; não encaminhar campos extras para o Prisma/adapter. Derivar aluno/papel da sessão e verificar propriedade/matrícula no servidor. Guard de papel não substitui política por recurso.
- Seguir a política de sessão do projeto: cookie HttpOnly, revogação/expiração, proteção CSRF e mesma origem via `/api`. Não introduzir JWT em localStorage por seguir um tutorial.
- O adapter usa URL/chave configuradas no servidor, timeouts e Base64/UTF-8 explícitos. `/version` retorna texto neste fork; `/languages` e submissões usam JSON. Descobrir linguagens, examinar erros por item e associar resultados por token.
- Erros de infraestrutura e POST incerto são estados recuperáveis, sem veredito falso ou retry cego. Não logar código, gabarito, cookies, credenciais ou corpo bruto do motor.

## Verificação

Testar regras/autorizações com unidade, endpoints e persistência com integração, usando bancos descartáveis; Redis só será necessário se a etapa futura de filas for retomada. Verificar DTOs, unicidade, rollback, acesso cruzado, resultados ocultos e reentrega conforme a mudança. Adapter falso testa a aplicação; integração real delimitada testa o contrato HTTP do motor. Testes Nest não comprovam isolamento do sandbox.
