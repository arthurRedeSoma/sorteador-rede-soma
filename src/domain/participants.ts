import type { Participant } from './types';

export function parseParticipants(text: string): Participant[] {
  return text
    .split(/\r\n|[\n\r]/u)
    .map((name) => name.trim().normalize('NFC'))
    .filter(Boolean)
    .map((name, index) => ({ id: `p-${index + 1}`, name }));
}

function comparisonKey(name: string): string {
  return name.trim().normalize('NFC').toLocaleLowerCase('pt-BR');
}

export function findDuplicates(participants: Participant[]): string[] {
  const firstNames = new Map<string, string>();
  const duplicates = new Set<string>();

  for (const { name } of participants) {
    const key = comparisonKey(name);
    const firstName = firstNames.get(key);
    if (firstName !== undefined) duplicates.add(firstName);
    else firstNames.set(key, name);
  }

  return [...duplicates];
}

export function deduplicateParticipants(participants: Participant[]): Participant[] {
  const seen = new Set<string>();
  return participants.filter(({ name }) => {
    const key = comparisonKey(name);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
