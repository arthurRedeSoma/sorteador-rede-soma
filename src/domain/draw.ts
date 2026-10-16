import type { DrawRequest, DrawResult, Participant, RandomSource } from './types';
import { parseRequest } from './validation';

export function validateRequest(request: DrawRequest): void {
  parseRequest(request);
}

function nextInt(random: RandomSource, bound: number): number {
  const value = random.nextInt(bound);
  if (!Number.isSafeInteger(value) || value < 0 || value >= bound) {
    throw new Error('A fonte aleatória produziu uma escolha inválida.');
  }
  return value;
}

function shuffle(participants: Participant[], random: RandomSource): Participant[] {
  const shuffled = [...participants];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const selected = nextInt(random, index + 1);
    [shuffled[index], shuffled[selected]] = [shuffled[selected]!, shuffled[index]!];
  }
  return shuffled;
}

function drawNumbers(
  request: Extract<DrawRequest, { mode: 'numbers' }>,
  random: RandomSource,
): number[] {
  const span = request.max - request.min + 1;
  if (request.allowRepeats) {
    return Array.from({ length: request.count }, () => request.min + nextInt(random, span));
  }

  // Store only moved positions, so a billion-number interval costs O(count) space.
  const positions = new Map<number, number>();
  const numbers: number[] = [];
  for (let index = 0; index < request.count; index += 1) {
    const remaining = span - index;
    const selected = nextInt(random, remaining);
    numbers.push(request.min + (positions.get(selected) ?? selected));
    positions.set(selected, positions.get(remaining - 1) ?? remaining - 1);
    positions.delete(remaining - 1);
  }
  return numbers;
}

export function draw(request: DrawRequest, random: RandomSource): DrawResult {
  validateRequest(request);
  if (request.mode === 'numbers') return { mode: 'numbers', numbers: drawNumbers(request, random) };

  const participants = shuffle(request.participants, random);
  if (request.mode === 'names')
    return { mode: 'names', winners: participants.slice(0, request.count) };

  const teams = Array.from({ length: request.teamCount }, (): Participant[] => []);
  participants.forEach((participant, index) => teams[index % request.teamCount]!.push(participant));
  return { mode: 'teams', teams };
}
