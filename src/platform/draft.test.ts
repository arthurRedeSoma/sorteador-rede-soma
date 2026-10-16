import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  defaultDraft,
  DRAFT_STORAGE_KEY,
  loadDraft,
  MAX_DRAFT_TEXT_BYTES,
  saveDraft,
  type DrawDraft,
} from './draft';

describe('draft persistence', () => {
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
  afterEach(() => vi.unstubAllGlobals());

  it('starts with the defined defaults and returns independent snapshots', () => {
    expect(loadDraft()).toEqual({ draft: defaultDraft });
    const first = loadDraft();
    first.draft.text = 'Alterado';
    expect(loadDraft().draft.text).toBe('');
    expect(defaultDraft.text).toBe('');
  });

  it('restores text and every setting exactly, including explicit duplicate acceptance', () => {
    const draft: DrawDraft = {
      text: '  José\nJOSE\u0301\n\nBia  ',
      teamRule: 'size',
      teamAmount: '4',
      winnerCount: '3',
      minimum: '0',
      maximum: '1000',
      numberCount: '20',
      allowRepeats: true,
      duplicateChoice: 'keep',
      autoPresent: true,
      countdown: false,
    };
    expect(saveDraft(draft)).toBeUndefined();
    expect(loadDraft()).toEqual({ draft });
    expect([...storage.keys()]).toEqual([DRAFT_STORAGE_KEY]);
  });

  it('preserves incomplete numeric fields without treating a draft as a ready draw', () => {
    const draft = {
      ...defaultDraft,
      teamAmount: '',
      minimum: '-',
      maximum: '1e',
      winnerCount: '0',
    };
    expect(saveDraft(draft)).toBeUndefined();
    expect(loadDraft().draft).toEqual(draft);
  });

  it.each(['', 'not json', '{}', 'null', '[]', '{"version":2,"draft":{}}'])(
    'recovers safely from invalid storage %j',
    (value) => {
      storage.set(DRAFT_STORAGE_KEY, value);
      expect(loadDraft().draft).toEqual(defaultDraft);
      expect(loadDraft().warning).toContain('Não foi possível recuperar');
    },
  );

  it.each([
    { ...defaultDraft, unexpected: true },
    { ...defaultDraft, text: null },
    { ...defaultDraft, teamRule: 'automatic' },
    { ...defaultDraft, duplicateChoice: 'remove' },
    { ...defaultDraft, countdown: 'true' },
    { ...defaultDraft, numberCount: 1 },
    { ...defaultDraft, maximum: '1'.repeat(65) },
    { text: 'Ana' },
  ])('rejects invalid or unknown draft fields', (draft) => {
    storage.set(DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, draft }));
    expect(loadDraft().draft).toEqual(defaultDraft);
    expect(loadDraft().warning).toBeTruthy();
  });

  it('rejects unknown envelope fields', () => {
    storage.set(
      DRAFT_STORAGE_KEY,
      JSON.stringify({ version: 1, draft: defaultDraft, other: true }),
    );
    expect(loadDraft().warning).toBeTruthy();
  });

  it('enforces the text limit in UTF-8 bytes when saving and restoring', () => {
    const accepted = { ...defaultDraft, text: 'é'.repeat(MAX_DRAFT_TEXT_BYTES / 2) };
    expect(saveDraft(accepted)).toBeUndefined();
    expect(loadDraft().draft.text).toBe(accepted.text);
    const oversized = { ...accepted, text: accepted.text + 'a' };
    expect(saveDraft(oversized)).toContain('Não foi possível salvar');
    expect(loadDraft().draft.text).toBe(accepted.text);
    storage.set(DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, draft: oversized }));
    expect(loadDraft().warning).toBeTruthy();
    expect(loadDraft().draft).toEqual(defaultDraft);
  });

  it('handles blocked storage without changing the caller preparation', () => {
    vi.stubGlobal('window', {
      get sessionStorage() {
        throw new Error('Blocked');
      },
    });
    const draft = { ...defaultDraft, text: 'Ana\nBruno' };
    expect(loadDraft().warning).toBeTruthy();
    expect(saveDraft(draft)).toContain('poderá ser perdida');
    expect(draft.text).toBe('Ana\nBruno');
  });

  it('reports quota failures and keeps the last stored preparation intact', () => {
    expect(saveDraft({ ...defaultDraft, text: 'Anterior' })).toBeUndefined();
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: () => {
          throw new Error('Quota exceeded');
        },
      },
    });
    expect(saveDraft({ ...defaultDraft, text: 'Nova' })).toContain('poderá ser perdida');
    expect(loadDraft().draft.text).toBe('Anterior');
  });
});
