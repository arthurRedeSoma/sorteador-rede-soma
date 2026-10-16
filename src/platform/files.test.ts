import { describe, expect, it } from 'vitest';
import type { DrawRecordV1, DrawResult } from '../domain/types';
import { formatResultCsv, formatResultText } from './files';

function recordWith(result: DrawResult): DrawRecordV1 {
  return {
    schemaVersion: 1,
    algorithmVersion: '1',
    id: 'f08ff0da-4331-4c35-a1fd-b81d7afc827a',
    createdAt: '2026-10-16T12:00:00.000Z',
    build: { version: '1.0.0', commit: 'local' },
    request: { mode: 'numbers', min: 1, max: 10, count: 1, allowRepeats: false },
    result,
    choices: [0],
    digest: '0'.repeat(64),
  };
}

describe('result exports', () => {
  it('copies team names and every participant without exposing a formula to a spreadsheet', () => {
    const record = recordWith({
      mode: 'teams',
      teams: [[{ id: '1', name: 'João' }], [{ id: '2', name: 'Ana' }]],
    });
    expect(formatResultText(record)).toContain('Equipe 1\nJoão\n\nEquipe 2\nAna');
    expect(formatResultCsv(record)).toBe(
      '\uFEFF"Equipe";"Inscrição";"Participante"\r\n"1";"1";"João"\r\n"2";"2";"Ana"',
    );
  });

  it('neutralizes formula prefixes and escapes separators and quotes', () => {
    const names = [
      '=HYPERLINK("https://example.com")',
      ' +SUM(A1)',
      '-1+1',
      '@SUM(A1)',
      '\t=1+1',
      'Ana; "Maria"',
    ];
    const csv = formatResultCsv(
      recordWith({
        mode: 'names',
        winners: names.map((name, index) => ({ id: String(index), name })),
      }),
    );
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"\' +SUM(A1)"');
    expect(csv).toContain('"\'-1+1"');
    expect(csv).toContain('"\'@SUM(A1)"');
    expect(csv).toContain('"\'\t=1+1"');
    expect(csv).toContain('"Ana; ""Maria"""');
  });

  it('keeps number draw order and uses UTF-8 BOM for Excel', () => {
    const record = recordWith({ mode: 'numbers', numbers: [10, 0, 7] });
    expect(formatResultText(record)).toContain('1. 10\n2. 0\n3. 7');
    expect(formatResultCsv(record)).toBe(
      '\uFEFF"Posição";"Número"\r\n"1";"10"\r\n"2";"0"\r\n"3";"7"',
    );
  });
});
