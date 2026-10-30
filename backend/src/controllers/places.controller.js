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
 * Returns places within radius (km) of given coordinates, with advanced filtering,
 * deterministic sorting, and structured pagination.
 * 
 * Query parameters:
 *  - lat: latitude (-90 to 90) [required]
 *  - lng: longitude (-180 to 180) [required]
 *  - radius: search radius in km (0.1 to 100, default 5) [optional]
 *  - category: category filter ('restaurant' | 'cafe' | 'viewpoint' | 'attraction') [optional]
 *  - minRating: minimum rating filter (0 to 5) [optional]
 *  - maxPrice: maximum price category ('budget' | 'moderate' | 'premium') [optional]
 *  - page: page number (positive integer, default 1) [optional]
 *  - limit: page size (positive integer 1-50, default 10) [optional]
 *  - sortBy: sort field ('distance' | 'rating', default 'distance') [optional]
 *  - sortOrder: sort direction ('asc' | 'desc') [optional]
 */
export const getNearbyPlaces = async (req, res, next) => {
  try {
    const {
      lat,
      lng,
      radius,
      category,
      minRating,
      maxPrice,
      page,
      limit,
      sortBy,
      sortOrder,
    } = req.query;

    // 1. Validate latitude
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

    // 2. Validate longitude
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

    // 3. Validate radius (km) - default 5, range 0.1 to 100
    let parsedRadius = 5;
    if (radius !== undefined && radius !== null && String(radius).trim() !== '') {
      parsedRadius = parseFloat(radius);
      if (isNaN(parsedRadius) || parsedRadius < 0.1 || parsedRadius > 100) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Query parameter 'radius' must be a positive number between 0.1 and 100 km.",
            statusCode: 400,
          },
        });
      }
    }

    // 4. Validate category
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

    // 5. Validate minRating (0 to 5)
    let parsedMinRating = null;
    if (minRating !== undefined && minRating !== null && String(minRating).trim() !== '') {
      parsedMinRating = parseFloat(minRating);
      if (isNaN(parsedMinRating) || parsedMinRating < 0 || parsedMinRating > 5) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Query parameter 'minRating' must be a number between 0 and 5.",
            statusCode: 400,
          },
        });
      }
    }

    // 6. Validate maxPrice ('budget' | 'moderate' | 'premium')
    let allowedPriceLevels = null;
    if (maxPrice !== undefined && maxPrice !== null && String(maxPrice).trim() !== '') {
      const normalizedPrice = String(maxPrice).trim().toLowerCase();
      const priceMap = {
        budget: ['budget'],
        '1': ['budget'],
        $: ['budget'],
        moderate: ['budget', 'moderate'],
        '2': ['budget', 'moderate'],
        $$: ['budget', 'moderate'],
        premium: ['budget', 'moderate', 'premium'],
        '3': ['budget', 'moderate', 'premium'],
        $$$: ['budget', 'moderate', 'premium'],
      };

      if (!priceMap[normalizedPrice]) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid maxPrice "${maxPrice}". Valid values: budget, moderate, premium`,
            statusCode: 400,
          },
        });
      }
      allowedPriceLevels = priceMap[normalizedPrice];
    }

    // 7. Validate pagination page (default 1, positive integer)
    let parsedPage = 1;
    if (page !== undefined && page !== null && String(page).trim() !== '') {
      parsedPage = Number(page);
      if (!Number.isInteger(parsedPage) || parsedPage < 1) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Query parameter 'page' must be a positive integer greater than or equal to 1.",
            statusCode: 400,
          },
        });
      }
    }

    // 8. Validate pagination limit (default 10, max 50)
    let parsedLimit = 10;
    if (limit !== undefined && limit !== null && String(limit).trim() !== '') {
      parsedLimit = Number(limit);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > 50) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Query parameter 'limit' must be an integer between 1 and 50.",
            statusCode: 400,
          },
        });
      }
    }

    // 9. Validate sortBy ('distance' | 'rating', default 'distance')
    let parsedSortBy = 'distance';
    if (sortBy !== undefined && sortBy !== null && String(sortBy).trim() !== '') {
      const normalizedSortBy = String(sortBy).trim().toLowerCase();
      if (!['distance', 'rating'].includes(normalizedSortBy)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid sortBy "${sortBy}". Valid values: distance, rating`,
            statusCode: 400,
          },
        });
      }
      parsedSortBy = normalizedSortBy;
    }

    // 10. Validate sortOrder ('asc' | 'desc')
    let parsedSortOrder = parsedSortBy === 'rating' ? 'desc' : 'asc';
    if (sortOrder !== undefined && sortOrder !== null && String(sortOrder).trim() !== '') {
      const normalizedSortOrder = String(sortOrder).trim().toLowerCase();
      if (!['asc', 'desc'].includes(normalizedSortOrder)) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid sortOrder "${sortOrder}". Valid values: asc, desc`,
            statusCode: 400,
          },
        });
      }
      parsedSortOrder = normalizedSortOrder;
    }

    // Prepare parameterized SQL components
    const radiusMeters = parsedRadius * 1000;

    const categoryCondition = category
      ? Prisma.sql`AND category = ${category}::"PlaceCategory"`
      : Prisma.empty;

    const ratingCondition = parsedMinRating !== null
      ? Prisma.sql`AND "averageRating" >= ${parsedMinRating}`
      : Prisma.empty;

    const priceCondition = allowedPriceLevels !== null
      ? Prisma.sql`AND "priceLevel" IN (${Prisma.join(allowedPriceLevels)})`
      : Prisma.empty;

    // Execute count query for accurate pagination metadata
    const countResult = await prisma.$queryRaw`
      SELECT COUNT(*)::int AS total
      FROM places
      WHERE "isActive" = true
        AND ST_DWithin(
          location,
          ST_SetSRID(ST_MakePoint(${parsedLng}, ${parsedLat}), 4326)::geography,
          ${radiusMeters}
        )
        ${categoryCondition}
        ${ratingCondition}
        ${priceCondition};
    `;

    const total = countResult[0]?.total ?? 0;
    const totalPages = Math.ceil(total / parsedLimit);
    const offset = (parsedPage - 1) * parsedLimit;

    // Deterministic order clause
    let orderClause;
    if (parsedSortBy === 'rating') {
      orderClause = parsedSortOrder === 'asc'
        ? Prisma.sql`"averageRating" ASC, "distanceMeters" ASC, id ASC`
        : Prisma.sql`"averageRating" DESC, "distanceMeters" ASC, id ASC`;
    } else {
      orderClause = parsedSortOrder === 'desc'
        ? Prisma.sql`"distanceMeters" DESC, "averageRating" DESC, id ASC`
        : Prisma.sql`"distanceMeters" ASC, "averageRating" DESC, id ASC`;
    }

    // Parameterized spatial query using PostGIS ST_DWithin and ST_Distance
    // Notice point creation is ST_MakePoint(longitude, latitude) in SRID 4326
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
        ${ratingCondition}
        ${priceCondition}
      ORDER BY ${orderClause}
      LIMIT ${parsedLimit}
      OFFSET ${offset};
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
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages,
      },
      search: {
        latitude: parsedLat,
        longitude: parsedLng,
        radiusKm: parsedRadius,
      },
      data: places,
    });
  } catch (error) {
    next(error);
  }
};

