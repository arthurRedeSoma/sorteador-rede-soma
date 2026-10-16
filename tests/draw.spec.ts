import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { SESSION_STORAGE_KEY } from '../src/platform/session';
import { DRAFT_STORAGE_KEY } from '../src/platform/draft';
import type { DrawRecordV1 } from '../src/domain/types';

const people = ['Ana', 'Bruno', 'Camila', 'Diego', 'Elisa'];
async function records(page: import('@playwright/test').Page): Promise<DrawRecordV1[]> {
  return page.evaluate((key) => {
    const stored = JSON.parse(sessionStorage.getItem(key) || '{}');
    return stored.records || [];
  }, SESSION_STORAGE_KEY);
}

test('creates balanced teams and preserves every participant', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('textbox', { name: 'Participantes', exact: true }).fill(people.join('\n'));
  await expect(page.getByText('2 equipes de 2 a 3 pessoas')).toBeVisible();
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  const result = (await records(page))[0]!.result;
  expect(result.mode).toBe('teams');
  if (result.mode !== 'teams') throw new Error('Expected teams');
  expect(result.teams.map((t) => t.length)).toEqual([3, 2]);
  expect(
    result.teams
      .flat()
      .map((p) => p.name)
      .sort(),
  ).toEqual([...people].sort());
  const before = JSON.stringify(result);
  await page.getByRole('textbox', { name: 'Participantes', exact: true }).fill('Outro\nNome');
  expect(JSON.stringify((await records(page))[0]!.result)).toBe(before);
});

test('requires duplicate review and can remove duplicate names', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('textbox', { name: 'Participantes', exact: true }).fill('Ana\nBruno\nana');
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Revise os nomes repetidos');
  expect(await records(page)).toHaveLength(0);
  await page.getByRole('button', { name: 'Remover duplicatas' }).click();
  await expect(page.getByRole('textbox', { name: 'Participantes', exact: true })).toHaveValue(
    'Ana\nBruno',
  );
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
});

test('preserves homonyms when separate entries are confirmed', async ({ page }) => {
  await page.goto('./#/nomes');
  await page.getByRole('textbox', { name: 'Participantes', exact: true }).fill('Ana\nAna');
  await page.getByRole('button', { name: 'Manter inscrições distintas' }).click();
  await page.getByLabel('Quantos nomes sortear?').fill('2');
  await page.getByRole('button', { name: 'Sortear nomes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  const record = (await records(page))[0]!;
  if (record.result.mode !== 'names') throw new Error('Expected names');
  expect(record.result.winners.map((p) => p.name)).toEqual(['Ana', 'Ana']);
  expect(new Set(record.result.winners.map((p) => p.id)).size).toBe(2);
});

test('numbers are inclusive and unique, including the single-value interval', async ({ page }) => {
  await page.goto('./#/numeros');
  await page.getByLabel('De', { exact: true }).fill('0');
  await page.getByLabel('Até', { exact: true }).fill('4');
  await page.getByLabel('Quantos números sortear?').fill('5');
  await page.getByRole('button', { name: 'Sortear números', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  const record = (await records(page))[0]!;
  if (record.result.mode !== 'numbers') throw new Error('Expected numbers');
  expect([...record.result.numbers].sort()).toEqual([0, 1, 2, 3, 4]);
});

test('does not perform another draw when presenting or on double click', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Usar lista de exemplo' }).click();
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).dblclick();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  expect(await records(page)).toHaveLength(1);
  const original = (await records(page))[0]!;
  await page.getByRole('button', { name: 'Apresentar', exact: true }).click();
  await page.getByRole('button', { name: 'Pular contagem' }).click();
  await page.getByRole('button', { name: 'Próximo', exact: true }).click();
  await page.getByRole('button', { name: 'Ver todos', exact: true }).click();
  await page.keyboard.press('Escape');
  expect(await records(page)).toEqual([original]);
});

test('restores session history and opens an earlier immutable result', async ({ page }) => {
  await page.goto('./#/nomes');
  await page.getByRole('textbox', { name: 'Participantes', exact: true }).fill('Ana\nBruno');
  await page.getByRole('button', { name: 'Sortear nomes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  const original = (await records(page))[0]!;
  await page.reload();
  await page.getByRole('button', { name: /Histórico/ }).click();
  await page.getByRole('button', { name: /Nomes.*Sorteio 1/ }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  expect(await records(page)).toEqual([original]);
  await page.getByRole('textbox', { name: 'Participantes', exact: true }).fill('Outra\nLista');
  await page.getByRole('button', { name: 'Novo sorteio', exact: true }).click();
  await expect(page.getByRole('textbox', { name: 'Participantes', exact: true })).toHaveValue(
    'Ana\nBruno',
  );
  await expect(page.getByRole('textbox', { name: 'Participantes', exact: true })).toBeFocused();
  expect(await records(page)).toEqual([original]);
});

test('keeps preparation when reading help and reloading the tab', async ({ page }) => {
  await page.goto('./');
  await page
    .getByRole('textbox', { name: 'Participantes', exact: true })
    .fill('Ana\nBruno\nCamila');
  await page.getByLabel('Quantidade de equipes').fill('3');
  await page.getByRole('link', { name: 'Como funciona', exact: true }).click();
  await page.getByRole('link', { name: 'Voltar ao sorteador' }).click();
  await expect(page.getByRole('textbox', { name: 'Participantes', exact: true })).toHaveValue(
    'Ana\nBruno\nCamila',
  );
  await expect(page.getByLabel('Quantidade de equipes')).toHaveValue('3');
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(sessionStorage.getItem(key) || '{}').draft?.teamAmount,
        DRAFT_STORAGE_KEY,
      ),
    )
    .toBe('3');
  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Participantes', exact: true })).toHaveValue(
    'Ana\nBruno\nCamila',
  );
  await expect(page.getByLabel('Quantidade de equipes')).toHaveValue('3');
});

test('explains when the maximum size would create only one team', async ({ page }) => {
  await page.goto('./');
  await page
    .getByRole('textbox', { name: 'Participantes', exact: true })
    .fill('Ana\nBruno\nCamila');
  await page.getByLabel('Pessoas por equipe', { exact: true }).check();
  await expect(
    page.getByText('Use no máximo 2 por equipe para formar ao menos 2 equipes.'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Reduza o máximo');
  await expect(page.getByRole('alert')).toBeFocused();
});

test('exports a record that the browser can verify again', async ({ page }) => {
  await page.goto('./');
  await page.getByRole('button', { name: 'Usar lista de exemplo' }).click();
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Baixar registro' }).click();
  const downloaded = await download;
  const path = await downloaded.path();
  expect(path).toBeTruthy();
  await page.getByRole('link', { name: 'Verificar registro', exact: true }).click();
  await page.getByLabel('Registro do sorteio (.json)').setInputFiles(path!);
  await expect(
    page.getByRole('heading', { name: 'Resultado consistente com o registro' }),
  ).toBeVisible();
});

test('handles unavailable storage while keeping a usable result', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Usar lista de exemplo' }).click();
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  await expect(page.getByText(/O navegador não conseguiu salvar a sessão/i)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Baixar registro' })).toBeEnabled();
});

test('never sends participant data or results over the network', async ({ page, baseURL }) => {
  const requests: string[] = [];
  page.on('request', (request) =>
    requests.push(`${request.method()} ${request.url()} ${request.postData() || ''}`),
  );
  await page.goto('./');
  await page
    .getByRole('textbox', { name: 'Participantes', exact: true })
    .fill('LOCAL_ONLY_MARKER\nOutra pessoa');
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  expect(requests.every((request) => !request.includes('LOCAL_ONLY_MARKER'))).toBe(true);
  expect(requests.every((request) => request.startsWith(`GET ${new URL(baseURL!).origin}/`))).toBe(
    true,
  );
});

for (const width of [360, 768, 1440]) {
  test(`usable and accessible at ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('./');
    await page.screenshot({
      path: testInfo.outputPath(`equipes-${width}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
    await page.getByRole('button', { name: 'Usar lista de exemplo' }).click();
    await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
    await page.screenshot({
      path: testInfo.outputPath(`resultado-${width}.png`),
      fullPage: true,
      animations: 'disabled',
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    const resultAudit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(resultAudit.violations).toEqual([]);
  });
}

test('keyboard navigation and reduced motion presentation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('./#/nomes');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Pular para o conteúdo' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/nomes$/);
  await page.getByRole('textbox', { name: 'Participantes', exact: true }).fill('Ana\nBruno');
  await page.getByRole('button', { name: 'Sortear nomes', exact: true }).click();
  await page.getByRole('button', { name: 'Apresentar', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Pular contagem' })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Apresentar', exact: true })).toBeFocused();
});

test('keeps an in-flight draw locked when navigating to help', async ({ page }) => {
  await page.addInitScript(() => {
    const digest = crypto.subtle.digest.bind(crypto.subtle);
    crypto.subtle.digest = async (...args) => {
      await new Promise((resolve) =>
        window.addEventListener('test:finish-digest', resolve, { once: true }),
      );
      return digest(...args);
    };
  });
  await page.goto('./');
  await page.getByRole('textbox', { name: 'Participantes', exact: true }).fill('Ana\nBruno');
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await page.getByRole('link', { name: 'Como funciona', exact: true }).click();
  await page.getByRole('link', { name: 'Voltar ao sorteador' }).click();
  await expect(page.getByRole('button', { name: 'Sorteando…', exact: true })).toBeDisabled();
  await page.evaluate(() => window.dispatchEvent(new Event('test:finish-digest')));
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  expect(await records(page)).toHaveLength(1);
});

test('defers automatic presentation while help is open', async ({ page }) => {
  await page.addInitScript(() => {
    const digest = crypto.subtle.digest.bind(crypto.subtle);
    crypto.subtle.digest = async (...args) => {
      await new Promise((resolve) =>
        window.addEventListener('test:finish-digest', resolve, { once: true }),
      );
      return digest(...args);
    };
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Usar lista de exemplo' }).click();
  await page.getByText('Opções de apresentação', { exact: true }).click();
  await page.getByLabel('Abrir em modo apresentação').check();
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await page.getByRole('link', { name: 'Como funciona', exact: true }).click();
  await page.evaluate(() => window.dispatchEvent(new Event('test:finish-digest')));
  await expect.poll(() => records(page)).toHaveLength(1);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Voltar ao sorteador' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  expect(await records(page)).toHaveLength(1);
});

test('blocks drawing without a cryptographic source', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(crypto, 'getRandomValues', { value: undefined }),
  );
  await page.goto('./');
  await page.getByRole('button', { name: 'Usar lista de exemplo' }).click();
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('aleatoriedade criptográfica');
  expect(await records(page)).toHaveLength(0);
});

test('keeps long names readable and prints only the result', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto('./');
  const name = 'Ana '.repeat(80).trim();
  await page.getByRole('textbox', { name: 'Participantes', exact: true }).fill(`${name}\nBruno`);
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.emulateMedia({ media: 'print' });
  await expect(
    page.getByRole('heading', { name: 'Sorteador de equipes', exact: true }),
  ).not.toBeVisible();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  await expect(page.locator('[data-print-result]').getByText(name, { exact: true })).toBeVisible();
});

test('recovers a damaged draft and saves subsequent edits', async ({ page }) => {
  await page.goto('./');
  await page.evaluate((key) => sessionStorage.setItem(key, '{invalid'), DRAFT_STORAGE_KEY);
  await page.reload();
  const participants = page.getByRole('textbox', { name: 'Participantes', exact: true });
  await participants.fill('Ana\nBruno');
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(sessionStorage.getItem(key) || '{}').draft?.text,
        DRAFT_STORAGE_KEY,
      ),
    )
    .toBe('Ana\nBruno');
  await page.reload();
  await expect(participants).toHaveValue('Ana\nBruno');
});

test('keeps controls and results usable at 200 percent page scale', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('./');
  await page.evaluate(() => {
    document.documentElement.style.zoom = '2';
  });
  await page.getByRole('button', { name: 'Usar lista de exemplo' }).click();
  await page.getByRole('button', { name: 'Sortear equipes', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Resultado do sorteio' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: 'Baixar registro' })).toBeEnabled();
});
