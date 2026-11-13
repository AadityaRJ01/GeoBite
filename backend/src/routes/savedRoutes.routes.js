/**
 * GeoBite — Saved Routes Routes
 *
 * Exposes endpoints for managing personal saved routes / trip history.
 * All endpoints require valid JWT authentication.
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware.js';
import {
  createSavedRoute,
  getSavedRoutes,
  getSavedRouteById,
  updateSavedRoute,
  deleteSavedRoute
} from '../controllers/savedRoutes.controller.js';

const router = Router();

// Protect all saved route operations
router.use(authenticateToken);

router.post('/', createSavedRoute);
router.get('/', getSavedRoutes);
router.get('/:id', getSavedRouteById);
router.put('/:id', updateSavedRoute);
router.delete('/:id', deleteSavedRoute);

export default router;

