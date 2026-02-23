import { useMemo, useState, useEffect, useRef } from 'react';

import { motion, AnimatePresence } from 'framer-motion';
import { useBrands } from '@/hooks/useBrands';
import { useNearbyBrands } from '@/hooks/useNearbyBrands'; // ✅ NEW

import { Link } from 'wouter';
// import BrandCard from '@/components/BrandCard'; // ADD THIS IMPORT
import type { Brand } from '@/types/brand';
import { Sparkles, Star, Tag, Award, MapPin } from 'lucide-react'; // ✅ Added MapPin
import PremiumCategoryIcon, { type CategoryType } from '@/components/PremiumCategoryIcon';
import LayeredCategorySection from '@/components/LayeredCategorySection';
import { getCategoryTextColor } from '@/components/PremiumCategoryIcon';


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

// Map category names to PremiumCategoryIcon types
const CATEGORY_TYPE_MAP: Record<string, CategoryType> = {
  'Gaming': 'gaming',
  'Fashion & Lifestyle': 'fashion',
  'E-Commerce': 'ecommerce',
  'Food & Beverages': 'food',
  'Tour & Travel': 'travel',
  'Wellness & Beauty': 'wellness',
  'Jewellery': 'jewellery',
  'Entertainment': 'entertainment',
  'Sports & Footwears': 'sports',
};

// ✨ Mood-driven aura colors for each category
const CATEGORY_MOOD_AURAS: Record<string, { glow: string; shadow: string; hoverGlow: string }> = {
  'E-Commerce': { 
    glow: 'rgba(147, 51, 234, 0.45)', 
    shadow: '0 0 40px rgba(147, 51, 234, 0.65), 0 0 60px rgba(147, 51, 234, 0.45)',
    hoverGlow: 'rgba(147, 51, 234, 0.75)'
  },
  'Food & Beverages': { 
    glow: 'rgba(147, 51, 234, 0.45)', 
    shadow: '0 0 40px rgba(147, 51, 234, 0.65), 0 0 60px rgba(147, 51, 234, 0.45)',
    hoverGlow: 'rgba(147, 51, 234, 0.75)'
  },
  'Fashion & Lifestyle': { 
    glow: 'rgba(147, 51, 234, 0.45)', 
    shadow: '0 0 40px rgba(147, 51, 234, 0.65), 0 0 60px rgba(147, 51, 234, 0.45)',
    hoverGlow: 'rgba(147, 51, 234, 0.75)'
  },
  'Tour & Travel': { 
    glow: 'rgba(147, 51, 234, 0.45)', 
    shadow: '0 0 40px rgba(147, 51, 234, 0.65), 0 0 60px rgba(147, 51, 234, 0.45)',
    hoverGlow: 'rgba(147, 51, 234, 0.75)'
  },
  'Gaming': { 
    glow: 'rgba(147, 51, 234, 0.45)', 
    shadow: '0 0 40px rgba(147, 51, 234, 0.65), 0 0 60px rgba(147, 51, 234, 0.45)',
    hoverGlow: 'rgba(147, 51, 234, 0.75)'
  },
  'Wellness & Beauty': { 
    glow: 'rgba(147, 51, 234, 0.45)', 
    shadow: '0 0 40px rgba(147, 51, 234, 0.65), 0 0 60px rgba(147, 51, 234, 0.45)',
    hoverGlow: 'rgba(147, 51, 234, 0.75)'
  },
  'Jewellery': { 
    glow: 'rgba(147, 51, 234, 0.45)', 
    shadow: '0 0 40px rgba(147, 51, 234, 0.65), 0 0 60px rgba(147, 51, 234, 0.45)',
    hoverGlow: 'rgba(147, 51, 234, 0.75)'
  },
  'Entertainment': { 
    glow: 'rgba(147, 51, 234, 0.45)', 
    shadow: '0 0 40px rgba(147, 51, 234, 0.65), 0 0 60px rgba(147, 51, 234, 0.45)',
    hoverGlow: 'rgba(147, 51, 234, 0.75)'
  },
  'Sports & Footwears': { 
    glow: 'rgba(147, 51, 234, 0.45)', 
    shadow: '0 0 40px rgba(147, 51, 234, 0.65), 0 0 60px rgba(147, 51, 234, 0.45)',
    hoverGlow: 'rgba(147, 51, 234, 0.75)'
  },
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

interface CategoriesSectionProps {
  buttonLabel?: string;
}

export default function CategoriesSection({ buttonLabel = "Quick Buy" }: CategoriesSectionProps = {}) {
  const { data: brands, isLoading, isError } = useBrands();
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  
  // ✅ Scrollbar hint ref and state
  const filterScrollRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0); // 0-100% of scroll
  const [isDraggingScrollbar, setIsDraggingScrollbar] = useState(false);
  const [animationTrigger, setAnimationTrigger] = useState(0); // Trigger animation on category click
  
  // ✅ Layered scroll animation refs
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  
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

// ✅ Per-category filter system: each category maintains its own filter
const [categoryFilters, setCategoryFilters] = useState<Record<string, string | null>>(() => {
  // Auto-select Super Cashbacks for preselected category
  const stored = localStorage.getItem("selectedCategories");
  if (stored) {
    try {
      const categories = JSON.parse(stored);
      if (categories.length > 0) {
        return { [categories[0]]: "Super Cashbacks" };
      }
    } catch  {
      return {};
    }
  }
  return {};
});

// Helper function to get filter for a specific category
const getFilterForCategory = (categoryName: string): string | null => {
  return categoryFilters[categoryName] || null;
};

// Helper function to set filter for a specific category
const setFilterForCategory = (categoryName: string, filter: string | null) => {
  setCategoryFilters(prev => ({
    ...prev,
    [categoryName]: filter
  }));
};


// ✅ NEW: Geolocation state
const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
const [locationError, setLocationError] = useState<string | null>(null);

// ✅ NEW: Fetch nearby brands
const selectedFilter = selectedCategory ? getFilterForCategory(selectedCategory) : null;
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
    setFilterForCategory(surpriseMeCategory, "Nearby Stores");
    
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

const handleCategoryClick = (categoryName: string) => {
  // Only allow click if in viewAll mode OR category is pre-selected
  if (!viewAllMode && preSelectedCategories.length > 0 && !preSelectedCategories.includes(categoryName)) {
    return; // Do nothing for non-selected categories
  }

  // If clicking same category, just scroll to it
  if (selectedCategory === categoryName) {
    setAnimationTrigger(prev => prev + 1);
    
    // ✅ Scroll to section smoothly with delay for rendering
    setTimeout(() => {
      const element = document.getElementById(`category-section-${categoryName}`);
      if (element) {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    }, 300);
    return;
  }

  // Different category clicked - update selection
  setSelectedCategory(categoryName);
  setAnimationTrigger(prev => prev + 1);
  
  // ✅ Clear filter for the newly selected category to show all brands by default
  setFilterForCategory(categoryName, null);
  
  // ✅ Store clicked category for TopBrandsSection to pick up
  localStorage.setItem('highlightCategory', categoryName);
  
  // ✅ Scroll to section smoothly with delay for re-sorting
  setTimeout(() => {
    const element = document.getElementById(`category-section-${categoryName}`);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }, 300);
};

// ✅ Handle scrollbar drag
const handleScrollbarDrag = () => {
  setIsDraggingScrollbar(true);
  
  if (!filterScrollRef.current) return;
  
  const container = filterScrollRef.current;
  const scrollableWidth = container.scrollWidth - container.clientWidth;
  const trackElement = container.parentElement?.querySelector('[class*="absolute bottom-0"]') as HTMLElement;
  
  if (!trackElement) return;
  
  const moveHandler = (moveEvent: MouseEvent | TouchEvent) => {
    if (!filterScrollRef.current || !trackElement) return;
    
    const trackRect = trackElement.getBoundingClientRect();
    const clientX = moveEvent instanceof MouseEvent ? moveEvent.clientX : moveEvent.touches[0].clientX;
    const relativeX = clientX - trackRect.left;
    
    // Calculate percentage within track (0-100%)
    const percentage = Math.max(0, Math.min(100, (relativeX / trackRect.width) * 100));
    
    // Convert percentage to scroll position
    const newScrollLeft = (percentage / 100) * scrollableWidth;
    
    container.scrollLeft = newScrollLeft;
    setScrollProgress(percentage);
  };
  
  const endHandler = () => {
    setIsDraggingScrollbar(false);
    document.removeEventListener('mousemove', moveHandler);
    document.removeEventListener('touchmove', moveHandler);
    document.removeEventListener('mouseup', endHandler);
    document.removeEventListener('touchend', endHandler);
  };
  
  document.addEventListener('mousemove', moveHandler);
  document.addEventListener('touchmove', moveHandler);
  document.addEventListener('mouseup', endHandler);
  document.addEventListener('touchend', endHandler);
};

// ✅ Scrollbar hint animation - nudges scroll container to show more content
const triggerScrollHint = () => {
  const container = filterScrollRef.current;
  if (!container) return;
  
  // Micro motion - subtle nudge that ends with partial next chip visible
  // Scroll further right first (40px)
  container.scrollTo({
    left: 40,
    behavior: 'smooth',
  });
  
  // Settle back to 25px - shows partial next chip, indicating more content
  setTimeout(() => {
    container.scrollTo({
      left: 25,
      behavior: 'smooth',
    });
  }, 300);
};

// ✅ Trigger scroll hint when category is clicked (including same category)
useEffect(() => {
  if (animationTrigger > 0) {
    const hintTimeout = setTimeout(() => {
      triggerScrollHint();
    }, 250);
    return () => clearTimeout(hintTimeout);
  }
}, [animationTrigger]); // Only watch animationTrigger

// ✅ Trigger animation on initial page load if category is preselected
useEffect(() => {
  if (selectedCategory) {
    const initialTimeout = setTimeout(() => {
      setAnimationTrigger(1); // Trigger once on mount after delay
    }, 400);
    return () => clearTimeout(initialTimeout);
  }
}, []); // Empty deps - run only once on mount

// ✅ Track scroll position changes
useEffect(() => {
  const container = filterScrollRef.current;
  if (!container) return;
  
  // Create scroll handler that updates progress
  const scrollHandler = () => {
    const scrollLeft = container.scrollLeft;
    const scrollableWidth = container.scrollWidth - container.clientWidth;
    
    if (scrollableWidth <= 0) {
      setScrollProgress(0);
      return;
    }
    
    const progress = (scrollLeft / scrollableWidth) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };
  
  // Attach listener
  container.addEventListener('scroll', scrollHandler, { passive: true });
  
  // Initial calculation
  scrollHandler();
  
  // Cleanup
  return () => {
    container.removeEventListener('scroll', scrollHandler);
  };
}, [filterScrollRef]);


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
      <section className="pt-0 pb-2 sm:pb-3 lg:pb-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-2 sm:mb-3 text-gray-900">
                    Hot Deals by Category
                </h2> */}

          {/* Clean Minimal Category Cards */}
          <motion.div
            className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 scrollbar-hide"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            {categoriesData.map((category) => {
              const isPreSelected = preSelectedCategories.includes(category.name);
              const isDisabled = !viewAllMode && preSelectedCategories.length > 0 && !isPreSelected;
              const isActive = selectedCategory === category.name;
              const isHovered = hoveredCategory === category.name;
              const categoryType = CATEGORY_TYPE_MAP[category.name] || 'ecommerce';
              const moodAura = CATEGORY_MOOD_AURAS[category.name] || CATEGORY_MOOD_AURAS['E-Commerce'];

              return (
                <motion.button
                  key={category.name}
                  onClick={() => handleCategoryClick(category.name)}
                  onMouseEnter={() => setHoveredCategory(category.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                  disabled={isDisabled}
                  className="flex flex-col items-center gap-2 transition-all duration-300 focus:outline-none flex-shrink-0 group"
                  whileTap={{ scale: isDisabled ? 1 : 0.95 }}
                  whileHover={!isDisabled ? { scale: 1.03, y: -4 } : {}}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  {/* Premium Card with mood-driven aura */}
                  <div 
                    className={`w-[100px] h-[100px] rounded-2xl flex items-center justify-center transition-all duration-300 flex-shrink-0 relative ${
                    isActive
                      ? 'bg-white dark:bg-slate-900/60 border-2 border-purple-300 dark:border-purple-500/50 shadow-[0_4px_16px_rgba(0,0,0,0.08)] dark:shadow-purple-900/30'
                      : isDisabled
                      ? 'bg-gray-100 dark:bg-slate-800/40 border-2 border-gray-200 dark:border-slate-700/40 opacity-40'
                      : 'bg-white dark:bg-slate-800/40 border-2 border-gray-200/70 dark:border-slate-700/40 shadow-[0_4px_12px_rgba(0,0,0,0.06)] dark:shadow-black/20 group-hover:border-gray-300 dark:group-hover:border-slate-600 group-hover:shadow-[0_8px_20px_rgba(0,0,0,0.1)] dark:group-hover:shadow-black/40'
                    }`}
                    style={{
                      boxShadow: !isDisabled && isHovered 
                        ? `${moodAura.shadow}, 0 8px 20px rgba(0,0,0,0.1)` 
                        : !isDisabled && !isActive
                        ? `0 4px 12px rgba(0,0,0,0.06)`
                        : undefined
                    }}
                  >
                    {/* Mood-driven aura background glow */}
                    {!isDisabled && (
                      <div 
                        className="absolute inset-0 rounded-2xl transition-all duration-300 -z-10"
                        style={{
                          background: isHovered 
                            ? `radial-gradient(circle at center, ${moodAura.hoverGlow}, transparent 65%)`
                            : `radial-gradient(circle at center, ${moodAura.glow}, transparent 65%)`,
                          filter: isHovered ? 'blur(20px)' : 'blur(16px)',
                          opacity: 1,
                          transform: 'scale(1.3)',
                        }}
                      />
                    )}
                    
                    {/* Premium 3D Illustration Icon */}
                    <PremiumCategoryIcon 
                      type={categoryType}
                      id={category.name.toLowerCase().replace(/\s+/g, '-')}
                      isActive={isActive}
                      isHovered={isHovered && !isDisabled}
                    />
                  </div>
                  
                  {/* Category Label - Clean typography */}
                  <div className="text-center min-w-[100px] mt-2">
                    <p className={`text-xs font-bold tracking-wide leading-tight line-clamp-2 transition-colors duration-300 ${
                      isActive 
                        ? getCategoryTextColor(categoryType)
                        : isDisabled
                        ? 'text-gray-400 dark:text-slate-500'
                        : 'text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-slate-100'
                    }`}>
                      {category.name}
                    </p>
                  </div>
                </motion.button>
              );
            })}

          </motion.div>

          {/* View All Button - Clean styling */}
          <div className="flex justify-center gap-3 mt-5">
            {!viewAllMode && preSelectedCategories.length > 0 && (
              <motion.button
                onClick={() => {
                  setViewAllMode(true);
                  setPreSelectedCategories([]);
                  localStorage.removeItem("selectedCategories");
                }}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-sm shadow-purple-900/20 hover:shadow-md hover:shadow-purple-900/30 active:scale-95 whitespace-nowrap"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                View All Categories
              </motion.button>
            )}
            <motion.button
              onClick={handleTakeTourAgain}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-all duration-300 shadow-sm shadow-purple-900/20 hover:shadow-md hover:shadow-purple-900/30 active:scale-95 whitespace-nowrap"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Take a Tour Again
            </motion.button>
          </div>






          {/* Filter Tags - Enhanced Interactive Design */}
          <AnimatePresence mode="wait">
            {selectedCategory && (
              <motion.div
                key={selectedCategory}
                initial={{ opacity: 0, y: -15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="mt-3"
              >
                {/* Section Header */}
                <div className="flex items-center gap-2 mb-2 px-1">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                    Recommended For You
                  </h3>
                  <motion.div
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-purple-500"
                  >
                    →
                  </motion.div>
                </div>

                <div className="relative border border-purple-200/60 dark:border-purple-500/30 rounded-xl px-2.5 py-2.5 bg-gradient-to-br from-purple-50/80 via-white to-white dark:from-purple-950/20 dark:via-slate-800/20 dark:to-slate-800/20 shadow-sm overflow-hidden">
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-100/30 to-transparent dark:via-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  {/* Interactive Scrollbar Indicator - More Prominent */}
                  <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-b-lg overflow-hidden group">
                    {/* Scrollbar thumb */}
                    <motion.div
                      className={`h-full rounded-full transition-all duration-200 absolute left-0 top-0 ${
                        isDraggingScrollbar 
                          ? 'bg-purple-600 dark:bg-purple-400 shadow-lg' 
                          : 'bg-gradient-to-r from-purple-400 via-purple-500 to-purple-600 dark:from-purple-500 dark:via-purple-400 dark:to-purple-500 group-hover:shadow-md'
                      } cursor-grab active:cursor-grabbing`}
                      style={{
                        width: '20%',
                        minWidth: '30px',
                      }}
                      animate={{
                        left: `${(scrollProgress / 100) * 80}%`,
                      }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      onMouseDown={handleScrollbarDrag}
                      onTouchStart={handleScrollbarDrag}
                    />
                  </div>
                  
                  {/* Right-side gradient fade with scroll hint */}
                  <div 
                    className="absolute top-0 right-0 bottom-1 w-20 pointer-events-none z-10 bg-gradient-to-l from-purple-50/90 via-purple-50/60 to-transparent dark:from-slate-800/90 dark:via-slate-800/60 rounded-r-xl transition-opacity duration-300 flex items-center justify-end pr-2"
                    style={{
                      opacity: scrollProgress >= 95 ? 0 : 1
                    }}
                  >
                    <motion.div
                      animate={{ 
                        x: [0, 5, 0],
                        opacity: [0.6, 1, 0.6]
                      }}
                      transition={{ 
                        duration: 1.5, 
                        repeat: Infinity, 
                        ease: "easeInOut" 
                      }}
                      className="text-purple-500 dark:text-purple-400 text-lg font-bold"
                    >
                      ›
                    </motion.div>
                  </div>
                  
                  <div ref={filterScrollRef} className="flex items-center gap-2 overflow-x-auto scrollbar-hide scroll-smooth pr-20">
                    {[
                      { name: "Super Cashbacks", icon: Sparkles },
                      { name: "Today's Picks", icon: Star },
                      { name: "Under ₹500", icon: Tag },
                      { name: "Under ₹1,000", icon: Tag },
                      { name: "Premium Picks", icon: Award },
                      { name: "Nearby Stores", icon: MapPin }
                    ].map((filter, index) => {
                      const Icon = filter.icon;
                      // ✅ Check if this filter is active for the SELECTED category only
                      const isActive = selectedCategory ? getFilterForCategory(selectedCategory) === filter.name : false;

                      return (
                        <motion.button
                          key={filter.name}
                          onClick={() => {
                            if (selectedCategory) {
                              const currentFilter = getFilterForCategory(selectedCategory);
                              setFilterForCategory(
                                selectedCategory, 
                                currentFilter === filter.name ? null : filter.name
                              );
                            }
                          }}
                          className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-300 flex-shrink-0 border-2 flex items-center gap-1.5 relative z-20 overflow-hidden ${
                            isActive
                              ? 'border-purple-400 bg-gradient-to-br from-purple-500 to-purple-600 dark:from-purple-600 dark:to-purple-700 text-white shadow-lg shadow-purple-500/50'
                              : 'border-purple-200 dark:border-purple-700/50 bg-white dark:bg-slate-800/40 text-gray-700 dark:text-slate-300 hover:border-purple-300 dark:hover:border-purple-600/60 hover:bg-purple-50 dark:hover:bg-slate-700/50 hover:shadow-md hover:-translate-y-0.5'
                          }`}
                          style={
                            isActive
                              ? {
                                  transform: 'translateY(-2px) scale(1.05)'
                                }
                              : undefined
                          }
                          whileHover={
                            !isActive ? {
                              boxShadow: '0 4px 15px rgba(168, 85, 247, 0.3)'
                            } : undefined
                          }
                          whileTap={{ scale: 0.95 }}
                          initial={{ opacity: 0, scale: 0.8, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ delay: index * 0.05, type: "spring", stiffness: 300, damping: 20 }}
                        >
                          {/* Enhanced Icon with unique animations per filter type */}
                          <motion.div
                            whileHover={
                              !isActive
                                ? filter.name === "Super Cashbacks"
                                  ? { rotate: [0, 10, -10, 0], scale: 1.1 }
                                  : filter.name === "Today's Picks"
                                  ? { scale: 1.2, rotate: [0, 20, -20, 0] }
                                  : filter.name === "Premium Picks"
                                  ? { scale: 1.15, y: -2 }
                                  : filter.name === "Nearby Stores"
                                  ? { scale: 1.15, y: [-2, -4, -2] }
                                  : { scale: 1.15, rotate: [0, 5, -5, 0] }
                                : undefined
                            }
                            animate={
                              isActive
                                ? filter.name === "Super Cashbacks"
                                  ? { rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }
                                  : filter.name === "Today's Picks"
                                  ? { scale: [1, 1.15, 1], rotate: [0, 15, 0] }
                                  : filter.name === "Premium Picks"
                                  ? { scale: [1, 1.1, 1], y: [0, -2, 0] }
                                  : filter.name === "Nearby Stores"
                                  ? { scale: [1, 1.15, 1], y: [0, -3, 0] }
                                  : { scale: [1, 1.1, 1] }
                                : {}
                            }
                            transition={{
                              duration: isActive ? 0.8 : 0.3,
                              repeat: isActive ? Infinity : 0,
                              repeatDelay: 0.5
                            }}
                            className={`relative ${isActive ? 'drop-shadow-lg' : ''}`}
                          >
                            {/* Colorful background glow for active icons */}
                            {isActive && (
                              <>
                                <motion.div
                                  className="absolute inset-0 rounded-full blur-md"
                                  animate={{
                                    backgroundColor: [
                                      'rgba(255, 255, 255, 0.3)',
                                      'rgba(255, 255, 255, 0.6)',
                                      'rgba(255, 255, 255, 0.3)'
                                    ]
                                  }}
                                  transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                  }}
                                />
                                {/* Extra sparkle for Super Cashbacks */}
                                {filter.name === "Super Cashbacks" && (
                                  <>
                                    <motion.div
                                      className="absolute -top-1 -right-1 w-1.5 h-1.5 bg-yellow-300 rounded-full"
                                      animate={{
                                        scale: [0, 1.5, 0],
                                        opacity: [0, 1, 0]
                                      }}
                                      transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        repeatDelay: 0.3
                                      }}
                                    />
                                    <motion.div
                                      className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-yellow-300 rounded-full"
                                      animate={{
                                        scale: [0, 1.5, 0],
                                        opacity: [0, 1, 0]
                                      }}
                                      transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        delay: 0.6,
                                        repeatDelay: 0.3
                                      }}
                                    />
                                  </>
                                )}
                              </>
                            )}
                            <Icon 
                              className={`w-4 h-4 relative z-10 ${
                                isActive 
                                  ? 'text-white drop-shadow-md' 
                                  : 'text-purple-500 dark:text-purple-400'
                              }`} 
                            />
                          </motion.div>
                          
                          {filter.name}
                          
                          {/* Active indicator badge */}
                          {isActive && (
                            <motion.div
                              className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full border border-white shadow-lg"
                              initial={{ scale: 0 }}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                            />
                          )}
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

      {/* Layered Sticky Category Sections */}
      {categoriesData
        // Sort categories: selected category goes FIRST (lowest z-index, appears as first layer)
        .sort((a, b) => {
          if (a.name === selectedCategory) return -1;  // Selected goes to start
          if (b.name === selectedCategory) return 1;   // Selected goes to start
          return 0; // Keep others in original order
        })
        .map((category, sectionIndex, array) => {
          // ✅ Only apply filter if this is the SELECTED category, otherwise show all brands
          const categoryFilter = category.name === selectedCategory 
            ? getFilterForCategory(category.name) 
            : null;
          
          // If no filter selected, show all brands with discounts (up to 10)
          // If filter selected, apply filter logic
          let brandsForThisCategory;
          
          if (!categoryFilter) {
            // No filter: show all brands with discount, sorted by discount
            brandsForThisCategory = category.brands
              .filter((brand) => brand.Discount)
              .sort((a, b) => {
                const discountA = parseFloat(a.Discount?.replace('%', '') || '0');
                const discountB = parseFloat(b.Discount?.replace('%', '') || '0');
                return discountB - discountA;
              })
              .slice(0, 10);
          } else {
            // Filter selected: apply filter logic
            brandsForThisCategory = category.brands
              .filter((brand) => brand.Discount)
              .filter((brand) => {
                const discount = parseFloat(brand.Discount?.replace('%', '') || '0');
                const minPrice = brand.MinPrice || 0;

                if (categoryFilter === "Nearby Stores") {
                  return nearbyBrands?.some((nb: any) => 
                    (nb.BrandId || nb.brandId) === brand.BrandId
                  );
                }

                switch (categoryFilter) {
                  case "Super Cashbacks":
                    return discount > 0;
                  case "Today's Picks":
                    return discount >= 10 && discount <= 15;
                  case "Under ₹500":
                    return minPrice > 0 && minPrice <= 500;
                  case "Under ₹1,000":
                    return minPrice > 500 && minPrice <= 1000;
                  case "Premium Picks":
                    return minPrice > 1000;
                  default:
                    return true;
                }
              })
              .sort((a, b) => {
                const discountA = parseFloat(a.Discount?.replace('%', '') || '0');
                const discountB = parseFloat(b.Discount?.replace('%', '') || '0');
                return discountB - discountA;
              })
              .slice(0, 5);
          }

          const displayBrands = categoryFilter === "Nearby Stores" 
            ? (nearbyBrands || []) 
            : brandsForThisCategory;

          if (displayBrands.length === 0) return null;

          return (
            <LayeredCategorySection
              key={category.name}
              index={sectionIndex}
              isLast={sectionIndex === array.length - 1}
            >
              <AnimatePresence mode="wait">
                <motion.div
                  key={`deals-${category.name}`}
                  ref={(el) => {
                    if (el && category.name) {
                      sectionRefs.current[category.name] = el;
                    }
                  }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  id={`category-section-${category.name}`}
                  className="pt-0 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-24"
                >
                  {/* ✅ Loading State for Nearby Stores */}
                  {categoryFilter === "Nearby Stores" && isLoadingNearby && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">Finding nearby stores...</p>
                    </div>
                  )}

                  {/* ✅ Location Error */}
                  {categoryFilter === "Nearby Stores" && locationError && (
                    <div className="text-center py-4">
                      <p className="text-sm text-red-500">{locationError}</p>
                    </div>
                  )}

                  {/* ✅ No Results */}
                  {categoryFilter === "Nearby Stores" && !isLoadingNearby && !locationError && displayBrands.length === 0 && (
                    <div className="text-center py-4">
                      <p className="text-sm text-gray-500">No nearby stores found in this category</p>
                    </div>
                  )}

                  {/* ✅ Horizontal Scroll Container */}
                  {displayBrands.length > 0 && (
                    <div className="bg-white dark:bg-slate-800/20 border border-gray-200 dark:border-slate-700/40 rounded-xl p-3 relative">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-slate-300">
                          {!categoryFilter
                            ? `All Brands in ${category.name}`
                            : categoryFilter === "Super Cashbacks" 
                            ? "Top Deals" 
                            : categoryFilter === "Nearby Stores"
                            ? "Nearby Brands"
                            : categoryFilter} {categoryFilter ? `in ${category.name}` : ''}
                        </h3>
                        
                        {/* Close button - only shows if this is the selected category */}
                        {selectedCategory === category.name && (
                          <button
                            onClick={() => {
                              setSelectedCategory(null);
                              setFilterForCategory(category.name, null);
                            }}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-700/30 text-lg"
                            aria-label="Deselect category"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Right-side gradient fade overlay */}
                      <div className="absolute top-0 right-0 bottom-0 w-24 pointer-events-none z-10 bg-gradient-to-l from-white dark:from-slate-800/20 via-white/80 dark:via-slate-800/10 to-transparent" />

                      {/* ✅ Direct wrapper with flex flex-nowrap + overflow-x-auto */}
                      <div className="flex flex-nowrap gap-4 overflow-x-auto overflow-y-hidden scrollbar-hide scroll-smooth pb-2 -mx-3 px-3 snap-x snap-mandatory">
                        {displayBrands.map((brand: any, index) => {

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
                              className="relative z-20 flex-shrink-0 w-[170px] min-w-[170px] snap-start"
                            >
                              <Link
                                href={`/brands/${brandId}${categoryFilter === 'Nearby Stores' ? '?autoFindStores=true' : ''}`}
                                className="block h-full"
                              >

                                {/* Full Brand Card */}
                                <div className="bg-neutral-50/90 dark:bg-neutral-800/70 border border-neutral-300/40 dark:border-neutral-600/40 rounded-2xl p-3 h-full hover:-translate-y-1 hover:shadow-xl transition-all duration-300 relative">
                      
                                  {/* Cashback Badge */}
                                  {discount && parseFloat(discount) > 0 && (
                                    <div className="absolute top-2 right-2 z-10">
                                      <div className="bg-purple-600 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                                        ⭐ {parseFloat(discount).toFixed(1)}%
                                      </div>
                                    </div>
                                  )}

                                  <div className="flex flex-col items-center text-center space-y-2">
                                    {/* Brand Image */}
                                    <div className="w-20 h-20 flex items-center justify-center flex-shrink-0">
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

                                    {/* Brand Name */}
                                    <div className="min-h-[2.5rem] flex items-center justify-center w-full">
                                      <h3 className="font-bold text-xs text-neutral-900 dark:text-neutral-100 line-clamp-2">
                                        {brandName}
                                      </h3>
                                    </div>

                                    {/* Category Tag */}
                                    <div className="min-h-[1.5rem] flex items-center justify-center">
                                      <span className="text-[10px] px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded-full whitespace-nowrap">
                                        {category.name}
                                      </span>
                                    </div>

                                    {/* Distance (for nearby stores) */}
                                    {distanceKm !== undefined && (
                                      <p className="text-xs text-gray-500 dark:text-slate-400 text-center">
                                        📍 {distanceKm.toFixed(1)}km
                                      </p>
                                    )}

                                    {/* Quick Buy Button */}
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                      }}
                                      className="w-full mt-2 bg-primary text-white py-1.5 rounded-md font-semibold text-[10px] flex items-center justify-center gap-1 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
                                    >
                                      🛒 {buttonLabel}
                                    </button>
                                  </div>
                                </div>
                              </Link>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </LayeredCategorySection>
          );
        })}

    </>
  );
}
