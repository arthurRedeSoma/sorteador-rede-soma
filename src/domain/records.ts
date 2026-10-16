import { canonicalJson, utf8ByteLength } from './canonical';
import { draw } from './draw';
import { MAX_NUMBER, MAX_PARTICIPANTS, MAX_RECORD_BYTES, MAX_RESULTS } from './limits';
import type { DrawRecordV1, DrawResult } from './types';
import {
  boundedArray,
  boundedString,
  integer,
  modeOf,
  objectWithKeys,
  parseParticipant,
  parseRequest,
} from './validation';

export function freezeRecord(record: DrawRecordV1): DrawRecordV1 {
  if (record.request.mode !== 'numbers') {
    record.request.participants.forEach(Object.freeze);
    Object.freeze(record.request.participants);
  }
  if (record.result.mode === 'teams') {
    for (const team of record.result.teams) {
      team.forEach(Object.freeze);
      Object.freeze(team);
    }
    Object.freeze(record.result.teams);
  } else if (record.result.mode === 'names') {
    record.result.winners.forEach(Object.freeze);
    Object.freeze(record.result.winners);
  } else Object.freeze(record.result.numbers);
  Object.freeze(record.build);
  Object.freeze(record.request);
  Object.freeze(record.result);
  Object.freeze(record.choices);
  return Object.freeze(record);
}

function parseResult(value: unknown): DrawResult {
  const mode = modeOf(value);
  if (mode === 'numbers') {
    const input = objectWithKeys(value, ['mode', 'numbers']);
    const numbers = boundedArray(
      input.numbers,
      MAX_RESULTS,
      'O resultado excede 10.000 números.',
    ).map((number) => integer(number, 0, MAX_NUMBER, 'O resultado contém um número inválido.'));
    return { mode: 'numbers', numbers };
  }
  if (mode === 'names') {
    const input = objectWithKeys(value, ['mode', 'winners']);
    return {
      mode: 'names',
      winners: boundedArray(
        input.winners,
        MAX_PARTICIPANTS,
        'O resultado excede 10.000 participantes.',
      ).map(parseParticipant),
    };
  }
  if (mode === 'teams') {
    const input = objectWithKeys(value, ['mode', 'teams']);
    let total = 0;
    const teams = boundedArray(
      input.teams,
      MAX_PARTICIPANTS,
      'O resultado excede o limite de equipes.',
    ).map((entry) => {
      const team = boundedArray(
        entry,
        MAX_PARTICIPANTS,
        'A equipe excede o limite de participantes.',
      );
      total += team.length;
      if (total > MAX_PARTICIPANTS) throw new Error('O resultado excede 10.000 participantes.');
      return team.map(parseParticipant);
    });
    return { mode: 'teams', teams };
  }
  throw new Error('A modalidade do resultado é inválida.');
}

function checkTextBudget(record: DrawRecordV1): void {
  const requestNames = record.request.mode === 'numbers' ? [] : record.request.participants;
  const resultNames =
    record.result.mode === 'teams'
      ? record.result.teams.flat()
      : record.result.mode === 'names'
        ? record.result.winners
        : [];
  let characters = 0;
  for (const participant of [...requestNames, ...resultNames]) {
    characters += participant.name.length + participant.id.length;
    if (characters > MAX_RECORD_BYTES) throw new Error('O registro excede o limite de 10 MiB.');
  }
}

/** Validates shape and replays the algorithm; SHA-256 is checked by platform/records. */
export function parseRecord(value: unknown): DrawRecordV1 {
  const input = objectWithKeys(value, [
    'schemaVersion',
    'algorithmVersion',
    'id',
    'createdAt',
    'build',
    'request',
    'result',
    'choices',
    'digest',
  ]);
  if (input.schemaVersion !== 1) throw new Error('A versão do registro não é suportada.');
  if (input.algorithmVersion !== '1') throw new Error('A versão do algoritmo não é suportada.');

  const id = boundedString(input.id, 36, 'A identificação do sorteio é inválida.');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(id)) {
    throw new Error('A identificação do sorteio é inválida.');
  }
  const createdAt = boundedString(input.createdAt, 24, 'A data do registro é inválida.');
  const date = new Date(createdAt);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== createdAt)
    throw new Error('A data do registro é inválida.');

  const build = objectWithKeys(input.build, ['version', 'commit']);
  const record: DrawRecordV1 = {
    schemaVersion: 1,
    algorithmVersion: '1',
    id,
    createdAt,
    build: {
      version: boundedString(build.version, 128, 'A versão da aplicação é inválida.'),
      commit: boundedString(build.commit, 128, 'A identificação do build é inválida.'),
    },
    request: parseRequest(input.request),
    result: parseResult(input.result),
    choices: boundedArray(
      input.choices,
      MAX_RESULTS,
      'O registro excede o limite de escolhas aleatórias.',
    ).map((choice) =>
      integer(choice, 0, MAX_NUMBER, 'O registro contém uma escolha aleatória inválida.'),
    ),
    digest: boundedString(input.digest, 64, 'O resumo SHA-256 do registro é inválido.'),
  };
  if (!/^[a-f\d]{64}$/u.test(record.digest))
    throw new Error('O resumo SHA-256 do registro é inválido.');
  checkTextBudget(record);
  if (utf8ByteLength(canonicalJson(record)) > MAX_RECORD_BYTES)
    throw new Error('O registro excede o limite de 10 MiB.');

  let index = 0;
  const replayed = draw(record.request, {
    nextInt(maxExclusive) {
      const choice = record.choices[index];
      index += 1;
      if (choice === undefined) throw new Error('Faltam escolhas aleatórias no registro.');
      if (choice >= maxExclusive)
        throw new Error('Uma escolha aleatória está fora do limite esperado.');
      return choice;
    },
  });
  if (index !== record.choices.length)
    throw new Error('O registro contém escolhas aleatórias excedentes.');
  if (canonicalJson(replayed) !== canonicalJson(record.result)) {
    throw new Error('O resultado não corresponde às entradas e escolhas do registro.');
  }
  return freezeRecord(record);
}
