import crypto from 'crypto';
import redisClient from '../config/redis.js';

export const validateApiKey = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const apiKey = authHeader && authHeader.split(' ')[1];

  if (!apiKey || !apiKey.startsWith('sk-live-')) {
    return res.status(401).json({ 
      error: { message: 'Invalid or missing API key format. Expected Bearer sk-live-...' } 
    });
  }

  try {
    // Hash key to lookup in Redis
    const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
    const keyData = await redisClient.hGetAll(`key:${keyHash}`);

    if (!keyData || !keyData.status || keyData.status !== 'active') {
      return res.status(403).json({ 
        error: { message: 'Unauthorized: Invalid, revoked, or inactive API Key.' } 
      });
    }

    // Attach developer and key metadata to request
    req.apiKeyMeta = {
      keyHash,
      keyId: keyData.keyId,
      developerId: keyData.developerId,
      tier: keyData.tier || 'free'
    };

    next();
  } catch (error) {
    console.error('API Key Auth Middleware Error:', error);
    return res.status(500).json({ error: { message: 'Internal Server Error during Authentication' } });
  }
};