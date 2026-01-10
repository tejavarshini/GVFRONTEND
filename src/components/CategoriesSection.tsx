import { useMemo, useState, useEffect } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { useBrands } from '@/hooks/useBrands';
import { useNearbyBrands } from '@/hooks/useNearbyBrands'; // ✅ NEW

import { Link } from 'wouter';
// import BrandCard from '@/components/BrandCard'; // ADD THIS IMPORT
import type { Brand } from '@/types/brand';
import { Sparkles, Star, Tag, Award, MapPin } from 'lucide-react'; // ✅ Added MapPin


// Category icon mapping - Only 9 categories from backend
const CATEGORY_ICONS: Record<string, string> = {
  'Gaming': '/icons/gaming.png',
  'Fashion & Lifestyle': '/icons/fashion.png',
  'E-Commerce': '/icons/ecommerce.png',
  'Food & Beverages': '/icons/food.png',
  'Tour & Travel': '/icons/travel.png',
  'Wellness & Beauty': '/icons/wellness.png',
  'Jewellery': '/icons/jewellery.png',
  'Entertainment': '/icons/entertainment.png',
  'Sports & Footwears': '/icons/sports.png',
};

// const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
//   'Gaming': 'Gaming',
//   'Fashion & Lifestyle': 'Fashion',
//   'E-Commerce': 'E-Commerce',
//   'Food & Beverages': 'Food',
//   'Tour & Travel': 'Travel',
//   'Wellness & Beauty': 'Grooming',
//   'Jewellery': 'Jewellery',
//   'Entertainment': 'Entertainment',
//   'Sports & Footwears': 'Sports',
// };

export default function CategoriesSection() {
  const { data: brands, isLoading, isError } = useBrands();
const [selectedCategory, setSelectedCategory] = useState<string | null>(() => {
  // Auto-select first category from preselected categories
  const stored = localStorage.getItem("selectedCategories");
  if (stored) {
    try {
      const categories = JSON.parse(stored);
      return categories.length > 0 ? categories[0] : null;
    } catch  {
      return null;
    }
  }
  return null;
});

const [selectedFilter, setSelectedFilter] = useState<string | null>(() => {
  // Auto-select Super Cashbacks if there's a preselected category
  const stored = localStorage.getItem("selectedCategories");
  if (stored) {
    try {
      const categories = JSON.parse(stored);
      return categories.length > 0 ? "Super Cashbacks" : null;
    } catch  {
      return null;
    }
  }
  return null;
});


// ✅ NEW: Geolocation state
const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
const [locationError, setLocationError] = useState<string | null>(null);

// ✅ NEW: Fetch nearby brands
const { 
  data: nearbyBrands, 
  isLoading: isLoadingNearby,
} = useNearbyBrands(
  selectedFilter === "Nearby Stores" && selectedCategory && userLocation
    ? { lat: userLocation.lat, lng: userLocation.lng, category: selectedCategory }
    : null,
  selectedFilter === "Nearby Stores" && !!userLocation && !!selectedCategory
);



const [viewAllMode, setViewAllMode] = useState(false);
const [preSelectedCategories, setPreSelectedCategories] = useState<string[]>(() => {
  // Lazy initialization - only runs once on mount
  const stored = localStorage.getItem("selectedCategories");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error("Failed to parse selected categories", e);
      return [];
    }
  }
  return [];
});

// ✅ NEW: Get user location when "Nearby Stores" is selected
useEffect(() => {
  if (selectedFilter === "Nearby Stores" && !userLocation) {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          console.error("Geolocation error:", error);
          setLocationError("Unable to get your location. Please enable location access.");
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }
}, [selectedFilter, userLocation]);

// ✅ NEW: Auto-select category and filter if coming from Surprise Me
useEffect(() => {
  const surpriseMeActive = localStorage.getItem("surpriseMeActive");
  const surpriseMeCategory = localStorage.getItem("surpriseMeCategory");
  
  if (surpriseMeActive === "true" && surpriseMeCategory) {
    setSelectedCategory(surpriseMeCategory);
    setSelectedFilter("Nearby Stores");
    
    // Clear the surprise me flags
    localStorage.removeItem("surpriseMeActive");
    localStorage.removeItem("surpriseMeCategory");
  }
}, []);



// No useEffect needed anymore - state is initialized correctly


    // const [, setLocation] = useLocation();

  // Group brands by category and get unique categories
  const categoriesData = useMemo(() => {
    if (!brands || !Array.isArray(brands)) return [];

    const categoryMap: Record<string, Brand[]> = {};

    brands.forEach((brand) => {
      const category = brand.Category?.trim();
      if (!category) return;

      if (!categoryMap[category]) {
        categoryMap[category] = [];
      }
      categoryMap[category].push(brand);
    });

    return Object.entries(categoryMap)
      .map(([name, categoryBrands]) => ({
        name,
        brands: categoryBrands,
        image: CATEGORY_ICONS[name] || '/icons/default.png',
        brandCount: categoryBrands.length,
      }))
.sort((a, b) => {
  // First, prioritize pre-selected categories
  const aIsPreSelected = preSelectedCategories.includes(a.name);
  const bIsPreSelected = preSelectedCategories.includes(b.name);
  
  if (aIsPreSelected && !bIsPreSelected) return -1;
  if (!aIsPreSelected && bIsPreSelected) return 1;
  
  // For pre-selected categories, maintain their selection order
  if (aIsPreSelected && bIsPreSelected) {
    return preSelectedCategories.indexOf(a.name) - preSelectedCategories.indexOf(b.name);
  }
  
  // For non-selected categories, use default order
  const order = [
    'Food & Beverages',
    'E-Commerce',
    'Fashion & Lifestyle',
    'Tour & Travel',
    'Gaming',
    'Wellness & Beauty',
    'Jewellery',
    'Entertainment',
    'Sports & Footwears'
  ];
  return order.indexOf(a.name) - order.indexOf(b.name);
});

  }, [brands, preSelectedCategories]);

  // Get filtered brands based on selected filter
  const filteredBrandsByFilter = useMemo(() => {
    if (!selectedCategory || !selectedFilter) return [];

      // ✅ NEW: Handle "Nearby Stores" filter
  if (selectedFilter === "Nearby Stores") {
    return nearbyBrands || [];
  }

    const category = categoriesData.find((cat) => cat.name === selectedCategory);
    if (!category) return [];

    const brandsWithDiscount = category.brands.filter((brand) => brand.Discount);

    // Filter based on discount ranges
    const filtered = brandsWithDiscount.filter((brand) => {
      const discount = parseFloat(brand.Discount?.replace('%', '') || '0');
      const minPrice = brand.MinPrice || 0;
      // const maxPrice = brand.MaxPrice || 0;

      switch (selectedFilter) {
        case "Super Cashbacks":
          return discount > 0; // All brands with discount (no range limit)
        case "Today's Picks":
          return discount >= 10 && discount <= 15; // 10-15%
        case "Under ₹500":
          return minPrice > 0 && minPrice <= 500; // 5-10%
        case "Under ₹1,000":
          return minPrice > 500 && minPrice <= 1000; // 0-5%
        case "Premium Picks":
          return minPrice > 1000; // 0-3%
        default:
          return true;
      }
    });

    return filtered
      .sort((a, b) => {
        const discountA = parseFloat(a.Discount?.replace('%', '') || '0');
        const discountB = parseFloat(b.Discount?.replace('%', '') || '0');
        return discountB - discountA;
      })
      .slice(0, 5);
  }, [selectedCategory, selectedFilter, categoriesData, nearbyBrands]);

const handleCategoryClick = (categoryName: string) => {
  // Only allow click if in viewAll mode OR category is pre-selected
  if (!viewAllMode && preSelectedCategories.length > 0 && !preSelectedCategories.includes(categoryName)) {
    return; // Do nothing for non-selected categories
  }

  // Toggle: if same category clicked, deselect it
  const newCategory = selectedCategory === categoryName ? null : categoryName;
  setSelectedCategory(newCategory);
  
  // ✅ Store clicked category for TopBrandsSection to pick up
  if (newCategory) {
    localStorage.setItem('highlightCategory', newCategory);
    // No timestamp needed anymore since we want it to persist
  } else {
    localStorage.removeItem('highlightCategory');
  }
};



  const handleTakeTourAgain = () => {
  // Clear onboarding completion
  localStorage.removeItem("onboardingComplete");
  localStorage.removeItem("giftChoices");
  localStorage.removeItem("selectedCategories");
  // Navigate to onboarding
  window.location.href = "/";
};




  // const closeOverlay = () => {
  //     setSelectedCategory(null);
  // };

  if (isLoading) {
    return (
      <section className="py-4 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Loading Skeleton Grid - theme aware */}
          <div className="flex gap-4 sm:gap-6 overflow-x-auto scrollbar-hide">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0">
                {/* Circle skeleton with dark theme support */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
                {/* Text skeleton with dark theme support */}
                <div className="w-12 h-3 sm:h-4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }


  if (isError) {
    return (
      <section className="py-4 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-red-500 dark:text-red-400">
            Unable to load categories
          </p>
        </div>
      </section>
    );
  }


  if (categoriesData.length === 0) {
    return null;
  }

  return (
    <>
      <section className="pt-0 pb-4 sm:pb-6 lg:pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 sm:mb-3 text-gray-900">
                    Hot Deals by Category
                </h2> */}

          {/* Categories Grid - 3 columns on all screens */}
          <motion.div
            className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 scrollbar-hide"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {categoriesData.map((category) => {
              const isPreSelected = preSelectedCategories.includes(category.name);
              const isDisabled = !viewAllMode && preSelectedCategories.length > 0 && !isPreSelected;

              return (
                <motion.button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  disabled={isDisabled}
                  className={`flex flex-col items-center gap-2 transition-all duration-300 focus:outline-none flex-shrink-0 w-[72px] ${isDisabled
                      ? "opacity-30 cursor-not-allowed grayscale"
                      : "hover:scale-105 cursor-pointer"
                    }`}
                  whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                >

                  {/* Category Image with overlay text */}
                  <div className={`relative w-[72px] h-[72px] rounded-2xl overflow-hidden transition-all border-[3px] ${selectedCategory === category.name
                    ? 'border-purple-700 shadow-[0_0_15px_rgba(139,92,246,0.4)]'
                    : 'border-white/10'
                    }`}>
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/icons/default.png';
                      }}
                    />
                    {/* Dark overlay */}
                    {/* <div className="absolute inset-0 bg-black bg-opacity-40"></div> */}

                    {/* Category Name on image */}
                    {/* <h3 className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white text-center px-2 lg:text-sm">
                    {CATEGORY_DISPLAY_NAMES[category.name] || category.name}
                  </h3> */}

                    {selectedCategory === category.name && (
                      <motion.div
                        layoutId="activeCategory"
                        className="absolute inset-0 rounded-2xl ring-3 ring-purple-600 pointer-events-none"
                      />
                    )}
                  </div>
                </motion.button>
              );
            })}

          </motion.div>

          {/* View All Button - Show when categories are filtered */}
<div className="flex justify-center gap-3 mt-4">
  {!viewAllMode && preSelectedCategories.length > 0 && (
    <button
      onClick={() => {
        setViewAllMode(true);
        setPreSelectedCategories([]);
        localStorage.removeItem("selectedCategories");
      }}
      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors shadow-lg whitespace-nowrap"
    >
      View All Categories
    </button>
  )}
  <button
    onClick={handleTakeTourAgain}
    className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-white text-sm font-medium transition-colors shadow-lg whitespace-nowrap"
  >
    Take a Tour Again
  </button>
</div>






          {/* Filter Tags - Show only when category is selected */}
          <AnimatePresence mode="wait">
            {selectedCategory && (
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="mt-2"
              >
                <div className="border border-gray-300 rounded-2xl px-3 py-2 bg-black bg-opacity-50">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
                    {/* All Brands - Link to brands page */}
                    {/* <Link
                      href="/brands"
                      className="px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0 border border-gray-300 bg-transparent text-gray-200 hover:bg-gray-800 flex items-center gap-1.5"
                    >
                      <Tag className="w-3 h-3" />
                      All Brands
                    </Link> */}

                    {[
                      { name: "Super Cashbacks", icon: Sparkles },
                      { name: "Today's Picks", icon: Star },
                      { name: "Under ₹500", icon: Tag },
                      { name: "Under ₹1,000", icon: Tag },
                      // { name: "Last-Minute", icon: Clock },
                      { name: "Premium Picks", icon: Award },
                      { name: "Nearby Stores", icon: MapPin } // ✅ NEW
                    ].map((filter, index) => {
                      const Icon = filter.icon;
                      const isActive = selectedFilter === filter.name;

                      return (
                        <motion.button
                          key={filter.name}
                          onClick={() => setSelectedFilter(selectedFilter === filter.name ? null : filter.name)}
className={`px-4 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors flex-shrink-0 border flex items-center gap-1.5 ${
  isActive
    ? // Active state
      'border-purple-500/50 shadow-[0_0_8px_rgba(139,92,246,0.3)] ' +
      'bg-purple-500/30 text-white ' + // Dark mode active
      'dark:bg-purple-500/30 dark:border-purple-500/50 dark:text-white ' +
      'light:bg-white light:border-purple-500 light:text-purple-600 light:shadow-none' // Light mode active
    : // Inactive state
      'dark:border-white/10 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10 ' + // Dark mode inactive
      'border-gray-300 bg-gray-100 text-gray-600 hover:bg-gray-200' // Light mode inactive
}`}

                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Icon className="w-3 h-3" />
                          {filter.name}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* Top Discounted Brands - Inline Below Categories */}
      <AnimatePresence mode="wait">
        {selectedCategory && selectedFilter && filteredBrandsByFilter.length > 0 && (
          <motion.div
            key={`deals-${selectedCategory}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="pt-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
          >
            {/* ✅ Loading State for Nearby Stores */}
{selectedFilter === "Nearby Stores" && isLoadingNearby && (
  <div className="text-center py-4">
    <p className="text-sm text-gray-500">Finding nearby stores...</p>
  </div>
)}

{/* ✅ Location Error */}
{selectedFilter === "Nearby Stores" && locationError && (
  <div className="text-center py-4">
    <p className="text-sm text-red-500">{locationError}</p>
  </div>
)}

{/* ✅ No Results */}
{selectedFilter === "Nearby Stores" && !isLoadingNearby && !locationError && filteredBrandsByFilter.length === 0 && (
  <div className="text-center py-4">
    <p className="text-sm text-gray-500">No nearby stores found in this category</p>
  </div>
)}

<h3 className="text-sm font-semibold text-gray-700 mb-2">
  {selectedFilter === "Super Cashbacks" 
    ? "Top Deals" 
    : selectedFilter === "Nearby Stores"
    ? "Nearby Brands"
    : selectedFilter} in {selectedCategory}
</h3>

            <div className="flex gap-4 overflow-x-auto pb-2">

{filteredBrandsByFilter.map((brand: any, index) => {
  // ✅ Handle both Brand and NearbyBrand types
  const brandId = brand.BrandId || brand.brandId;
  const brandName = brand.BrandName || brand.brandName;
  const brandImages = brand.Images || brand.images;
  const discount = brand.Discount;
  const distanceKm = brand.nearestDistanceKm;

  return (
    <motion.div
      key={brandId}
      initial={{ opacity: 0, scale: 0.8 }}

                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.25,
                    delay: index * 0.1,
                    type: "spring",
                    stiffness: 300,
                    damping: 25
                  }}
                >
<Link
  href={`/brands/${brandId}${selectedFilter === 'Nearby Stores' ? '?autoFindStores=true' : ''}`}
  className="flex flex-col items-center gap-2 hover:scale-105 transition-all flex-shrink-0"
>

                    {/* Brand Image - Same size as category */}
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center p-3 border-2 border-purple-200 lg:w-20 lg:h-20">
                        <img
                          src={
                            brandImages?.text ||
                            brandImages?.thumbnail ||
                            brandImages?.featured ||
                            brandImages?.main ||
                            brandImages?.raw ||
                            '/brand-placeholder.png'
                          }
                          alt={brandName}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            e.currentTarget.src = '/brand-placeholder.png';
                          }}
                        />
                      </div>
                      {/* Discount Badge */}
                      {discount && (
                        <div className="absolute top-0 -right-1 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          {parseFloat(discount).toFixed(1)}%
                        </div>
                      )}

                    </div>
                    {/* Brand Name */}
                    <p className="text-[10px] font-medium text-center line-clamp-2 w-16 lg:w-20 lg:text-xs">
                      {brandName}
                    </p>
                    {/* Distance (for nearby stores) */}
{distanceKm !== undefined && (
  <p className="text-[9px] text-gray-500 text-center mt-0.5">
    📍 {distanceKm.toFixed(1)}km
  </p>
)}
        </Link>
      </motion.div>
    );
  })}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </>
  );
}
