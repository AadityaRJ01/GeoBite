import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { 
  Route, 
  Compass, 
  Sparkles,
  Clock,
  ArrowRight,
  MapPin,
  RefreshCw,
  ExternalLink,
  Utensils,
  Coffee,
  Mountain,
  Landmark
} from 'lucide-react';
import { geocodeCity } from '../services/geocoding';
import { fetchPlaces, discoverCity } from '../services/placesApi';

const DEFAULT_CENTER = [12.9716, 77.5946];

function createPreviewMarkerIcon(index, isSelected) {
  const bg = isSelected ? '#0d9488' : '#1e3a30';
  const size = isSelected ? 36 : 28;
  const label = index + 1;

  const html = `
    <div style="
      width: ${size}px;
      height: ${size}px;
      border-radius: 9999px;
      background: ${bg};
      border: 2px solid #ffffff;
      box-shadow: 0 4px 10px rgba(13,33,27,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: sans-serif;
      font-weight: 800;
      font-size: ${isSelected ? '14px' : '11px'};
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

function MapViewController({ center, places }) {
  const map = useMap();
  const lastCenter = useRef(null);

  useEffect(() => {
    if (!center || typeof center[0] !== 'number' || typeof center[1] !== 'number') return;
    lastCenter.current = center;

    const valid = (places || [])
      .filter((p) => p.hasValidCoordinates && typeof p.latitude === 'number' && typeof p.longitude === 'number')
      .map((p) => [p.latitude, p.longitude]);

    if (valid.length > 0) {
      const bounds = L.latLngBounds(valid);
      map.fitBounds(bounds, { padding: [35, 35], maxZoom: 14, animate: true });
    } else {
      map.setView(center, 12, { animate: true });
    }
  }, [center, places, map]);

  return null;
}

export default function MapPreviewPlaceholder({ activeCity, selectedCategory }) {
  const [cityCoords, setCityCoords] = useState(DEFAULT_CENTER);
  const [resolvedCity, setResolvedCity] = useState(activeCity || 'Bengaluru, India');
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaceId, setSelectedPlaceId] = useState(null);

  const activeRequestRef = useRef(0);

  // Sync city coordinates & real places whenever activeCity changes
  useEffect(() => {
    const targetCity = activeCity || 'Bengaluru, India';
    const reqId = ++activeRequestRef.current;
    setLoading(true);

    const loadCityData = async () => {
      try {
        const geo = await geocodeCity(targetCity);
        if (reqId !== activeRequestRef.current) return;

        const coords = [geo.lat, geo.lng];
        setCityCoords(coords);
        setResolvedCity(geo.name || targetCity);

        // Fetch real places for this city
        let placesData = await fetchPlaces({ city: geo.cityName || targetCity });
        if (reqId !== activeRequestRef.current) return;
        let loaded = placesData.places || [];

        // If no places exist yet, trigger auto-discovery from OSM
        if (loaded.length === 0) {
          try {
            const discRes = await discoverCity({ city: geo.cityName || targetCity, lat: geo.lat, lng: geo.lng });
            if (reqId !== activeRequestRef.current) return;
            loaded = discRes.places || [];
          } catch (discErr) {
            console.warn('Preview auto-discovery:', discErr);
          }
        }

        if (reqId === activeRequestRef.current) {
          setPlaces(loaded.slice(0, 8));
          if (loaded.length > 0) {
            setSelectedPlaceId(loaded[0].id);
          }
        }
      } catch (err) {
        if (reqId === activeRequestRef.current) {
          console.warn('City geocoding preview error:', err.message);
        }
      } finally {
        if (reqId === activeRequestRef.current) {
          setLoading(false);
        }
      }
    };

    loadCityData();
  }, [activeCity]);

  // Compute polyline coordinates connecting verified spots
  const polylineCoordinates = useMemo(() => {
    return places
      .filter((p) => p.hasValidCoordinates)
      .map((p) => [p.latitude, p.longitude]);
  }, [places]);

  return (
    <section id="map-preview" className="py-20 relative overflow-hidden bg-sand-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 border border-teal-200 text-teal-900 text-xs sm:text-sm font-semibold mb-4 shadow-sm">
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Interactive Geospatial Intelligence</span>
            <Link
              to={`/discover?city=${encodeURIComponent(resolvedCity)}`}
              className="ml-2 inline-flex items-center gap-1 text-teal-700 hover:text-teal-900 underline font-bold"
            >
              <span>Explore Live Discovery Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-forest-950 tracking-tight">
            Live City Geospatial Preview: {resolvedCity}
          </h2>
          <p className="mt-3 text-base sm:text-lg text-slate-600">
            Real OpenStreetMap geographical corridor showing authentic food discoveries, caffeine stops, and scenic panoramas in {resolvedCity}.
          </p>
        </div>

        {/* Live Leaflet Map Container Card */}
        <div className="bg-white rounded-3xl border border-forest-200/90 shadow-soft-lg overflow-hidden">
          {/* Top Control Bar */}
          <div className="px-6 py-4 bg-forest-950 text-white flex flex-wrap items-center justify-between gap-4 border-b border-forest-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="font-semibold text-sm tracking-wide text-white flex items-center gap-2">
                  <span>Live Map: {resolvedCity}</span>
                  <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    {loading ? 'Resolving...' : `${places.length} Spots Mapped`}
                  </span>
                </span>
                <p className="text-xs text-forest-300">
                  Coordinates: <span className="text-teal-400 font-mono">{cityCoords[0].toFixed(4)}° N, {cityCoords[1].toFixed(4)}° E</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to={`/discover?city=${encodeURIComponent(resolvedCity)}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-forest-950 font-bold text-xs shadow-sm transition-all cursor-pointer"
              >
                <span>Open in Discovery</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Map Layout: Live Leaflet Canvas + Real Places Sequencer */}
          <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]">
            {/* Live Leaflet Map Container */}
            <div className="lg:col-span-8 bg-[#0d1a15] relative min-h-[400px] overflow-hidden">
              <MapContainer
                center={cityCoords}
                zoom={12}
                scrollWheelZoom={false}
                className="w-full h-full min-h-[420px] z-10"
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />
                <MapViewController center={cityCoords} places={places} />

                {polylineCoordinates.length >= 2 && (
                  <Polyline
                    positions={polylineCoordinates}
                    color="#0d9488"
                    weight={4}
                    opacity={0.85}
                    dashArray="6, 8"
                  />
                )}

                {places.map((place, index) => {
                  if (!place.hasValidCoordinates) return null;
                  const isSelected = selectedPlaceId === place.id;
                  return (
                    <Marker
                      key={place.id}
                      position={[place.latitude, place.longitude]}
                      icon={createPreviewMarkerIcon(index, isSelected)}
                      eventHandlers={{
                        click: () => setSelectedPlaceId(place.id),
                      }}
                    >
                      <Popup className="geobite-map-popup">
                        <div className="p-1 min-w-[180px]">
                          <p className="font-bold text-xs text-forest-950">{place.name}</p>
                          <p className="text-[11px] text-slate-500 capitalize">{place.category}</p>
                          <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{place.address}</p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>

              {loading && (
                <div className="absolute inset-0 bg-forest-950/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center text-teal-300 gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-teal-400" />
                  <span className="text-xs font-semibold">Updating Live Map for {resolvedCity}...</span>
                </div>
              )}
            </div>

            {/* Right Verified Places Sequencer Panel */}
            <div className="lg:col-span-4 bg-white p-6 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100 max-h-[500px] overflow-y-auto">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-forest-950 text-sm tracking-tight flex items-center gap-2">
                    <Clock className="w-4 h-4 text-teal-600" />
                    <span>Verified Spots in {resolvedCity}</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-500 bg-sand-100 px-2 py-0.5 rounded-full">
                    {places.length} Mapped
                  </span>
                </div>

                <div className="mt-4 space-y-2.5">
                  {places.length === 0 && !loading && (
                    <div className="p-4 text-center text-slate-500 text-xs">
                      No verified spots cached yet for this city. Click below to explore live.
                    </div>
                  )}

                  {places.map((place, index) => {
                    const isSelected = selectedPlaceId === place.id;
                    return (
                      <div
                        key={place.id}
                        onClick={() => setSelectedPlaceId(place.id)}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-forest-50/80 border-teal-500 shadow-soft-sm ring-1 ring-teal-500/20'
                            : 'bg-white border-slate-200/80 hover:border-forest-200 hover:bg-sand-50/50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                              isSelected ? 'bg-forest-900 text-teal-300' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-bold text-xs text-forest-950 truncate">
                              {place.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-sand-200/60 text-forest-800 capitalize shrink-0">
                            {place.category}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 mt-1 pl-7 line-clamp-1">
                          {place.address}
                        </p>

                        <div className="mt-1.5 pl-7 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>~{place.estimatedVisitMinutes || 45} mins visit</span>
                          <span>{place.latitude.toFixed(4)}°, {place.longitude.toFixed(4)}°</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Discovery CTA */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <Link
                  to={`/discover?city=${encodeURIComponent(resolvedCity)}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-forest-900 hover:bg-forest-800 text-teal-300 text-xs font-bold transition-all shadow-soft-sm cursor-pointer"
                >
                  <Compass className="w-4 h-4 text-teal-400" />
                  <span>Discover All Spots in {resolvedCity}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
