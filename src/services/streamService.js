/**
 * Express SSE Header setup and Chunk Writer for OpenAI-compatible streaming
 */
export const setupSSEStream = (res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();
};

/**
 * Writes SSE event chunks to the HTTP response stream
 */
export const writeSSEChunk = (res, chunkData) => {
  res.write(`data: ${JSON.stringify(chunkData)}\n\n`);
};

/**
 * Sends stream termination signal to client
 */
export const endSSEStream = (res) => {
  res.write('data: [DONE]\n\n');
  res.end();
};