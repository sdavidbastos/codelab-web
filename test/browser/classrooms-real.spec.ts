import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('real browser → proxy → NestJS → disposable PostgreSQL: teacher and student membership lifecycle', async ({
  page,
  browser,
  request,
}) => {
  const directory = process.env.CODELAB_TEST_PRIVATE_DIR;
  if (!directory)
    throw new Error('Use npm run test:classrooms:real; a disposable stack is required.');
  const accounts: unknown = JSON.parse(readFileSync(directory + '/accounts.json', 'utf8'));
  function account(value: unknown): { name: string; email: string; password: string } {
    if (
      typeof value !== 'object' ||
      value === null ||
      !('name' in value) ||
      typeof value.name !== 'string' ||
      !('email' in value) ||
      typeof value.email !== 'string' ||
      !('password' in value) ||
      typeof value.password !== 'string'
    )
      throw new Error('Invalid synthetic fixture');
    return { name: value.name, email: value.email, password: value.password };
  }
  if (
    typeof accounts !== 'object' ||
    accounts === null ||
    !('teacher' in accounts) ||
    !('student' in accounts)
  )
    throw new Error('Invalid synthetic accounts');
  const teacher = account(accounts.teacher);
  const student = account(accounts.student);
  const created = await request.post('/api/users', { data: student });
  expect(created.status()).toBe(201);
  async function login(target: Page, credentials: { email: string; password: string }) {
    await target.goto('/#/turmas');
    await target.getByLabel('E-mail', { exact: true }).fill(credentials.email);
    await target.getByLabel('Senha', { exact: true }).fill(credentials.password);
    await target.getByRole('button', { name: 'Entrar', exact: true }).click();
    await expect(target.getByRole('heading', { name: 'Minhas turmas', exact: true })).toBeVisible();
  }
  await login(page, teacher);
  await page.getByRole('button', { name: 'Nova turma', exact: true }).click();
  await page.getByLabel('Nome da turma').fill('LP1 — integração real F02');
  await page.getByLabel('Descrição').fill('Turma sintética em banco descartável.');
  await page.getByRole('button', { name: 'Criar turma' }).click();
  await expect(page.getByRole('heading', { name: 'LP1 — integração real F02' })).toBeVisible();
  const detailUrl = page.url();
  await page.getByRole('button', { name: 'Editar turma', exact: true }).click();
  await page.getByLabel('Nome da turma').fill('LP1 — turma revisada');
  await page.getByRole('button', { name: 'Salvar alterações' }).click();
  await expect(page.getByRole('heading', { name: 'LP1 — turma revisada' })).toBeVisible();
  await page.getByLabel('E-mail do aluno').fill(student.email);
  await page.getByRole('button', { name: 'Matricular aluno' }).click();
  await expect(page.getByRole('cell', { name: student.email, exact: true })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.some((c) => c.name === 'codelab_session' && c.httpOnly && c.path === '/api')).toBe(
    true,
  );
  await page.reload();
  await expect(page.getByRole('cell', { name: student.email, exact: true })).toBeVisible();
  const studentContext = await browser.newContext({ baseURL: 'http://127.0.0.1:5176' });
  const studentPage = await studentContext.newPage();
  try {
    await login(studentPage, student);
    await studentPage
      .getByRole('link', { name: 'Abrir turma LP1 — turma revisada', exact: true })
      .click();
    await expect(studentPage.getByRole('heading', { name: 'LP1 — turma revisada' })).toBeVisible();
    await expect(studentPage.getByLabel('E-mail do aluno')).toHaveCount(0);
    await page.getByRole('button', { name: `Remover ${student.name}`, exact: true }).click();
    await page.getByRole('button', { name: 'Remover matrícula', exact: true }).click();
    await expect(page.getByRole('cell', { name: student.email, exact: true })).toHaveCount(0);
    await studentPage.reload();
    await expect(studentPage.getByRole('heading', { name: 'Turma indisponível' })).toBeVisible();
    await studentPage.getByRole('link', { name: 'Minhas turmas', exact: true }).last().click();
    await expect(
      studentPage.getByRole('heading', { name: 'Suas turmas aparecerão aqui' }),
    ).toBeVisible();
    await page.getByLabel('E-mail do aluno').fill(student.email);
    await page.getByRole('button', { name: 'Matricular aluno' }).click();
    await expect(page.getByRole('cell', { name: student.email, exact: true })).toBeVisible();
    await studentPage.goto(detailUrl);
    await expect(studentPage.getByRole('heading', { name: 'LP1 — turma revisada' })).toBeVisible();
    await page.getByRole('button', { name: 'Sair', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
  } finally {
    await studentContext.close();
  }
});
