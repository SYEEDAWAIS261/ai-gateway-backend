import { createClient } from 'redis';
import dotenv from 'dotenv';

dotenv.config();

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('connect', () => {
  console.log('⚡ Redis Client: Connected successfully');
});

redisClient.on('error', (err) => {
  console.error('❌ Redis Client Error (App running in bypass mode):', err.message);
});

export const connectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (error) {
    console.error('⚠️ Could not connect to Redis. Continuing without caching/rate-limiting:', error.message);
  }
};

// ⚡ YE LINE MISSING THI - ISKO ENSURE KAREIN
export default redisClient;