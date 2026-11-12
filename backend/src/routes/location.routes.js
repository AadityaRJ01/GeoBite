import { Router } from 'express';
import { searchLocationController } from '../controllers/location.controller.js';

const router = Router();

/**
 * GET /api/locations/search?q=Tokyo
 * Resolves city coordinates and bounding box via OSM Nominatim
 */
router.get('/search', searchLocationController);

export default router;

