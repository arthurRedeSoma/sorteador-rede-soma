import Papa from 'papaparse';

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_PARTICIPANTS = 10_000;
const MAX_NAME_LENGTH = 2_000;

export interface ImportPreview {
  kind: 'txt' | 'csv';
  rows: string[][];
  columnCount: number;
}

export function parseImport(text: string, filename: string): ImportPreview {
  if (text.includes('\0'))
    throw new Error('O arquivo não contém texto válido. Salve a lista como TXT ou CSV em UTF-8.');

  const extension = filename.split('.').at(-1)?.toLowerCase();
  if (extension === 'txt') {
    const rows = text
      .replace(/^\uFEFF/u, '')
      .split(/\r\n|\n|\r/u)
      .map((line) => [line.trim()])
      .filter(([line]) => line);
    if (rows.length > MAX_PARTICIPANTS)
      throw new Error('A lista ultrapassa o limite de 10.000 participantes.');
    return { kind: 'txt', rows, columnCount: 1 };
  }

  if (extension !== 'csv') throw new Error('Escolha um arquivo TXT ou CSV.');

  const parsed = Papa.parse<string[]>(text, {
    skipEmptyLines: 'greedy',
    preview: MAX_PARTICIPANTS + 2,
  });
  if (parsed.errors.some((error) => error.code !== 'UndetectableDelimiter')) {
    throw new Error('O CSV contém aspas ou campos inválidos. Revise o arquivo e tente novamente.');
  }
  if (parsed.data.length > MAX_PARTICIPANTS + 1 || parsed.meta.truncated) {
    throw new Error('O CSV ultrapassa o limite de 10.000 participantes e uma linha de cabeçalho.');
  }
  const columnCount = parsed.data.reduce((max, row) => Math.max(max, row.length), 0);
  if (columnCount > 1_000)
    throw new Error(
      'O CSV tem colunas demais. Exporte apenas as colunas da lista de participantes.',
    );
  return { kind: 'csv', rows: parsed.data, columnCount };
}

export function selectParticipants(
  preview: ImportPreview,
  column: number,
  hasHeader: boolean,
): string[] {
  const rows = preview.rows.slice(preview.kind === 'csv' && hasHeader ? 1 : 0);
  const names = rows.map((row) => (row[column] ?? '').trim()).filter(Boolean);
  if (names.length > MAX_PARTICIPANTS)
    throw new Error('A lista ultrapassa o limite de 10.000 participantes.');
  if (names.some((name) => /[\r\n]/u.test(name)))
    throw new Error('Há um nome com quebra de linha. Corrija esse campo no CSV antes de importar.');
  if (names.some((name) => name.length > MAX_NAME_LENGTH))
    throw new Error(
      'Cada nome pode ter até 2.000 caracteres. Revise os campos da coluna selecionada.',
    );
  return names;
}

export async function readImportFile(file: File): Promise<ImportPreview> {
  if (file.size > MAX_IMPORT_BYTES) throw new Error('O arquivo deve ter no máximo 5 MB.');
  let text: string;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer());
  } catch {
    throw new Error('Não foi possível ler o arquivo. Salve uma cópia em UTF-8 e tente novamente.');
  }
  return parseImport(text, file.name);
}
