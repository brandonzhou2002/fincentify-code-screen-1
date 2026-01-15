import { createHash } from 'crypto';

/**
 * Creates a deterministic SHA-256 hash in hexadecimal format.
 * The same input will always produce the same hash output.
 * Used for duplicate detection where deterministic hashing is required (e.g., card PAN matching).
 *
 * @param input - The string to hash
 * @returns A 64-character hexadecimal string representing the SHA-256 hash
 */
export const deterministic_sha256_hex_hash = (input: string): string => {
  return createHash('sha256').update(input).digest('hex');
};
