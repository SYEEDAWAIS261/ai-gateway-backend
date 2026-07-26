import { groqClient, DEFAULT_AI_CONFIG } from '../config/aiEngine.js';

/**
 * Universal LLM Interface
 * Handles both streaming and non-streaming requests safely.
 */
export const callLLMEngine = async ({ messages, model, stream = false }) => {
  const targetModel = DEFAULT_AI_CONFIG.supportedModels.includes(model)
    ? model
    : DEFAULT_AI_CONFIG.defaultModel;

  try {
    return await groqClient.chat.completions.create({
      messages,
      model: targetModel,
      stream,
      temperature: 0.7,
      max_tokens: 2048,
    });
  } catch (error) {
    console.error('❌ LLM Engine Call Error:', error.message);
    throw new Error(`AI Engine Provider Error: ${error.message}`);
  }
};