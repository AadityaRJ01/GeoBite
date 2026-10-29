import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma.js';

/**
 * GET /api/places
 * Returns all active places, with optional ?category= filtering.
 */
export const getPlaces = async (req, res, next) => {
  try {
    const { category } = req.query;

    const validCategories = ['restaurant', 'cafe', 'viewpoint', 'attraction'];

    // Build the where clause
    const where = { isActive: true };

    if (category) {
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid category "${category}". Valid values: ${validCategories.join(', ')}`,
            statusCode: 400,
          },
        });
      }
      where.category = category;
    }

    const places = await prisma.place.findMany({
      where,
      orderBy: [{ averageRating: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        latitude: true,
        longitude: true,
        address: true,
        averageRating: true,
        priceLevel: true,
        estimatedVisitMinutes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        // location (PostGIS geography) is excluded — Prisma cannot serialize it
      },
    });

    return res.status(200).json({
      success: true,
      count: places.length,
      data: places,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/places/:id
 * Returns a single place by ID.
 */
export const getPlaceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const place = await prisma.place.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        latitude: true,
        longitude: true,
        address: true,
        averageRating: true,
        priceLevel: true,
        estimatedVisitMinutes: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!place) {
      return res.status(404).json({
        success: false,
        error: {
          message: `Place with id "${id}" not found.`,
          statusCode: 404,
        },
      });
    }

    return res.status(200).json({
      success: true,
      data: place,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/places/nearby
 * Returns places within radius (km) of given coordinates, ordered by geographic distance.
 * Query parameters:
 *  - lat: latitude (-90 to 90) [required]
 *  - lng: longitude (-180 to 180) [required]
 *  - radius: search radius in km (0.1 to 50, default 5) [optional]
 *  - category: category filter [optional]
 *  - limit: max results (1 to 100, default 50) [optional]
 */
export const getNearbyPlaces = async (req, res, next) => {
  try {
    const { lat, lng, radius, category, limit } = req.query;

    // Validate latitude
    if (lat === undefined || lat === null || String(lat).trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: "Query parameter 'lat' (latitude) is required.",
          statusCode: 400,
        },
      });
    }

    const parsedLat = parseFloat(lat);
    if (isNaN(parsedLat) || parsedLat < -90 || parsedLat > 90) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Query parameter 'lat' must be a valid number between -90 and 90.",
          statusCode: 400,
        },
      });
    }

    // Validate longitude
    if (lng === undefined || lng === null || String(lng).trim() === '') {
      return res.status(400).json({
        success: false,
        error: {
          message: "Query parameter 'lng' (longitude) is required.",
          statusCode: 400,
        },
      });
    }

    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLng) || parsedLng < -180 || parsedLng > 180) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Query parameter 'lng' must be a valid number between -180 and 180.",
          statusCode: 400,
        },
      });
    }

    // Validate radius (km)
    let parsedRadius = 5;
    if (radius !== undefined && radius !== null && String(radius).trim() !== '') {
      parsedRadius = parseFloat(radius);
      if (isNaN(parsedRadius) || parsedRadius < 0.1 || parsedRadius > 50) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Query parameter 'radius' must be a number between 0.1 and 50 km.",
            statusCode: 400,
          },
        });
      }
    }

    // Validate category
    const validCategories = ['restaurant', 'cafe', 'viewpoint', 'attraction'];
    if (category) {
      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid category "${category}". Valid values: ${validCategories.join(', ')}`,
            statusCode: 400,
          },
        });
      }
    }

    // Validate limit
    let parsedLimit = 50;
    if (limit !== undefined && limit !== null && String(limit).trim() !== '') {
      parsedLimit = Number(limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Query parameter 'limit' must be an integer between 1 and 100.",
            statusCode: 400,
          },
        });
      }
    }

    const radiusMeters = parsedRadius * 1000;
    const categoryCondition = category
      ? Prisma.sql`AND category = ${category}::"PlaceCategory"`
      : Prisma.empty;

    // Parameterized spatial query using PostGIS ST_DWithin and ST_Distance
    // Notice point creation is ST_MakePoint(longitude, latitude)
    const rawPlaces = await prisma.$queryRaw`
      SELECT 
        id, 
        name, 
        description,
        category,
        latitude, 
        longitude, 
        address,
        "averageRating",
        "priceLevel",
        "estimatedVisitMinutes",
        "isActive",
        "createdAt",
        "updatedAt",
        ROUND(ST_Distance(
          location,
          ST_SetSRID(ST_MakePoint(${parsedLng}, ${parsedLat}), 4326)::geography
        )::numeric, 1)::float AS "distanceMeters"
      FROM places
      WHERE "isActive" = true
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${parsedLng}, ${parsedLat}), 4326)::geography,
          ${radiusMeters}
        )
        ${categoryCondition}
      ORDER BY "distanceMeters" ASC
      LIMIT ${parsedLimit};
    `;

    const places = rawPlaces.map((place) => {
      const distMeters = Math.max(0, Math.round(Number(place.distanceMeters)));
      return {
        ...place,
        distanceMeters: distMeters,
        distanceKm: Number((distMeters / 1000).toFixed(2)),
      };
    });

    return res.status(200).json({
      success: true,
      count: places.length,
      data: places,
    });
  } catch (error) {
    next(error);
  }
};

