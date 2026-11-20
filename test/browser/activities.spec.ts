import { expect, test, type Page } from '@playwright/test';
import { classroom, csrf } from '../helpers/classrooms-api';
import { privateMarker, snapshot } from '../helpers/questions-api';
import { mockActivities } from '../helpers/activities-api';

const classRoute = `/#/turmas/${classroom.id}`;
const createRoute = classRoute + '/atividades/nova';
async function chooseVersion(page: Page) {
  await page.getByRole('button', { name: /^Soma de dois números/ }).click();
  await page.getByRole('button', { name: /^Versão 1 ·/ }).click();
}

test('teacher creates from a published version of a root under revision, then opens and closes', async ({
  page,
}) => {
  const state = await mockActivities(page, { empty: true });
  Object.assign(state.questions.questions[0], { status: 'DRAFT', publishedAt: null });
  await page.goto(classRoute);
  await page.getByRole('link', { name: 'Nova atividade', exact: true }).click();
  await page.getByLabel('Título da atividade').fill('Entrada UTF-8 — turma A');
  await page.getByLabel('Orientações').fill('  Leia com atenção.\n');
  await expect(page.getByRole('button', { name: 'Criar atividade', exact: true })).toBeDisabled();
  await chooseVersion(page);
  await page.getByRole('button', { name: 'Criar atividade', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Entrada UTF-8 — turma A', exact: true }),
  ).toBeVisible();
  const created = state.requests.filter((r) => r.method === 'POST');
  expect(created).toHaveLength(1);
  expect(created[0]).toMatchObject({
    csrf,
    body: {
      title: 'Entrada UTF-8 — turma A',
      description: '  Leia com atenção.\n',
      questionVersionId: state.questions.versions[0].id,
    },
  });
  expect(
    state.questions.requests.every(
      (r) => r.path === '/api/questions' || r.path.endsWith('/versions'),
    ),
  ).toBe(true);
  await expect(page.getByText('Rascunho', { exact: true })).toBeVisible();
  await expect(page.locator('main')).not.toContainText(privateMarker);
  await page.getByRole('button', { name: 'Abrir atividade', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Abrir atividade', exact: true })
    .click();
  await expect(page.getByText('Aberta', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Casos públicos 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Encerrar atividade', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('não poderá ser reaberta');
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Encerrar atividade', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Encerrar atividade', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Encerrar atividade', exact: true })
    .click();
  await expect(page.getByText('Encerrada', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Abrir atividade|Encerrar atividade/ }),
  ).toHaveCount(0);
  expect(state.requests.filter((r) => r.method === 'POST').map((r) => r.csrf)).toEqual([
    csrf,
    csrf,
    csrf,
  ]);
  await page.reload();
  await expect(page.getByText('Encerrada', { exact: true })).toBeVisible();
});

test('student lists and reads only public activity content without author endpoints or roster', async ({
  page,
}) => {
  const state = await mockActivities(page, { student: true });
  state.items.push({
    ...structuredClone(state.initial),
    id: crypto.randomUUID(),
    title: 'Desafio aberto',
    status: 'OPEN',
    openedAt: '2026-11-20T13:00:00.000Z',
  });
  await page.goto(classRoute);
  await expect(page.getByRole('link', { name: 'Abrir atividade Desafio aberto' })).toBeVisible();
  await expect(page.getByText(state.initial.title, { exact: true })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Nova atividade' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Abrir atividade Desafio aberto' }).click();
  await expect(page.getByRole('heading', { name: 'Desafio aberto', exact: true })).toBeVisible();
  await expect(page.getByLabel('Entrada publicada do caso 1')).toHaveText('2 3\n');
  await expect(page.locator('main')).not.toContainText(privateMarker);
  await expect(
    page.getByRole('button', { name: /Abrir atividade|Encerrar atividade|Enviar solução/ }),
  ).toHaveCount(0);
  expect(state.questions.requests).toHaveLength(0);
  expect(state.questions.auth.requests.some((r) => r.path.includes('/enrollments'))).toBe(false);
  expect(
    await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage })),
  ).not.toContain(privateMarker);
});

test('student cannot open draft or create via direct route; revoked membership is unavailable', async ({
  page,
}) => {
  const state = await mockActivities(page, { student: true });
  await page.goto(createRoute);
  await expect(page.getByRole('heading', { name: 'Área do professor' })).toBeVisible();
  expect(state.questions.requests).toHaveLength(0);
  expect(state.requests).toHaveLength(0);
  await page.goto(`/#/atividades/${state.initial.id}`);
  await expect(page.getByRole('heading', { name: 'Atividade indisponível' })).toBeVisible();
  state.items[0].status = 'OPEN';
  state.items[0].openedAt = '2026-11-20T13:00:00.000Z';
  await page.getByRole('button', { name: 'Consultar atividade novamente' }).click();
  await expect(page.getByRole('heading', { name: state.initial.title, exact: true })).toBeVisible();
  state.revoked = true;
  await page.getByRole('button', { name: 'Atualizar atividade' }).click();
  await expect(page.getByRole('heading', { name: 'Atividade indisponível' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Enunciado' })).toHaveCount(0);
});

test('activity filters and pagination are sent to the server and reset the page', async ({
  page,
}) => {
  const state = await mockActivities(page);
  for (let i = 0; i < 7; i++)
    state.items.push({
      ...structuredClone(state.initial),
      id: crypto.randomUUID(),
      title: 'Revisão ' + i,
      status: 'CLOSED',
      openedAt: '2026-11-20T13:00:00.000Z',
      closedAt: '2026-11-20T14:00:00.000Z',
    });
  await page.goto(classRoute);
  const panel = page.getByRole('region', { name: 'Atividades da turma' });
  await panel.getByRole('button', { name: 'Próxima' }).click();
  await expect(panel.getByText('Página 2 de 2')).toBeVisible();
  await page.getByLabel('Buscar atividade', { exact: true }).fill('Revisão');
  await page.getByLabel('Estado da atividade').selectOption('CLOSED');
  await panel.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(panel.getByText('Página 1 de 2')).toBeVisible();
  expect(new URLSearchParams(state.requests.at(-1)?.query)).toEqual(
    new URLSearchParams({ page: '1', pageSize: '6', search: 'Revisão', status: 'CLOSED' }),
  );
});

test('question and version chooser paginates and changing question clears chosen version', async ({
  page,
}) => {
  const state = await mockActivities(page);
  const q = state.questions.questions[0];
  for (let i = 0; i < 5; i++)
    state.questions.questions.unshift({
      ...structuredClone(q),
      id: crypto.randomUUID(),
      title: 'Sem publicação ' + i,
      status: 'DRAFT',
      publishedAt: null,
      latestVersionNumber: 0,
    });
  for (let i = 2; i < 7; i++) state.questions.versions.push(snapshot(q, i));
  await page.goto(createRoute);
  await expect(page.getByRole('button', { name: /^Sem publicação 0/ })).toBeDisabled();
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await page.getByRole('button', { name: /^Soma de dois números/ }).click();
  const versions = page.getByRole('region', { name: 'Versões publicadas' });
  await versions.getByRole('button', { name: 'Próxima', exact: true }).click();
  await versions.getByRole('button', { name: /^Versão 1 ·/ }).click();
  await page.getByLabel('Título da atividade').fill('Teste de seleção');
  await expect(page.getByRole('button', { name: 'Criar atividade', exact: true })).toBeEnabled();
  await page.getByLabel('Buscar exercício', { exact: true }).fill('Sem publicação');
  await page.getByRole('button', { name: 'Buscar exercício', exact: true }).click();
  // A search does not silently replace the explicit published selection.
  await expect(page.getByText('Selecionada: Soma de dois números · versão 1')).toBeVisible();
  expect(
    state.questions.requests.some(
      (r) => r.path.endsWith('/versions') && r.query.includes('page=2'),
    ),
  ).toBe(true);
  // Add another published root and explicitly choose it.
  const other = { ...structuredClone(q), id: crypto.randomUUID(), title: 'Outro exercício' };
  state.questions.questions.push(other);
  state.questions.versions.push(snapshot(other, 1));
  await page.getByLabel('Buscar exercício', { exact: true }).fill('Outro');
  await page.getByRole('button', { name: 'Buscar exercício', exact: true }).click();
  await page.getByRole('button', { name: /^Outro exercício/ }).click();
  await expect(page.getByRole('button', { name: 'Criar atividade', exact: true })).toBeDisabled();
  await expect(page.getByText(/^Selecionada:/)).toHaveCount(0);
});

for (const failure of ['network', 'invalid'] as const)
  test(`create ${failure} failure preserves fields and never automatically repeats POST`, async ({
    page,
  }) => {
    await mockActivities(page);
    let posts = 0;
    await page.route(
      (url) => url.pathname === `/api/classrooms/${classroom.id}/activities`,
      async (route) => {
        if (route.request().method() !== 'POST') return route.fallback();
        posts++;
        if (failure === 'network') return route.abort('connectionfailed');
        return route.fulfill({ status: 201, json: { id: 'invalid' } });
      },
    );
    await page.goto(createRoute);
    await page.getByLabel('Título da atividade').fill('Campos preservados');
    await page.getByLabel('Orientações').fill('Texto com ação');
    await chooseVersion(page);
    await page.getByRole('button', { name: 'Criar atividade', exact: true }).click();
    await expect(page.getByRole('alert')).toContainText('Consulte os dados');
    await expect(page.getByLabel('Título da atividade')).toHaveValue('Campos preservados');
    await expect(page.getByText(/^Selecionada:/)).toBeVisible();
    expect(posts).toBe(1);
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByRole('link', { name: 'Voltar à turma' }).click();
    await expect(page.getByLabel('Título da atividade')).toHaveValue('Campos preservados');
  });

test('pending creation blocks duplicate submit, editing and navigation', async ({ page }) => {
  const state = await mockActivities(page);
  let release!: () => void;
  const hold = new Promise<void>((resolve) => {
    release = resolve;
  });
  let posts = 0;
  await page.route(
    (url) => url.pathname === `/api/classrooms/${classroom.id}/activities`,
    async (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      posts++;
      await hold;
      await route.fallback();
    },
  );
  await page.goto(createRoute);
  await page.getByLabel('Título da atividade').fill('Envio único');
  await chooseVersion(page);
  await page.getByRole('button', { name: 'Criar atividade', exact: true }).dblclick();
  await expect(page.getByLabel('Título da atividade')).toBeDisabled();
  await page.getByRole('link', { name: 'Voltar à turma' }).click();
  await expect(page.getByRole('button', { name: 'Criando…' })).toBeDisabled();
  expect(posts).toBe(1);
  release();
  await expect(page.getByRole('heading', { name: 'Envio único', exact: true })).toBeVisible();
  expect(state.requests.filter((r) => r.method === 'POST')).toHaveLength(1);
});

test('lost lifecycle confirmation is reconciled using GET without another POST', async ({
  page,
}) => {
  const state = await mockActivities(page);
  let posts = 0;
  await page.route(
    (url) => url.pathname.endsWith('/open'),
    async (route) => {
      posts++;
      state.items[0].status = 'OPEN';
      state.items[0].openedAt = '2026-11-20T13:00:00.000Z';
      await route.abort('connectionfailed');
    },
  );
  await page.goto(`/#/atividades/${state.initial.id}`);
  await page.getByRole('button', { name: 'Abrir atividade', exact: true }).click();
  await page
    .getByRole('dialog')
    .getByRole('button', { name: 'Abrir atividade', exact: true })
    .click();
  await expect(page.getByRole('alert')).toContainText('Não foi possível confirmar');
  await page.getByRole('button', { name: 'Consultar estado da atividade' }).click();
  await expect(page.getByText('Aberta', { exact: true })).toBeVisible();
  expect(posts).toBe(1);
});

for (const invalid of ['hidden', 'state', 'extra'] as const)
  test(`invalid ${invalid} detail fails before rendering content`, async ({ page }) => {
    const state = await mockActivities(page);
    const detail = structuredClone(state.initial);
    if (invalid === 'hidden')
      Object.assign(detail.questionVersion.testCases[0], { visibility: 'HIDDEN' });
    if (invalid === 'state') detail.closedAt = '2026-11-20T14:00:00.000Z';
    if (invalid === 'extra') Object.assign(detail, { hiddenTestCaseCount: 1 });
    await page.route(
      (url) => url.pathname === `/api/activities/${detail.id}`,
      (route) => route.fulfill({ json: detail }),
    );
    await page.goto(`/#/atividades/${detail.id}`);
    await expect(page.getByRole('heading', { name: 'Atividade indisponível' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Enunciado' })).toHaveCount(0);
  });

test('expired session removes activity content', async ({ page }) => {
  const state = await mockActivities(page);
  await page.goto(`/#/atividades/${state.initial.id}`);
  await expect(page.getByRole('heading', { name: state.initial.title, exact: true })).toBeVisible();
  state.questions.auth.authenticated = false;
  await page.getByRole('button', { name: 'Atualizar atividade' }).click();
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Enunciado' })).toHaveCount(0);
});

test('empty/error list and unavailable classroom offer read recovery', async ({ page }) => {
  const state = await mockActivities(page, { empty: true });
  let failing = true;
  await page.route(
    (url) => url.pathname.endsWith('/activities'),
    (route) => (failing ? route.fulfill({ status: 503, json: {} }) : route.fallback()),
  );
  await page.goto(classRoute);
  await page.getByRole('button', { name: 'Consultar atividades novamente' }).waitFor();
  failing = false;
  await page.getByRole('button', { name: 'Consultar atividades novamente' }).click();
  await expect(page.getByText('Nenhuma atividade nesta página')).toBeVisible();
  state.questions.auth.classrooms = [];
  await page.goto(createRoute);
  await expect(page.getByRole('heading', { name: 'Turma indisponível' })).toBeVisible();
  expect(state.questions.requests).toHaveLength(0);
});

test('mobile detail renders hostile text safely; screenshots use only synthetic fixtures', async ({
  page,
}) => {
  const state = await mockActivities(page, { student: true });
  state.items[0].status = 'CLOSED';
  state.items[0].openedAt = '2026-11-20T13:00:00.000Z';
  state.items[0].closedAt = '2026-11-20T14:00:00.000Z';
  state.items[0].description = '<img src=x onerror="window.F05=1">';
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto(classRoute);
  await expect(
    page.getByRole('link', { name: `Abrir atividade ${state.initial.title}` }),
  ).toBeVisible();
  await page.screenshot({ path: 'docs/evidencias/F05-turma-desktop.png', fullPage: true });
  await page.getByRole('link', { name: `Abrir atividade ${state.initial.title}` }).click();
  await expect(page.getByRole('heading', { name: 'Enunciado' })).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByText(state.items[0].description, { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator('main img').count()).toBe(0);
  await page.screenshot({ path: 'docs/evidencias/F05-atividade-mobile.png', fullPage: true });
});

test('mobile creation keeps selection and controls within viewport', async ({ page }) => {
  await mockActivities(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(createRoute);
  await page.getByLabel('Título da atividade').fill('Prática de entrada e saída');
  await chooseVersion(page);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/evidencias/F05-criacao-mobile.png', fullPage: true });
});
