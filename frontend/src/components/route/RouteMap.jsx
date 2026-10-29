import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Navigation, Star, Clock } from 'lucide-react';

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
 * Fits map to route bounds whenever orderedCoordinates changes
 */
function RouteViewController({ orderedCoordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!orderedCoordinates || orderedCoordinates.length === 0) return;
    const valid = orderedCoordinates.filter(
      ([lat, lng]) => typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)
    );
    if (valid.length === 0) return;

    const bounds = L.latLngBounds(valid);
    map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: true, duration: 0.8 });
  }, [orderedCoordinates, map]);

  return null;
}

export default function RouteMap({ routeResult, algorithm }) {
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

  const lineColor = ALGO_COLORS[algorithm] || ALGO_COLORS.twoOpt;

  // Start place ID (first stop in this algorithm's order)
  const startPlaceId = orderedPlaces[0]?.id;

  // Initial center for map
  const initialCenter = useMemo(() => {
    if (orderedCoordinates.length > 0) return orderedCoordinates[0];
    return DEFAULT_CENTER;
  }, [orderedCoordinates]);

  if (!activeResult) {
    return (
      <div className="flex items-center justify-center h-[400px] bg-sand-50 rounded-3xl border border-forest-200 text-slate-500 text-sm">
        No route data available.
      </div>
    );
  }

  return (
    <div className="relative w-full h-[420px] lg:h-[480px] rounded-3xl overflow-hidden border border-forest-200/90 shadow-soft-md bg-sand-100">
      {/* Stats overlay */}
      <div className="absolute top-4 left-4 z-[400] bg-white/93 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-forest-100 shadow-soft-sm flex flex-col gap-1 pointer-events-none select-none">
        <div className="flex items-center gap-2 text-xs font-bold text-forest-900">
          <Navigation className="w-3.5 h-3.5 text-teal-600 rotate-45" />
          <span>{orderedPlaces.length} Stops</span>
        </div>
        <div className="text-xs text-slate-600 font-semibold font-mono">
          {activeResult.totalDistanceKm?.toFixed(2)} km total
        </div>
        {activeResult.improvementPercent > 0 && (
          <div className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 rounded-full px-2 py-0.5">
            {activeResult.improvementPercent}% vs baseline
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

        <RouteViewController orderedCoordinates={orderedCoordinates} />

        {/* Draw each leg as a polyline */}
        {legs.map((leg, idx) => (
          <Polyline
            key={`${algorithm}-leg-${idx}`}
            positions={[leg.fromCoordinates, leg.toCoordinates]}
            pathOptions={{
              color: lineColor,
              weight: idx === 0 ? 5 : 4,
              opacity: 0.85,
              dashArray: algorithm === 'baseline' ? '8, 6' : undefined,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        ))}

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
