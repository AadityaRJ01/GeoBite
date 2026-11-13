/**
 * GeoBite — Saved Routes Controller
 *
 * Implements CRUD operations for authenticated users' saved trips / routes.
 * Enforces ownership checks, input validation, structured stop constraints,
 * and seamless retrieval for route restoration.
 */

import prisma from '../lib/prisma.js';

/**
 * Validates stop array structure
 * Each stop must have name, latitude, longitude.
 */
function validateStops(stops) {
  if (!Array.isArray(stops) || stops.length < 2 || stops.length > 50) {
    return 'Stops must be an array of between 2 and 50 locations';
  }

  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    if (!s || typeof s !== 'object') {
      return `Stop at index ${i} is invalid`;
    }
    const lat = Number(s.latitude ?? s.lat);
    const lng = Number(s.longitude ?? s.lng);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return `Stop at index ${i} has invalid latitude: ${s.latitude ?? s.lat}`;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return `Stop at index ${i} has invalid longitude: ${s.longitude ?? s.lng}`;
    }
    if (!s.name || typeof s.name !== 'string' || !s.name.trim()) {
      return `Stop at index ${i} must have a non-empty name`;
    }
  }

  return null;
}

/**
 * Normalizes stops to standard format for storage
 */
function normalizeStops(stops) {
  return stops.map((s, index) => ({
    id: s.id || `stop-${index + 1}`,
    name: s.name.trim(),
    latitude: Number(s.latitude ?? s.lat),
    longitude: Number(s.longitude ?? s.lng),
    category: s.category || 'General',
    address: s.address || null,
    visitOrder: Number.isInteger(s.visitOrder) ? s.visitOrder : index + 1
  }));
}

/**
 * POST /api/saved-routes
 * Create a new saved route for authenticated user
 */
export async function createSavedRoute(req, res, next) {
  try {
    const userId = req.user.id;
    const {
      name,
      cityName,
      algorithm,
      totalDistanceKm,
      estimatedTravelMinutes,
      stops
    } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Route name is required and cannot be empty', statusCode: 400 }
      });
    }

    if (!cityName || typeof cityName !== 'string' || !cityName.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'City name is required', statusCode: 400 }
      });
    }

    const stopsError = validateStops(stops);
    if (stopsError) {
      return res.status(400).json({
        success: false,
        error: { message: stopsError, statusCode: 400 }
      });
    }

    const parsedDistance = parseFloat(totalDistanceKm);
    if (isNaN(parsedDistance) || parsedDistance < 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'totalDistanceKm must be a valid non-negative number', statusCode: 400 }
      });
    }

    const parsedMinutes = estimatedTravelMinutes !== undefined && estimatedTravelMinutes !== null
      ? parseFloat(estimatedTravelMinutes)
      : null;

    const normalized = normalizeStops(stops);

    const savedRoute = await prisma.savedRoute.create({
      data: {
        userId,
        name: name.trim(),
        cityName: cityName.trim(),
        algorithm: (algorithm || 'genetic').toLowerCase().trim(),
        totalDistanceKm: Math.round(parsedDistance * 100) / 100,
        estimatedTravelMinutes: parsedMinutes !== null ? Math.round(parsedMinutes * 10) / 10 : null,
        stopCount: normalized.length,
        stops: normalized
      }
    });

    return res.status(201).json({
      success: true,
      data: savedRoute,
      message: 'Route saved successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/saved-routes
 * List all saved routes for authenticated user with optional city filtering & pagination
 */
export async function getSavedRoutes(req, res, next) {
  try {
    const userId = req.user.id;
    const { city, page = 1, limit = 20 } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId,
      ...(city ? { cityName: { equals: city.trim(), mode: 'insensitive' } } : {})
    };

    const [total, routes] = await Promise.all([
      prisma.savedRoute.count({ where }),
      prisma.savedRoute.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      })
    ]);

    return res.status(200).json({
      success: true,
      data: {
        routes,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum) || 1
        }
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/saved-routes/:id
 * Retrieve a specific saved route by ID (enforcing ownership)
 */
export async function getSavedRouteById(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const route = await prisma.savedRoute.findUnique({
      where: { id }
    });

    if (!route || route.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Saved route not found', statusCode: 404 }
      });
    }

    return res.status(200).json({
      success: true,
      data: route
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/saved-routes/:id
 * Rename or update an existing saved route (enforcing ownership)
 */
export async function updateSavedRoute(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: { message: 'Route name cannot be empty', statusCode: 400 }
      });
    }

    const existing = await prisma.savedRoute.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Saved route not found', statusCode: 404 }
      });
    }

    const updated = await prisma.savedRoute.update({
      where: { id },
      data: {
        name: name.trim()
      }
    });

    return res.status(200).json({
      success: true,
      data: updated,
      message: 'Route renamed successfully'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/saved-routes/:id
 * Delete a saved route (enforcing ownership)
 */
export async function deleteSavedRoute(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await prisma.savedRoute.findUnique({
      where: { id }
    });

    if (!existing || existing.userId !== userId) {
      return res.status(404).json({
        success: false,
        error: { message: 'Saved route not found', statusCode: 404 }
      });
    }

    await prisma.savedRoute.delete({
      where: { id }
    });

    return res.status(200).json({
      success: true,
      message: 'Saved route deleted successfully'
    });
  } catch (err) {
    next(err);
  }
}

