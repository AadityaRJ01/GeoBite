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
