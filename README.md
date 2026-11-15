# CodeLab Web

Interface do TCC em **React + TypeScript**, com prática Python, login, turmas,
matrículas e autoria de exercícios versionados conectados ao backend NestJS.
A prática livre oferece editor Python, exemplos públicos, entrada personalizada,
saída esperada opcional e resultado real.

## Abrir com Docker

O backend precisa estar iniciado. Para executar programas na prática livre,
inicie também o Judge0; turmas, exercícios e login funcionam sem o executor. Na raiz deste repositório:

```bash
./scripts/web up
```

Abra **http://localhost:5173**. O comando constrói a SPA e inicia Nginx como
usuário sem privilégios, publicado somente em localhost. Não precisa instalar
Node no host para abrir a interface. O proxy `/api` encaminha ao NestJS pela
rede Docker `tcc-nest-api_default`; o navegador não chama o Judge0.

Se precisar iniciar o backend, no workspace local:

```bash
cd ../codelab-api
./scripts/api up
cd ../codelab-web
./scripts/web up
```

O executor deve ter sido iniciado pelo seu próprio guia no repositório Judge0.
O frontend não altera bancos, configurações nem volumes dos outros projetos.

```bash
./scripts/web ps
./scripts/web logs
./scripts/web stop
```

Após editar fontes, execute `up` novamente para reconstruir a imagem. A porta
externa pode ser alterada com `CODELAB_WEB_HTTP_PORT`. A rede do backend pode
ser informada por `CODELAB_BACKEND_NETWORK`; o serviço de API esperado pelo
proxy é `tcc-nest-api-api-1:3000`.

## Usar o MVP

1. Escolha **Olá, mundo**, **Soma de dois números** ou **Maior de três números**.
2. Edite o exemplo Python. Use os casos públicos ou sua própria entrada.
3. Marque **Comparar saída esperada** para testar uma saída; string vazia é
   válida. Desmarque para apenas executar o programa.
4. Clique em **Executar código** ou use Ctrl+Enter / ⌘+Enter no editor.
5. Veja stdout, diagnóstico, tempo e memória na aba **Resultado**.

Tab indenta no editor; Esc seguido de Tab permite sair usando teclado. O
rascunho é salvo por exemplo neste navegador, quando o armazenamento estiver
disponível. Restaurar o exemplo exige confirmação. O resultado pertence ao
snapshot enviado; a tela avisa se o código/entrada mudou depois.

Em falha de consulta, **Consultar novamente** usa somente GET. Não há reenvio
automático de POST. A última execução conhecida pode ser retomada após reload.
O ID e o snapshot locais ajudam a exibir o resultado correto; o resultado vem
do PostgreSQL pela API. O polling para após cerca de 30 segundos, além dos
prazos individuais de rede, e oferece retomada manual.

Cada clique executa **um caso de prática**. Os exemplos são um catálogo local,
não atividades cadastradas por professor. A prática é independente de login/turmas. Não há bateria
oculta, entrega avaliativa ou nota. Accepted sem saída esperada indica que o
programa terminou sem erro. Falha operacional não reprova uma solução.

## Desenvolver

Node 24 (versão em `.node-version`) e npm:

```bash
npm ci --ignore-scripts
npm run dev -- --port 5175 --strictPort
```

Abra http://localhost:5175 para edição com atualização automática, mantendo
a versão Docker na porta 5173. O proxy de desenvolvimento usa a API local na
porta 3001. Outro destino pode ser passado no shell:

```bash
API_PROXY_TARGET=http://127.0.0.1:3001 npm run dev -- --port 5175
```

Esse endereço é configuração do servidor de desenvolvimento; não é uma chave
ou URL privada distribuída no JavaScript do navegador. Não colocar segredos em
variáveis `VITE_*`. O frontend sempre solicita caminhos relativos `/api`.

## Verificar

```bash
npm run format:check
npm run typecheck
npm run build
npx playwright install chromium
npm test
```

Os **53 testes Playwright** sobem Vite na porta 5174 e interceptam a API, sem
usar dados ou submissões reais. Cobrem login/CSRF, papéis, turmas, matrículas,
exercícios e versões, DTO público, estados, falhas, retomada,
snapshot, rascunhos, teclado, mobile, armazenamento indisponível e saída segura.
Para usar um Chrome já instalado, configure
`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/usr/bin/google-chrome`.

Com frontend Docker, NestJS e Judge0 ativos, há uma verificação separada:

```bash
npm run test:real
```

Esse teste **cria duas execuções sintéticas reais** pelo navegador: hello e
stdin UTF-8. A CI configura somente testes simulados; não depende de sandbox
privilegiado. A configuração de CI ainda não foi executada remotamente.

Arquitetura e evidências estão em [F01](docs/F01_INTERFACE_REACT.md).
Repositório local, sem publicação remota.

## Turmas, matrículas e login — F02

Abra **http://localhost:5173/#/turmas**, ou clique em **Turmas** no editor.
Entre com sua conta existente:

- Professor: crie/edite turmas, matricule alunos pelo e-mail cadastrado e remova
  matrículas com confirmação. Busca, totais e paginação vêm do servidor.
- Aluno: consulte suas turmas e respectivos detalhes. A lista de colegas e os
  controles docentes não são exibidos.

O professor é provisionado por `./scripts/api create-teacher` no backend;
alunos usam o cadastro B04. Esta interface não inclui cadastro de conta.
Logout/expiração são reais; a sessão usa cookie HttpOnly e CSRF da API.
Credenciais não ficam no armazenamento do navegador.

Há uma verificação própria com API/PostgreSQL descartáveis, sem o Judge0:

```bash
npm run test:classrooms:real
```

Requer Node 24, Docker e `../codelab-api`, com portas 3006/5176 livres. Cria
somente fixtures sintéticas e limpa sua infraestrutura ao terminar. Não usa
credenciais, volumes ou banco de desenvolvimento. O comando `test:real` anterior
continua sendo exclusivo para as duas execuções de prática no Judge0 ativo.

Contrato, configuração e evidências estão no [guia F02](docs/F02_TURMAS_MATRICULAS.md).

## Exercícios e versões — F03

Abra **http://localhost:5173/#/exercicios** e entre como professor. A aba
**Exercícios** também fica disponível na navegação da área autenticada.

1. Clique em **Novo exercício** e preencha título, enunciado e os campos opcionais.
2. Prepare o código inicial Python, os limites e os casos públicos de entrada/saída.
3. **Salvar rascunho** persiste a edição. Para publicar, salve pelo menos um caso.
4. **Publicar versão** preserva o conteúdo e os casos daquele momento.
5. Use **Abrir novo rascunho** para revisar; consulte as publicações anteriores
   no **Histórico de versões**, em modo de leitura.

Busca, filtro e paginação consultam a API. Somente rascunhos nunca publicados
podem ser excluídos. Alterações não salvas pedem confirmação ao sair; falhas de
salvamento preservam os campos, sem reenvio automático. O rascunho de autoria
fica em memória até ser salvo no servidor.

A publicação ainda não vincula o exercício a turmas nem cria atividades para
alunos. Os casos desta etapa são públicos; casos ocultos e avaliação vêm nas
próximas etapas. A prática livre mantém seu catálogo independente.

Para validar com backend B07 e PostgreSQL descartáveis:

```bash
npm run test:questions:real
```

Usa os mesmos requisitos e portas do teste real de turmas; execute os dois
comandos separadamente. Não requer Judge0 nem usa o banco de desenvolvimento.
Detalhes e evidências no [guia F03](docs/F03_EXERCICIOS_VERSOES.md).
