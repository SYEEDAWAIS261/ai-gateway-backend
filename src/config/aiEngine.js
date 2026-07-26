import OpenAI from 'openai';
import crypto from 'crypto';
import dotenv from 'dotenv';
import redisClient from './redis.js';

dotenv.config();

// ⚡ Groq Cloud LPU Client (Replaces Local Ollama)
export const localAiClient = new OpenAI({
  baseURL: process.env.GROQ_BASE_URL || 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY
});
// Default Supported Groq Models
export const DEFAULT_AI_CONFIG = {
  defaultModel: process.env.AI_MODEL || 'llama-3.2-3b-preview',
  supportedModels: [
    'llama-3.2-3b-preview',
    'llama-3.3-70b-versatile',
    'deepseek-r1-distill-llama-70b',
    'mixtral-8x7b-32768'
  ]
};

/**
 * Helper: Objects ki keys ko deterministically sort karta hai
 * taake JSON.stringify key order par depend na kare.
 */
const canonicalize = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(canonicalize);
  
  return Object.keys(obj)
    .sort()
    .reduce((result, key) => {
      result[key] = canonicalize(obj[key]);
      return result;
    }, {});
};

/**
 * Cryptographically Secure Request Hash Generator
 */
const generatePromptHash = (messages, model, extraParams = {}) => {
  const normalizedPayload = canonicalize({
    messages,
    model,
    temperature: extraParams.temperature ?? 0.7,
    max_tokens: extraParams.max_tokens ?? null,
    top_p: extraParams.top_p ?? 1
  });

  const content = JSON.stringify(normalizedPayload);
  return crypto.createHash('sha256').update(content).digest('hex');
};

/**
 * Universal AI Caller Abstraction Layer using Groq Cloud LPU
 */
export const executeCompletion = async ({ 
  messages, 
  model, 
  stream = false, 
  temperature, 
  max_tokens, 
  top_p 
}) => {
  const selectedModel = DEFAULT_AI_CONFIG.supportedModels.includes(model) 
    ? model 
    : DEFAULT_AI_CONFIG.defaultModel;

  const extraParams = { temperature, max_tokens, top_p };

  // 1. Non-Streaming Cache Check (0ms Response Latency)
  if (!stream) {
    const cacheKey = `cache:completion:${generatePromptHash(messages, selectedModel, extraParams)}`;
    try {
      const cachedResponse = await redisClient.get(cacheKey);
      if (cachedResponse) {
        console.log('⚡ Redis Cache Hit - Responding instantly');
        return JSON.parse(cachedResponse);
      }
    } catch (err) {
      console.error('Cache Read Error:', err.message);
    }
  }

  // 2. Call Groq Cloud AI Engine
  try {
    console.log(`🚀 Executing request on Groq Cloud AI (${selectedModel})...`);

    const response = await localAiClient.chat.completions.create({
      messages,
      model: selectedModel,
      stream,
      ...(temperature !== undefined && { temperature }),
      ...(max_tokens !== undefined && { max_tokens }),
      ...(top_p !== undefined && { top_p })
    });

    // 3. Save Non-Streaming result to Redis (TTL: 12 Hours)
    if (!stream && response) {
      const cacheKey = `cache:completion:${generatePromptHash(messages, selectedModel, extraParams)}`;
      redisClient.setEx(cacheKey, 43200, JSON.stringify(response)).catch((err) => {
        console.error('Cache Write Error:', err.message);
      });
    }

    return response;

  } catch (error) {
    console.error('❌ Groq Cloud AI Execution Error:', error.message);
    throw new Error(`Groq AI Engine Error: ${error.message}`);
  }
};