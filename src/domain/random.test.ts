import { describe, expect, it } from 'vitest';
import { createCryptoRandomSource } from '../platform/random';

function cryptoSequence(values: number[]) {
  let calls = 0;
  const provider: Pick<Crypto, 'getRandomValues'> = {
    getRandomValues(array) {
      if (!(array instanceof Uint32Array)) throw new Error('Expected a Uint32Array');
      if (calls >= values.length) throw new Error('The random sequence was exhausted');
      array[0] = values[calls++]!;
      return array;
    },
  };
  return { provider, calls: () => calls };
}

describe('cryptographic integer sampling', () => {
  it('rejects the incomplete upper range before taking modulo', () => {
    const mock = cryptoSequence([4_294_967_295, 4_294_967_294]);
    expect(createCryptoRandomSource(mock.provider).nextInt(3)).toBe(2);
    expect(mock.calls()).toBe(2);
  });

  it('rejects exactly at the threshold for the largest supported draw interval', () => {
    const mock = cryptoSequence([4_000_000_004, 4_000_000_003]);
    expect(createCryptoRandomSource(mock.provider).nextInt(1_000_000_001)).toBe(1_000_000_000);
    expect(mock.calls()).toBe(2);
  });

  it('does not reject any sample for a power-of-two range', () => {
    const mock = cryptoSequence([4_294_967_295]);
    expect(createCryptoRandomSource(mock.provider).nextInt(256)).toBe(255);
    expect(mock.calls()).toBe(1);
  });

  it.each([0, -1, 1.5, Number.NaN, 2 ** 32 + 1])('rejects unsupported bounds %s', (bound) => {
    const mock = cryptoSequence([]);
    expect(() => createCryptoRandomSource(mock.provider).nextInt(bound)).toThrow();
    expect(mock.calls()).toBe(0);
  });

  it('fails without a cryptographic provider', () => {
    expect(() => createCryptoRandomSource(null as unknown as Crypto)).toThrow('criptográfica');
  });
});
