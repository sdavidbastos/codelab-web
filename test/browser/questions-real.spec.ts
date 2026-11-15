import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

test('real browser → NestJS → disposable PostgreSQL: draft, two immutable publications, reload and student denial', async ({
  page,
  browser,
  request,
}) => {
  const directory = process.env.CODELAB_TEST_PRIVATE_DIR;
  if (!directory) throw new Error('Use npm run test:questions:real with its disposable stack.');
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
  expect((await request.post('/api/users', { data: student })).status()).toBe(201);
  async function login(target: Page, credentials: { email: string; password: string }) {
    await target.goto('/#/exercicios');
    await target.getByLabel('E-mail', { exact: true }).fill(credentials.email);
    await target.getByLabel('Senha', { exact: true }).fill(credentials.password);
    await target.getByRole('button', { name: 'Entrar', exact: true }).click();
  }
  await login(page, teacher);
  await expect(page.getByRole('heading', { name: 'Meus exercícios', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Novo exercício', exact: true }).click();
  await page.getByLabel('Título do exercício').fill('Saudação — versão um');
  await page
    .getByRole('textbox', { name: 'Enunciado', exact: true })
    .fill('Leia um nome com acentos e escreva uma saudação.');
  await page.getByLabel('Objetivo de aprendizagem').fill('Praticar texto e entrada UTF-8.');
  await page
    .getByRole('textbox', { name: 'Código inicial Python' })
    .fill('nome = input()\n# complete a solução\n');
  await page.getByLabel('CPU (segundos)', { exact: true }).fill('1');
  await page.getByLabel('Tempo de parede (segundos)').fill('3');
  await page.getByLabel('Memória (KB)').fill('65536');
  await page.getByRole('button', { name: 'Adicionar caso público' }).click();
  await page.getByLabel('Entrada do caso 1').fill('João\n');
  await page.getByLabel('Saída esperada do caso 1').fill('Olá, João!\n');
  await page.getByRole('button', { name: 'Adicionar caso público' }).click();
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Saudação — versão um', exact: true }),
  ).toBeVisible();
  const questionUrl = page.url();
  const id = new URL(questionUrl).hash.split('/').at(-1);
  expect(id).toMatch(/^[a-f0-9-]{36}$/);
  await page.reload();
  await expect(page.getByLabel('Entrada do caso 1')).toHaveValue('João\n');
  await expect(page.getByLabel('Saída esperada do caso 2')).toHaveValue('');
  await expect(page.getByLabel('Memória (KB)')).toHaveValue('65536');
  await page.getByRole('button', { name: 'Publicar versão 1' }).click();
  await page.getByRole('button', { name: 'Confirmar publicação' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Versão 1 publicada' })).toBeVisible();
  await page.getByRole('button', { name: 'Abrir novo rascunho' }).click();
  await page.getByLabel('Título do exercício').fill('Saudação — versão dois');
  await page
    .getByRole('textbox', { name: 'Enunciado', exact: true })
    .fill('Leia um nome e escreva uma nova saudação revisada.');
  await page.getByLabel('Saída esperada do caso 1').fill('Bem-vindo, João!\n');
  await page.getByRole('button', { name: 'Salvar rascunho', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Publicar versão 2' })).toBeEnabled();
  await page.getByRole('button', { name: 'Publicar versão 2' }).click();
  await page.getByRole('button', { name: 'Confirmar publicação' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Versão 2 publicada' })).toBeVisible();
  await page.reload();
  await page.getByRole('link', { name: 'Consultar versão 1', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Saudação — versão um', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('Olá, João!\n', { exact: true })).toBeVisible();
  await expect(page.getByText('Somente leitura', { exact: true })).toBeVisible();
  const original = await page.request.get(`/api/questions/${id}/versions/1`);
  expect(original.status()).toBe(200);
  expect(await original.json()).toMatchObject({
    number: 1,
    title: 'Saudação — versão um',
    cpuTimeLimitSeconds: 1,
    wallTimeLimitSeconds: 3,
    memoryLimitKb: 65536,
    testCases: [
      { stdin: 'João\n', expectedOutput: 'Olá, João!\n' },
      { stdin: '', expectedOutput: '' },
    ],
  });
  const newVersion = await page.request.get(`/api/questions/${id}/versions/2`);
  expect(await newVersion.json()).toMatchObject({ number: 2, title: 'Saudação — versão dois' });
  const studentContext = await browser.newContext({ baseURL: 'http://127.0.0.1:5176' });
  try {
    const studentPage = await studentContext.newPage();
    await login(studentPage, student);
    await expect(studentPage.getByRole('heading', { name: 'Área do professor' })).toBeVisible();
    expect((await studentPage.request.get(`/api/questions/${id}`)).status()).toBe(403);
    expect((await studentPage.request.get(`/api/questions/${id}/versions/1`)).status()).toBe(403);
  } finally {
    await studentContext.close();
  }
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible();
});
