import prisma from '../lib/prisma.js';
import { optimizeRouteComparison } from '../algorithms/routeOptimizer.js';
import {
  benchmarkDataset,
  runStandardBenchmarkSuite,
  BENCHMARK_DATASETS,
} from '../algorithms/routeBenchmark.js';
import { getRoadRoute } from '../services/osrm.service.js';

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

/**
 * POST /api/routes/benchmark
 * Benchmarks routing algorithms across standard scenarios or custom place sets.
 * Runs multiple iterations to report median execution times and metrics.
 *
 * Request body:
 * {
 *   "scenario": "small" | "medium" | "large" | "clustered" | "dispersed" | "all", // Optional preset
 *   "placeIds": ["uuid-1", ...],                                                 // Optional: 2 to 20 DB IDs
 *   "places": [{ id, name, latitude, longitude }, ...],                         // Optional: 2 to 40 custom stops
 *   "runs": 3,                                                                  // Optional: 1 to 10 (default 3)
 *   "startPlaceId": "uuid-1"                                                    // Optional pinned start stop
 * }
 */
export const benchmarkRoute = async (req, res, next) => {
  try {
    const { scenario, placeIds, places: customPlaces, runs: rawRuns, startPlaceId } = req.body || {};

    // Validate runs parameter (1 to 10, default 3)
    let runs = 3;
    if (rawRuns !== undefined && rawRuns !== null) {
      runs = Number(rawRuns);
      if (!Number.isInteger(runs) || runs < 1 || runs > 10) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Parameter 'runs' must be an integer between 1 and 10.",
            statusCode: 400,
          },
        });
      }
    }

    // Mode 1: Preset Standard Scenario
    if (scenario) {
      const normalizedScenario = String(scenario).toLowerCase().trim();
      if (normalizedScenario === 'all') {
        const suiteResult = runStandardBenchmarkSuite({ runs });
        return res.status(200).json({
          success: true,
          data: suiteResult,
        });
      }

      const preset = BENCHMARK_DATASETS[normalizedScenario];
      if (!preset) {
        return res.status(400).json({
          success: false,
          error: {
            message: `Invalid scenario '${scenario}'. Valid options: small, medium, large, clustered, dispersed, all.`,
            statusCode: 400,
          },
        });
      }

      const result = benchmarkDataset(preset.places, preset.name, {
        runs,
        startPlaceId: startPlaceId || preset.places[0]?.id,
      });

      return res.status(200).json({
        success: true,
        data: {
          scenario: normalizedScenario,
          description: preset.description,
          ...result,
        },
      });
    }

    // Mode 2: Custom Place IDs from Database
    if (placeIds) {
      if (!Array.isArray(placeIds) || placeIds.length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Field 'placeIds' must be an array with at least 2 place IDs.",
            statusCode: 400,
          },
        });
      }

      if (placeIds.length > 20) {
        return res.status(400).json({
          success: false,
          error: {
            message: "A maximum of 20 places can be benchmarked per request to prevent excessive CPU usage.",
            statusCode: 400,
          },
        });
      }

      const dbPlaces = await prisma.place.findMany({
        where: { id: { in: placeIds }, isActive: true },
        select: { id: true, name: true, latitude: true, longitude: true },
      });

      if (dbPlaces.length !== placeIds.length) {
        const foundIds = new Set(dbPlaces.map((p) => p.id));
        const missing = placeIds.filter((id) => !foundIds.has(id));
        return res.status(404).json({
          success: false,
          error: {
            message: `The following place IDs were not found: ${missing.join(', ')}`,
            statusCode: 404,
          },
        });
      }

      const map = new Map(dbPlaces.map((p) => [p.id, p]));
      const ordered = placeIds.map((id) => map.get(id));

      const result = benchmarkDataset(ordered, `Selected Places (${ordered.length} stops)`, {
        runs,
        startPlaceId,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    // Mode 3: Inline Custom Places
    if (customPlaces) {
      if (!Array.isArray(customPlaces) || customPlaces.length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Field 'places' must be an array of at least 2 place objects.",
            statusCode: 400,
          },
        });
      }

      if (customPlaces.length > 40) {
        return res.status(400).json({
          success: false,
          error: {
            message: "A maximum of 40 custom places can be benchmarked per request.",
            statusCode: 400,
          },
        });
      }

      // Validate coordinates
      for (let i = 0; i < customPlaces.length; i++) {
        const p = customPlaces[i];
        if (
          !p ||
          typeof p.latitude !== 'number' ||
          typeof p.longitude !== 'number' ||
          !Number.isFinite(p.latitude) ||
          !Number.isFinite(p.longitude) ||
          p.latitude < -90 ||
          p.latitude > 90 ||
          p.longitude < -180 ||
          p.longitude > 180
        ) {
          return res.status(400).json({
            success: false,
            error: {
              message: `Place at index ${i} has invalid geographic coordinates.`,
              statusCode: 400,
            },
          });
        }
      }

      const result = benchmarkDataset(customPlaces, `Custom Route (${customPlaces.length} stops)`, {
        runs,
        startPlaceId,
      });

      return res.status(200).json({
        success: true,
        data: result,
      });
    }

    // If no parameters provided, default to small preset
    const defaultPreset = BENCHMARK_DATASETS.small;
    const defaultResult = benchmarkDataset(defaultPreset.places, defaultPreset.name, { runs });

    return res.status(200).json({
      success: true,
      data: {
        scenario: 'small',
        description: defaultPreset.description,
        ...defaultResult,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/routes/road-route
 * Fetches real road-network routing geometry and driving duration from OSRM.
 *
 * Request body:
 * {
 *   "stops": [{ "id": "p1", "latitude": 12.97, "longitude": 77.59 }, ...], // 2-25 stops
 *   // OR
 *   "placeIds": ["uuid-1", "uuid-2", ...] // 2-25 place UUIDs
 * }
 */
export const getRoadRouteHandler = async (req, res, next) => {
  try {
    const { stops, placeIds } = req.body || {};

    let targetStops = stops;

    // Mode A: Resolve placeIds from database in the exact requested order
    if (placeIds && Array.isArray(placeIds)) {
      if (placeIds.length < 2) {
        return res.status(400).json({
          success: false,
          error: {
            message: "Field 'placeIds' must contain at least 2 place IDs.",
            statusCode: 400,
          },
        });
      }

      if (placeIds.length > 25) {
        return res.status(400).json({
          success: false,
          error: {
            message: "A maximum of 25 places can be road-routed per request.",
            statusCode: 400,
          },
        });
      }

      const dbPlaces = await prisma.place.findMany({
        where: { id: { in: placeIds }, isActive: true },
        select: { id: true, name: true, latitude: true, longitude: true },
      });

      if (dbPlaces.length !== placeIds.length) {
        const foundIds = new Set(dbPlaces.map((p) => p.id));
        const missing = placeIds.filter((id) => !foundIds.has(id));
        return res.status(404).json({
          success: false,
          error: {
            message: `The following place IDs were not found: ${missing.join(', ')}`,
            statusCode: 404,
          },
        });
      }

      const map = new Map(dbPlaces.map((p) => [p.id, p]));
      targetStops = placeIds.map((id) => map.get(id));
    }

    // Mode B: Direct inline stops array
    if (!targetStops || !Array.isArray(targetStops)) {
      return res.status(400).json({
        success: false,
        error: {
          message: "Request body must include either a 'stops' array or 'placeIds' array.",
          statusCode: 400,
        },
      });
    }

    if (targetStops.length < 2) {
      return res.status(400).json({
        success: false,
        error: {
          message: "At least 2 stops are required to calculate a road route.",
          statusCode: 400,
        },
      });
    }

    const roadRouteData = await getRoadRoute(targetStops);

    return res.status(200).json({
      success: true,
      data: roadRouteData,
    });
  } catch (error) {
    next(error);
  }
};
