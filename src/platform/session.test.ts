import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { DrawRecordV1 } from '../domain/types';
import { loadSession, saveSession, SESSION_STORAGE_KEY } from './session';

const record: DrawRecordV1 = {
  schemaVersion: 1,
  algorithmVersion: '1',
  id: 'f08ff0da-4331-4c35-a1fd-b81d7afc827a',
  createdAt: '2026-10-16T12:00:00.000Z',
  build: { version: '1.0.0', commit: 'local' },
  request: { mode: 'numbers', min: 1, max: 10, count: 1, allowRepeats: false },
  result: { mode: 'numbers', numbers: [1] },
  choices: [0],
  digest: '0'.repeat(64),
};

describe('session history', () => {
  const storage = new Map<string, string>();
  beforeEach(() => {
    storage.clear();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => {
          storage.set(key, value);
        },
      },
    });
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('restores immutable records and handles an empty session', () => {
    expect(loadSession()).toEqual({ records: [] });
    expect(saveSession([record])).toBeUndefined();
    const restored = loadSession();
    expect(restored.records).toEqual([record]);
    expect(Object.isFrozen(restored.records[0])).toBe(true);
  });

  it('recovers valid entries when another entry is malformed or repeated', () => {
    storage.set(
      SESSION_STORAGE_KEY,
      JSON.stringify({ version: 1, records: [record, { ...record, result: null }, record] }),
    );
    const restored = loadSession();
    expect(restored.records).toEqual([record]);
    expect(restored.warning).toContain('Alguns registros');
  });

  it.each(['not json', '{}', '{"version":2,"records":[]}', 'null'])(
    'reports a corrupted session: %s',
    (value) => {
      storage.set(SESSION_STORAGE_KEY, value);
      expect(loadSession().records).toEqual([]);
      expect(loadSession().warning).toContain('Não foi possível recuperar');
    },
  );

  it('keeps the caller records untouched when browser storage is unavailable or full', () => {
    vi.stubGlobal('window', {
      get sessionStorage() {
        throw new Error('Storage blocked');
      },
    });
    expect(loadSession().warning).toBeTruthy();
    const records = [record];
    expect(saveSession(records)).toContain('Baixe os registros');
    expect(records).toEqual([record]);
  });
});
