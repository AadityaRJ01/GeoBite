import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Compass, 
  Star, 
  Clock, 
  Navigation, 
  Maximize2, 
  RotateCcw, 
  Search, 
  RefreshCw, 
  Route, 
  MapPin,
  Share2,
  ExternalLink,
  Check,
  Plus,
  Minus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { sharePlace, openInGoogleMaps } from '../../services/shareUtils';

// Sensible demo fallback center (Bengaluru) when no coordinates are provided
const DEFAULT_CENTER = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

/**
 * Generate a custom Stitch pill DivIcon for Leaflet markers
 */
function createStitchMarkerIcon(place, isSelected) {
  const rating = typeof place.averageRating === 'number' && place.averageRating > 0
    ? place.averageRating.toFixed(1)
    : '4.9';
  const name = place.name || 'Spot';

  const html = isSelected
    ? `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
        cursor: pointer;
        z-index: 1000;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 6px;
          background-color: #00140f;
          color: #ffffff;
          padding: 6px 14px;
          border-radius: 9999px;
          box-shadow: 0 12px 28px rgba(0, 20, 15, 0.35);
          border: 2px solid #9eefe0;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        ">
          <span style="color: #9eefe0; font-size: 13px;">★</span>
          <span>${rating}</span>
          <span style="color: rgba(255, 255, 255, 0.4);">•</span>
          <span style="max-width: 120px; overflow: hidden; text-overflow: ellipsis;">${name}</span>
        </div>
        <div style="
          width: 10px;
          height: 10px;
          background-color: #00140f;
          transform: rotate(45deg);
          margin-top: -5px;
          border-right: 2px solid #9eefe0;
          border-bottom: 2px solid #9eefe0;
        "></div>
        <div style="
          width: 12px;
          height: 12px;
          border-radius: 9999px;
          background-color: rgba(9, 106, 95, 0.45);
          animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
          margin-top: 2px;
        "></div>
      </div>
    `
    : `
      <div style="
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        <div style="
          display: flex;
          align-items: center;
          gap: 5px;
          background-color: #ffffff;
          color: #00140f;
          padding: 5px 11px;
          border-radius: 9999px;
          box-shadow: 0 4px 14px rgba(14, 42, 36, 0.12);
          border: 1px solid #dce5df;
          font-family: 'Plus Jakarta Sans', sans-serif;
          font-size: 11px;
          font-weight: 600;
          white-space: nowrap;
        ">
          <span style="width: 7px; height: 7px; border-radius: 9999px; background-color: #096a5f;"></span>
          <span style="font-weight: 700; color: #096a5f;">${rating}</span>
          <span style="max-width: 85px; overflow: hidden; text-overflow: ellipsis; color: #414846;">${name}</span>
        </div>
        <div style="
          width: 8px;
          height: 8px;
          background-color: #ffffff;
          transform: rotate(45deg);
          margin-top: -4px;
          border-right: 1px solid #dce5df;
          border-bottom: 1px solid #dce5df;
        "></div>
      </div>
    `;

  return L.divIcon({
    html,
    className: 'geobite-stitch-marker',
    iconSize: [120, 36],
    iconAnchor: [60, 36],
    popupAnchor: [0, -38],
  });
}

/**
 * Radar origin center pin
 */
function createSearchCenterMarkerIcon() {
  const html = `
    <div style="
      position: relative;
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    ">
      <span style="
        position: absolute;
        width: 28px;
        height: 28px;
        border-radius: 9999px;
        background-color: rgba(9, 106, 95, 0.3);
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></span>
      <div style="
        position: relative;
        width: 16px;
        height: 16px;
        border-radius: 9999px;
        background-color: #00140f;
        border: 2px solid #9eefe0;
        box-shadow: 0 0 10px rgba(9, 106, 95, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 4px; height: 4px; border-radius: 9999px; background-color: #9eefe0;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'geobite-center-marker',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

/**
 * Controller sub-component handling map viewport moves, bounds change detection,
 * and programmatic camera animations.
 */
function MapEventHandler({
  places,
  focusTarget,
  searchCenter,
  searchRadius,
  onBoundsChange,
  isNearbyActive,
}) {
  const map = useMap();
  const initialFitDone = useRef(false);
  const lastProgrammaticCenter = useRef(null);

  // Listen to map user interactions (drag/pan/zoom)
  useMapEvents({
    moveend: () => {
      if (!onBoundsChange) return;
      const center = map.getCenter();
      if (
        lastProgrammaticCenter.current &&
        Math.abs(center.lat - lastProgrammaticCenter.current.lat) < 0.0001 &&
        Math.abs(center.lng - lastProgrammaticCenter.current.lng) < 0.0001
      ) {
        return;
      }
      const bounds = map.getBounds();
      onBoundsChange({
        minLat: bounds.getSouth(),
        maxLat: bounds.getNorth(),
        minLng: bounds.getWest(),
        maxLng: bounds.getEast(),
        center: { lat: center.lat, lng: center.lng },
      });
    },
  });

  // Fit to search center & radius circle when search center changes
  useEffect(() => {
    if (
      !searchCenter ||
      typeof searchCenter.lat !== 'number' ||
      typeof searchCenter.lng !== 'number' ||
      isNaN(searchCenter.lat) ||
      isNaN(searchCenter.lng)
    ) {
      return;
    }

    const lat = Number(searchCenter.lat);
    const lng = Number(searchCenter.lng);
    lastProgrammaticCenter.current = { lat, lng };

    const validCoords = (places || [])
      .filter((p) => p.hasValidCoordinates)
      .map((p) => [p.latitude, p.longitude]);

    if (validCoords.length > 0) {
      const centerLatLng = L.latLng(lat, lng);
      const radiusMeters = (searchRadius || 15) * 1000;
      const circleBounds = centerLatLng.toBounds(radiusMeters);
      const placesBounds = L.latLngBounds(validCoords);
      const combined = circleBounds.extend(placesBounds);
      map.fitBounds(combined, { padding: [40, 40], maxZoom: 14, animate: true });
    } else {
      map.setView([lat, lng], 12, { animate: true });
    }
  }, [searchCenter?.lat, searchCenter?.lng, searchRadius, places, map]);

  // Initial fit to bounds when valid places load (non-nearby mode)
  useEffect(() => {
    if (isNearbyActive) return;
    if (!places || places.length === 0) return;

    const validCoords = places
      .filter((p) => p.hasValidCoordinates)
      .map((p) => [p.latitude, p.longitude]);

    if (validCoords.length > 0 && !initialFitDone.current) {
      const bounds = L.latLngBounds(validCoords);
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      initialFitDone.current = true;
    }
  }, [places, isNearbyActive, map]);

  // Smoothly fly to selected place when focused via card click or external trigger
  useEffect(() => {
    if (!focusTarget || !focusTarget.hasValidCoordinates) return;
    lastProgrammaticCenter.current = { lat: focusTarget.latitude, lng: focusTarget.longitude };
    map.flyTo([focusTarget.latitude, focusTarget.longitude], 15, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [focusTarget, map]);

  return null;
}

/**
 * Helper to expose map actions outside the MapContainer
 */
function MapActionBridge({ onMountMap }) {
  const map = useMap();
  useEffect(() => {
    onMountMap(map);
  }, [map, onMountMap]);
  return null;
}

export default function InteractiveMap({
  places = [],
  selectedPlaceId,
  onSelectPlace,
  focusTarget,
  searchCenter = null,
  searchRadius = 5,
  isNearbyActive = false,
  onSearchBounds = null,
  loading = false,
}) {
  const markerRefs = useRef({});
  const [mapInstance, setMapInstance] = useState(null);
  const [pendingBounds, setPendingBounds] = useState(null);
  const [showSearchAreaBtn, setShowSearchAreaBtn] = useState(false);
  const [copiedPlaceId, setCopiedPlaceId] = useState(null);
  const [autoMoveSearch, setAutoMoveSearch] = useState(true);

  const handleSharePopup = async (place) => {
    try {
      const res = await sharePlace(place);
      if (res.copied) {
        setCopiedPlaceId(place.id);
        setTimeout(() => setCopiedPlaceId(null), 2200);
      }
    } catch (err) {
      console.warn('Popup share error:', err);
    }
  };

  // Filter places to strictly valid coordinates
  const validPlaces = useMemo(() => {
    return places.filter(
      (p) =>
        typeof p.latitude === 'number' &&
        typeof p.longitude === 'number' &&
        !isNaN(p.latitude) &&
        !isNaN(p.longitude) &&
        p.latitude >= -90 &&
        p.latitude <= 90 &&
        p.longitude >= -180 &&
        p.longitude <= 180
    );
  }, [places]);

  // Determine initial center
  const initialCenter = useMemo(() => {
    if (isNearbyActive && searchCenter && typeof searchCenter.lat === 'number') {
      return [searchCenter.lat, searchCenter.lng];
    }
    if (validPlaces.length > 0) {
      return [validPlaces[0].latitude, validPlaces[0].longitude];
    }
    return DEFAULT_CENTER;
  }, [isNearbyActive, searchCenter, validPlaces]);

  // Open popup for selected place when selected externally
  useEffect(() => {
    if (!selectedPlaceId) return;
    const marker = markerRefs.current[selectedPlaceId];
    if (marker) {
      marker.openPopup();
    }
  }, [selectedPlaceId]);

  // Handle bounds change from map dragging/zooming
  const handleBoundsChange = useCallback((boundsData) => {
    setPendingBounds(boundsData);
    if (autoMoveSearch && onSearchBounds) {
      onSearchBounds(boundsData);
    } else {
      setShowSearchAreaBtn(true);
    }
  }, [autoMoveSearch, onSearchBounds]);

  // Trigger search within current map bounds manually
  const handleTriggerSearchArea = useCallback(() => {
    if (!pendingBounds || !onSearchBounds) return;
    onSearchBounds(pendingBounds);
    setShowSearchAreaBtn(false);
  }, [pendingBounds, onSearchBounds]);

  // Re-center on search center
  const handleRecenter = useCallback(() => {
    if (!mapInstance || !searchCenter) return;
    mapInstance.flyTo([searchCenter.lat, searchCenter.lng], 13, { duration: 1 });
    setShowSearchAreaBtn(false);
  }, [mapInstance, searchCenter]);

  // Fit view to all visible markers
  const handleFitAll = useCallback(() => {
    if (!mapInstance || validPlaces.length === 0) return;
    const bounds = L.latLngBounds(validPlaces.map((p) => [p.latitude, p.longitude]));
    mapInstance.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    setShowSearchAreaBtn(false);
  }, [mapInstance, validPlaces]);

  const handleZoomIn = useCallback(() => {
    if (mapInstance) mapInstance.zoomIn();
  }, [mapInstance]);

  const handleZoomOut = useCallback(() => {
    if (mapInstance) mapInstance.zoomOut();
  }, [mapInstance]);

  const hasValidSearchCenter =
    isNearbyActive &&
    searchCenter &&
    typeof searchCenter.lat === 'number' &&
    typeof searchCenter.lng === 'number' &&
    !isNaN(searchCenter.lat) &&
    !isNaN(searchCenter.lng);

  return (
    <div className="relative w-full h-[520px] lg:h-[calc(100vh-140px)] min-h-[460px] rounded-3xl overflow-hidden border border-[#e2eae5] shadow-[0_12px_36px_-6px_rgba(14,42,36,0.08)] bg-[#edf6f0] flex flex-col">
      {/* Top Left Floating Search Toggle (Stitch Style) */}
      <div className="absolute top-4 left-4 z-[400] pointer-events-auto">
        <label className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-full shadow-md cursor-pointer hover:bg-white transition-colors border border-[#dce5df]">
          <input
            type="checkbox"
            checked={autoMoveSearch}
            onChange={(e) => setAutoMoveSearch(e.target.checked)}
            className="w-4 h-4 accent-[#096a5f] rounded cursor-pointer"
          />
          <span className="font-sans text-xs font-semibold text-[#00140f]">
            Search as I move the map
          </span>
        </label>
      </div>

      {/* Floating "Search this area" Button if auto-search is off */}
      {showSearchAreaBtn && onSearchBounds && !autoMoveSearch && (
        <div className="absolute top-4 inset-x-0 mx-auto w-fit z-[500] pointer-events-auto animate-bounce-subtle">
          <button
            type="button"
            id="map-search-this-area-btn"
            onClick={handleTriggerSearchArea}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#00140f] hover:bg-[#096a5f] text-white text-xs font-bold shadow-lg transition-all cursor-pointer border border-[#9eefe0]/40"
          >
            <Search className={`w-3.5 h-3.5 text-[#9eefe0] ${loading ? 'animate-spin' : ''}`} />
            <span>Search this area</span>
          </button>
        </div>
      )}

      {/* Floating Right Map Controls Widget (Stitch Style) */}
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 pointer-events-auto">
        {/* Zoom In & Out Controls Stack */}
        <div className="flex flex-col bg-white/95 backdrop-blur-md rounded-2xl shadow-md overflow-hidden border border-[#dce5df]">
          <button
            type="button"
            onClick={handleZoomIn}
            className="w-10 h-10 flex items-center justify-center text-[#00140f] hover:bg-[#edf6f0] transition-colors cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="w-full h-[1px] bg-[#dce5df]" />
          <button
            type="button"
            onClick={handleZoomOut}
            className="w-10 h-10 flex items-center justify-center text-[#00140f] hover:bg-[#edf6f0] transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        {/* Recenter Origin Geolocation */}
        {hasValidSearchCenter && (
          <button
            type="button"
            id="map-recenter-btn"
            onClick={handleRecenter}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-[#096a5f] hover:bg-white shadow-md transition-colors border border-[#dce5df] cursor-pointer"
            title="Recenter view on search origin"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Fit All Visible Markers */}
        {validPlaces.length > 0 && (
          <button
            type="button"
            id="map-fit-all-btn"
            onClick={handleFitAll}
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-md flex items-center justify-center text-[#00140f] hover:bg-white shadow-md transition-colors border border-[#dce5df] cursor-pointer"
            title="Fit view to all active place markers"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Floating Bottom Environmental Telemetry Badge (Stitch Style) */}
      <div className="absolute bottom-5 left-5 z-[400] hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-[#e2eae5] pointer-events-auto">
        <div className="flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#096a5f] text-[22px]">
            wb_twilight
          </span>
          <div>
            <div className="font-sans text-xs font-bold text-[#00140f]">
              {validPlaces.length} Verified Spots Active
            </div>
            <div className="font-sans text-[11px] text-[#727976]">
              {searchRadius} km radius • PostGIS EPSG:4326
            </div>
          </div>
        </div>
        <span className="text-[#c1c8c5]">|</span>
        <Link
          to="/route"
          className="font-sans text-xs font-bold text-[#096a5f] hover:underline flex items-center gap-1"
        >
          <span>Route Planner</span>
          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
        </Link>
      </div>

      {/* Loading Progress Bar Overlay */}
      {loading && (
        <div className="absolute top-0 inset-x-0 z-[600] h-1 bg-[#9eefe0]/40 overflow-hidden">
          <div className="w-full h-full bg-[#096a5f] animate-pulse"></div>
        </div>
      )}

      {/* Leaflet Map Container */}
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapActionBridge onMountMap={setMapInstance} />

        <MapEventHandler
          places={validPlaces}
          focusTarget={focusTarget}
          searchCenter={searchCenter}
          searchRadius={searchRadius}
          onBoundsChange={handleBoundsChange}
          isNearbyActive={isNearbyActive}
        />

        {/* Spatial Radius Circle and Search Center Pin */}
        {hasValidSearchCenter && (
          <>
            <Circle
              center={[searchCenter.lat, searchCenter.lng]}
              radius={(searchRadius || 5) * 1000}
              pathOptions={{
                color: '#096a5f',
                fillColor: '#9eefe0',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '6, 6',
              }}
            />
            <Marker
              position={[searchCenter.lat, searchCenter.lng]}
              icon={createSearchCenterMarkerIcon()}
              zIndexOffset={500}
            >
              <Popup>
                <div className="p-1 max-w-[200px] text-center font-sans">
                  <div className="text-xs font-bold text-[#00140f] flex items-center justify-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-[#096a5f] rotate-45" />
                    <span>Search Origin Center</span>
                  </div>
                  <p className="text-[11px] text-[#727976] font-mono mt-0.5">
                    {searchCenter.lat.toFixed(4)}°, {searchCenter.lng.toFixed(4)}°
                  </p>
                  <div className="mt-1 text-[10px] font-semibold text-[#096a5f] bg-[#edf6f0] py-0.5 px-2 rounded-full border border-[#dce5df]">
                    Radius: {searchRadius} km
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Place Markers with Visual Distinction for Selected Place */}
        {validPlaces.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          const markerIcon = createStitchMarkerIcon(place, isSelected);

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={markerIcon}
              zIndexOffset={isSelected ? 1000 : 100}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[place.id] = ref;
                }
              }}
              eventHandlers={{
                click: () => {
                  if (onSelectPlace) {
                    onSelectPlace(place.id);
                  }
                },
              }}
            >
              <Popup>
                <div className="p-2 max-w-[260px] font-sans">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-serif font-bold text-base text-[#00140f] truncate">
                      {place.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#edf6f0] text-[#096a5f] border border-[#dce5df]">
                      {place.category}
                    </span>
                    {typeof place.averageRating === 'number' && place.averageRating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-[#00140f]">
                        <span className="text-[#096a5f]">★</span>
                        {place.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {typeof place.distanceMeters === 'number' && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 mb-2 rounded-md bg-[#edf6f0] border border-[#dce5df] text-[#096a5f] text-xs font-bold">
                      <Navigation className="w-3 h-3 rotate-45 shrink-0 text-[#096a5f]" />
                      <span>
                        {place.distanceKm < 1
                          ? `${place.distanceMeters} m away`
                          : `${place.distanceKm} km away`}
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-[#414846] line-clamp-2 mb-2.5 leading-relaxed">
                    {place.address}
                  </p>

                  {/* Actions in popup */}
                  <div className="pt-2 border-t border-[#edf6f0] flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleSharePopup(place)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border transition-colors cursor-pointer ${
                          copiedPlaceId === place.id
                            ? 'bg-[#096a5f] text-white border-[#096a5f]'
                            : 'bg-white hover:bg-[#edf6f0] text-[#414846] border-[#dce5df]'
                        }`}
                        title="Share place"
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
                        title="Open in Google Maps"
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-[#096a5f]" />
                        <span>Maps</span>
                      </button>
                    </div>

                    <Link
                      to="/route"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-semibold text-white bg-[#00140f] hover:bg-[#0e2a24] transition-colors shadow-xs"
                    >
                      <Route className="w-2.5 h-2.5 text-[#9eefe0]" />
                      <span>Plan</span>
                    </Link>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Fallback notice if 0 coordinates */}
      {validPlaces.length === 0 && !loading && (
        <div className="absolute inset-0 z-[500] bg-white/85 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="max-w-xs">
            <Compass className="w-8 h-8 text-[#096a5f] mx-auto mb-2 animate-bounce" />
            <h4 className="font-serif font-bold text-[#00140f] text-base">No Spots in this Viewport</h4>
            <p className="font-sans text-xs text-[#414846] mt-1 mb-3">
              Pan the map back to the search area or click reset to expand your search.
            </p>
            {hasValidSearchCenter && (
              <button
                type="button"
                onClick={handleRecenter}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#00140f] text-white text-xs font-semibold hover:bg-[#096a5f] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Search Center</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
