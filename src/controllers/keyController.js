import crypto from 'crypto';
import ApiKey from '../models/ApiKey.js';
import redisClient from '../config/redis.js';

// @desc    Create new API key
// @route   POST /api/v1/keys
export const createApiKey = async (req, res, next) => {
  try {
    const { name = 'Default Key' } = req.body;
    const developerId = req.user.id;

    // Generate Raw Key: sk-live-98f2a...
    const rawKey = `sk-live-${crypto.randomBytes(20).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const truncatedKey = `${rawKey.substring(0, 12)}...${rawKey.slice(-4)}`;

    // Save to MongoDB
    const apiKeyDoc = await ApiKey.create({
      developer: developerId,
      name,
      keyHash,
      truncatedKey,
      status: 'active'
    });

    // Save to Redis Memory for Fast Auth
    await redisClient.hSet(`key:${keyHash}`, {
      keyId: apiKeyDoc._id.toString(),
      developerId: developerId.toString(),
      status: 'active',
      tier: 'free'
    });

    res.status(201).json({
      success: true,
      apiKey: rawKey, // Show ONLY once to the developer
      keyDetails: {
        _id: apiKeyDoc._id,
        name: apiKeyDoc.name,
        truncatedKey: apiKeyDoc.truncatedKey,
        createdAt: apiKeyDoc.createdAt
      },
      message: 'Save this API key carefully. You will not be able to see it again!'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all API keys for logged in developer
// @route   GET /api/v1/keys
export const getMyKeys = async (req, res, next) => {
  try {
    const keys = await ApiKey.find({ developer: req.user.id })
      .select('-keyHash')
      .sort({ createdAt: -1 });

    res.json(keys);
  } catch (error) {
    next(error);
  }
};

// @route   PUT /api/v1/keys/:id
export const updateApiKey = async (req, res, next) => {
  try {
    const { name, tier } = req.body;

    const apiKeyDoc = await ApiKey.findOne({
      _id: req.params.id,
      developer: req.user.id,
    });

    if (!apiKeyDoc) {
      res.status(404);
      throw new Error('API Key not found or unauthorized');
    }

    if (apiKeyDoc.status === 'revoked') {
      res.status(400);
      throw new Error('Cannot update a revoked API key');
    }

    // Fields Update Karein
    if (name) apiKeyDoc.name = name;
    if (tier) apiKeyDoc.tier = tier;

    await apiKeyDoc.save();

    // Redis Cache Sync Update Karein
    const redisKey = `key:${apiKeyDoc.keyHash}`;
    const exists = await redisClient.exists(redisKey);

    if (exists) {
      const updates = {};
      if (tier) updates.tier = tier;

      if (Object.keys(updates).length > 0) {
        await redisClient.hSet(redisKey, updates);
      }
    }

    res.json({
      success: true,
      message: 'API Key updated successfully',
      keyDetails: apiKeyDoc,
    });
  } catch (error) {
    next(error);
  }
};
// @desc    Delete API key permanently from Database
// @route   DELETE /api/v1/keys/:id
export const deleteApiKey = async (req, res, next) => {
  try {
    const apiKeyDoc = await ApiKey.findOne({
      _id: req.params.id,
      developer: req.user.id
    });

    if (!apiKeyDoc) {
      res.status(404);
      throw new Error('API Key not found or unauthorized');
    }

    // 1. Delete from Redis Memory Cache
    await redisClient.del(`key:${apiKeyDoc.keyHash}`);

    // 2. Delete permanently from MongoDB Database
    await ApiKey.deleteOne({ _id: apiKeyDoc._id });

    res.json({ success: true, message: 'API Key deleted permanently' });
  } catch (error) {
    next(error);
  }
};