/**
 * GeoBite — Authentication Routes
 *
 * Defines API routes for registration, login, current profile inspection,
 * profile update, and logout.
 */

import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  logout,
} from '../controllers/auth.controller.js';
import { authenticateToken, authRateLimiter } from '../middleware/auth.middleware.js';

const router = Router();

// Public routes with rate limiting
router.post('/register', authRateLimiter(), register);
router.post('/login', authRateLimiter(), login);
router.post('/logout', logout);

// Protected routes requiring valid Bearer JWT
router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

export default router;

