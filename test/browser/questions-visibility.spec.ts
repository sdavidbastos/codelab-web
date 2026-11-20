import { expect, test } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { csrf } from '../helpers/classrooms-api';
import { mockQuestions, privateMarker, question, snapshot } from '../helpers/questions-api';
const detail = `/#/exercicios/${question.id}`;
const preview = `${detail}/versoes/1/previa`;

test('mixed draft saves explicit visibility and policy, confirms counts and previews only the server projection', async ({
  page,
}) => {
  const state = await mockQuestions(page, { hidden: true });
  await page.goto(detail);
  await expect(page.getByLabel('Visibilidade do caso 1')).toHaveValue('HIDDEN');
  await expect(page.getByLabel('Visibilidade do caso 2')).toHaveValue('PUBLIC');
  await expect(page.getByRole('status').filter({ hasText: '1 público · 1 oculto' })).toBeVisible();
  await page.getByLabel('Título do exercício').fill('Soma com bateria mista');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Publicar versão 1' })).toBeEnabled();
  const saved = state.requests.find((item) => item.method === 'PATCH');
  expect(saved?.csrf).toBe(csrf);
  expect(saved?.body).toMatchObject({
    comparisonPolicy: 'judge0_text_rstrip_v1',
    testCases: [
      {
        visibility: 'HIDDEN',
        stdin: privateMarker + '_entrada',
        expectedOutput: privateMarker + '_esperado',
      },
      { visibility: 'PUBLIC', stdin: question.testCases[0].stdin },
    ],
  });
  await page.getByRole('button', { name: 'Publicar versão 1' }).click();
  await expect(page.getByRole('dialog')).toContainText('1 público · 1 oculto');
  await page.getByRole('button', { name: 'Confirmar publicação' }).click();
  await expect(page.getByText('Oculto · apenas para o professor', { exact: true })).toBeVisible();
  const start = state.requests.length;
  await page.getByRole('link', { name: 'Prévia do aluno', exact: true }).click();
  await expect(page.getByText('PRÉVIA DO ALUNO · VERSÃO 1', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Caso 1', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Caso 2', exact: true })).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText(privateMarker);
  await expect(page.getByLabel('Entrada publicada do caso 1')).toHaveText('2 3\n');
  expect([...new Set(state.requests.slice(start).map((item) => item.path))]).toEqual([
    `/api/questions/${question.id}/versions/1/preview`,
  ]);
  expect(
    await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })),
  ).not.toContain(privateMarker);
});

test('hidden-only drafts can be saved but publication waits for a saved public example', async ({
  page,
}) => {
  await mockQuestions(page, { hidden: true });
  await page.goto(detail);
  await page.getByLabel('Visibilidade do caso 2').selectOption('HIDDEN');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Publicar versão 1' })).toBeDisabled();
  await expect(
    page.getByText('Adicione e salve pelo menos um caso público para publicar.', { exact: true }),
  ).toBeVisible();
  await page.getByLabel('Visibilidade do caso 1').selectOption('PUBLIC');
  await expect(page.getByRole('button', { name: 'Publicar versão 1' })).toBeDisabled();
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Publicar versão 1' })).toBeEnabled();
});

test('visibility is an unsaved edit and canceling navigation preserves it', async ({ page }) => {
  await mockQuestions(page);
  await page.goto(detail);
  await page.getByLabel('Visibilidade do caso 1').selectOption('HIDDEN');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('link', { name: 'Voltar aos exercícios', exact: true }).click();
  await expect(page.getByLabel('Visibilidade do caso 1')).toHaveValue('HIDDEN');
  await expect(page.getByRole('status').filter({ hasText: 'Alterações não salvas' })).toBeVisible();
});

test('save failure preserves hidden text and visibility without retry', async ({ page }) => {
  await mockQuestions(page, { hidden: true });
  let writes = 0;
  await page.route(
    (url) => url.pathname === `/api/questions/${question.id}`,
    (route) => {
      if (route.request().method() !== 'PATCH') return route.fallback();
      writes++;
      return route.abort('connectionfailed');
    },
  );
  await page.goto(detail);
  await page.getByLabel('Entrada do caso 1').fill(privateMarker + '_edição');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível confirmar');
  await expect(page.getByLabel('Entrada do caso 1')).toHaveValue(privateMarker + '_edição');
  await expect(page.getByLabel('Visibilidade do caso 1')).toHaveValue('HIDDEN');
  expect(writes).toBe(1);
});

test('different visibilities do not allow duplicate stdin', async ({ page }) => {
  const state = await mockQuestions(page, { hidden: true });
  await page.goto(detail);
  await page.getByLabel('Entrada do caso 1').fill(question.testCases[0].stdin);
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Não repita a mesma entrada');
  expect(state.requests.filter((item) => item.method !== 'GET')).toHaveLength(0);
});

test('earlier preview remains immutable after a formerly hidden case becomes public in a new version', async ({
  page,
}) => {
  await mockQuestions(page, { hidden: true, published: true });
  await page.goto(detail);
  await page.getByRole('button', { name: 'Abrir novo rascunho' }).click();
  await page.getByLabel('Visibilidade do caso 1').selectOption('PUBLIC');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Publicar versão 2' })).toBeEnabled();
  await page.getByRole('button', { name: 'Publicar versão 2' }).click();
  await page.getByRole('button', { name: 'Confirmar publicação' }).click();
  await page.getByRole('link', { name: 'Prévia do aluno', exact: true }).click();
  await expect(page.locator('main')).toContainText(privateMarker);
  await page.goto(preview);
  await expect(page.getByText('PRÉVIA DO ALUNO · VERSÃO 1', { exact: true })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(privateMarker);
});

test('preview failure offers only a new GET and 401 removes its private session view', async ({
  page,
}) => {
  const state = await mockQuestions(page, { published: true, hidden: true });
  let outcome: 'failed' | 'ready' | 'expired' = 'failed';
  await page.route(
    (url) => url.pathname.endsWith('/preview'),
    (route) => {
      if (outcome === 'failed') return route.fulfill({ status: 503, json: {} });
      if (outcome === 'expired') return route.fulfill({ status: 401, json: {} });
      return route.fallback();
    },
  );
  await page.goto(preview);
  await expect(page.getByRole('heading', { name: 'Prévia indisponível' })).toBeVisible();
  outcome = 'ready';
  await page.getByRole('button', { name: 'Consultar prévia novamente' }).click();
  await expect(page.getByText('PRÉVIA DO ALUNO · VERSÃO 1', { exact: true })).toBeVisible();
  expect(state.requests.every((item) => item.method === 'GET')).toBe(true);
  outcome = 'expired';
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(question.statement);
});

test('student cannot fetch a teacher preview through a deep link', async ({ page }) => {
  const state = await mockQuestions(page, { student: true, hidden: true, published: true });
  await page.goto(preview);
  await expect(page.getByRole('heading', { name: 'Área do professor' })).toBeVisible();
  expect(state.requests).toHaveLength(0);
});

for (const patch of [
  { comparisonPolicy: 'unknown' },
  { testCases: [{ ...question.testCases[0], visibility: 'unknown' }] },
  { testCases: [{ ...question.testCases[0], visibility: undefined }] },
]) {
  test(`invalid authoring contract ${JSON.stringify(patch)} is not editable`, async ({ page }) => {
    await mockQuestions(page);
    await page.route(
      (url) => url.pathname === `/api/questions/${question.id}`,
      (route) => route.fulfill({ json: { ...question, ...patch } }),
    );
    await page.goto(detail);
    await expect(page.getByRole('heading', { name: 'Exercício indisponível' })).toBeVisible();
    await expect(page.getByLabel('Visibilidade do caso 1')).toHaveCount(0);
  });
}

for (const extra of [
  { stdout: privateMarker },
  { authorId: privateMarker },
  { testCaseCount: 2 },
]) {
  test(`unexpected preview field ${Object.keys(extra)[0]} fails closed`, async ({ page }) => {
    const state = await mockQuestions(page, { published: true });
    const full = state.versions[0];
    const testCases = full.testCases.map(({ visibility: _visibility, ...item }) => item);
    await page.route(
      (url) => url.pathname.endsWith('/preview'),
      (route) =>
        route.fulfill({
          json: { ...full, testCases, comparisonDescription: 'Comparação textual.', ...extra },
        }),
    );
    await page.goto(preview);
    await expect(page.getByRole('heading', { name: 'Prévia indisponível' })).toBeVisible();
    await expect(page.locator('main')).not.toContainText(privateMarker);
  });
}

test('a private case in a malformed preview is rejected instead of filtered in the browser', async ({
  page,
}) => {
  const state = await mockQuestions(page, { published: true, hidden: true });
  await page.route(
    (url) => url.pathname.endsWith('/preview'),
    (route) =>
      route.fulfill({
        json: { ...state.versions[0], comparisonDescription: 'Comparação textual.' },
      }),
  );
  await page.goto(preview);
  await expect(page.getByRole('heading', { name: 'Prévia indisponível' })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(privateMarker);
});

test('mixed-case editing and student preview fit desktop and mobile viewports', async ({
  page,
}) => {
  const state = await mockQuestions(page, { hidden: true });
  mkdirSync('docs/evidencias', { recursive: true });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(detail);
  await page.getByRole('textbox', { name: 'Código inicial Python' }).click();
  await page.getByLabel('Visibilidade do caso 1').scrollIntoViewIfNeeded();
  await page.getByLabel('Título do exercício').scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'docs/evidencias/F04-editor-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByLabel('Visibilidade do caso 1').scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/evidencias/F04-editor-mobile.png', fullPage: true });
  state.versions.push(snapshot(state.questions[0], 1));
  await page.goto(preview);
  await expect(page.getByText('PRÉVIA DO ALUNO · VERSÃO 1', { exact: true })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(privateMarker);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/evidencias/F04-previa-mobile.png', fullPage: true });
});
