import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { mockQuestions, question, snapshot } from '../helpers/questions-api';
import { csrf } from '../helpers/classrooms-api';
const detail = `/#/exercicios/${question.id}`;

test('teacher creates a draft with exact blank case values, code and CSRF; publishes and preserves old versions', async ({
  page,
}) => {
  const state = await mockQuestions(page, { empty: true });
  await page.goto('/#/exercicios');
  await expect(
    page.getByRole('heading', { name: 'Seu próximo desafio começa aqui' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Novo exercício', exact: true }).click();
  await page.getByLabel('Título do exercício').fill('Olá, programação');
  await page
    .getByRole('textbox', { name: 'Enunciado', exact: true })
    .fill('Escreva um programa sem saída para começar.');
  const code = page.getByRole('textbox', { name: 'Código inicial Python' });
  await code.fill('# código inicial\n');
  await page.getByRole('button', { name: 'Adicionar caso público' }).click();
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Olá, programação', exact: true })).toBeVisible();
  const created = state.requests.find((r) => r.path === '/api/questions' && r.method === 'POST');
  expect(created?.csrf).toBe(csrf);
  expect(created?.body).toMatchObject({
    language: 'python3',
    title: 'Olá, programação',
    starterCode: '# código inicial\n',
    testCases: [{ stdin: '', expectedOutput: '', explanation: '' }],
  });
  const id = state.questions[0].id;
  await page.getByRole('button', { name: 'Publicar versão 1' }).click();
  await page.getByRole('button', { name: 'Confirmar publicação' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Versão 1 publicada' })).toBeVisible();
  await expect(page.getByText('(entrada vazia)', { exact: true })).toBeVisible();
  await expect(page.getByText('(saída vazia)', { exact: true })).toBeVisible();
  await expect(page.getByLabel('Título do exercício')).toHaveCount(0);
  await page.getByRole('button', { name: 'Abrir novo rascunho' }).click();
  await page.getByLabel('Título do exercício').fill('Olá, programação revisada');
  await expect(page.getByRole('button', { name: 'Publicar versão 2' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Excluir rascunho' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Publicar versão 2' })).toBeEnabled();
  await page.getByRole('button', { name: 'Publicar versão 2' }).click();
  await page.getByRole('button', { name: 'Confirmar publicação' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Versão 2 publicada' })).toBeVisible();
  await page.getByRole('link', { name: 'Consultar versão 1', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Olá, programação', exact: true })).toBeVisible();
  await expect(page.getByText('Somente leitura', { exact: true })).toBeVisible();
  expect(page.url()).toContain(`${id}/versoes/1`);
  expect(state.versions.map((v) => v.title)).toEqual([
    'Olá, programação',
    'Olá, programação revisada',
  ]);
  expect(state.requests.filter((r) => r.path.endsWith('/publish'))).toHaveLength(2);
  expect(state.requests.filter((r) => r.method !== 'GET').every((r) => r.csrf === csrf)).toBe(true);
});

test('saved draft needs at least one case before publication and supports removal', async ({
  page,
}) => {
  const state = await mockQuestions(page);
  state.questions[0].testCases = [];
  await page.goto(detail);
  await expect(page.getByRole('button', { name: 'Publicar versão 1' })).toBeDisabled();
  await page.getByRole('button', { name: 'Adicionar caso público' }).click();
  await page.getByLabel('Entrada do caso 1').fill('42\n');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Publicar versão 1' })).toBeEnabled();
  await page.getByRole('button', { name: 'Remover caso 1', exact: true }).click();
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Publicar versão 1' })).toBeDisabled();
});

test('duplicate stdin and incompatible execution limits are rejected without a request', async ({
  page,
}) => {
  const state = await mockQuestions(page);
  await page.goto(detail);
  await page.getByRole('button', { name: 'Adicionar caso público' }).click();
  await page.getByLabel('Entrada do caso 2').fill(question.testCases[0].stdin);
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(/Não repita a mesma entrada/);
  await page.getByLabel('Entrada do caso 2').fill('4 5\n');
  await page.getByLabel('Tempo de parede (segundos)').fill('1');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(/Confira os limites/);
  expect(state.requests.filter((r) => r.method !== 'GET')).toHaveLength(0);
});

test('ambiguous failed save preserves text and code with no automatic resubmission', async ({
  page,
}) => {
  const state = await mockQuestions(page);
  let writes = 0;
  await page.route(
    (url) => url.pathname === `/api/questions/${question.id}`,
    async (route) => {
      if (route.request().method() !== 'PATCH') return route.fallback();
      writes++;
      return route.abort('connectionfailed');
    },
  );
  await page.goto(detail);
  await page.getByLabel('Título do exercício').fill('Meu texto preservado');
  await page.getByRole('textbox', { name: 'Código inicial Python' }).fill('# preservar edição');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(/Não foi possível confirmar a alteração/);
  await expect(page.getByLabel('Título do exercício')).toHaveValue('Meu texto preservado');
  await expect(page.getByRole('textbox', { name: 'Código inicial Python' })).toHaveText(
    '# preservar edição',
  );
  expect(writes).toBe(1);
  expect(state.questions[0].title).toBe(question.title);
});

test('pending save prevents a second POST, editing and navigation', async ({ page }) => {
  await mockQuestions(page, { empty: true });
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let writes = 0;
  await page.route(
    (url) => url.pathname === '/api/questions',
    async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      writes++;
      await gate;
      return route.fallback();
    },
  );
  await page.goto('/#/exercicios/novo');
  await page.getByLabel('Título do exercício').fill('Rascunho pendente');
  await page
    .getByRole('textbox', { name: 'Enunciado', exact: true })
    .fill('Enunciado de teste sem envio duplicado.');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Salvando…', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Título do exercício')).toBeDisabled();
  await expect(page.getByRole('textbox', { name: 'Código inicial Python' })).toHaveAttribute(
    'contenteditable',
    'false',
  );
  await page.getByRole('link', { name: 'Voltar aos exercícios', exact: true }).click();
  await expect(page).toHaveURL(/exercicios\/novo$/);
  expect(writes).toBe(1);
  release();
  await expect(page.getByRole('heading', { name: 'Rascunho pendente', exact: true })).toBeVisible();
});

test('unsaved changes prompt on navigation; declining preserves data; accepting leaves', async ({
  page,
}) => {
  await mockQuestions(page);
  await page.goto(detail);
  await page.getByLabel('Título do exercício').fill('Edição ainda não salva');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('link', { name: 'Minhas turmas', exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${question.id}$`));
  await expect(page.getByLabel('Título do exercício')).toHaveValue('Edição ainda não salva');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('link', { name: 'Minhas turmas', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Minhas turmas', exact: true })).toBeVisible();
});

test('unpublished draft deletion requires confirmation and uses CSRF', async ({ page }) => {
  const state = await mockQuestions(page);
  await page.goto(detail);
  await page.getByRole('button', { name: 'Excluir rascunho', exact: true }).click();
  await page.getByRole('button', { name: 'Manter rascunho' }).click();
  expect(state.questions).toHaveLength(1);
  await page.getByRole('button', { name: 'Excluir rascunho', exact: true }).click();
  await page.getByRole('button', { name: 'Excluir definitivamente' }).click();
  await expect(
    page.getByRole('heading', { name: 'Seu próximo desafio começa aqui' }),
  ).toBeVisible();
  expect(state.requests.find((r) => r.method === 'DELETE')?.csrf).toBe(csrf);
});

test('student deep links never fetch teacher resources or show authoring controls', async ({
  page,
}) => {
  const state = await mockQuestions(page, { student: true });
  await page.goto(detail);
  await expect(page.getByRole('heading', { name: 'Área do professor', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Exercícios', exact: true })).toHaveCount(0);
  expect(state.requests).toHaveLength(0);
});

test('server search, status and list pagination determine the visible records', async ({
  page,
}) => {
  const state = await mockQuestions(page);
  state.questions = Array.from({ length: 13 }, (_, i) => ({
    ...structuredClone(question),
    id: crypto.randomUUID(),
    title: `Desafio ${i + 1}`,
  }));
  await page.goto('/#/exercicios');
  await expect(page.getByText('Página 1 de 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Abrir exercício Desafio 13', exact: true }),
  ).toBeVisible();
  await page.getByLabel('Buscar exercício', { exact: true }).fill('Desafio 3');
  await page.getByLabel('Estado do exercício').selectOption('DRAFT');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(
    page.getByRole('link', { name: 'Abrir exercício Desafio 3', exact: true }),
  ).toBeVisible();
  expect(state.requests.at(-1)?.query).toContain('page=1');
  expect(state.requests.at(-1)?.query).toContain('status=DRAFT');
  await page.getByLabel('Estado do exercício').selectOption('PUBLISHED');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Nenhum exercício encontrado' })).toBeVisible();
});

test('version history is paginated and historical pages render hostile content as text', async ({
  page,
}) => {
  const state = await mockQuestions(page, { published: true });
  const hostile = '<img src=x onerror="window.attacked=true">';
  state.versions = Array.from({ length: 6 }, (_, i) =>
    snapshot({ ...question, statement: hostile }, i + 1),
  );
  state.questions[0].latestVersionNumber = 6;
  await page.goto(detail);
  await expect(page.getByRole('link', { name: 'Consultar versão 6', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await page.getByRole('link', { name: 'Consultar versão 1', exact: true }).click();
  await expect(page.getByText(hostile, { exact: true })).toBeVisible();
  await expect(page.locator('main img')).toHaveCount(0);
  expect(await page.evaluate(() => 'attacked' in window)).toBe(false);
  await expect(page.getByRole('button', { name: 'Salvar rascunho', exact: true })).toHaveCount(0);
});

test('malformed question responses are rejected and can be queried again', async ({ page }) => {
  await mockQuestions(page);
  let malformed = true;
  await page.route(
    (url) => url.pathname === `/api/questions/${question.id}`,
    (route) =>
      malformed
        ? route.fulfill({ json: { ...question, cpuTimeLimitSeconds: 99 } })
        : route.fallback(),
  );
  await page.goto(detail);
  await expect(page.getByRole('heading', { name: 'Exercício indisponível' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText(/dados inesperados/);
  malformed = false;
  await page.getByRole('button', { name: 'Consultar exercício novamente' }).click();
  await expect(page.getByLabel('Título do exercício')).toHaveValue(question.title);
});

test('publication failure stays in the dialog and never pretends success or retries', async ({
  page,
}) => {
  await mockQuestions(page);
  let writes = 0;
  await page.route(
    (url) => url.pathname.endsWith('/publish'),
    (route) => {
      writes++;
      return route.fulfill({ status: 409, json: {} });
    },
  );
  await page.goto(detail);
  await page.getByRole('button', { name: 'Publicar versão 1' }).click();
  await page.getByRole('button', { name: 'Confirmar publicação' }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toHaveText(/Não foi possível publicar/);
  expect(writes).toBe(1);
  await page.getByRole('button', { name: 'Continuar no rascunho' }).click();
  await expect(page.getByLabel('Título do exercício')).toHaveValue(question.title);
});

test('expired teacher session removes question content and returns to login', async ({ page }) => {
  await mockQuestions(page);
  await page.goto(detail);
  await expect(page.getByLabel('Título do exercício')).toBeVisible();
  await page.route(
    (url) => url.pathname.endsWith('/publish'),
    (route) => route.fulfill({ status: 401, json: {} }),
  );
  await page.getByRole('button', { name: 'Publicar versão 1' }).click();
  await page.getByRole('button', { name: 'Confirmar publicação' }).click();
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await expect(page.getByLabel('Título do exercício')).toHaveCount(0);
});

test('desktop and mobile authoring and historical views remain readable without horizontal overflow', async ({
  page,
}) => {
  const state = await mockQuestions(page);
  mkdirSync('docs/evidencias', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(detail);
  await expect(page.getByRole('textbox', { name: 'Código inicial Python' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Código inicial Python' }).click();
  await page.getByLabel('Título do exercício').click();
  await page.screenshot({ path: 'docs/evidencias/F03-editor-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('textbox', { name: 'Código inicial Python' }).click();
  await page.getByLabel('Título do exercício').click();
  await expect(page.getByLabel('Título do exercício')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'docs/evidencias/F03-editor-mobile.png', fullPage: true });
  state.versions.push(snapshot(question, 1));
  await page.goto(`${detail}/versoes/1`);
  await expect(page.getByText('Somente leitura', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'docs/evidencias/F03-versao-mobile.png', fullPage: true });
});
