import { MAX_NAME_LENGTH, MAX_PARTICIPANTS, MAX_NUMBER, MAX_RESULTS } from './limits';
import type { DrawRequest, Participant } from './types';

function plainObject(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('O registro contém um objeto inválido.');
  }
  const prototype: unknown = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null) {
    throw new Error('O registro contém um objeto inválido.');
  }
  return value as Record<string, unknown>;
}

export function modeOf(value: unknown): unknown {
  const object = plainObject(value);
  const descriptor = Object.getOwnPropertyDescriptor(object, 'mode');
  if (!descriptor || !('value' in descriptor))
    throw new Error('A modalidade do sorteio é inválida.');
  return descriptor.value as unknown;
}

export function objectWithKeys(value: unknown, keys: readonly string[]): Record<string, unknown> {
  const object = plainObject(value);
  const ownKeys = Reflect.ownKeys(object);
  if (
    ownKeys.length !== keys.length ||
    ownKeys.some((key) => typeof key !== 'string' || !keys.includes(key))
  ) {
    throw new Error('O registro contém campos ausentes ou desconhecidos.');
  }
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(object, key);
    if (!descriptor || !('value' in descriptor))
      throw new Error('O registro contém um campo inválido.');
  }
  return object;
}

export function integer(value: unknown, min: number, max: number, message: string): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) {
    throw new Error(message);
  }
  return value;
}

export function boundedString(value: unknown, max: number, message: string): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    throw new Error(message);
  }
  return value;
}

export function boundedArray(value: unknown, max: number, message: string): unknown[] {
  if (!Array.isArray(value) || value.length > max) throw new Error(message);
  for (let index = 0; index < value.length; index += 1) {
    const descriptor = Object.getOwnPropertyDescriptor(value, index);
    if (!descriptor || !('value' in descriptor)) throw new Error(message);
  }
  return value;
}

export function parseParticipant(value: unknown): Participant {
  const participant = objectWithKeys(value, ['id', 'name']);
  return {
    id: boundedString(participant.id, 128, 'A identificação do participante é inválida.'),
    name: boundedString(
      participant.name,
      MAX_NAME_LENGTH,
      'Cada nome deve ter entre 1 e 2.000 caracteres.',
    ),
  };
}

function parseParticipantList(value: unknown): Participant[] {
  const entries = boundedArray(value, MAX_PARTICIPANTS, 'Informe até 10.000 participantes.');
  if (entries.length === 0) throw new Error('Adicione pelo menos um participante.');
  const participants = entries.map(parseParticipant);
  if (new Set(participants.map(({ id }) => id)).size !== participants.length) {
    throw new Error('As identificações dos participantes devem ser distintas.');
  }
  return participants;
}

export function parseRequest(value: unknown): DrawRequest {
  const mode = modeOf(value);
  if (mode === 'teams') {
    const input = objectWithKeys(value, ['mode', 'participants', 'teamCount']);
    const participants = parseParticipantList(input.participants);
    const teamCount = integer(
      input.teamCount,
      2,
      participants.length,
      'Informe de 2 equipes até o total de participantes.',
    );
    return { mode: 'teams', participants, teamCount };
  }
  if (mode === 'names') {
    const input = objectWithKeys(value, ['mode', 'participants', 'count']);
    const participants = parseParticipantList(input.participants);
    const count = integer(
      input.count,
      1,
      participants.length,
      'A quantidade de sorteados deve estar entre 1 e o total de participantes.',
    );
    return { mode: 'names', participants, count };
  }
  if (mode === 'numbers') {
    const input = objectWithKeys(value, ['mode', 'min', 'max', 'count', 'allowRepeats']);
    const min = integer(input.min, 0, MAX_NUMBER, 'O início deve ser um inteiro de 0 a 1 bilhão.');
    const max = integer(
      input.max,
      min,
      MAX_NUMBER,
      'O fim deve ser um inteiro entre o início e 1 bilhão.',
    );
    const count = integer(
      input.count,
      1,
      MAX_RESULTS,
      'Informe uma quantidade entre 1 e 10.000 números.',
    );
    if (typeof input.allowRepeats !== 'boolean')
      throw new Error('A opção de repetição é inválida.');
    if (!input.allowRepeats && count > max - min + 1) {
      throw new Error('A quantidade excede os números disponíveis sem repetição.');
    }
    return { mode: 'numbers', min, max, count, allowRepeats: input.allowRepeats };
  }
  throw new Error('A modalidade do sorteio é inválida.');
}
