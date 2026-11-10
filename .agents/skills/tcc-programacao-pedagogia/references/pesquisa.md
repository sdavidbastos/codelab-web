# Planejar e relatar a avaliação do TCC

Estas são orientações de pesquisa, não resultados obtidos nem exigências de uma instituição específica.

## Delimitação e evidências

Definir problema, público, contexto e contribuição verificável. Uma pergunta possível: “Como um ambiente com avaliação automática e acompanhamento docente apoia a identificação de dificuldades em atividades introdutórias de programação?” Ajustar às condições reais; a pergunta não pressupõe eficácia demonstrada.

Relacionar objetivo → requisito → funcionalidade → critério de aceite → evidência coletada. Separar avaliações:

| Dimensão | Questão | Evidência possível |
| --- | --- | --- |
| Técnica | O sistema julga corretamente e mantém consistência? | Corpus com vereditos conhecidos, falhas controladas, latência e integridade |
| Usabilidade | Alunos e professores completam as tarefas? | Observação de tarefas, sucesso, erros, entrevistas e questionário justificado |
| Educacional | Há evidências de mudança na aprendizagem ou acompanhamento? | Atividades comparáveis, produções, avaliações e relatos contextualizados |

Protótipo funcional e estudo de usabilidade não demonstram ganho de aprendizagem. Se apenas validação técnica for viável, limitar as conclusões a ela.

## Protocolo proporcional

Definir participantes, recrutamento, contexto, tarefas, duração, instrumentos, análise e limitações antes da coleta. Selecionar estudo de caso, experimento, pesquisa de desenvolvimento ou outra abordagem pela pergunta e recursos.

Para avaliar o julgador, montar corpus sintético com soluções e falhas conhecidas; especificar linguagem, runtime, limites e comparador. Medir separadamente correção do veredito, erros do serviço, latência total incluindo fila e duração do executor. Declarar hardware, carga e denominadores; percentis precisam de amostra e contexto.

Para uma intervenção, usar tarefas equivalentes e registrar ajuda e experiência anterior. Antes/depois sem controle sofre efeito de prática, maturação e seleção. Não atribuir causalidade sem desenho que a sustente. Evitar testes estatísticos sem amostra ou pressupostos adequados.

Com participantes reais, verificar exigências de consentimento, tratamento de dados e apreciação institucional antes de coletar. Não presumir aprovação ou dispensa. Minimizar identificação e separar dados de pesquisa dos registros operacionais conforme protocolo.

## Fontes e redação

Buscar fontes primárias para afirmações específicas: documentação oficial de software e artigos originais. Conferir autoria, ano, veículo, DOI e o trecho que sustenta a afirmação. Uma lista de artigos no README não equivale a leitura realizada.

O [README do fork](https://github.com/sdavidbastos/judge0#citation) aponta o artigo “Robust and Scalable Online Code Execution System”, de Herman Zvonimir Došilović e Igor Mekterović, MIPRO 2020, DOI [10.23919/MIPRO48935.2020.9245310](https://doi.org/10.23919/MIPRO48935.2020.9245310). É ponto de partida; ler o texto antes de atribuir conclusões específicas.

Consultar manual institucional para estrutura e formatação. Quando solicitadas normas ou obrigações atuais, verificar fontes oficiais; não presumir edições ou regras locais. Distinguir contribuição própria, funcionalidades herdadas do Judge0 e bibliotecas utilizadas.

Marcar protocolo planejado, hipótese, exemplo sintético e resultado observado. Não preencher resultados com números plausíveis. Relatar limitações, divergências entre plano e execução e condições de reprodução sem expor pessoas.
