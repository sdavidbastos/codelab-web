---
name: tcc-programacao-pedagogia
description: Projetar exercícios de programação, baterias de testes, rubricas, feedback formativo e indicadores docentes para o TCC com Judge0. Use também para planejar a avaliação científica desse ambiente e, quando solicitado, o uso pedagógico de IA.
---

# Ensino e avaliação no ambiente de programação do TCC

## Propósito

Apoiar alunos na prática de programação e professores na interpretação de evidências de aprendizagem. O sistema recebe código, executa casos no Judge0 e apresenta acertos e dificuldades. Aprovação em testes é evidência de correção funcional nas entradas avaliadas; não comprova, por si só, compreensão, autoria, legibilidade ou eficiência assintótica.

Trabalhar em português brasileiro. O contexto confirmado é Linguagem de Programação 1 no ensino superior, com Python 3 inicial. Experiência anterior e ementa continuam a confirmar; não inferir domínio prévio apenas pelo nome da disciplina.

## Escolher a referência pela tarefa

- Para criar ou revisar exercícios, testes, rubricas, feedback e painéis docentes: [references/atividades.md](references/atividades.md).
- Para problema de pesquisa, metodologia, métricas, instrumentos e redação do TCC: [references/pesquisa.md](references/pesquisa.md).
- Para tutor, dicas ou avaliação assistida por IA, somente quando solicitado: [references/ia.md](references/ia.md).

Ler apenas as referências pertinentes. Se a solicitação envolver implementação, traduzir decisões pedagógicas em regras verificáveis na plataforma NestJS/React e usar `tcc-plataforma-typescript`, `tcc-backend-nestjs` ou `tcc-frontend-react` conforme a camada. Usar `tcc-judge0-ruby` somente para mudanças internas do executor.

## Procedimento

1. Identificar o resultado observável desejado: resolver um problema, compreender um conceito, depurar um erro ou permitir uma intervenção docente.
2. Usar requisitos existentes de turma, linguagem, nível e avaliação. Perguntar somente por lacunas que alterem materialmente a entrega; avançar no restante.
3. Relacionar objetivo, tarefa, evidência e feedback. Distinguir o que é medido automaticamente do que depende de análise docente.
4. Produzir o artefato solicitado: exercício utilizável, matriz de casos, rubrica, especificação de painel, protocolo de estudo ou texto acadêmico fundamentado.
5. Verificar ambiguidades de entrada/saída, coerência dos gabaritos, casos de fronteira, visibilidade de testes e cálculo da nota. Não declarar validação por execução se houve apenas análise manual.
6. Explicar hipóteses, critérios de aceite e pendências que afetem validade ou uso do artefato.

## Invariantes pedagógicas

- Explicitar o comportamento esperado antes de avaliar. Testes ocultos verificam o contrato publicado, sem requisitos surpresa.
- Distinguir avaliação formativa de atividade com nota. O professor define tentativas, prazos, dicas e divulgação de respostas.
- Não penalizar falha de infraestrutura; preservar a tentativa e permitir retomada sem consumir injustamente uma oportunidade.
- Usar feedback específico e acionável. Não revelar soluções completas ou dados de testes ocultos fora da política da atividade.
- Oferecer interpretação docente, não rótulos automáticos como “aluno fraco” ou “não aprendeu”. Quantidade de tentativas e tempo de sessão têm explicações alternativas.
- Não inferir plágio ou autoria a partir de similaridade ou uso de IA sem revisão e evidências adicionais.
- Manter o núcleo do TCC viável. A referência ao LeetCode não obriga reproduzir todo o produto.
- Não inventar fontes, dados, participantes, resultados experimentais ou aprovações institucionais. Separar hipótese, protocolo, simulação e observação real.
