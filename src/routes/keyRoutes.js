import express from 'express';
import {
  createApiKey,
  getMyKeys,
  updateApiKey,
  deleteApiKey,
} from '../controllers/keyController.js';
import { protectDashboard } from '../middlewares/auth.js';

const router = express.Router();

// All key routes require developer dashboard login JWT
router.use(protectDashboard);

router.route('/')
  .post(createApiKey)
  .get(getMyKeys);

// Pehle sirf router.delete('/:id', revokeApiKey); tha, 
// ab is me updateApiKey (PUT) bhi add kar diya gaya hai:
router.route('/:id')
  .put(updateApiKey)
  .delete(deleteApiKey);

export default router;