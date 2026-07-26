import express from 'express';
import { createChatCompletion } from '../controllers/chatController.js';
import { validateApiKey } from '../middlewares/apiKeyAuth.js';
import { apiKeyRateLimiter } from '../middlewares/rateLimiter.js';

const router = express.Router();

// Route: /v1/chat/completions
// Middleware Pipeline: Fast Redis Auth -> Rate Limiting (60 req/min) -> Controller Execution
router.post(
  '/chat/completions',
  validateApiKey,
  apiKeyRateLimiter(60), // 60 requests per minute limit
  createChatCompletion
);

export default router;