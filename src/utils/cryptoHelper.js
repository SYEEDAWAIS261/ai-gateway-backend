import crypto from 'crypto';

/**
 * Generate SHA-256 Hash of string
 */
export const hashString = (input) => {
  return crypto.createHash('sha256').update(input).digest('hex');
};

/**
 * Truncate secret key for UI display (e.g., sk-live-1234...abcd)
 */
export const truncateKey = (rawKey) => {
  if (!rawKey || rawKey.length < 16) return rawKey;
  return `${rawKey.substring(0, 12)}...${rawKey.slice(-4)}`;
};