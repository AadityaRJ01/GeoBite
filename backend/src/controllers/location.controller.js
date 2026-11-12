import { searchLocation } from '../services/geocoding.service.js';

/**
 * GET /api/locations/search?q=Tokyo
 * Resolves location queries using OSM Nominatim and returns normalized
 * coordinates, bounding box, and location metadata.
 */
export async function searchLocationController(req, res, next) {
  try {
    const { q, query } = req.query;
    const searchTerm = q || query;

    if (!searchTerm || typeof searchTerm !== 'string' || !searchTerm.trim()) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Query parameter "q" is required and cannot be empty.',
          statusCode: 400,
        },
      });
    }

    const location = await searchLocation(searchTerm);

    return res.status(200).json({
      success: true,
      data: location,
    });
  } catch (error) {
    next(error);
  }
}

