import { Router } from 'express';
import { getPlaces, getPlaceById } from '../controllers/places.controller.js';

const router = Router();

/**
 * GET /api/places
 * Returns active places. Supports optional ?category=restaurant|cafe|viewpoint|attraction
 */
router.get('/', getPlaces);

/**
 * GET /api/places/:id
 * Returns a single place by UUID
 */
router.get('/:id', getPlaceById);

export default router;
