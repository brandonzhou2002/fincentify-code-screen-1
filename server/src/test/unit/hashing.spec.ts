import { expect } from 'chai';
import { deterministic_sha256_hex_hash } from '../../lib/hashing';

describe('deterministic_sha256_hex_hash', () => {
  it('returns the same hash for the same input', () => {
    const input = '4242424242424242';

    const hash_1 = deterministic_sha256_hex_hash(input);
    const hash_2 = deterministic_sha256_hex_hash(input);

    expect(hash_1).to.equal(hash_2);
    expect(hash_1).to.have.length(64);
  });

  it('matches known SHA-256 output', () => {
    const hash = deterministic_sha256_hex_hash('abc');
    expect(hash).to.equal(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
    );
  });
});
