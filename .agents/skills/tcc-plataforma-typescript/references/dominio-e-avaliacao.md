# Domínio e avaliação: regras comuns da plataforma

O documento ativo de arquitetura e a T05 no repositório são a fonte das decisões específicas; os nomes abaixo são convenções de referência, não entidades já implementadas.

## Modelo e invariantes

- `User`/sessão: identidade e papel derivados do servidor; cadastro público não concede perfil docente.
- `Classroom`/`Enrollment`: professor responsável, matrícula única e autorização por vínculo. Papel global sozinho não autoriza acesso a uma turma específica.
- `Exercise`/`ExerciseVersion`/`TestCase`: rascunho e versão publicada imutável, incluindo contrato, casos, comparador, linguagem/runtime e limites.
- `Activity`: publicação da versão para uma turma e disponibilidade manual conforme o MVP.
- `Attempt`: código imutável do aluno, atividade, versão e instante aceito. Prática pública é distinta de envio avaliativo.
- `EvaluationRun`: rodada rastreável; reavaliação preserva a anterior e identifica a vigente.
- `CaseResult`: unicidade por rodada/caso; associação explícita ao token técnico do Judge0, restrito ao servidor.

## Máquina de estados e consolidação

Definir estados e transições explícitos, com tipos discriminados quando isso impedir combinações inválidas. Processamento, conclusão e falha operacional não são o mesmo estado com campos opcionais ambíguos. Uma atualização repetida deve ser idempotente; resultado terminal não retrocede sem nova rodada.

A política inicial conta casos com peso igual e não produz nota oficial. Percentual final exige todos os casos previstos com resultados terminais conhecidos e nenhuma falha operacional. Não remover casos do denominador; bateria vazia é configuração inválida. Última tentativa é a visão padrão, sem substituição silenciosa pela melhor. Instabilidade de infraestrutura não vira resposta errada.

Confirmar estados na instalação Judge0. O contrato observado inclui 1/2 pendentes, 3 aceito, 4–12/14 resultados de programa e 13 erro interno. Estado desconhecido, resposta ausente ou falha de transporte não resolvida mantém avaliação incompleta.

## Consistência e processamento

O usuário priorizou MVP sem fila/worker/outbox próprios. Persistir tentativa/rodada/casos antes do HTTP; enviar diretamente ao Judge0 e salvar tokens. A consulta da tentativa busca e persiste resultados conhecidos. Usar unicidade e transições condicionais para evitar duplicação de registros. Não manter transação SQL aberta durante chamadas ao Judge0. Filas/outbox e recuperação automática de despacho ficam para uma evolução posterior autorizada.

Timeout após o envio pode significar execução já criada. Registrar aceitação incerta, sem repetir cegamente ou fabricar resultado; permitir ação explícita para um novo envio. Consultas têm prazo e retries limitados. Fechar a página pausa consultas do NestJS, mas o Judge0 continua execuções aceitas; tokens salvos permitem nova consulta ao retornar. O MVP não promete consolidação sem consultas nem recuperação automática de despacho. Se uma fila for introduzida depois, seu job ID também não deduplicará POST no motor.

## Projeções e autorização

A resposta do aluno é uma projeção explícita, não a entidade de persistência ou o serializer integral do Judge0. Para casos ocultos, omitir entrada, esperado, saídas brutas, diagnósticos e tokens em HTTP, HTML, exportação e logs. Um programa pode imprimir ou lançar uma exceção contendo a própria entrada. Truncamento/escape não substitui seleção dos campos autorizados.

Professor só consulta suas turmas/exercícios; aluno só consulta atividades autorizadas e tentativas próprias. Aplicar regras também em listas, filtros, paginação, relacionamentos e exportações. Receber um ID não comprova permissão.

## Evidências essenciais

Selecionar casos pertinentes: correta/incorreta; saída vazia/UTF-8; batch parcial; indisponibilidade/estado desconhecido; POST incerto; reentrega e retomada; mudança de versão; acesso cruzado; código que imprime a entrada oculta. Comparar estado persistido e projeção exposta, além do status HTTP.

Acertos funcionais não comprovam compreensão, autoria ou aprendizagem. Preservar os limites e indicadores da T05; usar a skill pedagógica para mudar objetivos, rubricas ou instrumentos.
