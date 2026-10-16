import { canonicalJson } from '../domain/canonical';
import { draw } from '../domain/draw';
import { MAX_RECORD_BYTES } from '../domain/limits';
import { freezeRecord, parseRecord } from '../domain/records';
import type { BuildIdentity, DrawRecordV1, DrawRequest } from '../domain/types';
import { boundedString, parseRequest } from '../domain/validation';
import { createCryptoRandomSource } from './random';

async function digestRecord(record: Omit<DrawRecordV1, 'digest'>): Promise<string> {
  if (!globalThis.crypto?.subtle)
    throw new Error('A verificação criptográfica está indisponível neste navegador.');
  const serialized = new TextEncoder().encode(canonicalJson(record));
  // Include room for the digest field that will be added to the exported record.
  if (serialized.byteLength + 76 > MAX_RECORD_BYTES)
    throw new Error('O registro excede o limite de 10 MiB.');
  const hash = await globalThis.crypto.subtle.digest('SHA-256', serialized);
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function createRecord(
  request: DrawRequest,
  build: BuildIdentity,
): Promise<DrawRecordV1> {
  if (!globalThis.crypto?.randomUUID || !globalThis.crypto.subtle) {
    throw new Error(
      'Este navegador não oferece os recursos criptográficos necessários. Acesse o site por HTTPS em um navegador atualizado.',
    );
  }
  const snapshot = parseRequest(request);
  const choices: number[] = [];
  const random = createCryptoRandomSource();
  const result = draw(snapshot, {
    nextInt(maxExclusive) {
      const choice = random.nextInt(maxExclusive);
      choices.push(choice);
      return choice;
    },
  });
  const payload: Omit<DrawRecordV1, 'digest'> = {
    schemaVersion: 1,
    algorithmVersion: '1',
    id: globalThis.crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    build: {
      version: boundedString(build.version, 128, 'A versão da aplicação é inválida.'),
      commit: boundedString(build.commit, 128, 'A identificação do build é inválida.'),
    },
    request: snapshot,
    result,
    choices,
  };
  const digest = await digestRecord(payload);
  return freezeRecord({ ...payload, digest });
}

export type VerificationResult =
  { valid: true; record: DrawRecordV1 } | { valid: false; error: string };

export async function verifyRecord(input: unknown): Promise<VerificationResult> {
  try {
    const record = parseRecord(input);
    const { digest, ...payload } = record;
    if ((await digestRecord(payload)) !== digest) {
      return { valid: false, error: 'O SHA-256 não corresponde ao conteúdo do registro.' };
    }
    return { valid: true, record };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Não foi possível verificar este registro.',
    };
  }
}
