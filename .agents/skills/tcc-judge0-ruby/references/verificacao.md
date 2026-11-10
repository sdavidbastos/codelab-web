# Verificar o fluxo de julgamento

As verificações de sandbox/API técnica pertencem ao motor. Autorização por aluno/turma, tentativas pedagógicas e projeções de casos ocultos são testadas na plataforma NestJS/React, mesmo quando usam uma instância real do Judge0. Não atribuir ao motor sozinho essas responsabilidades.

Selecionar testes pelo comportamento alterado; não criar suíte para edição exclusivamente documental. Usar framework e comandos existentes no checkout. Mocks verificam cliente e domínio, mas não demonstram isolamento ou compatibilidade real com o executor.

| Cenário pertinente | Evidência esperada |
| --- | --- |
| Solução correta e incorreta conhecidas | Casos e agregação correspondem aos gabaritos e comparador |
| Erro de sintaxe/compilação ou execução | Classificação correta, mensagem útil e sem vazamento |
| Laço infinito | Limite aplicado pelo executor; coleta termina no prazo |
| Limite de memória | Classificação conforme contrato real, sem supor ID universal específico |
| Saída vazia, Unicode e fim de linha | Regra publicada preservada; Base64 sem dupla codificação |
| Batch com tokens e erros misturados | Associação correta por caso; falhas por item preservadas |
| Timeout após envio ou indisponibilidade | Nenhuma resposta errada fabricada nem nota duplicada |
| Jobs repetidos e resultados concorrentes | Uma tentativa lógica e agregação consistente |
| Código imprime a entrada de um caso oculto | Resposta ao aluno não contém valores restritos |
| Aluno consulta outra tentativa ou professor outra turma | Acesso negado em detalhes, listas e exportações |
| Exercício alterado após submissão | Tentativa ligada à versão original |
| Casos ausentes, peso inválido ou estado desconhecido | Sem aprovação automática ou nota final indevida |

Separar, quando necessário: unidade de comparador/agregador; integração de persistência, job, API e autorização com executor simulado; ponta a ponta com instância isolada do Judge0. Não executar soluções de alunos no processo do backend.

Em smoke test real autorizado, usar dados sintéticos e conferir envio → token → consulta → resultado terminal → agregação → visualização por perfil. Limitar programas e carga ao ambiente de desenvolvimento. Registrar comando, resultado e limites; um mock não comprova proteção de sandbox.
