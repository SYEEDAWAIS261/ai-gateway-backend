import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';
import redisClient from '../config/redis.js';

/**
 * Generate a cryptographically secure API key, hash it for DB storage,
 * and cache the hash in Redis for fast authentication.
 */
export const generateAndStoreKey = async ({ developerId, name, tier = 'free' }) => {
  // Generate high-entropy raw key: sk-live-98f2a...
  const rawKey = `sk-live-${crypto.randomBytes(24).toString('hex')}`;
  
  // SHA-256 hash for secure database lookup
  const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
  const truncatedKey = `${rawKey.substring(0, 12)}...${rawKey.slice(-4)}`;

  // Save document in MongoDB
  const apiKeyDoc = await ApiKey.create({
    developer: developerId,
    name,
    keyHash,
    truncatedKey,
    tier,
    status: 'active'
  });

  // Warm up Redis Cache (keyHash -> metadata)
  await redisClient.hSet(`key:${keyHash}`, {
    keyId: apiKeyDoc._id.toString(),
    developerId: developerId.toString(),
    status: 'active',
    tier
  });

  return {
    rawKey, // Returned ONLY ONCE during key creation
    apiKeyDoc
  };
};

/**
 * Revoke key and evict from Redis memory
 */
export const revokeKeyService = async (keyId, developerId) => {
  const apiKeyDoc = await ApiKey.findOne({ _id: keyId, developer: developerId });
  if (!apiKeyDoc) return false;

  apiKeyDoc.status = 'revoked';
  await apiKeyDoc.save();

  // Instantly evict from Redis cache
  await redisClient.del(`key:${apiKeyDoc.keyHash}`);
  return true;
};