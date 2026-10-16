import { expect, test } from '@playwright/test';
import { createRecord } from '../src/platform/records';

test('imports a selected CSV column, previews names, and restores focus', async ({ page }) => {
  await page.goto('./');
  const importButton = page.getByRole('button', { name: 'Importar lista' });
  await importButton.click();
  const dialog = page.getByRole('dialog', { name: 'Importar participantes' });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel('Arquivo TXT ou CSV').setInputFiles({
    name: 'participantes.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('Código;Nome\n1;João Silva\n2;Ana Júlia\n3;Luís Costa', 'utf8'),
  });
  await dialog.getByLabel('A primeira linha é um cabeçalho').check();
  await dialog.getByLabel('Coluna dos participantes').selectOption('1');
  const preview = dialog.getByRole('region', { name: 'Prévia da importação' });
  await expect(preview).toContainText('3 participantes');
  await expect(preview).toContainText('João Silva');
  await dialog.getByRole('button', { name: 'Usar esta lista' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Participantes', exact: true })).toHaveValue(
    'João Silva\nAna Júlia\nLuís Costa',
  );
  await expect(importButton).toBeFocused();
});

test('cancels import by keyboard without changing the prepared list', async ({ page }) => {
  await page.goto('./');
  const participants = page.getByRole('textbox', { name: 'Participantes', exact: true });
  await participants.fill('Ana\nBruno');
  const importButton = page.getByRole('button', { name: 'Importar lista' });
  await importButton.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(participants).toHaveValue('Ana\nBruno');
  await expect(importButton).toBeFocused();
});

test('reports a malformed CSV and accepts another file without reopening', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Importar lista' }).click();
  const dialog = page.getByRole('dialog');
  const fileInput = dialog.getByLabel('Arquivo TXT ou CSV');
  await fileInput.setInputFiles({
    name: 'lista.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from('"Ana,Bruno'),
  });
  await expect(dialog.getByRole('alert')).toContainText('aspas');
  await expect(dialog.getByRole('button', { name: 'Usar esta lista' })).toBeDisabled();
  await fileInput.setInputFiles({
    name: 'lista.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('Ana\n\nBruno'),
  });
  await expect(dialog.getByRole('alert')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Usar esta lista' })).toBeEnabled();
  await expect(dialog.getByRole('region')).toContainText('2 participantes');
});

test('verifies a valid record and reports digest tampering', async ({ page }) => {
  const record = await createRecord(
    { mode: 'numbers', min: 0, max: 100, count: 4, allowRepeats: false },
    { version: '1.0.0', commit: 'local' },
  );
  await page.goto('./#/verificar');
  const input = page.getByLabel('Registro do sorteio (.json)');
  await input.setInputFiles({
    name: 'sorteio.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(record)),
  });
  await expect(
    page.getByRole('heading', { name: 'Resultado consistente com o registro' }),
  ).toBeVisible();
  await expect(page.getByText(record.id, { exact: true })).toBeVisible();
  await expect(page.getByText(/não comprova tentativa única/)).toBeVisible();
  await input.setInputFiles({
    name: 'alterado.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ ...record, digest: '0'.repeat(64) })),
  });
  await expect(page.getByRole('alert')).toContainText('SHA-256 não corresponde');
  await expect(
    page.getByRole('heading', { name: 'Resultado consistente com o registro' }),
  ).toHaveCount(0);
});

test('shows an actionable message for an invalid JSON record', async ({ page }) => {
  await page.goto('./#/verificar');
  await page.getByLabel('Registro do sorteio (.json)').setInputFiles({
    name: 'sorteio.json',
    mimeType: 'application/json',
    buffer: Buffer.from('invalid json'),
  });
  await expect(page.getByRole('alert')).toContainText('Escolha o registro baixado após o sorteio');
});
