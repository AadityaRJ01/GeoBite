import React, { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Navigation, 
  Star, 
  Clock, 
  Car, 
  AlertTriangle, 
  Loader2, 
  Share2, 
  ExternalLink, 
  Check,
  Plus,
  Minus,
  RotateCcw
} from 'lucide-react';
import { sharePlace, openInGoogleMaps } from '../../services/shareUtils';

const DEFAULT_CENTER = [43.3183, -1.9812]; // San Sebastián default fallback
const DEFAULT_ZOOM = 13;

const ALGO_COLORS = {
  baseline: '#94a3b8',        // slate
  nearestNeighbor: '#f59e0b', // amber
  twoOpt: '#096a5f',          // coastal eucalyptus (Stitch secondary)
};

/**
 * Creates a numbered circular DivIcon for route stops in Stitch style
 */
function createStopIcon(index, isStart, isHighlighted) {
  const bg = isStart ? '#00140f' : isHighlighted ? '#096a5f' : '#0e2a24';
  const borderColor = isStart ? '#9eefe0' : '#ffffff';
  const size = isStart ? 36 : 30;
  const label = index + 1;

  const html = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      transform: translate(-50%, -50%);
      cursor: pointer;
      z-index: ${isStart ? 1000 : 500};
    ">
      <div style="
        width: ${size}px;
        height: ${size}px;
        border-radius: 9999px;
        background: ${bg};
        border: 2px solid ${borderColor};
        box-shadow: 0 4px 14px rgba(0, 20, 15, 0.35);
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-weight: 800;
        font-size: ${size >= 36 ? '14px' : '12px'};
        color: #ffffff;
      ">
        ${isStart ? `<span style="color: #9eefe0;">★</span>` : label}
      </div>
      ${isStart ? `
        <div style="
          position: absolute;
          width: 44px;
          height: 44px;
          border-radius: 9999px;
          background: rgba(9, 106, 95, 0.25);
          animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          z-index: -1;
        "></div>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'geobite-route-stop-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2) - 6],
  });
}

/**
 * Fits map to route bounds or centers on current city
 */
function RouteViewController({ orderedCoordinates, center, onMapInstance }) {
  const map = useMap();

  useEffect(() => {
    if (onMapInstance) onMapInstance(map);
  }, [map, onMapInstance]);

  useEffect(() => {
    if (!orderedCoordinates || orderedCoordinates.length === 0) {
      if (center && typeof center[0] === 'number' && typeof center[1] === 'number') {
        map.setView(center, 13, { animate: true });
      }
      return;
    }
    const valid = orderedCoordinates.filter(
      ([lat, lng]) => typeof lat === 'number' && typeof lng === 'number' && !isNaN(lat) && !isNaN(lng)
    );
    if (valid.length === 0) return;

    const bounds = L.latLngBounds(valid);
    map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true, duration: 0.8 });
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
  baselineResult = null,
}) {
  const markerRefs = useRef({});
  const [mapInstance, setMapInstance] = useState(null);
  const [copiedPlaceId, setCopiedPlaceId] = useState(null);

  const handleSharePopup = async (place) => {
    try {
      const res = await sharePlace(place);
      if (res.copied) {
        setCopiedPlaceId(place.id);
        setTimeout(() => setCopiedPlaceId(null), 2200);
      }
    } catch (err) {
      console.warn('Route popup share error:', err);
    }
  };

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

  const baselineCoordinates = useMemo(() => {
    if (!baselineResult?.orderedCoordinates) return [];
    return baselineResult.orderedCoordinates;
  }, [baselineResult]);

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

  const viewCoordinates = useMemo(() => {
    if (roadPositions && roadPositions.length > 1) return roadPositions;
    return orderedCoordinates;
  }, [roadPositions, orderedCoordinates]);

  const lineColor = ALGO_COLORS[algorithm] || ALGO_COLORS.twoOpt;
  const startPlaceId = orderedPlaces[0]?.id;

  const initialCenter = useMemo(() => {
    if (viewCoordinates.length > 0) return viewCoordinates[0];
    if (center && Array.isArray(center) && center.length === 2) return center;
    return DEFAULT_CENTER;
  }, [viewCoordinates, center]);

  const handleZoomIn = () => {
    if (mapInstance) mapInstance.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapInstance) mapInstance.zoomOut();
  };

  const handleRecenter = () => {
    if (!mapInstance) return;
    if (viewCoordinates.length > 0) {
      const bounds = L.latLngBounds(viewCoordinates);
      mapInstance.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (center) {
      mapInstance.setView(center, 13);
    }
  };

  if (!activeResult) {
    return (
      <div className="relative w-full h-[460px] rounded-3xl overflow-hidden border border-[#e2eae5] shadow-lg bg-[#edf6f0] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#096a5f] mb-3 shadow-xs">
          <Navigation className="w-6 h-6 rotate-45" />
        </div>
        <h4 className="font-serif text-lg font-bold text-[#00140f] mb-1">
          Awaiting Itinerary Waypoints
        </h4>
        <p className="font-sans text-xs text-[#414846] max-w-sm">
          Select at least 2 places from the left catalog to activate high-precision TSP route solving and road geometry.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[460px] bg-[#edf6f0] rounded-3xl overflow-hidden shadow-lg border border-[#e2eae5] flex flex-col">
      {/* Top Left Compass & Topographic Badge (Stitch Style) */}
      <div className="absolute top-4 left-4 z-[400] flex flex-wrap items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-md border border-[#dce5df]">
          <span className="w-2 h-2 rounded-full bg-[#096a5f]" />
          <span className="font-sans text-[11px] text-[#00140f] uppercase font-bold tracking-wider">
            Topographic Pedestrian
          </span>
        </div>
        {orderedPlaces[0] && (
          <div className="hidden sm:flex bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md text-[#414846] items-center gap-1 text-[11px] font-semibold border border-[#dce5df]">
            <span className="material-symbols-outlined text-[14px] text-[#096a5f]">explore</span>
            <span>
              {orderedPlaces[0].latitude?.toFixed(2)}° | {orderedPlaces[0].longitude?.toFixed(2)}°
            </span>
          </div>
        )}
      </div>

      {/* Top Right Map Controls Stack (Stitch Style) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-1.5 bg-white/95 backdrop-blur-md p-1.5 rounded-2xl shadow-md border border-[#dce5df] pointer-events-auto">
        <button
          type="button"
          onClick={handleZoomIn}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#edf6f0] text-[#00140f] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleZoomOut}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#edf6f0] text-[#00140f] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="h-px bg-[#dce5df] my-0.5" />
        <button
          type="button"
          onClick={handleRecenter}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-[#edf6f0] text-[#096a5f] transition-colors cursor-pointer"
          title="Recenter Route"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Loading Progress Bar for OSRM */}
      {roadLoading && (
        <div className="absolute top-0 inset-x-0 z-[600] h-1 bg-[#9eefe0]/40 overflow-hidden">
          <div className="w-full h-full bg-[#096a5f] animate-pulse"></div>
        </div>
      )}

      {/* Leaflet Map Canvas */}
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom
        zoomControl={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <RouteViewController
          orderedCoordinates={viewCoordinates}
          center={initialCenter}
          onMapInstance={setMapInstance}
        />

        {/* Faint Red Baseline Dotted Line for comparison if baselineResult is available */}
        {baselineCoordinates.length > 1 && algorithm !== 'baseline' && (
          <Polyline
            positions={baselineCoordinates}
            pathOptions={{
              color: '#ba1a1a',
              weight: 2,
              opacity: 0.35,
              dashArray: '4, 8',
              lineCap: 'round',
            }}
          />
        )}

        {/* Render road geometry or fallback straight-line legs */}
        {roadPositions ? (
          <Polyline
            key={`road-${algorithm}-${roadPositions.length}`}
            positions={roadPositions}
            pathOptions={{
              color: lineColor,
              weight: 5,
              opacity: 0.95,
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
                weight: 4,
                opacity: 0.85,
                dashArray: '8, 6',
                lineCap: 'round',
                lineJoin: 'round',
              }}
            />
          ))
        )}

        {/* Stop markers */}
        {orderedPlaces.map((place, idx) => {
          const isStart = place.id === startPlaceId;
          const icon = createStopIcon(idx, isStart, false);
          const lat = typeof place.latitude === 'number' ? place.latitude : parseFloat(place.latitude);
          const lng = typeof place.longitude === 'number' ? place.longitude : parseFloat(place.longitude);

          if (isNaN(lat) || isNaN(lng)) return null;

          const legFromHere = legs.find((l) => l.fromPlaceId === place.id);

          return (
            <Marker
              key={place.id}
              position={[lat, lng]}
              icon={icon}
              ref={(ref) => { if (ref) markerRefs.current[place.id] = ref; }}
            >
              <Popup>
                <div className="p-2 max-w-[240px] font-sans">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full bg-[#00140f] text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {isStart ? '★' : idx + 1}
                    </span>
                    <span className="font-serif font-bold text-sm text-[#00140f] truncate">
                      {place.name}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#414846] mb-2 line-clamp-1">{place.address}</p>

                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] mb-2">
                    {typeof place.averageRating === 'number' && place.averageRating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[#00140f] font-bold bg-[#edf6f0] border border-[#dce5df] px-1.5 py-0.5 rounded-full">
                        <span className="text-[#096a5f]">★</span>
                        {place.averageRating.toFixed(1)}
                      </span>
                    )}
                    {place.estimatedVisitMinutes && (
                      <span className="inline-flex items-center gap-0.5 text-[#414846] bg-[#edf6f0] border border-[#dce5df] px-1.5 py-0.5 rounded-full">
                        <Clock className="w-2.5 h-2.5 text-[#727976]" />
                        {place.estimatedVisitMinutes}m
                      </span>
                    )}
                    <span className="capitalize text-[#096a5f] font-semibold bg-[#9eefe0]/30 border border-[#9eefe0] px-1.5 py-0.5 rounded-full">
                      {place.category}
                    </span>
                  </div>

                  {legFromHere && (
                    <div className="pt-1.5 border-t border-[#edf6f0] text-[10px] text-[#727976] flex items-center gap-1">
                      <Navigation className="w-3 h-3 text-[#096a5f] rotate-45 shrink-0" />
                      <span>
                        Next: <strong className="text-[#00140f]">{legFromHere.distanceKm?.toFixed(2)} km</strong> to {legFromHere.toPlaceName}
                      </span>
                    </div>
                  )}

                  {/* Actions: Share & Google Maps */}
                  <div className="mt-2.5 pt-2 border-t border-[#edf6f0] flex items-center justify-between gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSharePopup(place)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer ${
                        copiedPlaceId === place.id
                          ? 'bg-[#096a5f] text-white border-[#096a5f]'
                          : 'bg-white hover:bg-[#edf6f0] text-[#414846] border-[#dce5df]'
                      }`}
                    >
                      {copiedPlaceId === place.id ? (
                        <>
                          <Check className="w-2.5 h-2.5" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-2.5 h-2.5 text-[#096a5f]" />
                          <span>Share</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openInGoogleMaps(place)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white hover:bg-[#edf6f0] text-[#414846] border border-[#dce5df] transition-colors cursor-pointer"
                    >
                      <ExternalLink className="w-2.5 h-2.5 text-[#096a5f]" />
                      <span>Directions</span>
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Bottom Floating Map Topography Metric Badge (Stitch Style) */}
      <div className="absolute bottom-4 left-4 right-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-md border border-[#e2eae5] z-[400] pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#096a5f] text-[20px]">timeline</span>
          <span className="font-sans text-xs text-[#00140f]">
            Euclidean straight: <strong>{activeResult.totalDistanceKm?.toFixed(2)} km</strong>
            {roadRoute && (
              <>
                {' '}• OSRM road geometry: <strong className="text-[#096a5f]">{roadRoute.distanceKm} km</strong> (~{roadRoute.durationMinutes} min)
              </>
            )}
          </span>
        </div>
        <div className="flex items-center gap-3 self-end sm:self-auto text-[11px] font-sans">
          {algorithm !== 'baseline' && baselineResult && (
            <span className="flex items-center gap-1 text-[#ba1a1a]">
              <span className="w-2.5 h-0.5 bg-[#ba1a1a] inline-block" /> Original Path
            </span>
          )}
          <span className="flex items-center gap-1 text-[#096a5f] font-bold">
            <span className="w-3 h-1 bg-[#096a5f] rounded-full inline-block" /> Solved Flow
          </span>
        </div>
      </div>
    </div>
  );
}
