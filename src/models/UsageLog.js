import mongoose from 'mongoose';

const usageLogSchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    apiKey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ApiKey',
      required: true,
      index: true,
    },
    modelUsed: {
      type: String,
      required: true,
      default: 'llama-3.3-70b-versatile',
    },
    promptTokens: {
      type: Number,
      default: 0,
    },
    completionTokens: {
      type: Number,
      default: 0,
    },
    totalTokens: {
      type: Number,
      default: 0,
    },
    latencyMs: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexing for rapid analytics queries in dashboard
usageLogSchema.index({ developer: 1, createdAt: -1 });

const UsageLog = mongoose.model('UsageLog', usageLogSchema);
export default UsageLog;