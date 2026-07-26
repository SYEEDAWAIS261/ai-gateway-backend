import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Route Handlers
import authRoutes from './routes/authRoutes.js';
import keyRoutes from './routes/keyRoutes.js';
import aiRoutes from './routes/aiRoutes.js';

// Import Middlewares
import { errorHandler, notFound } from './middlewares/errorHandler.js';

dotenv.config();

const app = express();

// 1. Core Middlewares
// 1. Core Middlewares
app.use(cors({
  origin: true, // Yeh automatically har frontend domain (chahe Vercel ka live URL ho ya preview URL) ko allow kar dega
  credentials: true,
}));
app.options('*', cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 2. Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Custom AI Gateway API' 
  });
});

// 3. API Routes Mounting
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/keys', keyRoutes);

// OpenAI-Compatible Primary Route Mounting (/v1/chat/completions)
app.use('/v1', aiRoutes);

// 4. Fallback Error Handlers
app.use(notFound);
app.use(errorHandler);

export default app;