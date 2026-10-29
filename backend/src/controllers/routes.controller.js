import prisma from '../lib/prisma.js';
import { optimizeRouteComparison } from '../algorithms/routeOptimizer.js';

/**
 * POST /api/routes/optimize
 * Optimizes a multi-stop itinerary across 2 to 10 selected places.
 *
 * Request body:
 * {
 *   "placeIds": ["uuid-1", "uuid-2", ...],   // Required: 2 to 10 place UUIDs
 *   "startPlaceId": "uuid-1",                // Optional: Must be in placeIds if provided
 *   "mode": "comparison"                     // Optional: "comparison" (default)
 * }
 */
export const optimizeRoute = async (req, res, next) => {
  try {
    const { placeIds, startPlaceId } = req.body || {};

    // 1. Validate placeIds presence and type
    if (!placeIds || !Array.isArray(placeIds)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Field 'placeIds' is required and must be an array of place IDs.",
          statusCode: 400,
        },
      });
    }

    // 2. Validate bounds (2 to 10 places)
    if (placeIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          message: `At least 2 places are required to plan an itinerary (received ${placeIds.length}).`,
          statusCode: 400,
        },
      });
    }

    if (placeIds.length > 10) {
      return res.status(400).json({
        success: false,
        error: {
          message: `A maximum of 10 places can be optimized per itinerary (received ${placeIds.length}).`,
          statusCode: 400,
        },
      });
    }

    // 3. Validate ID types & check for duplicates
    for (let i = 0; i < placeIds.length; i++) {
      if (typeof placeIds[i] !== 'string' || !placeIds[i].trim()) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Item at index ${i} in 'placeIds' must be a valid non-empty string.`,
            statusCode: 400,
          },
        });
      }
    }

    const uniqueIds = Array.from(new Set(placeIds));
    if (uniqueIds.length !== placeIds.length) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Duplicate place IDs detected in 'placeIds'. Each place may only be visited once.",
          statusCode: 400,
        },
      });
    }

    // 4. Validate startPlaceId if provided
    if (startPlaceId !== undefined && startPlaceId !== null) {
      if (typeof startPlaceId !== 'string' || !placeIds.includes(startPlaceId)) {
        return res.status(400).json({
          success: false,
          error: {
            message: "'startPlaceId' must be one of the selected places in 'placeIds'.",
            statusCode: 400,
          },
        });
      }
    }

    // 5. Authoritative database lookup
    const places = await prisma.place.findMany({
      where: {
        id: { in: placeIds },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        category: true,
        latitude: true,
        longitude: true,
        address: true,
        averageRating: true,
        priceLevel: true,
        estimatedVisitMinutes: true,
      },
    });

    // 6. Verify all requested place records exist and are active
    if (places.length !== placeIds.length) {
      const foundIds = new Set(places.map((p) => p.id));
      const missingIds = placeIds.filter((id) => !foundIds.has(id));
      return res.status(404).json({
        success: false,
        error: {
          message: `The following place IDs were not found or are inactive: ${missingIds.join(', ')}`,
          statusCode: 404,
        },
      });
    }

    // 7. Verify all places have valid geographic coordinates
    for (const place of places) {
      if (
        typeof place.latitude !== 'number' ||
        typeof place.longitude !== 'number' ||
        isNaN(place.latitude) ||
        isNaN(place.longitude) ||
        place.latitude < -90 ||
        place.latitude > 90 ||
        place.longitude < -180 ||
        place.longitude > 180
      ) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Place "${place.name}" (${place.id}) has invalid coordinates for routing.`,
            statusCode: 400,
          },
        });
      }
    }

    // 8. Reconstruct places in the exact user-selected order (baseline)
    const placeMap = new Map(places.map((p) => [p.id, p]));
    const orderedSelection = placeIds.map((id) => placeMap.get(id));

    // 9. Run multi-algorithm optimization comparison
    const optimizationResult = optimizeRouteComparison(orderedSelection, startPlaceId || null);

    return res.status(200).json({
      success: true,
      data: optimizationResult,
    });
  } catch (error) {
    next(error);
  }
};
