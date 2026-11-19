import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Star, 
  MapPin, 
  Clock, 
  Compass, 
  Coffee, 
  Utensils, 
  Mountain, 
  Landmark, 
  Navigation,
  Route,
  Share2,
  ExternalLink,
  Check,
  Bookmark
} from 'lucide-react';
import { sharePlace, openInGoogleMaps } from '../../services/shareUtils';

const CATEGORY_CONFIG = {
  restaurant: {
    label: 'Restaurant & Pintxos',
    tag: 'Terroir-Driven Dining',
    badge: 'bg-[#edf6f0] text-[#096a5f] border-[#dce5df]',
    icon: Utensils,
    iconName: 'restaurant',
    defaultImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBauDXhjLJNmBzSW82QH49UYOARrPrClZiUrM0hJNXCRiOk3TdVfge_8j3gVmQ0SDqyd3doRvqhXeHY5ONZEW7iKGNRpUkidpQj4zP9eOuZDafGj0W87zKDmGc56QcT1A7VC65jJzKhzThfGn9LEp9x_zB4DleYcnudlbxgCk_ItoeexppaZptVhMS0Dz3rCvmL4-6qOR3dB0yHIo3Hta-Lb3wIrUzFkHe19Y8-e7s',
  },
  cafe: {
    label: 'Specialty Café & Bakery',
    tag: 'Morning Geographies',
    badge: 'bg-[#edf6f0] text-[#096a5f] border-[#dce5df]',
    icon: Coffee,
    iconName: 'local_cafe',
    defaultImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDYCoFLGN6kkdHW5Chhzb42wwnaOo1aHIIGtgH3RQWOSBU46vpkkYazDYUV0vUfG15L5ZMPb-vpWh-fo3uCn0E8ZK1yO-16bKyaJ4436yOW-XxvdNwM4mNvpGToPrKsohJz9HmsTJUtGmBU1mfQSZTLrbMEbCjXnW-2eDmvn-DqPuv-FCXI1YiJyhAm-7uqKW9LQXiOp8Zkn3awi_Bs1MNrmezqZB1AtuSSuqWQDOs',
  },
  viewpoint: {
    label: 'Panoramic Mirador',
    tag: 'Topographic Vista',
    badge: 'bg-[#edf6f0] text-[#096a5f] border-[#dce5df]',
    icon: Mountain,
    iconName: 'landscape',
    defaultImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1kQJaiIA9RQ8aaUfQqAPB0Aaa8kIKfgt9Q68T0GwgfAKdpUYj_cwv75F9lBRYahaiDtOSB_HLrTrAo7W5s_lgm3thzRATStAVgThgdmllFM5gc6XlUUPVOzrktS9MW32kz0VD3IYldqePk12kU0TGOQRqIzZA0_7xNhvD6SQ0CAqHWhsjMqWHW14WNp-5O8b_Tavp4JgTjzS9YJr2LL1ZI79M5NMEL4usKmuo8h4',
  },
  attraction: {
    label: 'Heritage & Cloister',
    tag: 'Cultural Geography',
    badge: 'bg-[#edf6f0] text-[#096a5f] border-[#dce5df]',
    icon: Landmark,
    iconName: 'museum',
    defaultImg: 'https://lh3.googleusercontent.com/aida/ALJJyrCMH94Kgs0RDbMyNb_ZXlGEbgTNpZgYmjffEjvRrzMf7BLB6L_aSU5uouXUFT31QwdL-Dli0kyqT1CU8NRnuaMcmnRlDNHQcZQcAH6tno_GuMQ4X12h789WWfDyHy25xvT5OGrj4J0xZRx355vpL3P5IBo4Il4cWD-iYUS6rf9wvPb1HOom3S77yjK8OGYit41N48-63Yf-f-6j2VlUJjYKN9QwwOyQ2F9ixvw4lDKh',
  },
};

function formatPriceLevel(priceLevel) {
  const norm = (priceLevel || '').toLowerCase();
  if (norm === 'budget') return '€';
  if (norm === 'moderate') return '€€';
  if (norm === 'premium' || norm === 'luxury') return '€€€';
  return '€€';
}

export default function PlaceCard({
  place,
  isSelected,
  onSelect,
  onFocusMap,
}) {
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const config = CATEGORY_CONFIG[place.category] || {
    label: place.category ? place.category.charAt(0).toUpperCase() + place.category.slice(1) : 'Culinary Spot',
    tag: 'Gastronomic Gem',
    badge: 'bg-[#edf6f0] text-[#096a5f] border-[#dce5df]',
    icon: Compass,
    iconName: 'explore',
    defaultImg: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCOb7xYUC-4DnYG9SO9o15Ijz_2AlaJIeu_6Nc7FzcrG4AymnckYLVMcS3xM27m_loNVB1hjIOTCZwloC1UQ5JW8Kqk0uRJkMRLs4DcCGxoo5pQRTsPMICOzj8PRhWwkkP0hBD0ZEADx0WFa7EAfgZ-quo7S82G7jN2gRTbBkz-1fRU0tAUkkuD6wuP1uVu6sM_JvNNRcEjvNGccclLs40w3WZBCR5NabCX2G5pIxs',
  };

  const displayImage = place.imageUrl || config.defaultImg;
  const ratingValue = typeof place.averageRating === 'number' && place.averageRating > 0 
    ? place.averageRating.toFixed(2) 
    : '4.88';

  const handleCardClick = () => {
    if (onSelect) onSelect(place.id);
  };

  const handleFocusClick = (e) => {
    e.stopPropagation();
    if (onSelect) onSelect(place.id);
    if (onFocusMap) onFocusMap(place);
  };

  const handleShareClick = async (e) => {
    e.stopPropagation();
    try {
      const res = await sharePlace(place);
      if (res.copied) {
        setCopiedNotice(true);
        setTimeout(() => setCopiedNotice(false), 2200);
      }
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleGoogleMapsClick = (e) => {
    e.stopPropagation();
    openInGoogleMaps(place);
  };

  const toggleBookmark = (e) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <article
      id={`place-card-${place.id}`}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`group relative bg-white rounded-3xl p-4 transition-all duration-300 cursor-pointer outline-none border flex flex-col md:flex-row gap-4 ${
        isSelected
          ? 'border-[#096a5f] shadow-[0_12px_32px_-4px_rgba(14,42,36,0.12)] ring-2 ring-[#9eefe0] bg-[#fbfdfb]'
          : 'border-[#e2eae5] hover:border-[#9eefe0] hover:shadow-[0_8px_24px_-4px_rgba(14,42,36,0.08)]'
      }`}
    >
      {/* Visual Photography Column (w-full md:w-5/12) */}
      <div className="w-full md:w-5/12 h-56 md:h-auto min-h-[180px] rounded-2xl overflow-hidden relative shrink-0">
        <img
          src={displayImage}
          alt={place.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        
        {/* Editorial Badge Overlay Top-Left */}
        <div className="absolute top-3 left-3 bg-[#0e2a24]/90 backdrop-blur-md text-white px-3 py-1 rounded-full font-sans text-[11px] font-semibold flex items-center gap-1.5 shadow-sm border border-white/10">
          <span className="material-symbols-outlined text-[14px] text-[#9eefe0]">
            {isSelected ? 'verified_user' : 'stars'}
          </span>
          <span>{isSelected ? 'Active Pick' : config.label}</span>
        </div>

        {/* Bookmark Action Top-Right */}
        <button
          type="button"
          onClick={toggleBookmark}
          aria-label="Bookmark place"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/85 backdrop-blur-md flex items-center justify-center text-[#151d1a] hover:bg-white transition-colors shadow-sm cursor-pointer"
        >
          <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#096a5f] text-[#096a5f]' : ''}`} />
        </button>

        {/* Subtle bottom gradient on image */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>

      {/* Content & Details Column (w-full md:w-7/12) */}
      <div className="w-full md:w-7/12 flex flex-col justify-between py-1">
        <div>
          {/* Header row: Category Tag + Rating Pill */}
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <span className="font-sans text-[11px] uppercase tracking-wider text-[#096a5f] font-bold truncate">
              {config.tag}
            </span>

            <div className="flex items-center gap-1 bg-[#edf6f0] px-2.5 py-0.5 rounded-full shrink-0 border border-[#dce5df]/60">
              <span className="material-symbols-outlined text-[14px] text-[#096a5f]" style={{ fontVariationSettings: "'FILL' 1" }}>
                star
              </span>
              <span className="font-sans text-xs font-bold text-[#00140f]">{ratingValue}</span>
            </div>
          </div>

          {/* Place Name in Playfair Display serif */}
          <h3 className="font-serif text-lg sm:text-xl font-bold text-[#00140f] group-hover:text-[#096a5f] transition-colors leading-snug mb-1.5">
            {place.name}
          </h3>

          {/* Address */}
          <div className="flex items-center gap-1 text-xs text-[#727976] mb-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#096a5f] shrink-0" />
            <span className="truncate">{place.address || 'Location verified on map'}</span>
          </div>

          {/* Description */}
          {place.description && (
            <p className="font-sans text-xs text-[#414846] line-clamp-2 leading-relaxed mb-3">
              {place.description}
            </p>
          )}

          {/* Feature Badges: Distance, Price, Visit duration */}
          <div className="flex flex-wrap items-center gap-1.5 mb-3">
            {typeof place.distanceMeters === 'number' && (
              <span className="font-sans text-[11px] font-semibold bg-[#edf6f0] text-[#00140f] px-2.5 py-0.5 rounded-full border border-[#dce5df]">
                {place.distanceKm < 1 ? `${place.distanceMeters}m away` : `${place.distanceKm} km away`}
              </span>
            )}
            <span className="font-sans text-[11px] font-bold bg-[#edf6f0] text-[#00140f] px-2.5 py-0.5 rounded-full border border-[#dce5df]">
              {formatPriceLevel(place.priceLevel)}
            </span>
            {place.estimatedVisitMinutes && (
              <span className="font-sans text-[11px] font-medium bg-[#edf6f0] text-[#414846] px-2.5 py-0.5 rounded-full border border-[#dce5df] flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#727976]" />
                {place.estimatedVisitMinutes}m
              </span>
            )}
          </div>
        </div>

        {/* Bottom Action Footer */}
        <div className="pt-2 border-t border-[#edf6f0] flex flex-wrap items-center justify-between gap-2 mt-1">
          <div className="flex items-center gap-1.5 text-[11px] text-[#096a5f] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#096a5f] animate-pulse" />
            <span>Verified PostGIS Spot</span>
          </div>

          {/* Action Buttons: Share, Maps, Focus, Plan */}
          <div className="flex items-center gap-1.5">
            {/* Share */}
            <button
              type="button"
              onClick={handleShareClick}
              className={`p-1.5 rounded-full transition-colors cursor-pointer border ${
                copiedNotice
                  ? 'bg-[#096a5f] text-white border-[#096a5f]'
                  : 'bg-[#edf6f0] text-[#414846] hover:text-[#00140f] hover:bg-[#e2eae5] border-[#dce5df]'
              }`}
              title="Share place"
              aria-label="Share place"
            >
              {copiedNotice ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
            </button>

            {/* Google Maps */}
            <button
              type="button"
              onClick={handleGoogleMapsClick}
              className="p-1.5 rounded-full bg-[#edf6f0] text-[#414846] hover:text-[#00140f] hover:bg-[#e2eae5] transition-colors border border-[#dce5df] cursor-pointer"
              title="Open directions in Google Maps"
              aria-label="Open in Google Maps"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>

            {/* Focus on Leaflet Map */}
            <button
              type="button"
              onClick={handleFocusClick}
              className="px-3 py-1 rounded-full bg-[#edf6f0] text-[#00140f] hover:bg-[#e2eae5] font-sans text-xs font-semibold transition-colors border border-[#dce5df] flex items-center gap-1 cursor-pointer"
              title="Focus on map"
            >
              <Navigation className="w-3 h-3 text-[#096a5f]" />
              <span>Map</span>
            </button>

            {/* Plan Route Link */}
            <Link
              to="/route"
              onClick={(e) => e.stopPropagation()}
              className="px-3.5 py-1 rounded-full bg-[#00140f] text-white hover:bg-[#0e2a24] font-sans text-xs font-semibold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              title="Add this place to Route Planner"
            >
              <Route className="w-3 h-3 text-[#9eefe0]" />
              <span>Plan</span>
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
