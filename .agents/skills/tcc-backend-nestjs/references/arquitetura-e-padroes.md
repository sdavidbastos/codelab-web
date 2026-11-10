# NestJS: arquitetura e padrões aplicados

## Organização por funcionalidade

Estrutura indicativa para uma funcionalidade com regras e integração externas; criar somente as partes necessárias:

```text
codelab-api/src/
  modules/attempts/
    attempts.module.ts
    presentation/attempts.controller.ts
    presentation/dto/create-attempt.dto.ts
    application/submit-attempt.use-case.ts
    application/ports/attempts.repository.ts
    domain/evaluation-state.ts
    infrastructure/prisma-attempts.repository.ts
  integrations/judge0/
  jobs/
  database/
  main.ts
```

Um módulo CRUD pequeno pode começar com `controller`, `service`, `dto` e testes próximos. Criar subcamadas quando a regra ou integração justificar; não espalhar lógica de uma funcionalidade por pastas globais enormes `services/` e `utils/`.

Direção de dependências: entrada HTTP/fila → aplicação → domínio/portas. Adapters implementam portas e são conectados pelo módulo Nest. Domínio puro não importa Nest, Prisma, BullMQ, HTTP ou tipos de request. Um módulo consome a API pública de outro, não seu repository interno. Evitar ciclos e módulos globais indiscriminados.

No MVP atual não há worker/fila próprios. Os padrões de fila/outbox abaixo são opções futuras, condicionadas à retomada explícita dessa etapa.

## Escolher o padrão pelo problema

| Problema concreto | Padrão/diretriz | Limite |
| --- | --- | --- |
| Trocar HTTP real por um fake, sem mudar o caso de uso | Port + Adapter e DI | Não simular Judge0 dentro de regras de nota |
| Garantir persistência/transação de uma tentativa | Repository focado + unidade de transação | Não transformar toda tabela em interface genérica |
| Políticas de comparação realmente distintas | Strategy | Com uma política, função/serviço simples é suficiente |
| Resposta do aluno difere de dados docentes/internos | Mapper/projeção explícita | Não carregar tudo e esperar o React esconder campos |
| Eventos SQL precisam virar trabalho durável | Transactional Outbox e consumidor idempotente | Não prometer atomicidade entre banco e fila |
| Mensagens repetidas/concorrentes | Unicidade e transição condicional de estado | Job ID não deduplica POST ao Judge0 |
| Estados impossíveis por combinação de flags | Máquina de estados explícita/tipos discriminados | Não requer uma biblioteca de state machine por padrão |

SOLID aqui significa responsabilidades pequenas e dependência de fronteiras apropriadas. DRY trata a mesma regra/conhecimento, não semelhança casual de duas linhas. YAGNI evita CQRS bus, event sourcing, Abstract Factory ou Builder sem uma variação/necessidade comprovada.

## DI com token de runtime

Exemplo ilustrativo, não código já implementado:

```ts
export const JUDGE0_PORT = Symbol('JUDGE0_PORT');
export interface Judge0Port {
  submit(input: TrustedCaseSubmission): Promise<DispatchOutcome>;
}

// Na composição do módulo:
providers: [
  { provide: JUDGE0_PORT, useClass: Judge0HttpAdapter },
  SubmitAttemptUseCase,
]
```

O consumidor injeta `JUDGE0_PORT` com a assinatura `Judge0Port`; o teste fornece um fake nesse token. `TrustedCaseSubmission` é construído pelo servidor a partir da versão autorizada, não um DTO do aluno repassado integralmente. `DispatchOutcome` precisa representar aceitação incerta quando aplicável; não fingir que toda exceção significa que nada foi enviado.

## Transações e fluxo assíncrono

No MVP: validar/autorizar, persistir tentativa/rodada/casos em transação, enviar ao Judge0 fora da transação e salvar tokens privados. A consulta HTTP da tentativa busca e persiste resultados conhecidos; não inicia novos envios. Uma interrupção de despacho pode deixar aceitação incerta, sem retry cego. Não prometer atualização sem consultas ou criar tarefas em memória depois da resposta.

Se filas forem retomadas futuramente, intenção/outbox transacional e consumidores idempotentes poderão recuperar despachos. Essa evolução não pertence à implementação atual.

Não usar `new PrismaClient()` por request/job; adotar provider com ciclo de vida do processo e transações explícitas. Passar contexto transacional apenas ao escopo que precisa dele; um repository não deve escapar da transação e gravar em outra conexão por conveniência.

Retries de leitura têm limite, espera e prazo. Retries de escrita dependem do efeito externo e da idempotência realmente implementada. No fluxo direto, limitar os prazos de cada requisição. Se houver worker no futuro, tratar seu encerramento/retomada nessa etapa.

## Autorização e testes

Controller/guard identifica o ator; aplicação/política verifica vínculo e propriedade no recurso consultado/alterado. Filtrar query por escopo autorizado, proteger também relações/listas e revalidar invariantes relevantes na transação. Escolher 403/404 de forma consistente com a política de exposição, sem retornar dados do recurso indevido.

Testes devem observar resultado, efeitos persistidos e campos expostos. Cobrir o aluno tentando tornar-se professor, docente de outra turma, requisições extras em DTO, caso oculto que imprime a entrada, reentrega concorrente e operação com motor indisponível conforme a funcionalidade entregue. Não tratar percentuais corretos com vazamento de dados como aceite aprovado.

## Fontes primárias para detalhes de implementação

- [Módulos Nest](https://docs.nestjs.com/modules).
- [Custom providers e tokens](https://docs.nestjs.com/fundamentals/custom-providers).
- [Autorização](https://docs.nestjs.com/security/authorization).
- [Filas e BullMQ](https://docs.nestjs.com/techniques/queues).

Conferir documentação compatível com a versão do lockfile antes de usar uma API. As escolhas acima são diretrizes deste projeto, não exigências universais do NestJS.
