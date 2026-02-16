import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ArrowLeft, Sparkles, Search } from "lucide-react";
import { useBrands } from "@/hooks/useBrands";
import { getNearbyBrands } from "@/api/storesApi";
import type { NearbyBrandsRequest } from "@/types/store";

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
    `https://images.gift360.io/${brand.BrandId}.png`
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
  const addUserMessage = (content: string) => {
    setMessages((prev) => [
      ...prev,
      { type: "user", content, timestamp: new Date() },
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
              <div className="space-y-3">
                <p className="text-sm leading-relaxed">
                  👋 Welcome to <span className="font-semibold bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">Gift360 Vouchers</span>!
                </p>
                <p className="text-sm leading-relaxed">
                  This website deals with the <span className="font-semibold">best instantly available gift vouchers</span> for you to choose the best offers around you.
                </p>
                <p className="text-sm leading-relaxed">
                  I'll help you find the perfect voucher in just a few steps. Ready to begin?
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

  // Handle welcome response
  const handleWelcomeResponse = (proceed: boolean) => {
    if (proceed) {
      addUserMessage("Yes, let's proceed!");
      setStep("budget");
      addBotMessage(
        <div className="space-y-2">
          <p className="text-sm">Great! What's your tentative budget for the gift voucher?</p>
        </div>
      );
    } else {
      addUserMessage("No, I'll explore on my own");
      handleSkipToHome();
    }
  };

  // Handle budget selection
  const handleBudgetSelect = (budget: string) => {
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
    addUserMessage(`Selected: ${choices.categories.join(", ")}`);
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
        { image: '/icons/gaming.png', label: 'Gaming' },
        { image: '/icons/fashion.png', label: 'Fashion & Lifestyle' },
        { image: '/icons/ecommerce.png', label: 'E-Commerce' },
        { image: '/icons/food.png', label: 'Food & Beverages' },
        { image: '/icons/travel.png', label: 'Tour & Travel' },
        { image: '/icons/wellness.png', label: 'Wellness & Beauty' },
        { image: '/icons/jewellery.png', label: 'Jewellery' },
        { image: '/icons/entertainment.png', label: 'Entertainment' },
        { image: '/icons/sports.png', label: 'Sports & Footwears' },
      ];
    }
    const uniqueCategories = [...new Set(brands.map((brand) => brand.Category))].filter(Boolean);
    return uniqueCategories.map((category) => ({
      image: CATEGORY_ICONS[category] || '/icons/default.png',
      label: category,
    }));
  }, [brands]);

  const budgets = [
    { emoji: "💵", label: "Under ₹500" },
    { emoji: "💵💵", label: "₹500-1K" },
    { emoji: "💵💵💵", label: "₹1K-2.5K" },
    { emoji: "💵💵💵💵", label: "₹2.5K-5K" },
    { emoji: "💵💵💵💵💵", label: "₹5K+" },
    { emoji: "🤷", label: "Any Budget" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-purple-500/30 to-pink-500/30 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            rotate: [90, 0, 90],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-blue-500/30 to-purple-500/30 rounded-full blur-3xl"
        />
      </div>

      {/* Mobile Phone Frame */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative w-full max-w-md h-[90vh] bg-white rounded-[3rem] shadow-2xl border-[12px] border-gray-900 overflow-hidden flex flex-col z-10"
        style={{
          boxShadow: '0 0 80px rgba(168, 85, 247, 0.4), 0 0 40px rgba(236, 72, 153, 0.3)',
        }}
      >
        {/* Phone Notch */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="bg-gray-900 h-7 flex justify-center items-center relative"
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

        {/* Header */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, type: "spring", stiffness: 100 }}
          className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white shadow-lg relative overflow-hidden"
        >
          <motion.div
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
            className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
          />
          
          <div className="px-4 py-4 flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg"
              >
                <Sparkles className="w-6 h-6 text-white" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="text-base font-bold tracking-wide"
                >
                  Gift360 Assistant
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="flex items-center gap-1"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                  />
                  <p className="text-xs text-white/90 font-medium">Online</p>
                </motion.div>
              </div>
            </div>

            {step !== "welcome" && (
              <motion.button
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                whileHover={{ scale: 1.1, rotate: -10 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleGoBack}
                className="p-2.5 hover:bg-white/20 rounded-full transition-all backdrop-blur-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="bg-gradient-to-b from-white to-gray-50 border-b border-gray-100 px-4 py-3 shadow-sm"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="relative"
          >
            <input
              type="text"
              value={typingText}
              readOnly
              className="w-full px-4 py-2.5 pr-10 bg-white border-2 border-purple-200 rounded-full text-gray-700 text-sm outline-none shadow-inner"
              placeholder="Searching..."
            />
            <motion.div
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="absolute right-4 top-1/2 -translate-y-1/2"
            >
              <div className="w-1.5 h-4 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full shadow-lg shadow-purple-500/50"></div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white">
          <div className="px-4 py-4 space-y-3">
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
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.type === "user"
                        ? "bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 text-white rounded-br-md shadow-lg shadow-purple-500/30"
                        : "bg-white text-gray-900 shadow-md rounded-bl-md border border-gray-100"
                    }`}
                  >
                    {message.content}
                  </motion.div>
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
                <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-md px-5 py-3 shadow-md">
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

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, type: "spring", stiffness: 100 }}
          className="bg-white border-t-2 border-gray-100 shadow-2xl"
        >
          <div className="px-4 py-4">
            {/* Welcome Step */}
            {step === "welcome" && !isTyping && messages.length > 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex gap-3"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleWelcomeResponse(true)}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all text-sm relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  <span className="relative z-10">Let's Go! 🚀</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleWelcomeResponse(false)}
                  className="py-3.5 px-5 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all text-sm shadow-md"
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
                className="grid grid-cols-2 gap-2.5"
              >
                {budgets.map((budget, idx) => (
                  <motion.button
                    key={budget.label}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 260,
                      damping: 20,
                      delay: idx * 0.1
                    }}
                    whileHover={{ scale: 1.05, y: -3 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleBudgetSelect(budget.label)}
                    className="flex items-center justify-center gap-2 py-3.5 px-3 bg-white border-2 border-purple-200 hover:border-purple-500 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 rounded-xl transition-all group shadow-md hover:shadow-xl hover:shadow-purple-200/50"
                  >
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                      className="text-2xl"
                    >
                      {budget.emoji}
                    </motion.span>
                    <span className="text-xs font-bold text-gray-700 group-hover:text-purple-700">
                      {budget.label}
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Categories Step */}
            {step === "categories" && !isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-3"
              >
                <div className="grid grid-cols-2 gap-2.5 max-h-80 overflow-y-auto">
                  {apiCategories.map((category, idx) => {
                    const isSelected = choices.categories.includes(category.label);
                    return (
                      <motion.button
                        key={category.label}
                        initial={{ scale: 0, opacity: 0, rotateY: -180 }}
                        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 260,
                          damping: 20,
                          delay: idx * 0.05
                        }}
                        whileHover={{ scale: 1.08, y: -4 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleCategoryToggle(category.label)}
                        className={`flex flex-col items-center gap-2 py-3.5 px-2 rounded-2xl border-2 transition-all relative overflow-hidden ${
                          isSelected
                            ? "border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl shadow-purple-200/50"
                            : "border-gray-200 hover:border-purple-300 bg-white hover:shadow-lg"
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="absolute top-1 right-1"
                          >
                            <motion.div
                              animate={{ rotate: [0, 360] }}
                              transition={{ duration: 0.5 }}
                              className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg"
                            >
                              <span className="text-white text-sm font-bold">✓</span>
                            </motion.div>
                          </motion.div>
                        )}
                        <motion.div
                          animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.3 }}
                          className="w-14 h-14 flex items-center justify-center"
                        >
                          <img
                            src={category.image}
                            alt={category.label}
                            className="w-full h-full object-contain rounded-lg"
                            onError={(e) => {
                              e.currentTarget.src = '/icons/default.png';
                            }}
                          />
                        </motion.div>
                        <span className={`text-[10px] font-bold text-center leading-tight ${
                          isSelected ? "text-purple-700" : "text-gray-700"
                        }`}>
                          {category.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
                {choices.categories.length > 0 && (
                  <motion.button
                    initial={{ scale: 0, y: 50 }}
                    animate={{ scale: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleCategoriesContinue}
                    className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all flex items-center justify-center gap-2 text-sm relative overflow-hidden"
                  >
                    <motion.div
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                      className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                    />
                    <span className="relative z-10">Continue ({choices.categories.length})</span>
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

                {/* Skip Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBrandSkip}
                  className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all text-sm shadow-md"
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
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLocationResponse(true)}
                  className="flex-1 py-3.5 px-4 bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-purple-500/50 transition-all text-sm relative overflow-hidden"
                >
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
                    className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                  />
                  <span className="relative z-10">Yes, Nearby 📍</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleLocationResponse(false)}
                  className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 rounded-2xl font-semibold hover:bg-gray-200 transition-all text-sm shadow-md"
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
          className="bg-gray-900 h-14 flex justify-center items-center"
        >
          <motion.div
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            className="w-28 h-1.5 bg-gray-700 rounded-full cursor-pointer shadow-inner"
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
