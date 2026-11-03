import { Router } from 'express';
import {
  optimizeRoute,
  benchmarkRoute,
  getRoadRouteHandler,
} from '../controllers/routes.controller.js';

const router = Router();

/**
 * POST /api/routes/optimize
 * Optimizes a multi-stop itinerary across 2 to 10 selected places.
 */
router.post('/optimize', optimizeRoute);

/**
 * POST /api/routes/benchmark
 * Runs multi-iteration performance benchmarks across routing algorithms.
 */
router.post('/benchmark', benchmarkRoute);

/**
 * POST /api/routes/road-route
 * Fetches real road-network routing geometry and duration from OSRM.
 */
router.post('/road-route', getRoadRouteHandler);

export default router;
