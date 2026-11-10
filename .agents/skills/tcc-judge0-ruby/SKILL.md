---
name: tcc-judge0-ruby
description: Desenvolver e revisar o executor Judge0 em Ruby no TCC, incluindo API técnica, jobs de execução, Isolate/cgroups, limites, configuração Docker e testes do motor. Use para alterações internas do fork; backend educacional NestJS e frontend React pertencem às skills TypeScript.
---

# Executor Judge0 do TCC

## Escopo vigente

Esta skill trata do fork `sdavidbastos/judge0`, cujo código Ruby permanece no repositório próprio `judge0`. Autenticação de alunos/professores, turmas e tentativas educacionais pertencem ao NestJS no repositório separado `codelab-api`; a interface pertence ao React no repositório `codelab-web`. A aplicação Rails educacional anterior não é a base de novas funcionalidades.

1. Ler `AGENTS.md`, plano ativo, `Gemfile.lock`, configuração, rotas/jobs e testes pertinentes. Conferir o estado real da imagem e do checkout; a versão do produto Judge0 não identifica sozinha Ruby, Rails e Isolate.
2. Para contrato HTTP, leitura/armazenamento de Base64 e integração, ler [API Judge0](references/judge0.md). Não presumir que o fork equivale ao upstream ou que todos os endpoints retornam JSON.
3. Para mudanças no julgamento, isolamento ou limpeza, ler [verificação](references/verificacao.md). Selecionar regressões de ciclo de vida e execução real que demonstrem o comportamento alterado, distinguindo mocks de sandbox real.
4. Preservar contratos existentes e a compatibilidade documentada; não atualizar a stack do motor incidentalmente para acompanhar a plataforma TypeScript. Verificar versões/correções oficiais antes de orientar implantação.

## Arquitetura e invariantes

- A API recebe submissões técnicas; jobs existentes executam no Isolate e persistem resultado técnico. Uma submissão não equivale à tentativa pedagógica agrupada do aluno.
- Seguir as convenções Ruby/Rails e o mecanismo de jobs existentes no fork. Manter configuração, execução, leitura de metadados e classificação testáveis; evitar refatoração ampla sem necessidade demonstrada.
- Executar código recebido somente no sandbox. Não resolver incompatibilidade desligando isolamento, controles de rede ou limites. Testes Nest/React não comprovam essas proteções.
- Proteger o ciclo de vida do sandbox: validar inicialização/diretório antes de limpar; manter reserva/lock até encerrar uso/limpeza; não permitir que jobs concorrentes compartilhem slot inadvertidamente.
- Preservar a semântica de saída vazia, normalização textual, UTF-8 e precedência de erros sobre igualdade da saída. Estado desconhecido ou erro interno não pode virar aceito ou resposta errada por conveniência.
- O motor é acessado pela plataforma por HTTP. Não adicionar usuários, turmas ou autorização docente nas tabelas internas para contornar a camada Nest.
- O contexto de build do motor exclui aplicações/pacotes educacionais, skills, segredos e dependências Node. Credenciais ficam fora do Git e de logs; não remover volumes para testar ou corrigir instalação.

Para regras educacionais ou visibilidade por aluno/professor, usar `tcc-plataforma-typescript`/`tcc-backend-nestjs`. Para objetivos, feedback e avaliação científica, usar `tcc-programacao-pedagogia`. Relatar versões, comando, resultado e limites efetivos da validação.
