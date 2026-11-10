import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const id = '20000000-0000-4000-8000-000000000001';
const execution = (state = 'QUEUED', status = 3, stdout: string | null = 'hello\n') => ({
  id,
  state,
  language: 'python3',
  createdAt: '2026-11-07T12:00:00Z',
  errorCode: state === 'ERROR' ? 'EXECUTOR_ERROR' : null,
  result:
    state === 'COMPLETED'
      ? {
          status: { id: status, description: status === 3 ? 'Accepted' : 'Runtime Error' },
          stdout,
          stderr: status === 11 ? 'Traceback: synthetic error' : null,
          compileOutput: null,
          time: '0.012',
          memory: 3476,
          outputTruncated: false,
        }
      : null,
});
async function edit(page: Page, source: string) {
  const editor = page.getByRole('textbox', { name: 'Editor de código Python' });
  await editor.click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText(source);
}
async function complete(page: Page, status = 3, stdout: string | null = 'hello\n') {
  await page.route('**/api/executions', (route) =>
    route.fulfill({ status: 202, json: execution() }),
  );
  await page.route('**/api/executions/*', (route) =>
    route.fulfill({ json: execution('COMPLETED', status, stdout) }),
  );
}
test.beforeEach(async ({ page }) => {
  // All API traffic is intercepted. These tests never submit to the real NestJS/Judge0.
  await page.route('http://127.0.0.1:5174/api/**', (route) =>
    route.request().url().endsWith('/api/health/ready')
      ? route.fulfill({ json: { status: 'ok', database: 'up' } })
      : route.fulfill({ status: 501, json: { message: 'Unconfigured simulated endpoint' } }),
  );
});

test('opens the React workspace with editor and a truthful API health indicator', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '01. Olá, mundo' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Editor de código Python' })).toContainText(
    'print("hello")',
  );
  await expect(page.getByRole('button', { name: 'API disponível' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: 'Comparar saída esperada' })).toBeChecked();
});
test('sends the snapshot only to NestJS and displays a decoded result', async ({ page }) => {
  await complete(page);
  let payload: unknown;
  await page.route('**/api/executions', async (route) => {
    payload = route.request().postDataJSON() as unknown;
    await route.fulfill({ status: 202, json: execution() });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
  expect(payload).toMatchObject({ language: 'python3', stdin: '', expectedOutput: 'hello\n' });
  expect(payload).not.toHaveProperty('language_id');
  expect(payload).not.toHaveProperty('token');
  await expect(page.getByLabel('Saída do programa', { exact: true })).toHaveText('hello\n');
});
test('distinguishes omitted expected output from an empty expected string', async ({ page }) => {
  const payloads: unknown[] = [];
  await complete(page, 3, null);
  await page.route('**/api/executions', async (route) => {
    payloads.push(route.request().postDataJSON() as unknown);
    await route.fulfill({ status: 202, json: execution() });
  });
  await page.goto('/');
  await edit(page, 'pass');
  await page.getByRole('checkbox', { name: 'Comparar saída esperada' }).uncheck();
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('heading', { name: 'Executado com sucesso' })).toBeVisible();
  expect(payloads[0]).not.toHaveProperty('expectedOutput');
  await page.getByRole('tab', { name: 'Entrada de teste' }).click();
  await page.getByRole('checkbox', { name: 'Comparar saída esperada' }).check();
  await page.getByRole('textbox', { name: 'Saída esperada do teste' }).fill('');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
  expect(payloads[1]).toHaveProperty('expectedOutput', '');
  await expect(page.getByLabel('Saída do programa', { exact: true })).toHaveText('(saída vazia)');
});
for (const [status, title] of [
  [4, 'Saída diferente'],
  [5, 'Tempo limite excedido'],
  [11, 'Erro de execução'],
] as const) {
  test(`shows the server verdict ${status} without rejudging locally`, async ({ page }) => {
    await complete(page, status);
    await page.goto('/');
    await page.getByRole('button', { name: 'Executar código' }).click();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    if (status === 11) await expect(page.getByText('Traceback: synthetic error')).toBeVisible();
  });
}
test('keeps an operational failure separate from a wrong answer', async ({ page }) => {
  await complete(page);
  await page.route('**/api/executions/*', (route) => route.fulfill({ json: execution('ERROR') }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(
    page.getByRole('heading', { name: 'Não foi possível concluir a execução' }),
  ).toBeVisible();
  await expect(
    page.getByText('Isso não significa que sua solução esteja errada.', { exact: false }),
  ).toBeVisible();
});
test('does not accept an unknown verdict as success', async ({ page }) => {
  await complete(page, 99);
  await page.goto('/');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('button', { name: 'Consultar novamente' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toHaveCount(0);
});
test('never retries a POST that lost confirmation and preserves the draft', async ({ page }) => {
  let posts = 0;
  await page.route('**/api/executions', (route) => {
    posts++;
    return route.abort('failed');
  });
  await page.goto('/');
  await edit(page, 'print("rascunho preservado")');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('heading', { name: 'Envio não confirmado' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Editor de código Python' })).toContainText(
    'rascunho preservado',
  );
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Editor de código Python' })).toContainText(
    'rascunho preservado',
  );
  expect(posts).toBe(1);
});
test('resumes by GET after a read failure and reload, without resubmitting', async ({ page }) => {
  let posts = 0;
  let gets = 0;
  await page.route('**/api/executions', (route) => {
    posts++;
    return route.fulfill({ status: 202, json: execution() });
  });
  await page.route('**/api/executions/*', (route) =>
    ++gets === 1
      ? route.fulfill({ status: 503, json: {} })
      : route.fulfill({ json: execution('COMPLETED') }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('button', { name: 'Consultar novamente' })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Consultar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
  expect(posts).toBe(1);
  expect(gets).toBe(2);
});
test('uses a known execution ID from a failed POST to resume safely', async ({ page }) => {
  let posts = 0;
  await page.route('**/api/executions', (route) => {
    posts++;
    return route.fulfill({ status: 503, json: { executionId: id } });
  });
  await page.route('**/api/executions/*', (route) =>
    route.fulfill({ json: execution('COMPLETED') }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await page.getByRole('button', { name: 'Consultar novamente' }).click();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
  expect(posts).toBe(1);
});
test('marks results from an older code snapshot', async ({ page }) => {
  await complete(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
  await edit(page, 'print("outro código")');
  await expect(
    page.getByText('Este é o resultado da execução anterior.', { exact: false }),
  ).toBeVisible();
  await expect(page.getByLabel('Saída do programa', { exact: true })).toHaveText('hello\n');
});
test('renders untrusted output as text, without HTML execution', async ({ page }) => {
  const output = '<img src=x onerror="window.__bad=true">';
  await complete(page, 3, output);
  await page.goto('/');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByLabel('Saída do programa', { exact: true })).toHaveText(output);
  await expect(page.locator('img')).toHaveCount(0);
  expect(await page.evaluate(() => '__bad' in window)).toBe(false);
});
test('keeps separate drafts and switches actual public example input', async ({ page }) => {
  await page.goto('/');
  await edit(page, 'print("meu rascunho")');
  await page.getByRole('combobox', { name: 'Selecionar exercício' }).selectOption('soma');
  await expect(page.getByRole('textbox', { name: 'Entrada do programa' })).toHaveValue('2 3\n');
  await page.getByRole('button', { name: 'Caso 2', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Entrada do programa' })).toHaveValue('-4 7\n');
  await page.getByRole('combobox', { name: 'Selecionar exercício' }).selectOption('hello');
  await expect(page.getByRole('textbox', { name: 'Editor de código Python' })).toContainText(
    'meu rascunho',
  );
});
test('supports execution shortcut and prevents duplicate sends while pending', async ({ page }) => {
  let posts = 0;
  let release: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/executions', async (route) => {
    posts++;
    await ready;
    await route.fulfill({ status: 202, json: execution() });
  });
  await page.route('**/api/executions/*', (route) =>
    route.fulfill({ json: execution('COMPLETED') }),
  );
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Editor de código Python' });
  await editor.click();
  try {
    await page.keyboard.press('Control+Enter');
    await expect(page.getByRole('button', { name: 'Executando…' })).toBeDisabled();
    await page.keyboard.press('Control+Enter');
    await expect.poll(() => posts).toBe(1);
  } finally {
    release();
  }
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
});
test('editor can be exited by keyboard and help is a real dialog', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Editor de código Python' });
  await editor.click();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Tab');
  await expect(editor).not.toBeFocused();
  await page.getByRole('button', { name: 'Como funciona' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
test('mobile layout fits the viewport and executes a case', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await complete(page);
  await page.goto('/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
});
test('keeps the sent snapshot while the code changes during execution', async ({ page }) => {
  let payload: unknown;
  let release: () => void = () => undefined;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/api/executions', async (route) => {
    payload = route.request().postDataJSON() as unknown;
    await ready;
    await route.fulfill({ status: 202, json: execution() });
  });
  await page.route('**/api/executions/*', (route) =>
    route.fulfill({ json: execution('COMPLETED') }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Executar código' }).click();
  try {
    await expect(page.getByRole('button', { name: 'Executando…' })).toBeDisabled();
    await edit(page, 'print("código novo")');
  } finally {
    release();
  }
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
  expect(payload).toHaveProperty(
    'sourceCode',
    '# Seu primeiro programa em Python.\nprint("hello")\n',
  );
  await expect(
    page.getByText('Este é o resultado da execução anterior.', { exact: false }),
  ).toBeVisible();
});
test('rejects empty code without making a POST', async ({ page }) => {
  let posts = 0;
  await page.route('**/api/executions', (route) => {
    posts++;
    return route.fulfill({ status: 202, json: execution() });
  });
  await page.goto('/');
  await edit(page, '');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('alert')).toHaveText('Escreva um código antes de executar.');
  expect(posts).toBe(0);
});
test('keeps working when browser storage is unavailable', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('Storage blocked');
      },
    });
  });
  await complete(page);
  await page.goto('/');
  await edit(page, 'print("hello")');
  await expect(page.getByText('Não foi possível salvar neste navegador')).toBeVisible();
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
});
test('restores the code only after confirmation', async ({ page }) => {
  await page.goto('/');
  await edit(page, 'print("rascunho")');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Restaurar exemplo de código' }).click();
  await expect(page.getByRole('textbox', { name: 'Editor de código Python' })).toContainText(
    'rascunho',
  );
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Restaurar exemplo de código' }).click();
  await expect(page.getByRole('textbox', { name: 'Editor de código Python' })).toContainText(
    'print("hello")',
  );
});
