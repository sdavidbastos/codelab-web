# Contrato do executor e integração com Judge0

Escopo atual: o executor continua Ruby; a plataforma educacional usa NestJS/TypeScript e React/TypeScript. A seção de evidências abaixo é histórica; confirmar o contrato no código local e na instalação atual antes de implementar.

No fork já observado, `/version` retorna texto simples. `/languages`, criação e consulta de submissões usam JSON. Não aplicar o mesmo parser indiscriminadamente a todos os endpoints.

## Evidências consultadas em 4 de novembro de 2026

O fork é [sdavidbastos/judge0](https://github.com/sdavidbastos/judge0). A consulta remota é uma fotografia de `master`, não uma inspeção do futuro checkout local. Reconfirmar quando houver código local:

- O [Gemfile](https://github.com/sdavidbastos/judge0/blob/master/Gemfile) declara Rails `~> 6.1`, PostgreSQL, Redis, Resque e Resque Scheduler. Consultar o lockfile e imagens para versões instaladas.
- As [rotas](https://github.com/sdavidbastos/judge0/blob/master/config/routes.rb) incluem submissões individuais e batch, linguagens, estados e informações de configuração.
- O modelo [Submission](https://github.com/sdavidbastos/judge0/blob/master/app/models/submission.rb) representa uma execução, com código, entrada, saída esperada, token, resultado e limites. Seus acessores fazem codificação interna; distinguir armazenamento e transporte HTTP.

A presença dessas rotas não demonstra a existência de autenticação educacional, turmas, exercícios ou painel docente. Inspecionar antes de concluir o que falta.

## Contrato HTTP a confirmar

A [documentação oficial](https://ce.judge0.com/) descreve uma versão de referência, que pode divergir do fork:

- Consultar `/languages`, `/statuses`, `/config_info` e `/version`; não fixar IDs de linguagem copiados de exemplos.
- `POST /submissions` recebe `source_code`, `language_id`, `stdin` e `expected_output`, entre outros campos; devolve token para consulta em `GET /submissions/{token}`.
- Estados de referência: 1 em fila, 2 processando, 3 aceito, 4 resposta incorreta, 5 limite de tempo, 6 erro de compilação, 7–12 erros de execução, 13 erro interno e 14 erro de formato de execução. Confirmar os estados da instalação; desconhecidos exigem tratamento explícito.
- Tempo de CPU e de parede são expressos em segundos; memória, em kilobytes. Documentar conversões na interface.
- Aceito sem comparação de saída não demonstra correção da resposta.

Segundo a [documentação de criação](https://github.com/judge0/judge0/blob/master/docs/api/submissions/create_a_submission.md), preferir envio assíncrono a `wait=true`. Quando `base64_encoded=true`, codificar todos os campos textuais de entrada desse contrato, incluindo código, entrada e saída esperada quando presentes. Tratar explicitamente a codificação da consulta de resultados. No adapter Nest, usar UTF-8/Base64 explicitamente, por exemplo `Buffer.from(text, 'utf8').toString('base64')`; no código Ruby interno, `Base64.strict_encode64` quando pertinente. Codificar uma vez na fronteira HTTP.

Segundo a [documentação de batch](https://github.com/judge0/judge0/blob/master/docs/api/submissions/create_a_submission_batch.md), o corpo usa `submissions`. Um HTTP 201 pode conter tokens e erros de validação por item. Examinar cada posição e persistir sua associação com o caso enviado; não considerar o lote inteiro aceito apenas pelo status HTTP. Na coleta, correlacionar resultados por token e confirmar o formato da versão em uso.

## Fluxo proposto para a plataforma

1. Autorizar aluno e atividade; validar tamanho do código e linguagem.
2. Persistir a tentativa e a versão dos testes/políticas; enfileirar após confirmação da transação, com recuperação de tentativas não despachadas.
3. Criar uma execução por caso com limites definidos pelo servidor; enviar em lotes compatíveis com a instância ou individualmente.
4. Persistir tokens e erros por caso. Coletar com backoff, jitter e prazo total, sem manter uma requisição web aberta.
5. Atualizar idempotentemente. Se usar callback, validar procedência e associação; sem autenticação confiável, usá-lo como sinal para consultar o resultado no Judge0.
6. Agregar apenas resultados terminais conhecidos e consistentes; publicar uma projeção de dados apropriada ao perfil.

Uma falha de rede após POST pode ocorrer depois de o Judge0 criar a execução. Não há garantia de deduplicação porque o cliente repetiu o pedido. Registrar despachos e tratar essa janela como envio incerto; retries cegos podem duplicar execução e custo. Duplicatas não podem duplicar nota ou contagem de tentativas.

## Limites e isolamento

Permitir apenas os campos necessários no pedido do aluno. O backend escolhe URL do executor, gabarito, limites e opções. Não encaminhar `callback_url`, arquivos adicionais ou opções arbitrárias de compilação sem funcionalidade explícita e validada.

A [configuração do upstream](https://github.com/judge0/judge0/blob/master/judge0.conf) prevê controles de rede e limites. Para exercícios convencionais, configurar `ENABLE_NETWORK=false` e `ALLOW_ENABLE_NETWORK=false`, além de limites de CPU, parede, memória, processos, arquivos e fila adequados às linguagens. Confirmar suporte no fork. Restringir também conectividade externa da infraestrutura; uma flag de API não substitui essa fronteira.

Manter chaves no servidor e executor sem acesso a segredos ou bancos da aplicação. Não enviar pedidos autenticados a uma URL fornecida pelo aluno. Limitar concorrência e frequência por usuário/turma e truncar saídas com indicação na UI.

Consultar [releases](https://github.com/judge0/judge0/releases) e [avisos de segurança](https://github.com/judge0/judge0/security/advisories) antes de implantar: há histórico de correções de escape de sandbox. Uma versão mínima em documento antigo não garante segurança atual. Não alterar privilégios do host ou desligar isolamento como solução improvisada.
