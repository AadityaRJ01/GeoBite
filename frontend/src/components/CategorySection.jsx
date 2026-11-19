import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Utensils,
  Coffee,
  Landmark,
  Mountain,
  ArrowRight,
  Plus,
  Check
} from 'lucide-react';

const CATEGORIES = [
  {
    id: 'food',
    tag: 'Terroir-Driven Dining',
    title: 'Farm-to-Table & Secret Bistros',
    description:
      'Micro-seasonal tasting rooms, organic vineyard cellars, and coastal tavernas where menus change with the morning catch.',
    badge: '142 Verified Kitchens',
    subtext: 'Kyoto • Donostia • Noma Alumni',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBW5muRrVbcsB8bmbvZfhmpoemWUO0lGb1g_e5tBqPClfhIn1RohpSKZpbN8d1K6Lzv2dZXD21YufS6TxBtsnGTHteMcHzPUSaR0uS9cbpfPt2iRiljZD9yzqRzJRNlYvtplx4FJ77uOnyYXOt5kZFz3KQS69iBgDvNZJMdvtbFwgQ8O4gi0vh7fvSpF2snPLz4f9_3dOXgA2aUXVqhxJ1fCTwxeeJb-CBynH5jfTA',
    alt: 'Ceramic artisan plate with burrata, heirloom tomatoes, and chilled wine',
    iconName: 'eco',
  },
  {
    id: 'cafe',
    tag: 'Morning Geographies',
    title: 'Artisan Roasters & Sourdough Ateliers',
    description:
      'Quiet sanctuaries with natural light, Ethiopian single-origin extractions, ancient grain sourdoughs, and considered spatial design.',
    badge: '89 Independent Roasters',
    subtext: 'Copenhagen • Melbourne • Lisbon',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBPSURCt9QiHzYC23Wur56eQSGH9PahlsIyCLCfNlZ8-JyNBsFsdpbxobYJ5p_reDJA94EBxb77ogy8UcpenmX3NO7i6GgKmHS8olHFki7x7eLzfeEBiXC5fZWEXOpzOld5pcLs4Ckxmu3JJ1aoah2V6TePKvxVYeLk5xmoZjWpdZrJgQvgiOsMtoftKT6jL-8SV09FwX5H4JOsdEjCqctByx1K0AesK4_ipS-0zxc',
    alt: 'Scandinavian bakery interior with sourdough loaves and morning light',
    iconName: 'local_cafe',
  },
  {
    id: 'culture',
    tag: 'Cultural Geography',
    title: 'Heritage Walks & Architectural Shrines',
    description:
      'Ancient stone staircases, secluded moss gardens, and historic artisan quarters located mere minutes from world-class dining.',
    badge: '64 Hidden Sanctuaries',
    subtext: 'Kyoto • Oaxaca • Rome',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuA31fhfwR20UFFTfmjBZfu3481pGXCZARxROnGWFa5Qq4axloYmE8q00OzWovEXilNH9Eu1hrLuYtJxRc9CseRZnlBlj6khZbj1EqXRGqpZPdcnoCHhGBUg6Tv4zZ42uV5TfMfmOXLgSymACrIRjhiAwQehgZl9gUuyqUz798p4Tz6pbeRDaPA60GayR5MJIT3aysi238C-C5B6YvBQrkQNUqjBw7GZ8zhS0eAh9Lo',
    alt: 'Atmospheric Japanese evening street scene in an old Kyoto preservation district',
    iconName: 'temple_buddhist',
  },
  {
    id: 'viewpoint',
    tag: 'Topographic Panoramas',
    title: 'Scenic Ridges & Golden Hour Lookouts',
    description:
      'Elevated clifftops, coastal promenades, and sunset viewpoints carefully synchronized for golden hour aperitivos.',
    badge: '52 Panoramic Vistas',
    subtext: 'San Sebastián • Zürich • Mumbai',
    image:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBxWMarR3K6dTcSUabyXla3Qdh9vBe5wrN5jgbHo4ag89Q38lkZkTbVJGQvxc5oykGJQ-WAIrjXj0LJTU9UeUdpUSCYZjsgEDt32xEVyMb6VDtWdHBnRsSvrZBw-oCHkp9tIgcWUXrQD8oa0yhwSom4bT3tXL4TZC7z9ruSsj4hMcKoaFUTIcgfV8_jxIN-3ld_A2VAJAzCza9J5m6HvC0hMhRZbmqfm1sAyHGqnR4',
    alt: 'Coastal panorama over ocean cliffs and sunset golden hour',
    iconName: 'landscape',
  },
];

export default function CategorySection({ selectedCategory, onSelectCategory }) {
  const navigate = useNavigate();

  const handleCardClick = (catId) => {
    if (onSelectCategory) {
      onSelectCategory(catId);
    }
  };

  const handleExploreCategory = (catId, e) => {
    e.stopPropagation();
    navigate(`/discover?category=${catId}`);
  };

  return (
    <section className="w-full bg-[#f3fbf6] py-16 md:py-24 border-t border-[#dce5df]/60">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="font-sans text-xs text-[#096a5f] uppercase tracking-widest font-bold">
              Sensory Taxonomy
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#00140f] tracking-tight mt-1">
              Curated by Discipline &amp; Atmosphere
            </h2>
            <p className="font-sans text-sm sm:text-base text-[#414846] mt-1 max-w-xl">
              Each venue is vetted in-person for architectural presence, ingredient provenance, and hospitality ethos.
            </p>
          </div>

          <Link
            to="/discover"
            className="inline-flex items-center gap-1.5 text-[#096a5f] font-sans text-sm font-semibold hover:text-[#00140f] transition-colors group self-start md:self-auto"
          >
            <span>Browse Complete Directory (1,480+ entries)</span>
            <span className="material-symbols-outlined text-[18px] group-hover:translate-x-1 transition-transform">
              east
            </span>
          </Link>
        </div>

        {/* Categories Showcase Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => handleCardClick(cat.id)}
                className={`relative bg-[#edf6f0] rounded-3xl p-4 transition-all duration-300 flex flex-col justify-between cursor-pointer border ${
                  isSelected
                    ? 'border-[#096a5f] bg-[#e7f0eb] shadow-[0_8px_24px_-4px_rgba(9,106,95,0.15)] ring-2 ring-[#9eefe0]'
                    : 'border-[#dce5df]/80 hover:bg-[#e7f0eb] hover:shadow-md'
                }`}
              >
                <div>
                  <div className="relative h-56 w-full rounded-2xl overflow-hidden mb-4 shadow-sm">
                    <div
                      className="w-full h-full bg-cover bg-center hover:scale-105 transition-transform duration-500"
                      style={{ backgroundImage: `url('${cat.image}')` }}
                    />
                    <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm font-sans text-xs text-[#00140f] font-semibold shadow-xs">
                      {cat.badge}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[#096a5f] font-sans text-xs font-bold uppercase tracking-wider mb-1">
                    <span className="material-symbols-outlined text-[16px]">{cat.iconName}</span>
                    <span>{cat.tag}</span>
                  </div>

                  <h3 className="font-serif text-lg font-bold text-[#00140f] mb-1.5 leading-snug">
                    {cat.title}
                  </h3>

                  <p className="font-sans text-xs text-[#414846] mb-4 leading-relaxed line-clamp-3">
                    {cat.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#dce5df]/60">
                  <span className="font-sans text-[11px] text-[#727976] truncate max-w-[140px]">
                    {cat.subtext}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => handleExploreCategory(cat.id, e)}
                    className={`px-3 py-1.5 rounded-full font-sans text-xs font-semibold shadow-xs flex items-center gap-1 transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#00140f] text-[#9eefe0]'
                        : 'bg-white text-[#00140f] hover:bg-[#00140f] hover:text-white'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{isSelected ? 'Active' : 'Explore'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
