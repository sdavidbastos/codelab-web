# Exercícios, evidências e acompanhamento docente

## Desenhar um exercício

Produzir conforme o pedido: objetivo observável, pré-requisitos, nível, enunciado, formato de entrada/saída, restrições, exemplos explicados, linguagens, política de tentativas, matriz de casos, comparador, cálculo da nota e critérios de aceite. Incluir rubrica ou solução docente restrita quando pertinente.

Para o MVP, preferir programas completos por entrada/saída padrão. Uma interface por função exige assinatura, adaptadores por linguagem e serialização; explicitar a ampliação antes de tratá-la como disponível.

Escolher casos por classes de equivalência, fronteiras e erros conceituais plausíveis. Considerar negativos, zero, repetição, vazios e limites somente se permitidos no contrato. O gabarito deve ser único ou o comparador deve aceitar as múltiplas respostas válidas.

Se o objetivo for usar laços, resposta correta não prova uso de laço. Avaliar explicação ou estrutura por rubrica quando fizer parte da aprendizagem. Tempo de uma execução também não prova complexidade assintótica.

## Exemplo de alinhamento

Exemplo sintético, não estudo executado. Objetivo: selecionar o maior entre três inteiros. Entrada: três inteiros entre -100 e 100 separados por espaço. Saída: o maior inteiro e quebra de linha conforme comparador declarado.

| Entrada | Saída | Finalidade | Visibilidade sugerida |
| --- | --- | --- | --- |
| `1 2 3` | `3` | Compreender o contrato | Pública |
| `9 2 1` | `9` | Maior na primeira posição | Oculta |
| `1 9 2` | `9` | Maior na posição intermediária | Oculta |
| `-8 -3 -5` | `-3` | Evitar inicialização incorreta com zero | Oculta |
| `7 7 2` | `7` | Empate | Oculta |
| `-100 -100 -100` | `-100` | Igualdade e fronteira inferior | Oculta |
| `-100 0 100` | `100` | Fronteira superior e zero | Oculta |

Confirmar gabaritos com referência confiável e considerar soluções propositalmente erradas para verificar se os casos capturam falhas relevantes. Indicar quando a checagem foi somente manual.

## Feedback e rubrica

Em casos públicos, mostrar esperado e obtido se permitido. Em ocultos, usar categorias autorizadas e próximos passos sem valores ou saídas brutas. Exemplo: “Revise a inicialização do valor candidato quando os números são negativos”, somente se a divulgação dessa categoria estiver prevista.

Distinguir compilação, execução, tempo, resposta e indisponibilidade do avaliador. A mensagem deve propor uma ação, sem atribuir incapacidade ao aluno.

Uma sequência opcional de ajuda pode oferecer pergunta orientadora, conceito e exemplo análogo. O professor define quando liberar uma solução comentada. Não restringir pedidos explícitos do professor ou desenvolvedor por uma política presumida de dicas.

Separar correção automática de análise docente. Para legibilidade, decomposição e explicação, propor níveis observáveis e pesos verificáveis, sem impor uma rubrica universal. Definir melhor ou última tentativa, reenvios, atraso, dicas e reavaliação. Não atribuir zero por indisponibilidade do serviço.

## Painel docente

Priorizar visão de turma/atividade e detalhamento por aluno, exercício e tentativa. Cada indicador precisa de denominador, janela temporal e regra de tentativas:

| Indicador | Interpretação possível | Limite |
| --- | --- | --- |
| Alunos que tentaram / matriculados elegíveis | Participação observada | Não mede dedicação fora do sistema |
| Alunos com aprovação / alunos que tentaram | Resolução entre participantes | Difere da resolução entre todos os matriculados |
| Categorias de erro por exercício | Pontos para intervenção docente | Erro técnico não determina sozinho causa conceitual |
| Evolução entre tentativas comparáveis | Mudança nos resultados | Versões diferentes e ajuda externa afetam comparação |
| Tentativas até aprovação | Percurso observado | Muitas tentativas podem ser exploração produtiva |

Separar processamento e falhas do serviço das dificuldades conceituais. Evitar ranking público como padrão; permitir examinar o código e contextualizar evidências.

Usar mensagens compreensíveis, navegação por teclado e estados distinguíveis sem depender só de cor. Preservar código após falhas e apresentar descrição textual do resultado.
