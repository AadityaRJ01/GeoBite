import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Star, Clock, Car, AlertTriangle, Loader2 } from 'lucide-react';

const DEFAULT_CENTER = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

// Algorithm colour palette
const ALGO_COLORS = {
  baseline: '#94a3b8',       // slate
  nearestNeighbor: '#f59e0b', // amber
  twoOpt: '#0d9488',          // teal (best/recommended)
};

/**
 * Creates a numbered circular DivIcon for route stops
 */
function createStopIcon(index, isStart, isHighlighted) {
  const bg = isStart ? '#2f7059' : isHighlighted ? '#0d9488' : '#1e3a30';
  const size = isStart ? 40 : 32;
  const label = isStart ? '★' : index + 1;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${bg};
      border: 3px solid #ffffff;
      box-shadow: 0 4px 12px rgba(13,33,27,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Plus Jakarta Sans', Inter, system-ui, sans-serif;
      font-weight: 800;
      font-size: ${isStart ? '16px' : '13px'};
      color: #ffffff;
      transform: translate(-50%, -50%);
      cursor: pointer;
    ">${label}</div>
  `;

  return L.divIcon({
    html,
    className: '',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 4],
  });
}

/**
 * Fits map to route bounds or centers on current city
 */
function RouteViewController({ orderedCoordinates, center }) {
  const map = useMap();

  useEffect(() => {
    if (!orderedCoordinates || orderedCoordinates.length === 0) {
      if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
        map.setView(center, 12, { animate: true });
      }
      return;
    }
    const valid = orderedCoordinates.filter(
      ([lat, lng]) => typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)
    );
    if (valid.length === 0) return;

    const bounds = L.latLngBounds(valid);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true, duration: 0.8 });
  }, [orderedCoordinates, center, map]);

  return null;
}

export default function RouteMap({
  routeResult,
  algorithm,
  roadRoute = null,
  roadLoading = false,
  roadError = null,
  center = null,
}) {
  const markerRefs = useRef({});

  const activeResult = useMemo(() => {
    if (!routeResult) return null;
    return routeResult.results?.[algorithm] || routeResult.bestRoute || null;
  }, [routeResult, algorithm]);

  const orderedPlaces = useMemo(() => {
    return activeResult?.orderedPlaces || [];
  }, [activeResult]);

  const orderedCoordinates = useMemo(() => {
    return activeResult?.orderedCoordinates || [];
  }, [activeResult]);

  const legs = useMemo(() => {
    return activeResult?.legs || [];
  }, [activeResult]);

  // Convert GeoJSON [longitude, latitude] into Leaflet [latitude, longitude]
  const roadPositions = useMemo(() => {
    if (!roadRoute?.geometry?.coordinates || !Array.isArray(roadRoute.geometry.coordinates)) {
      return null;
    }
    const coords = roadRoute.geometry.coordinates
      .filter(([lng, lat]) => typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng))
      .map(([lng, lat]) => [lat, lng]);

    return coords.length > 1 ? coords : null;
  }, [roadRoute]);

  // Fit bounds to road positions if available, otherwise straight-line coordinates
  const viewCoordinates = useMemo(() => {
    if (roadPositions && roadPositions.length > 1) return roadPositions;
    return orderedCoordinates;
  }, [roadPositions, orderedCoordinates]);

  const lineColor = ALGO_COLORS[algorithm] || ALGO_COLORS.twoOpt;

  // Start place ID (first stop in this algorithm's order)
  const startPlaceId = orderedPlaces[0]?.id;

  // Initial center for map
  const initialCenter = useMemo(() => {
    if (viewCoordinates.length > 0) return viewCoordinates[0];
    if (center && Array.isArray(center) && center.length === 2) return center;
    return DEFAULT_CENTER;
  }, [viewCoordinates, center]);

  if (!activeResult) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-sand-50 rounded-3xl border border-forest-200 text-slate-500 text-sm">
        No route data available.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[340px] sm:h-[420px] lg:h-[480px] rounded-3xl overflow-hidden border border-forest-200/90 shadow-soft-md bg-sand-100">
      {/* Optimization Haversine Stats overlay (Left) */}
      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-[400] bg-white/95 backdrop-blur-md px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-2xl border border-forest-100 shadow-soft-sm flex flex-col gap-0.5 sm:gap-1 pointer-events-none select-none max-w-[160px] sm:max-w-none">
        <div className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-bold text-forest-900">
          <Navigation className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-teal-600 rotate-45" />
          <span>{orderedPlaces.length} Stops</span>
        </div>
        <div className="text-[11px] sm:text-xs text-slate-600 font-semibold font-mono">
          {activeResult.totalDistanceKm?.toFixed(2)} km (straight)
        </div>
        {activeResult.improvementPercent > 0 && (
          <div className="text-[9px] sm:text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5 w-fit">
            {activeResult.improvementPercent}% vs base
          </div>
        )}
      </div>

      {/* Road routing status / Fallback indicator (Right) */}
      <div className="absolute top-3 right-3 sm:top-4 sm:right-4 z-[400] flex flex-col items-end gap-1.5 pointer-events-none select-none max-w-[180px] sm:max-w-[300px]">
        {roadLoading && (
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-white/95 text-teal-800 border border-teal-200 shadow-soft-sm">
            <Loader2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 animate-spin text-teal-600" />
            <span>Calculating road route...</span>
          </div>
        )}

        {roadRoute && !roadLoading && (
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold bg-white/95 text-forest-900 border border-teal-200/80 shadow-soft-sm text-right">
            <Car className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-teal-600 shrink-0" />
            <span>
              OSRM: <strong className="font-mono text-teal-700">{roadRoute.distanceKm} km</strong> ({roadRoute.durationMinutes}m)
            </span>
          </div>
        )}

        {roadError && !roadLoading && (
          <div className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-xs font-medium bg-amber-50/95 text-amber-900 border border-amber-300 shadow-soft-sm text-right">
            <AlertTriangle className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-amber-600 shrink-0" />
            <span>Straight-line preview</span>
          </div>
        )}
      </div>

      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <RouteViewController orderedCoordinates={viewCoordinates} />

        {/* Render road geometry or fallback straight-line legs */}
        {roadPositions ? (
          <Polyline
            key={`road-${algorithm}-${roadPositions.length}`}
            positions={roadPositions}
            pathOptions={{
              color: lineColor,
              weight: 5,
              opacity: 0.9,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ) : (
          legs.map((leg, idx) => (
            <Polyline
              key={`${algorithm}-fallback-leg-${idx}`}
              positions={[leg.fromCoordinates, leg.toCoordinates]}
              pathOptions={{
                color: lineColor,
                weight: idx === 0 ? 5 : 4,
                opacity: 0.75,
                dashArray: '8, 6',
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          ))
        )}

        {/* Render numbered stop markers */}
        {orderedPlaces.map((place, idx) => {
          const isStart = place.id === startPlaceId;
          const icon = createStopIcon(idx, isStart, false);
          const lat = typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude);
          const lng = typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude);

          if (isNaN(lat) || isNaN(lng)) return null;

          // Find leg from this stop
          const legFromHere = legs.find((l) => l.fromPlaceId === place.id);

          return (
            <Marker
              key={place.id}
              position={[lat, lng]}
              icon={icon}
              ref={(ref) => { if (ref) markerRefs.current[place.id] = ref; }}
            >
              <Popup>
                <div className="p-1 max-w-[220px]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-forest-900 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                      {isStart ? '★' : idx + 1}
                    </span>
                    <span className="font-bold text-sm text-forest-950 truncate">{place.name}</span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-1.5 line-clamp-1">{place.address}</p>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                    {typeof place.averageRating === 'number' && place.averageRating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-amber-700 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md">
                        <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-500" />
                        {place.averageRating.toFixed(1)}
                      </span>
                    )}
                    {place.estimatedVisitMinutes && (
                      <span className="inline-flex items-center gap-0.5 text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md">
                        <Clock className="w-2.5 h-2.5 text-slate-400" />
                        {place.estimatedVisitMinutes}m
                      </span>
                    )}
                    <span className="capitalize text-forest-700 bg-forest-50 border border-forest-200 px-1.5 py-0.5 rounded-md">
                      {place.category}
                    </span>
                  </div>

                  {legFromHere && (
                    <div className="mt-2 pt-1.5 border-t border-slate-100 text-[10px] text-slate-500 flex items-center gap-1">
                      <Navigation className="w-2.5 h-2.5 text-teal-600 rotate-45 shrink-0" />
                      <span>
                        Next leg: <strong className="text-forest-900">{legFromHere.distanceKm?.toFixed(2)} km</strong> to {legFromHere.toPlaceName}
                      </span>
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}
