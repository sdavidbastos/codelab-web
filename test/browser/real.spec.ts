import { expect, test } from '@playwright/test';
test('real React → proxy → NestJS → Judge0: hello and UTF-8 input', async ({ page }) => {
  const requests: string[] = [];
  const ids: string[] = [];
  page.on('request', (request) => {
    requests.push(request.url());
  });
  page.on('response', async (response) => {
    if (
      response.request().method() === 'POST' &&
      response.url().endsWith('/api/executions') &&
      response.status() === 202
    ) {
      const body: unknown = await response.json();
      if (typeof body === 'object' && body !== null && 'id' in body && typeof body.id === 'string')
        ids.push(body.id);
    }
  });
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'API disponível' })).toBeVisible();
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
  await expect(page.getByLabel('Saída do programa', { exact: true })).toHaveText('hello\n');
  await page.getByRole('textbox', { name: 'Editor de código Python' }).click();
  await page.keyboard.press('Control+a');
  await page.keyboard.insertText('print(input())\n');
  await page.getByRole('tab', { name: 'Entrada de teste' }).click();
  await page.getByRole('textbox', { name: 'Entrada do programa' }).fill('ação 👩🏽‍💻\n');
  await page.getByRole('textbox', { name: 'Saída esperada do teste' }).fill('ação 👩🏽‍💻\n');
  await page.getByRole('button', { name: 'Executar código' }).click();
  await expect(page.getByRole('heading', { name: 'Saída confere' })).toBeVisible();
  await expect(page.getByLabel('Saída do programa', { exact: true })).toHaveText('ação 👩🏽‍💻\n');
  expect(ids).toHaveLength(2);
  expect(requests.some((url) => url.includes(':2358') || url.includes(':3001'))).toBe(false);
  console.log('Real execution IDs:', ids.join(', '));
  await page.screenshot({ path: 'test-results/react-real-desktop.png', fullPage: true });
});
