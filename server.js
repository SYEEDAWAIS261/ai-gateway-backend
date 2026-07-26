import app from './src/app.js';
import connectDB from './src/config/db.js';
import { connectRedis } from './src/config/redis.js';
import logger from './src/utils/logger.js';

const PORT = process.env.PORT || 8080;

// 1. MongoDB & Redis Connections (Serverless Warmup)
const initializeDatabases = async () => {
  try {
    await connectDB();
    await connectRedis();
  } catch (error) {
    logger.error(`❌ Database Connection Failed: ${error.message}`);
  }
};

// Vercel serverless context ke liye database initialization invoke karein
initializeDatabases();

// 2. Local Machine (VS Code) Par Server Run Karne Ke Liye
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    logger.info(`🚀 AI Gateway Server running on port ${PORT}`);
    logger.info(`⚡ OpenAI Compatible Endpoint: http://localhost:${PORT}/v1/chat/completions`);
  });

  process.on('unhandledRejection', (err) => {
    logger.error(`❌ Unhandled Rejection Error: ${err.message}`);
  });
}

// ⚡ 3. Vercel Deployment Ke Liye Express App Export (LAZMI)
export default app;