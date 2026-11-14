import { expect, test } from '@playwright/test';
import {
  classroom,
  csrf,
  enrollment,
  mockClassrooms,
  student,
  teacher,
} from '../helpers/classrooms-api';
const details = `/#/turmas/${classroom.id}`;

test('login uses a fresh CSRF, rotates it for mutations and keeps credentials out of storage', async ({
  page,
}) => {
  const state = await mockClassrooms(page, { anonymous: true, empty: true });
  await page.goto('/#/turmas');
  await page.getByLabel('E-mail', { exact: true }).fill(teacher.email);
  await page.getByLabel('Senha', { exact: true }).fill('synthetic-password-123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Minhas turmas' })).toBeVisible();
  await page.getByRole('button', { name: 'Nova turma', exact: true }).click();
  await page.getByLabel('Nome da turma').fill('LP1 — 2026.2');
  await page.getByLabel('Descrição').fill('Uma turma para aprender.');
  await page.getByRole('button', { name: 'Criar turma' }).click();
  await expect(page.getByRole('heading', { name: 'LP1 — 2026.2' })).toBeVisible();
  const login = state.requests.find((r) => r.path.endsWith('/login'));
  expect(login?.csrf).toBe('a'.repeat(64));
  expect(login?.body).toEqual({ email: teacher.email, password: 'synthetic-password-123' });
  const create = state.requests.find((r) => r.path === '/api/classrooms' && r.method === 'POST');
  expect(create?.csrf).toBe(csrf);
  expect(create?.body).toEqual({ name: 'LP1 — 2026.2', description: 'Uma turma para aprender.' });
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage, ...sessionStorage }));
  expect(stored).not.toContain('synthetic-password');
  expect(stored).not.toContain(csrf);
  expect(stored).not.toContain(teacher.email);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'LP1 — 2026.2' })).toBeVisible();
  expect(
    state.requests.filter((r) => r.path === '/api/classrooms' && r.method === 'POST'),
  ).toHaveLength(1);
});
test('teacher edits a class, enrolls a student and confirms removal using the student ID', async ({
  page,
}) => {
  const state = await mockClassrooms(page);
  await page.goto(details);
  await page.getByRole('button', { name: 'Editar turma', exact: true }).click();
  await page.getByLabel('Nome da turma').fill('LP1 — Revisada');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('heading', { name: 'LP1 — Revisada' })).toBeVisible();
  await page.getByLabel('E-mail do aluno').fill(student.email);
  await page.getByRole('button', { name: 'Matricular aluno' }).click();
  await expect(page.getByRole('cell', { name: student.email, exact: true })).toBeVisible();
  await page.getByRole('button', { name: `Remover ${student.name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Manter matrícula' }).click();
  expect(state.requests.filter((r) => r.method === 'DELETE')).toHaveLength(0);
  await page.screenshot({ path: 'docs/evidencias/F02-professor.png', fullPage: true });
  await page.getByRole('button', { name: `Remover ${student.name}`, exact: true }).click();
  await page.getByRole('button', { name: 'Remover matrícula', exact: true }).click();
  await expect(page.getByRole('cell', { name: student.email, exact: true })).toHaveCount(0);
  const removed = state.requests.filter((r) => r.method === 'DELETE');
  expect(removed).toHaveLength(1);
  expect(removed[0].path).toBe(`/api/classrooms/${classroom.id}/enrollments/${student.id}`);
  expect(removed[0].csrf).toBe(csrf);
});
test('student sees their classes without requesting the participant list or showing management controls', async ({
  page,
}) => {
  const state = await mockClassrooms(page, { student: true });
  await page.goto('/#/turmas');
  await expect(page.getByRole('link', { name: `Abrir turma ${classroom.name}` })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nova turma' })).toHaveCount(0);
  await page.getByRole('link', { name: `Abrir turma ${classroom.name}` }).click();
  await expect(page.getByRole('heading', { name: classroom.name, exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Editar turma' })).toHaveCount(0);
  await expect(page.getByLabel('E-mail do aluno')).toHaveCount(0);
  expect(state.requests.some((r) => r.path.includes('/enrollments'))).toBe(false);
  await page.getByRole('link', { name: 'Abrir prática livre' }).click();
  await expect(page.getByRole('button', { name: 'Executar código' })).toBeVisible();
});
test('search and pagination query the server and work with browser back navigation', async ({
  page,
}) => {
  const state = await mockClassrooms(page);
  state.classrooms = Array.from({ length: 13 }, (_, index) => ({
    ...classroom,
    id: `70000000-0000-4000-8000-${String(index + 10).padStart(12, '0')}`,
    name: `LP1 — Turma ${index + 1}`,
  }));
  await page.goto('/#/turmas');
  await expect(page.getByText('13 turmas', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Próxima', exact: true }).click();
  await expect(page.getByText('Página 2 de 2')).toBeVisible();
  await page.getByRole('link', { name: 'Abrir turma LP1 — Turma 13', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'LP1 — Turma 13', exact: true })).toBeVisible();
  await page.goBack();
  await page.getByLabel('Buscar turma pelo nome').fill('Turma 13');
  await page.getByRole('button', { name: 'Buscar', exact: true }).click();
  await expect(page.getByText('1 turma', { exact: true })).toBeVisible();
  expect(state.requests.some((r) => r.path === '/api/classrooms' && r.method === 'POST')).toBe(
    false,
  );
});
test('distinct empty states explain how teachers and students get started', async ({ page }) => {
  const state = await mockClassrooms(page, { empty: true });
  await page.goto('/#/turmas');
  await expect(page.getByRole('heading', { name: 'Sua primeira turma começa aqui' })).toBeVisible();
  state.student = true;
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Suas turmas aparecerão aqui' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nova turma' })).toHaveCount(0);
});
test('wrong login preserves the email, clears the password and respects throttling', async ({
  page,
}) => {
  const state = await mockClassrooms(page, { anonymous: true });
  let attempts = 0;
  await page.route('**/api/auth/login', (route) => {
    attempts++;
    return route.fulfill({
      status: attempts === 1 ? 401 : 429,
      json: { message: 'private driver detail' },
    });
  });
  await page.goto('/#/turmas');
  await page.getByLabel('E-mail', { exact: true }).fill(teacher.email);
  await page.getByLabel('Senha').fill('wrong');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText('E-mail ou senha inválidos.');
  await expect(page.getByLabel('E-mail', { exact: true })).toHaveValue(teacher.email);
  await expect(page.getByLabel('Senha')).toHaveValue('');
  await page.getByLabel('Senha').fill('wrong');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Muitas tentativas');
  expect(attempts).toBe(2);
  expect(state.authenticated).toBe(false);
});
test('expiry from the server clears private data and offers login at the same route', async ({
  page,
}) => {
  await mockClassrooms(page);
  await page.goto(details);
  await expect(page.getByRole('heading', { name: classroom.name, exact: true })).toBeVisible();
  await page.route('**/api/classrooms/*/enrollments', (route) =>
    route.fulfill({ status: 401, json: {} }),
  );
  await page.getByLabel('E-mail do aluno').fill(student.email);
  await page.getByRole('button', { name: 'Matricular aluno' }).click();
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  await expect(page.getByRole('heading', { name: classroom.name, exact: true })).toHaveCount(0);
  await expect(page.getByLabel('E-mail do aluno')).toHaveCount(0);
  expect(page.url()).toContain(classroom.id);
});
test('successful logout uses CSRF and removes private content', async ({ page }) => {
  const state = await mockClassrooms(page);
  await page.goto(details);
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  expect(state.requests.find((r) => r.path === '/api/auth/logout')?.csrf).toBe(csrf);
});
test('failed logout does not claim the session ended', async ({ page }) => {
  await mockClassrooms(page);
  await page.route('**/api/auth/logout', (route) => route.fulfill({ status: 503, json: {} }));
  await page.goto('/#/turmas');
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('indisponível');
  await expect(page.getByRole('button', { name: 'Sair', exact: true })).toBeVisible();
});
for (const failure of ['network', 'invalid', '503'] as const) {
  test(`creation failure ${failure} preserves the draft and never retries the POST`, async ({
    page,
  }) => {
    await mockClassrooms(page, { empty: true });
    let posts = 0;
    await page.route('**/api/classrooms', (route) => {
      if (route.request().method() === 'GET') return route.fallback();
      posts++;
      return failure === 'network'
        ? route.abort('failed')
        : route.fulfill({ status: failure === '503' ? 503 : 201, json: {} });
    });
    await page.goto('/#/turmas');
    await page.getByRole('button', { name: 'Nova turma', exact: true }).click();
    await page.getByLabel('Nome da turma').fill('Rascunho preservado');
    await page.getByRole('button', { name: 'Criar turma' }).click();
    await expect(page.getByRole('alert')).toBeVisible();
    await expect(page.getByLabel('Nome da turma')).toHaveValue('Rascunho preservado');
    expect(posts).toBe(1);
    await expect(page.getByRole('dialog')).toBeVisible();
  });
}
test('duplicate enrollment keeps its email and displays the conflict', async ({ page }) => {
  const state = await mockClassrooms(page);
  state.enrollments.push(enrollment);
  await page.goto(details);
  await page.getByLabel('E-mail do aluno').fill(student.email);
  await page.getByRole('button', { name: 'Matricular aluno' }).click();
  await expect(page.getByRole('alert')).toContainText('já está matriculado');
  await expect(page.getByLabel('E-mail do aluno')).toHaveValue(student.email);
});
test('malformed session and classroom responses are rejected instead of showing invented data', async ({
  page,
}) => {
  await mockClassrooms(page);
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ json: { user: { role: 'ADMIN' }, csrfToken: csrf, expiresAt: 'bad' } }),
  );
  await page.goto('/#/turmas');
  await expect(
    page.getByRole('heading', { name: 'Não foi possível consultar sua sessão' }),
  ).toBeVisible();
  await page.unroute('**/api/auth/me');
  await page.route('**/api/classrooms?**', (route) =>
    route.fulfill({ json: { items: [{ name: 'Incompleta' }], total: 1, page: 1, pageSize: 12 } }),
  );
  await page.getByRole('button', { name: 'Consultar sessão novamente' }).click();
  await expect(page.getByRole('alert')).toContainText('dados inesperados');
  await expect(page.getByRole('heading', { name: 'Incompleta' })).toHaveCount(0);
});
test('query failures can be retried with GET and never send a mutation', async ({ page }) => {
  const state = await mockClassrooms(page);
  let reads = 0;
  let failing = true;
  await page.route('**/api/classrooms?**', (route) => {
    reads++;
    return failing ? route.fulfill({ status: 503, json: {} }) : route.fallback();
  });
  await page.goto('/#/turmas');
  await expect(page.getByRole('alert')).toBeVisible();
  const initialReads = reads;
  failing = false;
  await page.getByRole('button', { name: 'Consultar novamente', exact: true }).click();
  await expect(page.getByRole('link', { name: `Abrir turma ${classroom.name}` })).toBeVisible();
  expect(reads).toBe(initialReads + 1);
  expect(state.requests.some((r) => r.method !== 'GET')).toBe(false);
});
test('untrusted class names and descriptions remain text', async ({ page }) => {
  const state = await mockClassrooms(page);
  state.classrooms[0].name = '<img src=x onerror="window.bad=true">';
  await page.goto('/#/turmas');
  await expect(
    page.getByRole('heading', { name: state.classrooms[0].name, exact: true }),
  ).toBeVisible();
  await expect(page.locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => 'bad' in window)).toBe(false);
});
test('modal supports Escape and returns focus to the opening control', async ({ page }) => {
  await mockClassrooms(page);
  await page.goto('/#/turmas');
  const trigger = page.getByRole('button', { name: 'Nova turma', exact: true });
  await trigger.click();
  await expect(page.getByLabel('Nome da turma')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(trigger).toBeFocused();
});
test('mobile login, class details and roster fit the viewport', async ({ page }) => {
  const state = await mockClassrooms(page, { anonymous: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/turmas');
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/evidencias/F02-login-mobile.png', fullPage: true });
  state.authenticated = true;
  state.enrollments.push(enrollment);
  await page.goto(details);
  await page.reload();
  await expect(page.getByRole('cell', { name: student.email, exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'docs/evidencias/F02-turma-mobile.png', fullPage: true });
});
