# CodeLab Web

Interface de prática do TCC em **React + TypeScript**, conectada ao backend
NestJS e ao Judge0. Editor Python, exemplos públicos, entrada personalizada,
saída esperada opcional e resultado real. Esta é a primeira tela do MVP,
inspirada no ambiente de resolução do LeetCode.

## Abrir com Docker

O backend e o Judge0 precisam estar iniciados. Na raiz deste repositório:

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
não atividades cadastradas por professor. Ainda não há login, turma, bateria
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

Os **21 testes Playwright** sobem Vite na porta 5174 e interceptam a API, sem
usar dados ou submissões reais. Cobrem DTO público, estados, falhas, retomada,
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
Repositório criado somente localmente, sem remoto nem commit inicial.
