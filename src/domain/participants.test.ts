import { describe, expect, it } from 'vitest';
import { deduplicateParticipants, findDuplicates, parseParticipants } from './participants';

describe('participant preparation', () => {
  it('trims empty lines and preserves accents, internal spacing and input order', () => {
    expect(parseParticipants('  Ana  Paula \r\n\r\n Joa\u0303o\n  Márcia  \rBruno')).toEqual([
      { id: 'p-1', name: 'Ana  Paula' },
      { id: 'p-2', name: 'João' },
      { id: 'p-3', name: 'Márcia' },
      { id: 'p-4', name: 'Bruno' },
    ]);
  });

  it('reports repeated names once without equating different accents', () => {
    const participants = parseParticipants('José\nJOSÉ\nJose\njosé\nAna\nANA');
    expect(findDuplicates(participants)).toEqual(['José', 'Ana']);
    expect(participants).toHaveLength(6);
  });

  it('deduplicates only on request, preserving the first registration and its ID', () => {
    const participants = parseParticipants('JOÃO\njoa\u0303o\nBia');
    expect(deduplicateParticipants(participants)).toEqual([participants[0], participants[2]]);
    expect(participants).toHaveLength(3);
  });
});
