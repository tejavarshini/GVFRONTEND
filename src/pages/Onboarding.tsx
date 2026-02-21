import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Sparkles, Search } from "lucide-react";
import { useBrands } from "@/hooks/useBrands";
import { getNearbyBrands } from "@/api/storesApi";
import type { NearbyBrandsRequest } from "@/types/store";
import PremiumCategoryIcon, { type CategoryType } from '@/components/PremiumCategoryIcon';
// Temporarily hidden - keep type for existing state logic
import type { GuideState } from '@/components/SabbieGuide';
// import { SabbieGuide } from '@/components/SabbieGuide';

const FALLBACK = "/brand-placeholder.png";

// Helper function to validate image
async function validateImage(url: string): Promise<string> {
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject();
      img.src = url;
      setTimeout(() => reject(), 5000);
    });
  } catch {
    return FALLBACK;
  }
}

// Helper to get brand image URL
const getBrandImageUrl = (brand: any) => {
  return (
    brand.Images?.text ||
    brand.Images?.thumbnail ||
    brand.Images?.featured ||
    brand.Images?.base ||
    brand.Images?.mobile ||
    brand.Images?.small ||
    brand.Images?.raw ||
    `https://images.sabbpe.com/${brand.BrandId}.png`
  );
};

// Category icon mapping
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

type ConversationStep =
  | "welcome"
  | "budget"
  | "categories"
  | "brand"
  | "location"
  | "loading-nearby"
  | "nearby-results"
  | "final";

interface Message {
  type: "bot" | "user";
  subtype?: "confirmation" | "action-suggestion"; // New subtypes for visual hierarchy
  content: string | React.ReactNode;
  timestamp: Date;
}

interface UserChoices {
  budget: string;
  categories: string[];
  brand: string;
  wantsNearby: boolean;
  nearbyCount?: number;
}

export default function Onboarding() {
  const [step, setStep] = useState<ConversationStep>("welcome");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [choices, setChoices] = useState<UserChoices>({
    budget: "",
    categories: [],
    brand: "",
    wantsNearby: false,
  });
  const [guideState, setGuideState] = useState<GuideState>("intro");
  const [lastInteractionTime, setLastInteractionTime] = useState(Date.now());
  const [brandImagesLoaded, setBrandImagesLoaded] = useState<Record<string, string>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingText, setTypingText] = useState("");

  const { data: brands } = useBrands();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Typing animation in search bar
  const keywords = [
    "Best gift vouchers near you...",
    "Instant delivery gift cards...",
    "Top brand vouchers...",
    "Exclusive offers for you...",
    "Perfect gifts instantly...",
  ];

  useEffect(() => {
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const typeEffect = setInterval(() => {
      const currentKeyword = keywords[currentIndex];

      if (!isDeleting) {
        setTypingText(currentKeyword.substring(0, charIndex + 1));
        charIndex++;

        if (charIndex === currentKeyword.length) {
          isDeleting = true;
          setTimeout(() => {}, 2000);
        }
      } else {
        setTypingText(currentKeyword.substring(0, charIndex - 1));
        charIndex--;

        if (charIndex === 0) {
          isDeleting = false;
          currentIndex = (currentIndex + 1) % keywords.length;
        }
      }
    }, isDeleting ? 50 : 100);

    return () => clearInterval(typeEffect);
  }, []);

  // Add bot message with typing effect
  const addBotMessage = (content: string | React.ReactNode, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { type: "bot", content, timestamp: new Date() },
      ]);
      setIsTyping(false);
    }, delay);
  };

  // Add user message
  const addUserMessage = (content: string, subtype?: "confirmation" | "action-suggestion") => {
    setMessages((prev) => [
      ...prev,
      { type: "user", content, timestamp: new Date(), subtype },
    ]);
  };

  // Initialize welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setIsTyping(true);
      setTimeout(() => {
        setMessages([
          {
            type: "bot",
            content: (
              <div className="space-y-1.5">
                <p className="text-[13px] leading-relaxed">
                  👋 Welcome to <span className="font-semibold text-purple-600">SabbPe Gift Vouchers</span>!
                </p>
                <p className="text-[13px] leading-relaxed text-gray-700">
                  Find the <span className="font-semibold text-purple-600">best instantly available gift vouchers</span> with top offers around you.
                </p>
                <p className="text-[13px] leading-relaxed font-medium text-gray-800">
                  I'll help you find the perfect voucher. Ready to begin?
                </p>
              </div>
            ),
            timestamp: new Date(),
          },
        ]);
        setIsTyping(false);
      }, 500);
    }
  }, [messages.length]);

  // Sabbie guide state transitions based on conversation step
  useEffect(() => {
    const transitionGuide = async () => {
      if (step === "welcome") {
        setGuideState("intro");
        // After intro animation, transition to idle
        setTimeout(() => setGuideState("idle"), 3000);
      } else if (step === "budget") {
        setGuideState("budgetGuide");
        // Return to idle after guiding
        setTimeout(() => setGuideState("idle"), 3000);
      } else if (step === "categories") {
        setGuideState("scrollHint");
        setTimeout(() => setGuideState("idle"), 4000);
      } else if (step === "brands") {
        setGuideState("thinking");
        setTimeout(() => setGuideState("idle"), 2000);
      }
    };
    transitionGuide();
  }, [step]);

  // Idle timer for skip hint
  useEffect(() => {
    const checkIdle = () => {
      const idleTime = Date.now() - lastInteractionTime;
      if (idleTime > 5000 && guideState === "idle" && step !== "welcome") {
        setGuideState("skipHint");
        setTimeout(() => setGuideState("idle"), 3000);
      }
    };

    const interval = setInterval(checkIdle, 1000);
    return () => clearInterval(interval);
  }, [lastInteractionTime, guideState, step]);

  // Track user interactions
  const trackInteraction = () => {
    setLastInteractionTime(Date.now());
  };

  // Handle welcome response
  const handleWelcomeResponse = (proceed: boolean) => {
    trackInteraction();
    if (proceed) {
      addUserMessage("Yes, let's proceed!");
      setStep("budget");
      addBotMessage(
        <div className="space-y-2">
          <p className="text-sm">Great! What's your tentative budget for the gift voucher?</p>
        </div>
      );
      setGuideState("budgetGuide");
    } else {
      addUserMessage("No, I'll explore on my own");
      setGuideState("complete");
      handleSkipToHome();
    }
  };

  // Handle budget selection
  const handleBudgetSelect = (budget: string) => {
    trackInteraction();
    setGuideState("confirm");
    addUserMessage(budget);
    setChoices({ ...choices, budget });
    setStep("categories");
    addBotMessage(
      <div className="space-y-2">
        <p className="text-sm">Perfect! Now, what categories are you interested in?</p>
        <p className="text-xs text-gray-600">You can select multiple categories.</p>
      </div>
    );
  };

  // Handle category selection
  const handleCategoryToggle = (category: string) => {
    trackInteraction();
    setChoices((prev) => {
      const isSelected = prev.categories.includes(category);
      return {
        ...prev,
        categories: isSelected
          ? prev.categories.filter((c) => c !== category)
          : [...prev.categories, category],
      };
    });
  };

  const handleCategoriesContinue = () => {
    trackInteraction();
    setGuideState("thinking");
    addUserMessage(`Selected: ${choices.categories.join(", ")}`, "confirmation");
    setStep("brand");
    addBotMessage(
      <div className="space-y-2">
        <p className="text-sm">Excellent choice! 🎯</p>
        <p className="text-sm">
          Do you have any <span className="font-semibold">specific brand</span> in mind?
        </p>
        <p className="text-xs text-gray-600">Search for brands or press Skip to continue.</p>
      </div>
    );
  };

  // Handle brand search and selection
  const filteredBrands = useMemo(() => {
    if (!brands || !searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return brands
      .filter(brand => brand.BrandName.toLowerCase().includes(query))
      .slice(0, 6);
  }, [brands, searchQuery]);

  // Load brand images
  useEffect(() => {
    filteredBrands.forEach(async (brand) => {
      if (!brandImagesLoaded[brand.BrandId]) {
        const sabbpeUrl = `https://images.sabbpe.com/${brand.BrandId}.png`;
        const rawImage = getBrandImageUrl(brand);

        try {
          const validatedUrl = await validateImage(rawImage || sabbpeUrl);
          setBrandImagesLoaded(prev => ({
            ...prev,
            [brand.BrandId]: validatedUrl
          }));
        } catch {
          try {
            const fallbackUrl = await validateImage(sabbpeUrl);
            setBrandImagesLoaded(prev => ({
              ...prev,
              [brand.BrandId]: fallbackUrl
            }));
          } catch {
            setBrandImagesLoaded(prev => ({
              ...prev,
              [brand.BrandId]: FALLBACK
            }));
          }
        }
      }
    });
  }, [filteredBrands, brandImagesLoaded]);

  const handleBrandSelect = (brandId: string, brandName: string) => {
    // Store choices
    localStorage.setItem("onboardingComplete", "true");
    localStorage.setItem("giftChoices", JSON.stringify({ ...choices, brand: brandName }));
    
    // Navigate to brands page with selected brand
    window.location.href = `/brands/${brandId}`;
  };

  const handleBrandSkip = () => {
    addUserMessage("No specific brand");
    setChoices({ ...choices, brand: "Any Brand" });
    setStep("location");
    addBotMessage(
      <div className="space-y-2">
        <p className="text-sm">Got it! 👍</p>
        <p className="text-sm">
          Are you looking for offers <span className="font-semibold">near you</span>? You can buy here and redeem at nearby stores.
        </p>
      </div>
    );
  };

  // Handle location preference
  const handleLocationResponse = async (wantsNearby: boolean) => {
    setChoices({ ...choices, wantsNearby });

    if (wantsNearby) {
      addUserMessage("Yes, show me nearby offers");
      setStep("loading-nearby");
      addBotMessage("🔍 Finding stores near you...", 500);

      // Get user location
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };

            try {
              let totalCount = 0;

              for (const category of choices.categories) {
                const request: NearbyBrandsRequest = {
                  lat: location.lat,
                  lng: location.lng,
                  category: category,
                };

                const nearbyBrands = await getNearbyBrands(request);
                totalCount += nearbyBrands.length;
              }

              setChoices((prev) => ({ ...prev, nearbyCount: totalCount }));
              setStep("nearby-results");
              addBotMessage(
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-4xl mb-2">🎉</p>
                    <p className="text-xl font-bold text-gray-900">
                      Found {totalCount} {totalCount === 1 ? "store" : "stores"} near you!
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Based on your selected categories
                    </p>
                  </div>
                </div>,
                800
              );
            } catch (error) {
              console.error("Error fetching nearby stores:", error);
              setChoices((prev) => ({ ...prev, nearbyCount: 0 }));
              setStep("nearby-results");
              addBotMessage(
                "Sorry, I couldn't find stores nearby right now. Let me show you the best available offers instead.",
                800
              );
            }
          },
          (error) => {
            console.error("Geolocation error:", error);
            addBotMessage(
              "I need location access to find nearby stores. Let me show you all available offers instead.",
              800
            );
            setTimeout(() => handleProceedToHome(), 2000);
          }
        );
      }
    } else {
      addUserMessage("No, show me all offers");
      setStep("final");
      addBotMessage(
        "Perfect! Let me show you the best offers available based on your preferences. 🎁",
        800
      );
      setTimeout(() => handleProceedToHome(), 1500);
    }
  };

  // Handle view nearby stores
  const handleViewNearbyStores = () => {
    addUserMessage("Show me these offers!");
    localStorage.setItem("onboardingComplete", "true");
    localStorage.setItem("giftChoices", JSON.stringify(choices));
    localStorage.setItem("selectedCategories", JSON.stringify(choices.categories));
    localStorage.setItem("surpriseMeActive", "true");
    if (choices.categories.length > 0) {
      localStorage.setItem("surpriseMeCategory", choices.categories[0]);
    }
    
    window.location.reload();
  };

  // Handle proceed to home
  const handleProceedToHome = () => {
    localStorage.setItem("onboardingComplete", "true");
    localStorage.setItem("giftChoices", JSON.stringify(choices));
    localStorage.setItem("selectedCategories", JSON.stringify(choices.categories));
    
    window.location.reload();
  };

  // Handle skip to home
  const handleSkipToHome = () => {
    localStorage.setItem("onboardingComplete", "true");
    localStorage.setItem("giftChoices", JSON.stringify({
      budget: "",
      categories: [],
      brand: "",
      wantsNearby: false,
    }));
    
    window.location.reload();
  };

  // Handle go back
  const handleGoBack = () => {
    setMessages((prev) => prev.slice(0, -2));

    switch (step) {
      case "budget":
        setStep("welcome");
        break;
      case "categories":
        setStep("budget");
        setChoices({ ...choices, budget: "" });
        break;
      case "brand":
        setStep("categories");
        setChoices({ ...choices, categories: [] });
        setSearchQuery("");
        break;
      case "location":
        setStep("brand");
        setChoices({ ...choices, brand: "" });
        break;
      case "nearby-results":
      case "final":
        setStep("location");
        setChoices({ ...choices, wantsNearby: false, nearbyCount: undefined });
        break;
    }
  };

  // Get categories from API
  const apiCategories = useMemo(() => {
    if (!brands || !Array.isArray(brands) || brands.length === 0) {
      return [
        { image: '/icons/gaming.png', label: 'Gaming', type: 'gaming' as CategoryType },
        { image: '/icons/fashion.png', label: 'Fashion & Lifestyle', type: 'fashion' as CategoryType },
        { image: '/icons/ecommerce.png', label: 'E-Commerce', type: 'ecommerce' as CategoryType },
        { image: '/icons/food.png', label: 'Food & Beverages', type: 'food' as CategoryType },
        { image: '/icons/travel.png', label: 'Tour & Travel', type: 'travel' as CategoryType },
        { image: '/icons/wellness.png', label: 'Wellness & Beauty', type: 'wellness' as CategoryType },
        { image: '/icons/jewellery.png', label: 'Jewellery', type: 'jewellery' as CategoryType },
        { image: '/icons/entertainment.png', label: 'Entertainment', type: 'entertainment' as CategoryType },
        { image: '/icons/sports.png', label: 'Sports & Footwears', type: 'sports' as CategoryType },
      ];
    }
    const uniqueCategories = [...new Set(brands.map((brand) => brand.Category))].filter(Boolean);
    return uniqueCategories.map((category) => ({
      image: CATEGORY_ICONS[category] || '/icons/default.png',
      label: category,
      type: CATEGORY_TYPE_MAP[category] || 'food' as CategoryType,
    }));
  }, [brands]);

const budgets = [
  { label: 'Under ₹500' },
  { label: '₹500-1K' },
  { label: '₹1K-2.5K' },
  { label: '₹2.5K-5K' },
  { label: '5K+' },
  { label: 'Any Budget' },
];

  // Get progress indicator text
  const getProgressText = () => {
    switch (step) {
      case 'welcome':
        return 'Step 1 of 5 • Welcome';
      case 'budget':
        return 'Step 2 of 5 • Budget';
      case 'categories':
        return 'Step 3 of 5 • Categories';
      case 'brand':
        return 'Step 4 of 5 • Brand';
      case 'location':
      case 'loading-nearby':
      case 'nearby-results':
        return 'Step 5 of 5 • Location';
      default:
        return '';
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-fuchsia-900 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Enhanced Vibrant Mesh Gradient Background */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Sparkle Particles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut"
            }}
          />
        ))}
        
        {/* Larger Sparkles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={`large-${i}`}
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            <motion.div
              animate={{
                opacity: [0, 0.8, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 4,
                ease: "easeInOut"
              }}
            >
              <Sparkles className="w-3 h-3 text-white" />
            </motion.div>
          </motion.div>
        ))}
        
        {/* Primary Purple Blob */}
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            x: [0, 50, 0],
            y: [0, -30, 0],
            rotate: [0, 120, 0],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-1/3 -left-1/3 w-[120%] h-[120%] bg-gradient-to-br from-purple-600/50 via-purple-500/40 to-transparent rounded-full blur-[100px]"
        />
        
        {/* Pink Blob */}
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            x: [0, -60, 0],
            y: [0, 40, 0],
            rotate: [90, 0, 90],
            opacity: [0.6, 0.4, 0.6],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-1/3 -right-1/3 w-[120%] h-[120%] bg-gradient-to-tl from-pink-600/60 via-fuchsia-500/50 to-transparent rounded-full blur-[100px]"
        />
        
        {/* Blue Accent Blob */}
        <motion.div
          animate={{
            scale: [1, 1.4, 1],
            x: [0, -40, 0],
            y: [0, 50, 0],
            rotate: [45, 225, 45],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/4 w-[100%] h-[100%] bg-gradient-to-r from-blue-500/40 via-cyan-500/30 to-transparent rounded-full blur-[120px]"
        />
        
        {/* Magenta Accent Blob */}
        <motion.div
          animate={{
            scale: [1.1, 1, 1.1],
            x: [0, 30, 0],
            y: [0, -60, 0],
            rotate: [180, 360, 180],
            opacity: [0.4, 0.6, 0.4],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-1/3 right-1/4 w-[100%] h-[100%] bg-gradient-to-l from-fuchsia-600/50 via-pink-600/40 to-transparent rounded-full blur-[100px]"
        />
      </div>

      {/* Mobile Phone Frame with Enhanced Glow */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md h-[100dvh] rounded-[3rem] shadow-2xl overflow-visible flex flex-col z-10 backdrop-blur-xl bg-white"
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 0 120px rgba(168, 85, 247, 0.8), 0 0 80px rgba(236, 72, 153, 0.6), 0 8px 40px rgba(0, 0, 0, 0.4)',
          border: '14px solid rgba(30, 20, 50, 0.9)',
          borderRadius: '3rem',
        }}
      >
        {/* Phone Notch */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="shrink-0 bg-gray-900 h-7 flex justify-center items-center relative"
        >
          <div className="w-36 h-5 bg-black rounded-full flex items-center justify-between px-3">
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
            />
            <div className="w-12 h-1 bg-gray-800 rounded-full" />
          </div>
        </motion.div>

        {/* Header with Animated Gradient */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 100 }}
          className="shrink-0 bg-gradient-to-r from-purple-500 via-purple-400 to-pink-400 text-white shadow-lg relative overflow-hidden"
        >
          {/* Animated gradient layer */}
          <motion.div
            animate={{ 
              x: ['0%', '100%', '0%'],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute inset-0 bg-gradient-to-r from-purple-400/30 via-pink-400/30 to-purple-400/30"
          />
          {/* Shimmer effect */}
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          />
          
          <div className="px-4 pt-3 pb-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3 flex-1">
              <motion.div
                animate={{ 
                  rotate: 360,
                  y: [0, -3, 0]
                }}
                transition={{ 
                  rotate: { duration: 20, repeat: Infinity, ease: "linear" },
                  y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
                }}
                className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div className="flex-1">
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-base font-bold tracking-wide"
                >
                  SabbPe Assistant
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-2 mt-1"
                >
                  <div className="flex items-center gap-1">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.3, 1],
                        opacity: [1, 0.7, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/80"
                    />
                    <p className="text-xs text-white/90 font-medium">Online</p>
                  </div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 }}
                    className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 text-white backdrop-blur-sm"
                  >
                    {getProgressText()}
                  </motion.div>
                </motion.div>
              </div>
            </div>

            {step !== "welcome" && (
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleGoBack}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition-colors flex items-center justify-center shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Search Bar - Overlapping with slight negative margin */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="shrink-0 bg-gradient-to-b from-white to-gray-50 px-4 py-2 mt-[-14px] relative z-10 shadow-lg border border-white/40 backdrop-blur-md"
        >
          <motion.div
            whileHover={{ scale: 1.01 }}
            className="relative"
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <input
              type="text"
              value={typingText}
              readOnly
              className="w-full pl-11 pr-10 py-2.5 bg-white border-2 border-purple-200 rounded-full text-gray-700 text-sm outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
              placeholder="Searching..."
            />
            <motion.div
              animate={{ opacity: [0.7, 0.3, 0.7] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <div className="w-1.5 h-4 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Chat Messages - Scrollable Area */}
        <div className="flex-1 overflow-y-auto flex flex-col justify-end bg-gradient-to-b from-white to-purple-50/40" style={{
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}>
          <div className="px-4 py-4 space-y-5 pb-6">
            <AnimatePresence mode="popLayout">
              {messages.map((message, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 50, scale: 0.3 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                    delay: index * 0.1
                  }}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className="flex flex-col gap-1 max-w-[92%]">
                    {/* Action Suggestion Label */}
                    {message.type === "bot" && message.subtype === "action-suggestion" && (
                      <p className="text-[10px] text-gray-400 uppercase tracking-wide px-1">
                        Assistant Suggestion
                      </p>
                    )}
                    
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: index * 0.05 }}
                      whileHover={{ scale: message.subtype !== "confirmation" ? 1.01 : 1 }}
                      className={
                        message.subtype === "confirmation"
                          ? "bg-purple-500/10 text-purple-700 rounded-full px-3 py-1 text-xs inline-flex items-center gap-1 font-medium"
                          : message.type === "user"
                          ? "rounded-2xl px-4 py-3 text-sm leading-relaxed bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                          : "rounded-2xl bg-white shadow-[0_10px_25px_rgba(0,0,0,0.06)] px-4 py-3"
                      }
                    >
                      {message.type === "bot" && !message.subtype ? (
                        <div className="space-y-1.5">
                          {message.content}
                        </div>
                      ) : (
                        message.content
                      )}
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ type: "spring", stiffness: 400 }}
                className="flex justify-start"
              >
                <div className="bg-white/80 backdrop-blur-md border border-gray-100 rounded-2xl rounded-bl-md px-4 py-2.5 shadow-md max-w-[92%]">
                  <div className="flex gap-1.5">
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
                      className="w-2.5 h-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg shadow-purple-300/50"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                      className="w-2.5 h-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg shadow-purple-300/50"
                    />
                    <motion.div
                      animate={{ y: [0, -8, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut", delay: 0.4 }}
                      className="w-2.5 h-2.5 bg-gradient-to-br from-purple-400 to-purple-600 rounded-full shadow-lg shadow-purple-300/50"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Action Buttons - Sticky Footer */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
          className="shrink-0 sticky bottom-0 bg-white border-t-2 border-gray-100 px-4 py-3 safe-area-bottom"
          style={{
            boxShadow: '0 -4px 12px rgba(0, 0, 0, 0.08)',
          }}
        >
          <div>
            {/* Welcome Step */}
            {step === "welcome" && !isTyping && messages.length > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col items-stretch gap-2.5"
              >
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleWelcomeResponse(true)}
                  className="w-full px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold text-sm shadow-md relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  <span className="relative z-10">Yes, let's proceed! 🚀</span>
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleWelcomeResponse(false)}
                  className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm transition-all"
                >
                  Skip
                </motion.button>
              </motion.div>
            )}

            {/* Budget Step */}
            {step === "budget" && !isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-3"
              >
                {budgets.map((budget, idx) => {
                  const isSelected = choices.budget === budget.label;
                  return (
                  <motion.button
                    key={budget.label}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ 
                      scale: [1, 1.02, 1],
                      opacity: 1
                    }}
                    transition={{
                      scale: {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: idx * 0.2
                      },
                      opacity: { duration: 0.3, delay: idx * 0.05 }
                    }}
                    whileHover={{ scale: 1.04, y: -2 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => handleBudgetSelect(budget.label)}
                    className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl border relative overflow-hidden group transition-all duration-200 ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-500 via-purple-400 to-pink-400 text-white border-transparent shadow-md'
                        : 'bg-white border-purple-200 shadow-sm hover:bg-gradient-to-br hover:from-purple-600 hover:via-purple-500 hover:to-pink-500 hover:border-transparent hover:text-white'
                    }`}
                  >
                    <span className={`text-xs font-bold relative z-10 ${
                      isSelected ? 'text-white' : 'text-gray-800'
                    }`}>
                      {budget.label}
                    </span>
                  </motion.button>
                  );
                })}
              </motion.div>
            )}

            {/* Categories Step - Clean Minimal Design */}
            {step === "categories" && !isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <motion.div 
                  className="grid grid-cols-3 gap-3 max-h-80 overflow-y-auto pr-2"
                  animate={guideState === "scrollHint" ? {
                    x: [-6, 0],
                  } : {}}
                  transition={{
                    duration: 1.8,
                    repeat: guideState === "scrollHint" ? Infinity : 0,
                    ease: "easeInOut"
                  }}
                >
                  {apiCategories.map((category, idx) => {
                    const isSelected = choices.categories.includes(category.label);
                    const isFirstRow = idx < 3; // First row categories
                    
                    // Category-specific background colors
                    const categoryBgMap: Record<string, string> = {
                      "Food": "bg-orange-50",
                      "E-Commerce": "bg-blue-50",
                      "Fashion": "bg-pink-50",
                      "Travel": "bg-sky-50",
                      "Gaming": "bg-violet-50",
                      "Wellness": "bg-rose-50",
                      "Jewellery": "bg-amber-50",
                      "Sports": "bg-emerald-50",
                      "Entertainment": "bg-purple-50"
                    };
                    const categoryBg = categoryBgMap[category.label] || "bg-gray-50";
                    
                    return (
                      <motion.button
                        key={category.label}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ 
                          scale: 1, 
                          opacity: 1,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                          delay: idx * 0.04
                        }}
                        whileHover={{ scale: 1.03, y: -3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCategoryToggle(category.label)}
                        className={`flex flex-col items-center gap-1.5 group ${
                          isFirstRow && step === "categories" && choices.categories.length === 0
                            ? "animate-[pulse_2s_ease-in-out_infinite]"
                            : ""
                        }`}
                      >
                        {/* Clean Category Card with colored background */}
                        <div className={`relative w-[72px] h-[72px] rounded-xl flex items-center justify-center transition-all duration-200 overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-br from-purple-500 via-purple-400 to-pink-400 ring-2 ring-purple-400 shadow-md scale-[1.04]'
                            : `${categoryBg} border border-gray-200/50 shadow-sm group-hover:shadow-md group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:via-purple-500 group-hover:to-pink-500`
                        }`}>
                          {/* Icon - smaller container */}
                          <div className={`w-10 h-10 relative z-10 [&_svg]:transition-colors ${
                            isSelected ? '[&_svg]:!text-white' : '[&_svg]:group-hover:!text-white'
                          }`}>
                            <PremiumCategoryIcon
                              type={category.type}
                              isActive={isSelected}
                              isHovered={false}
                            />
                          </div>
                          
                          {/* Selected checkmark */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center shadow-md z-20"
                            >
                              <span className="text-purple-700 text-[10px] font-bold">✓</span>
                            </motion.div>
                          )}
                        </div>
                        
                        {/* Category Label */}
                        <span className={`text-[10px] font-medium text-center leading-tight h-5 w-[72px] transition-colors ${
                          isSelected
                            ? 'text-white font-semibold'
                            : 'text-gray-700 group-hover:text-white'
                        }`}>
                          {category.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </motion.div>
                {choices.categories.length > 0 && (
                  <motion.button
                    initial={{ scale: 0, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleCategoriesContinue}
                    className="w-full py-2.5 px-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-md flex items-center justify-center gap-2 text-sm"
                  >
                    <span>Continue ({choices.categories.length})</span>
                    <motion.div
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Send className="w-4 h-4" />
                    </motion.div>
                  </motion.button>
                )}
              </motion.div>
            )}

            {/* Brand Step */}
            {step === "brand" && !isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                {/* Helper Text */}
                <p className="text-xs text-gray-600 flex items-center gap-1.5 px-1">
                  <Search className="w-3.5 h-3.5" />
                  <span>You can search OR skip.</span>
                </p>

                {/* Search Input */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search brands..."
                    className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-purple-500 transition-all"
                  />
                </div>

                {/* Brand Results */}
                {searchQuery.trim() && filteredBrands.length > 0 && (
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {filteredBrands.map((brand, idx) => (
                      <motion.button
                        key={brand.BrandId}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleBrandSelect(brand.BrandId, brand.BrandName)}
                        className="flex flex-col items-center gap-2 p-3 rounded-xl border-2 border-gray-200 hover:border-purple-500 hover:bg-purple-50 transition-all bg-white shadow-md"
                      >
                        <div className="w-12 h-12 flex items-center justify-center overflow-hidden rounded-lg bg-white">
                          {!brandImagesLoaded[brand.BrandId] ? (
                            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
                          ) : brandImagesLoaded[brand.BrandId] === FALLBACK ? (
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                              {brand.BrandName.charAt(0)}
                            </div>
                          ) : (
                            <img
                              src={brandImagesLoaded[brand.BrandId]}
                              alt={brand.BrandName}
                              className="w-full h-full object-contain"
                            />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-gray-700 text-center line-clamp-2">
                          {brand.BrandName}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                )}

                {/* Skip Button - Now below search field */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBrandSkip}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all text-sm"
                >
                  Skip →
                </motion.button>
              </motion.div>
            )}

            {/* Location Step */}
            {step === "location" && !isTyping && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex gap-3"
              >
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLocationResponse(true)}
                  className="flex-1 py-3.5 px-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-md text-sm relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1.5 }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  <span className="relative z-10">Yes, Nearby 📍</span>
                </motion.button>
                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleLocationResponse(false)}
                  className="flex-1 py-3.5 px-4 bg-white text-gray-700 rounded-xl font-semibold transition-all text-sm border border-purple-200 hover:bg-purple-50"
                >
                  Show All
                </motion.button>
              </motion.div>
            )}

            {/* Nearby Results Step */}
            {step === "nearby-results" && !isTyping && (
              <motion.button
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleViewNearbyStores}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2 text-sm relative overflow-hidden"
              >
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />
                <span className="relative z-10">View Offers 🎁</span>
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Phone Home Button */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="shrink-0 bg-gray-900 h-12 flex justify-center items-center"
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="w-28 h-1.5 bg-gray-700 rounded-full cursor-pointer shadow-inner"
          />
        </motion.div>

        {/* Sabbie Animated Guide - Inside Phone Frame */}
        {/* Temporarily hidden */}
        {/* <SabbieGuide guideState={guideState} /> */}
      </motion.div>
    </div>
  );
}
