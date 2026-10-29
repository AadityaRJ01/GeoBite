import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, Star, Clock, Navigation } from 'lucide-react';

// Sensible demo fallback center (Bengaluru) when no places exist or valid coordinates are zero
const DEFAULT_CENTER = [12.9716, 77.5946];
const DEFAULT_ZOOM = 12;

/**
 * Category color definitions for markers
 */
const CATEGORY_COLORS = {
  restaurant: { bg: '#d97706', border: '#b45309' }, // Amber
  cafe: { bg: '#0d9488', border: '#0f766e' },       // Teal
  viewpoint: { bg: '#0284c7', border: '#0369a1' },  // Sky
  attraction: { bg: '#7c3aed', border: '#6d28d9' }, // Purple
};

/**
 * Generate a custom, crisp SVG DivIcon for Leaflet markers
 */
function createCustomMarkerIcon(category, isSelected) {
  const colors = CATEGORY_COLORS[category] || { bg: '#2f7059', border: '#1b3b30' };
  const size = isSelected ? 42 : 32;
  const pinColor = isSelected ? '#14b8a6' : colors.bg;
  const borderColor = isSelected ? '#0d211b' : colors.border;

  const html = `
    <div style="
      position: relative;
      width: ${size}px;
      height: ${size}px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transform: translate(-50%, -100%);
      filter: drop-shadow(0 4px 6px rgba(13, 33, 27, 0.35));
    ">
      <svg viewBox="0 0 36 44" width="${size}" height="${(size * 44) / 36}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M18 0C8.05888 0 0 8.05888 0 18C0 28.5 15.5 42.5 17.1 43.8C17.6 44.2 18.4 44.2 18.9 43.8C20.5 42.5 36 28.5 36 18C36 8.05888 27.9411 0 18 0Z" fill="${pinColor}" stroke="${borderColor}" stroke-width="2"/>
        <circle cx="18" cy="17" r="7" fill="white" />
        <circle cx="18" cy="17" r="3.5" fill="${pinColor}" />
      </svg>
      ${isSelected ? `
        <span style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background-color: #2dd4bf;
          border: 2px solid #ffffff;
          box-shadow: 0 0 8px #2dd4bf;
        "></span>
      ` : ''}
    </div>
  `;

  return L.divIcon({
    html,
    className: 'geobite-custom-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size],
  });
}

function createSearchCenterMarkerIcon() {
  const html = `
    <div style="
      position: relative;
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      transform: translate(-50%, -50%);
    ">
      <span style="
        position: absolute;
        width: 32px;
        height: 32px;
        border-radius: 9999px;
        background-color: rgba(13, 148, 136, 0.35);
        animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></span>
      <div style="
        position: relative;
        width: 18px;
        height: 18px;
        border-radius: 9999px;
        background-color: #0f766e;
        border: 3px solid #ffffff;
        box-shadow: 0 0 10px rgba(15, 118, 110, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 4px; height: 4px; border-radius: 9999px; background-color: #ffffff;"></div>
      </div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'geobite-center-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

/**
 * Controller sub-component to handle map viewport fitting and programmatic panning
 */
function MapViewController({ places, focusTarget, searchCenter, searchRadius, isNearbyActive }) {
  const map = useMap();
  const initialFitDone = useRef(false);

  // When nearby search is active, fit to search center & places
  useEffect(() => {
    if (!isNearbyActive || !searchCenter || typeof searchCenter.lat !== 'number' || typeof searchCenter.lng !== 'number') {
      return;
    }

    const centerLatLng = L.latLng(searchCenter.lat, searchCenter.lng);
    const radiusMeters = (searchRadius || 5) * 1000;
    // Calculate geographic bounds of radius circle
    const circleBounds = centerLatLng.toBounds(radiusMeters);

    const validCoords = (places || [])
      .filter((p) => p.hasValidCoordinates)
      .map((p) => [p.latitude, p.longitude]);

    if (validCoords.length > 0) {
      const placesBounds = L.latLngBounds(validCoords);
      const combined = circleBounds.extend(placesBounds);
      map.fitBounds(combined, { padding: [40, 40], maxZoom: 15 });
    } else {
      map.fitBounds(circleBounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [isNearbyActive, searchCenter, searchRadius, places, map]);

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
    map.flyTo([focusTarget.latitude, focusTarget.longitude], 15, {
      duration: 1.2,
      easeLinearity: 0.25,
    });
  }, [focusTarget, map]);

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
}) {
  const markerRefs = useRef({});

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

  // Selected place object
  const selectedPlace = useMemo(() => {
    return places.find((p) => p.id === selectedPlaceId) || null;
  }, [places, selectedPlaceId]);

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

  const hasValidSearchCenter =
    isNearbyActive &&
    searchCenter &&
    typeof searchCenter.lat === 'number' &&
    typeof searchCenter.lng === 'number' &&
    !isNaN(searchCenter.lat) &&
    !isNaN(searchCenter.lng);

  return (
    <div className="relative w-full h-[450px] lg:h-[calc(100vh-210px)] min-h-[420px] rounded-3xl overflow-hidden border border-forest-200/90 shadow-soft-md bg-sand-100 flex flex-col">
      {/* Top Map Stats Badge */}
      <div className="absolute top-4 left-4 z-[400] bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-forest-100 shadow-soft-sm flex items-center gap-2 text-xs font-semibold text-forest-900 pointer-events-auto">
        <Compass className="w-3.5 h-3.5 text-teal-600 animate-spin-slow" />
        <span>
          {validPlaces.length} {validPlaces.length === 1 ? 'Marker' : 'Markers'} Active
          {isNearbyActive && ` (${searchRadius} km radius)`}
        </span>
      </div>

      {/* Map Container */}
      <MapContainer
        center={initialCenter}
        zoom={DEFAULT_ZOOM}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        <MapViewController
          places={validPlaces}
          selectedPlace={selectedPlace}
          focusTarget={focusTarget}
          searchCenter={searchCenter}
          searchRadius={searchRadius}
          isNearbyActive={isNearbyActive}
        />

        {/* Spatial Radius Circle and Search Center Pin */}
        {hasValidSearchCenter && (
          <>
            <Circle
              center={[searchCenter.lat, searchCenter.lng]}
              radius={(searchRadius || 5) * 1000}
              pathOptions={{
                color: '#0d9488',
                fillColor: '#14b8a6',
                fillOpacity: 0.08,
                weight: 2,
                dashArray: '6, 6',
              }}
            />
            <Marker
              position={[searchCenter.lat, searchCenter.lng]}
              icon={createSearchCenterMarkerIcon()}
              zIndexOffset={1000}
            >
              <Popup>
                <div className="p-1 max-w-[200px] text-center">
                  <div className="text-xs font-bold text-forest-950 flex items-center justify-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-teal-600 rotate-45" />
                    <span>Search Origin Center</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {searchCenter.lat.toFixed(4)}°, {searchCenter.lng.toFixed(4)}°
                  </p>
                  <div className="mt-1 text-[10px] font-semibold text-teal-800 bg-teal-50 py-0.5 px-2 rounded-full border border-teal-200">
                    Radius: {searchRadius} km
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {validPlaces.map((place) => {
          const isSelected = place.id === selectedPlaceId;
          const markerIcon = createCustomMarkerIcon(place.category, isSelected);

          return (
            <Marker
              key={place.id}
              position={[place.latitude, place.longitude]}
              icon={markerIcon}
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
                <div className="p-1 max-w-[240px]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-forest-950 truncate">
                      {place.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-forest-50 text-forest-800 border border-forest-200">
                      {place.category}
                    </span>
                    {typeof place.averageRating === 'number' && place.averageRating > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-xs font-bold text-amber-700">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                        {place.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>

                  {/* PostGIS Distance Badge */}
                  {typeof place.distanceMeters === 'number' && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 mb-2 rounded-md bg-teal-50 border border-teal-200 text-teal-900 text-xs font-bold">
                      <Navigation className="w-3 h-3 text-teal-600 rotate-45 shrink-0" />
                      <span>
                        {place.distanceKm < 1
                          ? `${place.distanceMeters} m away`
                          : `${place.distanceKm} km away`}
                      </span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-600 line-clamp-2 mb-2 leading-tight">
                    {place.address}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1.5 border-t border-slate-100">
                    <span className="capitalize">{place.priceLevel || 'Moderate'}</span>
                    {place.estimatedVisitMinutes && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {place.estimatedVisitMinutes}m
                      </span>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Fallback notice if 0 coordinates */}
      {validPlaces.length === 0 && (
        <div className="absolute inset-0 z-[500] bg-white/80 backdrop-blur-sm flex items-center justify-center p-6 text-center">
          <div className="max-w-xs">
            <Compass className="w-8 h-8 text-teal-600 mx-auto mb-2 animate-bounce" />
            <h4 className="font-bold text-forest-950 text-sm">No Coordinates to Display</h4>
            <p className="text-xs text-slate-600 mt-1">
              Currently fetched place records do not contain valid geographic coordinates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
