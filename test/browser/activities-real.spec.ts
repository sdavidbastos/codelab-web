import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

function accounts() {
  const directory = process.env.CODELAB_TEST_PRIVATE_DIR;
  if (!directory) throw new Error('Use test:activities:real with its disposable stack.');
  const value: unknown = JSON.parse(readFileSync(directory + '/accounts.json', 'utf8'));
  function account(item: unknown): { name: string; email: string; password: string } {
    if (
      typeof item !== 'object' ||
      item === null ||
      !('name' in item) ||
      typeof item.name !== 'string' ||
      !('email' in item) ||
      typeof item.email !== 'string' ||
      !('password' in item) ||
      typeof item.password !== 'string'
    )
      throw new Error('Invalid synthetic account');
    return { name: item.name, email: item.email, password: item.password };
  }
  if (typeof value !== 'object' || value === null || !('teacher' in value) || !('student' in value))
    throw new Error('Invalid synthetic fixtures');
  return { teacher: account(value.teacher), student: account(value.student) };
}
async function login(page: Page, credentials: { email: string; password: string }) {
  await page.goto('/#/turmas');
  await page.getByLabel('E-mail', { exact: true }).fill(credentials.email);
  await page.getByLabel('Senha', { exact: true }).fill(credentials.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Minhas turmas', exact: true })).toBeVisible();
}

test('real F05: immutable version, draft privacy, opening, public student reading, terminal closure and revoked enrollment', async ({
  page,
  browser,
  request,
}) => {
  const { teacher, student } = accounts();
  expect((await request.post('/api/users', { data: student })).status()).toBe(201);
  await login(page, teacher);
  await page.getByRole('button', { name: 'Nova turma', exact: true }).click();
  await page.getByLabel('Nome da turma').fill('LP1 — atividades F05');
  await page.getByRole('button', { name: 'Criar turma', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'LP1 — atividades F05', exact: true }),
  ).toBeVisible();
  await page.getByLabel('E-mail do aluno').fill(student.email);
  await page.getByRole('button', { name: 'Matricular aluno', exact: true }).click();
  await expect(page.getByRole('cell', { name: student.name, exact: true })).toBeVisible();
  const classHash = new URL(page.url()).hash;
  const classId = classHash.split('/').at(-1);
  const session = await (await page.request.get('/api/auth/me')).json();
  const headers = { 'X-CSRF-Token': String(session.csrfToken) };
  // Establish versioned educational fixtures through the real HTTP API. All new
  // F05 actions below use the browser UI; no API routes are intercepted.
  const privateMarker = 'DADO_PRIVADO_SINTETICO_F05_ação';
  const content = {
    title: 'Entrada UTF-8 — primeira versão',
    statement: 'Leia um nome e produza uma saudação.',
    learningObjective: 'Praticar entrada e saída.',
    inputDescription: 'Um nome.',
    outputDescription: 'Uma saudação.',
    constraints: '',
    starterCode: 'nome = input()\n',
    language: 'python3',
    comparisonPolicy: 'judge0_text_rstrip_v1',
    cpuTimeLimitSeconds: 1,
    wallTimeLimitSeconds: 3,
    memoryLimitKb: 65536,
    testCases: [
      {
        visibility: 'HIDDEN',
        stdin: privateMarker,
        expectedOutput: privateMarker + '_esperado',
        explanation: privateMarker + '_explicação',
      },
      {
        visibility: 'PUBLIC',
        stdin: 'João\n',
        expectedOutput: 'Olá, João!\n',
        explanation: 'Exemplo com acentos.',
      },
    ],
  };
  const createdQuestion = await page.request.post('/api/questions', { headers, data: content });
  expect(createdQuestion.status()).toBe(201);
  const questionId = (await createdQuestion.json()).id;
  expect(
    (await page.request.post(`/api/questions/${questionId}/publish`, { headers })).status(),
  ).toBe(200);
  const version1 = await (await page.request.get(`/api/questions/${questionId}/versions/1`)).json();
  expect(
    (await page.request.post(`/api/questions/${questionId}/draft`, { headers })).status(),
  ).toBe(200);
  expect(
    (
      await page.request.patch(`/api/questions/${questionId}`, {
        headers,
        data: {
          ...content,
          title: 'Entrada revisada — versão dois',
          statement: 'Contrato novo, preservando o histórico.',
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (await page.request.post(`/api/questions/${questionId}/publish`, { headers })).status(),
  ).toBe(200);
  expect(
    (await page.request.post(`/api/questions/${questionId}/draft`, { headers })).status(),
  ).toBe(200);
  const teacherReads: string[] = [];
  page.on('request', (req) => {
    const path = new URL(req.url()).pathname;
    if (path.startsWith('/api/questions')) teacherReads.push(path);
  });
  await page.getByRole('link', { name: 'Nova atividade', exact: true }).click();
  await page.getByLabel('Título da atividade').fill('Atividade com publicação preservada');
  await page.getByLabel('Orientações').fill('  Consulte os exemplos.\n');
  await page.getByRole('button', { name: /^Entrada revisada — versão dois/ }).click();
  await page.getByRole('button', { name: /^Versão 1 · Entrada UTF-8/ }).click();
  await page.getByRole('button', { name: 'Criar atividade', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade com publicação preservada', exact: true }),
  ).toBeVisible();
  const activityHash = new URL(page.url()).hash;
  const activityId = activityHash.split('/').at(-1);
  expect([...new Set(teacherReads)]).toEqual([
    '/api/questions',
    `/api/questions/${questionId}/versions`,
  ]);
  const draft = await (await page.request.get(`/api/activities/${activityId}`)).json();
  expect(draft).toMatchObject({
    status: 'DRAFT',
    classroom: { id: classId },
    description: '  Consulte os exemplos.\n',
    questionVersion: { id: version1.id, number: 1, statement: content.statement },
  });
  expect(JSON.stringify(draft)).not.toContain(privateMarker);
  const pupil = await browser.newContext({ baseURL: 'http://127.0.0.1:5176' });
  try {
    const studentPage = await pupil.newPage();
    const studentReads: string[] = [];
    studentPage.on('request', (req) => {
      const path = new URL(req.url()).pathname;
      if (path.startsWith('/api/')) studentReads.push(path);
    });
    await login(studentPage, student);
    await studentPage.goto('/' + classHash);
    await expect(studentPage.getByText('Nenhuma atividade nesta página')).toBeVisible();
    const draftList = await (
      await studentPage.request.get(`/api/classrooms/${classId}/activities`)
    ).json();
    expect(draftList).toMatchObject({ items: [], total: 0 });
    expect((await studentPage.request.get(`/api/activities/${activityId}`)).status()).toBe(404);
    await page.getByRole('button', { name: 'Abrir atividade', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Abrir atividade', exact: true })
      .click();
    await expect(page.getByText('Aberta', { exact: true })).toBeVisible();
    await studentPage.reload();
    await studentPage
      .getByRole('link', { name: 'Abrir atividade Atividade com publicação preservada' })
      .click();
    await expect(studentPage.getByLabel('Entrada publicada do caso 1')).toHaveText('João\n');
    await expect(studentPage.getByLabel('Saída publicada do caso 1')).toHaveText('Olá, João!\n');
    await expect(studentPage.locator('main')).not.toContainText(privateMarker);
    await expect(studentPage.locator('main')).not.toContainText('Contrato novo');
    await expect(
      studentPage.getByRole('button', {
        name: /Abrir atividade|Encerrar atividade|Enviar solução/,
      }),
    ).toHaveCount(0);
    const projection = await studentPage.request.get(`/api/activities/${activityId}`);
    expect(projection.status()).toBe(200);
    expect(projection.headers()['cache-control']).toBe('no-store');
    const publicDetail = await projection.json();
    expect(JSON.stringify(publicDetail)).not.toContain(privateMarker);
    expect(publicDetail.questionVersion.testCases).toEqual([
      {
        id: expect.any(String),
        position: 1,
        stdin: 'João\n',
        expectedOutput: 'Olá, João!\n',
        explanation: 'Exemplo com acentos.',
      },
    ]);
    await page.getByRole('button', { name: 'Encerrar atividade', exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Encerrar atividade', exact: true })
      .click();
    await expect(page.getByText('Encerrada', { exact: true })).toBeVisible();
    await page.reload();
    await expect(page.getByText('Encerrada', { exact: true })).toBeVisible();
    await studentPage.reload();
    await expect(studentPage.getByText('Encerrada', { exact: true })).toBeVisible();
    expect(
      (await page.request.post(`/api/activities/${activityId}/open`, { headers })).status(),
    ).toBe(409);
    expect(
      studentReads.some(
        (path) => path.startsWith('/api/questions') || path.includes('/enrollments'),
      ),
    ).toBe(false);
    await page.goto('/' + classHash);
    await page.getByRole('button', { name: `Remover ${student.name}`, exact: true }).click();
    await page
      .getByRole('dialog')
      .getByRole('button', { name: 'Remover matrícula', exact: true })
      .click();
    await expect(page.getByRole('status').filter({ hasText: 'Matrícula de' })).toBeVisible();
    await studentPage.getByRole('button', { name: 'Atualizar atividade', exact: true }).click();
    await expect(
      studentPage.getByRole('heading', { name: 'Atividade indisponível' }),
    ).toBeVisible();
    expect((await studentPage.request.get(`/api/activities/${activityId}`)).status()).toBe(404);
    expect((await studentPage.request.get(`/api/classrooms/${classId}/activities`)).status()).toBe(
      404,
    );
    expect(activityHash).toMatch(/^#\/atividades\/[a-f0-9-]{36}$/);
  } finally {
    await pupil.close();
  }
});
