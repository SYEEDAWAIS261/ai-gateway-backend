import { executeCompletion } from '../config/aiEngine.js';
import UsageLog from '../models/UsageLog.js';

// @desc    Generate Chat Completion (Supports SSE Streaming)
// @route   POST /v1/chat/completions
export const createChatCompletion = async (req, res, next) => {
  const startTime = Date.now();

  try {
    const { messages, model, stream = false } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({
        error: { message: "'messages' field is required and must be a non-empty array." }
      });
    }

    // 1. STREAMING RESPONSE (Real-Time Typewriter Effect)
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const aiStream = await executeCompletion({ messages, model, stream: true });

      for await (const chunk of aiStream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();

      // Async Log Usage after stream ends
      logUsageAsync(req.apiKeyMeta, model, Date.now() - startTime);
      return;
    }

    // 2. STANDARD NON-STREAMING RESPONSE
    const completion = await executeCompletion({ messages, model, stream: false });
    
    // Log usage to database
    logUsageAsync(req.apiKeyMeta, model, Date.now() - startTime, completion.usage);

    return res.json(completion);

  } catch (error) {
    console.error('Chat Completion Controller Error:', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        error: { message: error.message || 'Error executing AI Inference Engine.' }
      });
    }
  }
};

// Helper: Async background usage logger
const logUsageAsync = async (apiKeyMeta, model, latencyMs, usage = {}) => {
  try {
    await UsageLog.create({
      developer: apiKeyMeta.developerId,
      apiKey: apiKeyMeta.keyId,
      modelUsed: model || 'default-llama-3.3-70b',
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
      latencyMs
    });
  } catch (err) {
    console.error('Failed to log API usage stats:', err.message);
  }
};