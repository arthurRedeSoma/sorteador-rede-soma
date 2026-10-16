import type { RandomSource } from '../domain/types';

const UINT32_RANGE = 2 ** 32;

export function createCryptoRandomSource(
  provider: Pick<Crypto, 'getRandomValues'> = globalThis.crypto,
): RandomSource {
  if (!provider || typeof provider.getRandomValues !== 'function') {
    throw new Error(
      'Este navegador não oferece aleatoriedade criptográfica. Abra o site em um navegador atualizado.',
    );
  }
  const buffer = new Uint32Array(1);
  return {
    nextInt(maxExclusive) {
      if (!Number.isSafeInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
        throw new Error('O limite da escolha aleatória é inválido.');
      }
      const limit = Math.floor(UINT32_RANGE / maxExclusive) * maxExclusive;
      let value: number;
      // Incomplete ranges are discarded before modulo, keeping all outcomes equally likely.
      do {
        provider.getRandomValues(buffer);
        value = buffer[0]!;
      } while (value >= limit);
      return value % maxExclusive;
    },
  };
}
