import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import CategorySection from '../components/CategorySection';
import MapPreviewPlaceholder from '../components/MapPreviewPlaceholder';
import ArchitectureSection from '../components/ArchitectureSection';
import Footer from '../components/Footer';
import { fetchHealth } from '../services/placesApi';
import { Check } from 'lucide-react';

export default function LandingPage() {
  const [activeCity, setActiveCity] = useState('San Sebastián, Spain');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [healthStatus, setHealthStatus] = useState({ online: false, data: null });
  const [searchNotification, setSearchNotification] = useState(null);
  const [dispatchEmail, setDispatchEmail] = useState('');
  const [dispatchSubscribed, setDispatchSubscribed] = useState(false);

  // Check backend health status using shared service
  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const data = await fetchHealth();
        if (isMounted) setHealthStatus({ online: true, data });
      } catch {
        if (isMounted) setHealthStatus({ online: false, data: null });
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleSearch = (city, radius) => {
    setActiveCity(city);
    setSearchNotification(`Searching ${selectedCategory} spots in ${city} within ${radius}`);
    setTimeout(() => setSearchNotification(null), 4000);
  };

  const handleSelectCategory = (categoryId) => {
    setSelectedCategory(categoryId);
  };

  const handleDispatchSubmit = (e) => {
    e.preventDefault();
    if (dispatchEmail.trim()) {
      setDispatchSubscribed(true);
      setTimeout(() => setDispatchSubscribed(false), 5000);
      setDispatchEmail('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f3fbf6] text-[#151d1a] selection:bg-[#9eefe0] selection:text-[#00140f]">
      {/* Toast Notification */}
      {searchNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#00140f] text-white px-5 py-3 rounded-2xl shadow-xl border border-[#9eefe0]/40 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-[#9eefe0]" />
          <span>{searchNotification}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar healthStatus={healthStatus} />

      {/* Main Content with top padding to clear fixed navbar */}
      <main className="w-full pt-20 bg-[#f3fbf6] flex-1">
        <HeroSection
          onSearch={handleSearch}
          activeCity={activeCity}
          setActiveCity={setActiveCity}
        />

        <CategorySection
          selectedCategory={selectedCategory}
          onSelectCategory={handleSelectCategory}
        />

        <MapPreviewPlaceholder
          activeCity={activeCity}
          selectedCategory={selectedCategory}
        />

        {/* Editorial Field Notes & Monocle-style Journal */}
        <section className="w-full bg-[#f3fbf6] py-16 md:py-24 border-t border-[#dce5df]/60">
          <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12">
            <div className="bg-[#edf6f0] rounded-3xl p-6 sm:p-10 md:p-14 border border-[#dce5df] shadow-[0_4px_24px_-4px_rgba(14,42,36,0.04)]">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Editorial Quote & Field Note (8 Cols) */}
                <div className="lg:col-span-8">
                  <div className="flex items-center gap-2 text-[#096a5f] font-sans text-xs uppercase tracking-widest font-bold mb-4">
                    <span className="material-symbols-outlined text-[16px]">menu_book</span>
                    <span>Field Notes • Volume VII</span>
                  </div>
                  <blockquote className="font-serif text-2xl sm:text-3xl lg:text-4xl text-[#00140f] tracking-tight leading-relaxed italic mb-6">
                    “The true soul of a city isn’t found in its monuments, but in the morning light cutting through steam above an espresso machine, and the quiet dignity of a third-generation baker pulling loaves at dawn.”
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#dce5df] flex items-center justify-center font-serif text-base font-bold text-[#00140f]">
                      EL
                    </div>
                    <div>
                      <div className="font-sans text-sm font-bold text-[#00140f]">Elena Larrañaga</div>
                      <div className="font-sans text-xs text-[#414846]">Contributing Culinary Anthropologist • San Sebastián</div>
                    </div>
                  </div>
                </div>

                {/* Community Dispatch Signup (4 Cols) */}
                <div className="lg:col-span-4 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-[#e2eae5]">
                  <span className="font-sans text-xs text-[#096a5f] uppercase font-bold tracking-wider">
                    The Dispatch
                  </span>
                  <h4 className="font-serif text-xl font-bold text-[#00140f] mt-1 mb-2">
                    Secret Tables in Your Inbox
                  </h4>
                  <p className="font-sans text-xs text-[#414846] mb-5 leading-relaxed">
                    Join 45,000+ conscious explorers. Every Thursday: one secret dining route, one micro-roaster profile, and zero sponsored fluff.
                  </p>

                  {dispatchSubscribed ? (
                    <div className="p-3 bg-[#9eefe0]/30 border border-[#9eefe0] rounded-2xl flex items-center gap-2 text-[#096a5f] font-sans text-xs font-semibold">
                      <Check className="w-4 h-4 text-[#096a5f]" />
                      <span>Thank you. You are on the subscriber dispatch.</span>
                    </div>
                  ) : (
                    <form onSubmit={handleDispatchSubmit} className="flex flex-col gap-2.5">
                      <input
                        type="email"
                        required
                        value={dispatchEmail}
                        onChange={(e) => setDispatchEmail(e.target.value)}
                        placeholder="Your primary correspondence email"
                        className="w-full px-4 py-2.5 rounded-full bg-[#edf6f0] text-[#00140f] font-sans text-xs placeholder:text-[#727976] focus:outline-none focus:ring-2 focus:ring-[#9eefe0] border border-[#dce5df]"
                      />
                      <button
                        type="submit"
                        className="w-full py-2.5 rounded-full bg-[#00140f] text-white font-sans text-xs font-semibold hover:bg-[#096a5f] transition-colors shadow-xs cursor-pointer"
                      >
                        Receive Field Notes
                      </button>
                    </form>
                  )}

                  <div className="mt-3 text-center font-sans text-[11px] text-[#727976]">
                    Private and curated. Unsubscribe anytime with one tap.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <ArchitectureSection
          healthData={healthStatus?.data}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
