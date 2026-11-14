# F02 — interface de turmas e matrículas

Entrega de 14 de novembro de 2026 no repositório local `codelab-web`, solicitada
antes da B07 para usar as funcionalidades B05/B06 já implementadas no NestJS.

## Abrir e usar

Com o backend B06 ativo, execute `./scripts/web up` e abra
**http://localhost:5173/#/turmas**. A prática livre permanece em `/` ou `#hello`;
o link **Turmas** no editor abre a área autenticada. Não é preciso iniciar o
Judge0 para usar login, turmas e matrículas; ele continua necessário para executar
programas na prática livre.

1. Entre com uma conta existente de professor ou aluno.
2. **Professor:** use Nova turma para preencher nome/descrição. Abra a turma,
   edite suas informações e matricule alunos pelo e-mail de contas já cadastradas.
3. A lista de alunos é paginada. Remover abre uma confirmação; cancelar preserva
   o vínculo. A API revoga a matrícula sem apagar o registro; adicioná-la novamente
   reativa o mesmo vínculo.
4. **Aluno:** a listagem e o detalhe mostram suas turmas. Não há controles de
   administração nem consulta à lista de colegas.
5. Sair revoga a sessão. Recarregar a página recupera a sessão válida pela API.

O professor é criado pelo procedimento administrativo já existente:
`../codelab-api/scripts/api create-teacher`. Alunos usam o cadastro B04 do backend.
Esta fatia não acrescenta cadastro público na interface nem cria contas docentes
pelo navegador. Não há credenciais padrão incluídas no frontend.

## Navegação e apresentação

O tema escuro e verde da prática foi mantido. Login, lista de turmas, detalhe,
formulários e tabela de alunos têm layout adaptável. A interface exibe somente
registros retornados pela API, sem turmas ou alunos de demonstração no produto.

Rotas hash preservam os links F01 de exercícios e não exigem configurar caminhos
no proxy: `#/turmas` e `#/turmas/:uuid`. Voltar/avançar do navegador funciona;
rotas desconhecidas mostram uma página de erro. A prática foi extraída para
`PracticePage`, preservando editor, rascunhos, snapshots e retomada de execução.

Busca e paginação de turmas e matrículas são consultas reais ao servidor. Totais
vêm da projeção autorizada; não se estima quantidade de alunos na lista de turmas.
Nomes, descrições e e-mails são texto React, sem interpretação de HTML.

## Estado, contrato e sessão

- `features/auth`: Context de sessão, login, logout e contrato validado em runtime.
  A consulta inicial protegida usa GET `/api/auth/me`; a prática não exige essa consulta.
- No evento de login, GET `/api/auth/csrf` prepara o cookie e o CSRF; POST login
  envia o token no header. O CSRF renovado é usado nas mutações seguintes.
- Cookie HttpOnly é gerenciado pelo navegador. Senha e CSRF ficam somente na
  memória necessária ao fluxo; a senha é limpa depois da tentativa. Nenhuma
  identidade, senha, cookie ou CSRF é gravado em localStorage/sessionStorage.
- Expiração local e resposta 401 limpam a visão privada e mostram login mantendo
  o destino da navegação. Logout que falha não é apresentado como concluído.
- `shared/api/http`: transporte `/api` com `credentials: same-origin`, timeout,
  erros sanitizados e nenhuma repetição automática de escrita.
- `features/classrooms`: contratos públicos próprios, hooks de consulta/mutação,
  componentes de lista, detalhe, formulários e matrículas. Não importa código,
  Prisma ou configuração privada do checkout do backend.
- Consultas têm cancelamento ao desmontar/trocar destino. A chave inclui ator e
  caminho, evitando exibir resposta anterior em outra turma. Mutações são ações
  explícitas, com bloqueio durante o envio. Falhas preservam os campos; confirmação
  perdida orienta consultar os dados antes de reenviar.
- Controles por papel são conveniência da interface. A autorização efetiva continua
  na B06, inclusive em listas, detalhes, totais e alterações.

Modais usam dialog nativo, rótulos, foco inicial no campo, Escape e restauração
de foco. Formulários indicam erros por texto; sucesso não depende somente de cor.
A tabela se adapta ao celular sem expor dados adicionais para alunos.

## Verificação

- Tipos, build Vite e formatação aprovados.
- **39 testes Playwright com API simulada**: 21 regressões da prática F01 e
  18 de login/turmas. Cobrem protocolo CSRF, papéis, busca/paginação, teclado,
  erros, payloads, expiração/logout, armazenamento, texto seguro e viewport móvel.
- **1 fluxo real de navegador com NestJS/PostgreSQL descartável**, sem mocks de
  API: cadastro sintético de aluno, login docente, criação/edição de turma,
  matrícula, sessão após reload, acesso discente, revogação, perda de acesso,
  reativação e logout persistido após reload. Confere cookie HttpOnly com Path=/api.
- Capturas desktop/móvel inspecionadas; sem overflow horizontal em 390 px.
- Nenhuma nova execução Judge0 nesta fatia. Os testes comuns de prática simulam
  execução; não são evidência de isolamento ou aprendizagem.

```bash
npm run format:check
npm run build
npm test
npm run test:classrooms:real
```

O último comando requer Node 24, Docker e o checkout irmão `codelab-api` (ou
`CODELAB_API_CHECKOUT` explícito). Constrói sua imagem de teste, inicia PostgreSQL
em tmpfs, aplica migrações e cria somente contas sintéticas, com credenciais
temporárias privadas. A API aceita exclusivamente TEST_DATABASE_URL do destino
descartável. Usa portas locais 3006 e 5176; se estiverem ocupadas, encerre apenas
o conflito conhecido antes de executar. Não reinicia nem limpa a stack de desenvolvimento.

O runner remove seus containers/rede e os arquivos temporários ao terminar.
Somente uma falha de limpeza mantém a configuração privada para recuperação.
Não usa o banco/credenciais de desenvolvimento, não envia programas ao motor e
não registra tokens em traces. Os testes simulados e os testes reais têm saídas
separadas em `test-results`, ignorado pelo Git.

Evidências: [F02.json](evidencias/F02.json), [professor desktop](evidencias/F02-professor.png),
[login móvel](evidencias/F02-login-mobile.png), [turma móvel](evidencias/F02-turma-mobile.png).
A prévia integrada do aplicativo não estava disponível; a verificação visual usou
as capturas do navegador de teste e a versão local servida por Docker.

## Limites

Não há autoinscrição, convites, exclusão/transferência de turma, atividades,
exercícios versionados, casos ocultos ou nota. B07 permanece como próxima tarefa
do backend. Não houve publicação remota, criação de remoto ou novo commit nesta
entrega. A infraestrutura e os dados existentes dos demais repositórios foram preservados.
