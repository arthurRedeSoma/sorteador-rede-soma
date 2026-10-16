import { afterEach, describe, expect, it, vi } from 'vitest';
import { createRecord, verifyRecord } from '../platform/records';
import { canonicalJson, utf8ByteLength } from './canonical';
import { parseParticipants } from './participants';
import { parseRecord } from './records';
import type { DrawRecordV1, DrawRequest } from './types';

const build = { version: '1.0.0', commit: 'local' };
const participants = parseParticipants('Ana\nBia\nCaio\nDavi\nEva');

async function recordCopy(): Promise<DrawRecordV1> {
  return structuredClone(await createRecord({ mode: 'teams', participants, teamCount: 2 }, build));
}

afterEach(() => vi.unstubAllGlobals());

describe('draw records', () => {
  it.each<DrawRequest>([
    { mode: 'teams', participants, teamCount: 2 },
    { mode: 'names', participants, count: 3 },
    { mode: 'names', participants: participants.slice(0, 1), count: 1 },
    { mode: 'numbers', min: 0, max: 1_000_000_000, count: 100, allowRepeats: false },
    { mode: 'numbers', min: 5, max: 5, count: 3, allowRepeats: true },
  ])('replays and verifies %j after a JSON round trip', async (request) => {
    const record = await createRecord(request, build);
    expect(record.digest).toMatch(/^[a-f\d]{64}$/u);
    expect(await verifyRecord(JSON.parse(JSON.stringify(record)))).toEqual({ valid: true, record });
    expect(parseRecord(record)).toEqual(record);
  });

  it('takes an immutable snapshot before asynchronous hashing', async () => {
    const entries = structuredClone(participants);
    const identity = { ...build };
    const pending = createRecord({ mode: 'teams', participants: entries, teamCount: 2 }, identity);
    entries[0]!.name = 'Changed';
    entries.push({ id: 'extra', name: 'Extra' });
    identity.version = 'Changed';
    const record = await pending;
    expect(record.build.version).toBe('1.0.0');
    if (record.request.mode !== 'teams' || record.result.mode !== 'teams')
      throw new Error('Unexpected result mode');
    expect(record.request.participants).toEqual(participants);
    expect(Object.isFrozen(record)).toBe(true);
    expect(Object.isFrozen(record.request.participants[0])).toBe(true);
    expect(Object.isFrozen(record.result.teams[0])).toBe(true);
    expect(() => record.choices.push(0)).toThrow();
  });

  it('rejects a changed result even when it still has the expected shape', async () => {
    const record = await recordCopy();
    if (record.result.mode !== 'teams') throw new Error('Unexpected result mode');
    record.result.teams[0]![0]!.name = 'Alterado';
    expect(await verifyRecord(record)).toEqual({
      valid: false,
      error: expect.stringContaining('não corresponde'),
    });
  });

  it('rejects changed metadata through the digest', async () => {
    const record = await recordCopy();
    record.createdAt = '2026-01-01T00:00:00.000Z';
    expect(await verifyRecord(record)).toEqual({
      valid: false,
      error: expect.stringContaining('SHA-256'),
    });
  });

  it('rejects a changed digest', async () => {
    const record = await recordCopy();
    record.digest = '0'.repeat(64);
    expect((await verifyRecord(record)).valid).toBe(false);
  });

  it.each(['schemaVersion', 'algorithmVersion'])('rejects unknown %s', async (field) => {
    const record = { ...(await recordCopy()), [field]: 999 };
    expect(await verifyRecord(record)).toEqual({
      valid: false,
      error: expect.stringContaining('versão'),
    });
  });

  it('rejects missing, extra, fractional and out-of-bound choices', async () => {
    const original = await recordCopy();
    for (const choices of [
      original.choices.slice(1),
      [...original.choices, 0],
      [0.5, ...original.choices.slice(1)],
      [5, ...original.choices.slice(1)],
    ]) {
      expect((await verifyRecord({ ...original, choices })).valid).toBe(false);
    }
  });

  it('rejects malformed and unknown fields without executing a replay', async () => {
    const record = await recordCopy();
    for (const input of [
      null,
      [],
      'record',
      {},
      { ...record, extra: true },
      { ...record, choices: Array(4) },
      { ...record, result: { mode: 'numbers', numbers: [0] } },
    ]) {
      expect((await verifyRecord(input)).valid).toBe(false);
    }
  });

  it('rejects oversized choice arrays and result participant totals before replay', async () => {
    const record = await recordCopy();
    expect(
      (await verifyRecord({ ...record, choices: Array.from({ length: 10_001 }, () => 0) })).valid,
    ).toBe(false);
    expect(
      (
        await verifyRecord({
          ...record,
          result: {
            mode: 'teams',
            teams: [Array(10_000).fill(participants[0]), [participants[1]]],
          },
        })
      ).valid,
    ).toBe(false);
  });

  it('does not execute accessors or traverse arbitrary nested fields', async () => {
    const record = await recordCopy();
    const getMode = vi.fn(() => 'teams');
    const request = { ...record.request };
    Object.defineProperty(request, 'mode', { get: getMode, enumerable: true });
    expect((await verifyRecord({ ...record, request })).valid).toBe(false);
    expect(getMode).not.toHaveBeenCalled();
    const cyclic: Record<string, unknown> = { ...record };
    cyclic.extra = cyclic;
    expect((await verifyRecord(cyclic)).valid).toBe(false);
  });

  it('rejects duplicate participant IDs, invalid dates and forged prototypes', async () => {
    const record = await recordCopy();
    expect((await verifyRecord({ ...record, createdAt: 'invalid' })).valid).toBe(false);
    expect(
      (
        await verifyRecord({
          ...record,
          request: { mode: 'names', participants: [participants[0], participants[0]], count: 1 },
        })
      ).valid,
    ).toBe(false);
    expect((await verifyRecord(Object.create(record))).valid).toBe(false);
  });

  it('does not use a fallback when Web Crypto is unavailable', async () => {
    vi.stubGlobal('crypto', undefined);
    await expect(createRecord({ mode: 'names', participants, count: 1 }, build)).rejects.toThrow(
      'criptográficos',
    );
  });

  it('verifies without depending on property insertion order', async () => {
    const record = await recordCopy();
    const reordered = Object.fromEntries(Object.entries(record).reverse());
    expect((await verifyRecord(reordered)).valid).toBe(true);
    expect(canonicalJson({ z: 1, a: { b: 2, a: 1 } })).toBe('{"a":{"a":1,"b":2},"z":1}');
  });

  it('counts UTF-8 bytes consistently for accented and supplementary characters', () => {
    for (const value of ['Ana', 'João', '漢字', '\uD83D\uDE00', '\uD800']) {
      expect(utf8ByteLength(value)).toBe(new TextEncoder().encode(value).byteLength);
    }
  });
});
