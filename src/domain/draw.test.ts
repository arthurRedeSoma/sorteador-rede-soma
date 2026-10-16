import { describe, expect, it } from 'vitest';
import { draw, validateRequest } from './draw';
import { parseParticipants } from './participants';
import type { DrawRequest, RandomSource } from './types';

const participants = parseParticipants('Ana\nBia\nCaio');
const zero: RandomSource = { nextInt: () => 0 };

function sequence(choices: number[]): RandomSource {
  let index = 0;
  return { nextInt: () => choices[index++]! };
}

describe('draw', () => {
  it('covers every three-person permutation exactly once with equal choice paths', () => {
    const outcomes = new Set<string>();
    for (let first = 0; first < 3; first += 1) {
      for (let second = 0; second < 2; second += 1) {
        const result = draw({ mode: 'names', participants, count: 3 }, sequence([first, second]));
        if (result.mode !== 'names') throw new Error('Unexpected result mode');
        outcomes.add(result.winners.map(({ id }) => id).join(','));
      }
    }
    expect(outcomes.size).toBe(6);
  });

  it('balances teams and includes every registration exactly once', () => {
    const entries = parseParticipants(
      Array.from({ length: 17 }, (_, index) => `Pessoa ${index}`).join('\n'),
    );
    const result = draw({ mode: 'teams', participants: entries, teamCount: 5 }, zero);
    if (result.mode !== 'teams') throw new Error('Unexpected result mode');
    expect(result.teams.map((team) => team.length)).toEqual([4, 4, 3, 3, 3]);
    expect(
      result.teams
        .flat()
        .map(({ id }) => id)
        .sort(),
    ).toEqual(entries.map(({ id }) => id).sort());
  });

  it('keeps homonyms as distinct registrations and does not mutate inputs', () => {
    const entries = parseParticipants('Ana\nAna\nAna');
    const original = structuredClone(entries);
    entries.forEach(Object.freeze);
    Object.freeze(entries);
    const result = draw({ mode: 'names', participants: entries, count: 3 }, zero);
    if (result.mode !== 'names') throw new Error('Unexpected result mode');
    expect(new Set(result.winners.map(({ id }) => id)).size).toBe(3);
    expect(entries).toEqual(original);
  });

  it('allows a single participant in a name draw without requiring random choices', () => {
    const result = draw(
      { mode: 'names', participants: participants.slice(0, 1), count: 1 },
      {
        nextInt() {
          throw new Error('No entropy is needed for one possible result');
        },
      },
    );
    expect(result).toEqual({ mode: 'names', winners: [participants[0]] });
  });

  it('covers all six permutations when selecting all three interval numbers', () => {
    const outcomes = new Set<string>();
    for (let first = 0; first < 3; first += 1) {
      for (let second = 0; second < 2; second += 1) {
        const result = draw(
          { mode: 'numbers', min: 8, max: 10, count: 3, allowRepeats: false },
          sequence([first, second, 0]),
        );
        if (result.mode !== 'numbers') throw new Error('Unexpected result mode');
        expect([...result.numbers].sort((a, b) => a - b)).toEqual([8, 9, 10]);
        outcomes.add(result.numbers.join(','));
      }
    }
    expect(outcomes.size).toBe(6);
  });

  it('handles the largest interval with space proportional to the requested count', () => {
    const result = draw(
      { mode: 'numbers', min: 0, max: 1_000_000_000, count: 10_000, allowRepeats: false },
      zero,
    );
    if (result.mode !== 'numbers') throw new Error('Unexpected result mode');
    expect(result.numbers).toHaveLength(10_000);
    expect(new Set(result.numbers).size).toBe(10_000);
    expect(result.numbers.slice(0, 3)).toEqual([0, 1_000_000_000, 999_999_999]);
  });

  it('uses inclusive endpoints and permits repetition only when requested', () => {
    expect(draw({ mode: 'numbers', min: 10, max: 10, count: 3, allowRepeats: true }, zero)).toEqual(
      { mode: 'numbers', numbers: [10, 10, 10] },
    );
    expect(
      draw(
        { mode: 'numbers', min: 0, max: 1_000_000_000, count: 1, allowRepeats: false },
        { nextInt: (bound) => bound - 1 },
      ),
    ).toEqual({ mode: 'numbers', numbers: [1_000_000_000] });
  });

  it.each([-1, 3, 0.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects invalid random choice %s',
    (choice) => {
      expect(() =>
        draw({ mode: 'names', participants, count: 1 }, { nextInt: () => choice }),
      ).toThrow();
    },
  );
});

describe('request validation', () => {
  it.each<DrawRequest>([
    { mode: 'teams', participants, teamCount: 1 },
    { mode: 'teams', participants, teamCount: 4 },
    { mode: 'teams', participants, teamCount: 2.5 },
    { mode: 'names', participants: [], count: 1 },
    { mode: 'names', participants, count: 0 },
    { mode: 'names', participants, count: 4 },
    { mode: 'names', participants: [{ id: 'a', name: ' ' }], count: 1 },
    { mode: 'names', participants: [{ id: 'a', name: 'x'.repeat(2_001) }], count: 1 },
    {
      mode: 'names',
      participants: [
        { id: 'a', name: 'Ana' },
        { id: 'a', name: 'Bia' },
      ],
      count: 1,
    },
    { mode: 'numbers', min: -1, max: 10, count: 1, allowRepeats: false },
    { mode: 'numbers', min: 0, max: 1_000_000_001, count: 1, allowRepeats: false },
    { mode: 'numbers', min: 10, max: 5, count: 1, allowRepeats: false },
    { mode: 'numbers', min: 0.5, max: 10, count: 1, allowRepeats: false },
    { mode: 'numbers', min: 0, max: 0, count: 2, allowRepeats: false },
    { mode: 'numbers', min: 0, max: 10, count: 10_001, allowRepeats: true },
  ])('rejects an invalid request: %j', (request) => {
    expect(() => validateRequest(request)).toThrow();
  });

  it('accepts 10,000 registrations and rejects 10,001', () => {
    const entries = Array.from({ length: 10_001 }, (_, index) => ({
      id: String(index),
      name: 'Participante',
    }));
    expect(() =>
      validateRequest({ mode: 'names', participants: entries.slice(0, 10_000), count: 10_000 }),
    ).not.toThrow();
    expect(() => validateRequest({ mode: 'names', participants: entries, count: 1 })).toThrow(
      '10.000',
    );
  });
});
