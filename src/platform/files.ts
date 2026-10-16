import type { DrawRecordV1 } from '../domain/types';

const modeLabels = { teams: 'Equipes', names: 'Nomes', numbers: 'Números' };

export function formatResultText(record: DrawRecordV1): string {
  const lines = [
    `Sorteador Rede Soma — ${modeLabels[record.result.mode]}`,
    `Sorteio ${record.id}`,
    '',
  ];

  switch (record.result.mode) {
    case 'teams':
      record.result.teams.forEach((team, index) => {
        lines.push(`Equipe ${index + 1}`, ...team.map(({ name }) => name), '');
      });
      break;
    case 'names':
      lines.push(...record.result.winners.map(({ name }, index) => `${index + 1}. ${name}`));
      break;
    case 'numbers':
      lines.push(...record.result.numbers.map((number, index) => `${index + 1}. ${number}`));
  }

  return lines.join('\n').trimEnd();
}

// Spreadsheet applications may interpret user-provided names as formulas.
function csvCell(value: string | number): string {
  const text = String(value);
  const safeText = /^[\s\uFEFF]*[=+\-@\t\r]/u.test(text) ? `'${text}` : text;
  return `"${safeText.replaceAll('"', '""')}"`;
}

export function formatResultCsv(record: DrawRecordV1): string {
  const rows: (string | number)[][] = [];

  switch (record.result.mode) {
    case 'teams':
      rows.push(['Equipe', 'Inscrição', 'Participante']);
      record.result.teams.forEach((team, index) => {
        team.forEach(({ id, name }) => rows.push([index + 1, id, name]));
      });
      break;
    case 'names':
      rows.push(['Posição', 'Inscrição', 'Participante']);
      record.result.winners.forEach(({ id, name }, index) => rows.push([index + 1, id, name]));
      break;
    case 'numbers':
      rows.push(['Posição', 'Número']);
      record.result.numbers.forEach((number, index) => rows.push([index + 1, number]));
  }

  return '\uFEFF' + rows.map((row) => row.map(csvCell).join(';')).join('\r\n');
}

function download(content: string, mimeType: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  // Give the browser time to consume the URL before releasing the Blob.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

function filenameId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 80) || 'registro';
}

export function downloadCsv(record: DrawRecordV1): void {
  download(formatResultCsv(record), 'text/csv;charset=utf-8', `soma-${filenameId(record.id)}.csv`);
}

export function downloadRecord(record: DrawRecordV1): void {
  download(
    JSON.stringify(record),
    'application/json;charset=utf-8',
    `soma-${filenameId(record.id)}.json`,
  );
}
