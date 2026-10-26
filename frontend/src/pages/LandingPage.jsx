import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import CategorySection from '../components/CategorySection';
import MapPreviewPlaceholder from '../components/MapPreviewPlaceholder';
import ArchitectureSection from '../components/ArchitectureSection';
import Footer from '../components/Footer';
import { fetchHealth } from '../services/placesApi';

export default function LandingPage() {
  const [activeCity, setActiveCity] = useState('Bengaluru, India');
  const [selectedCategory, setSelectedCategory] = useState('food');
  const [healthStatus, setHealthStatus] = useState({ online: false, data: null });
  const [searchNotification, setSearchNotification] = useState(null);

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

  return (
    <div className="min-h-screen flex flex-col bg-sand-50 selection:bg-teal-500 selection:text-white">
      {/* Toast Notification */}
      {searchNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-forest-900 text-white px-5 py-3 rounded-2xl shadow-soft-lg border border-teal-500/40 text-xs sm:text-sm font-medium flex items-center gap-2 animate-bounce">
          <span className="w-2 h-2 rounded-full bg-teal-400" />
          <span>{searchNotification}</span>
        </div>
      )}

      {/* Navigation */}
      <Navbar healthStatus={healthStatus} />

      {/* Main Content */}
      <main className="flex-1">
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

        <ArchitectureSection
          healthData={healthStatus?.data}
        />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
