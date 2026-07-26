import mongoose from 'mongoose';

const apiKeySchema = new mongoose.Schema(
  {
    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please provide a key name/label'],
      default: 'Default Key',
      trim: true,
    },
    keyHash: {
      type: String,
      required: true,
      unique: true,
      index: true, // Faster DB indexing
    },
    truncatedKey: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
    },
    tier: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    lastUsedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

const ApiKey = mongoose.model('ApiKey', apiKeySchema);
export default ApiKey;