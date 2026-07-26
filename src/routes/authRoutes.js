import express from 'express';
import {
  registerUser,
  loginUser,
  getMe,
} from '../controllers/authController.js';
import { protectDashboard } from '../middlewares/auth.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protectDashboard, getMe);

export default router;