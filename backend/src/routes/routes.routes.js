import { Router } from 'express';
import { optimizeRoute } from '../controllers/routes.controller.js';

const router = Router();

/**
 * POST /api/routes/optimize
 * Optimizes a multi-stop itinerary across 2 to 10 selected places.
 */
router.post('/optimize', optimizeRoute);

export default router;
