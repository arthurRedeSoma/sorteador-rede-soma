import { describe, expect, it } from 'vitest';
import { MAX_IMPORT_BYTES, parseImport, readImportFile, selectParticipants } from './parseImport';

describe('participant imports', () => {
  it('preserves accents and homonyms while ignoring empty lines', () => {
    const parsed = parseImport(
      '\uFEFF  João Silva \r\n\r\nAna Júlia\nJoão Silva\rLuís',
      'Participantes.TXT',
    );
    expect(selectParticipants(parsed, 0, false)).toEqual([
      'João Silva',
      'Ana Júlia',
      'João Silva',
      'Luís',
    ]);
  });

  it('detects semicolon-separated CSV and lets the user choose a column and header', () => {
    const parsed = parseImport(
      'Código;Nome;Cidade\n1;"Ana; Maria";Manaus\n2;José;Salvador',
      'lista.csv',
    );
    expect(parsed.columnCount).toBe(3);
    expect(selectParticipants(parsed, 1, true)).toEqual(['Ana; Maria', 'José']);
    expect(selectParticipants(parsed, 1, false)).toEqual(['Nome', 'Ana; Maria', 'José']);
  });

  it('supports commas, quoted commas, and escaped quotation marks', () => {
    const parsed = parseImport('name,code\n"Silva, Ana",1\n"João ""Juca""",2', 'lista.csv');
    expect(selectParticipants(parsed, 0, true)).toEqual(['Silva, Ana', 'João "Juca"']);
  });

  it('accepts a one-column CSV', () => {
    const parsed = parseImport('Ana\nBruno\nClara', 'lista.csv');
    expect(selectParticipants(parsed, 0, false)).toEqual(['Ana', 'Bruno', 'Clara']);
  });

  it('does not silently split names spanning lines in CSV', () => {
    const parsed = parseImport('Nome,Código\n"Ana\nMaria",1', 'lista.csv');
    expect(() => selectParticipants(parsed, 0, true)).toThrow('quebra de linha');
  });

  it('rejects malformed CSV, binary data, unsupported files, and names over the limit', () => {
    expect(() => parseImport('"Ana,Bruno', 'lista.csv')).toThrow('aspas');
    expect(() => parseImport('Ana\0Maria', 'lista.txt')).toThrow('texto válido');
    expect(() => parseImport('Ana', 'lista.xlsx')).toThrow('TXT ou CSV');
    expect(() => selectParticipants(parseImport('a'.repeat(2_001), 'lista.txt'), 0, false)).toThrow(
      '2.000',
    );
  });

  it('allows 10,000 participants and a separately selected CSV header', () => {
    const text = Array.from({ length: 10_000 }, (_, i) => `Pessoa ${i}`).join('\n');
    expect(selectParticipants(parseImport(text, 'lista.txt'), 0, false)).toHaveLength(10_000);
    expect(() => parseImport(text + '\nOutra pessoa', 'lista.txt')).toThrow('10.000');
    const csv = parseImport('Nome\n' + text, 'lista.csv');
    expect(selectParticipants(csv, 0, true)).toHaveLength(10_000);
    expect(() => selectParticipants(csv, 0, false)).toThrow('10.000');
    expect(() => parseImport('Nome\n' + text + '\nOutra pessoa', 'lista.csv')).toThrow('10.000');
  });

  it('checks file size before reading and reports non-UTF-8 content', async () => {
    await expect(
      readImportFile(new File([new Uint8Array(MAX_IMPORT_BYTES + 1)], 'lista.txt')),
    ).rejects.toThrow('5 MB');
    await expect(
      readImportFile(new File([new Uint8Array([0xc3, 0x28])], 'lista.txt')),
    ).rejects.toThrow('UTF-8');
    const parsed = await readImportFile(new File(['Ana\nJoão'], 'lista.txt'));
    expect(selectParticipants(parsed, 0, false)).toEqual(['Ana', 'João']);
  });
});
