import { Search, X, Play, Pause } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useBrands } from "@/hooks/useBrands";


// Import the animated GIF
import heroGif from "@/attached_assets/gift-cards-animated.mp4";

export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showVideo, setShowVideo] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setLocation] = useLocation();
  const { data: brands, isLoading } = useBrands();



  const handleSearch = () => {
    console.log("Search:", searchQuery);
  };

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
        setIsPlaying(false);
      } else {
        videoRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Map API brand names to display names
  const brandNameMapping: Record<string, string> = {
    "Amazon Prime Lite Edition-Giftbig": "Amazon",
    "Flipkart B2B SuperCoins Voucher": "Flipkart",
    "Reliance Digital": "Reliance",
    "Bigbasket E-Gift Card": "Bigbasket",
    "Skechers": "Skechers"
  };

  // Filter and map brands from API
  const trendingBrands = brands
    ?.filter(brand => brandNameMapping[brand.BrandName])
    .map(brand => ({
      ...brand,
      displayName: brandNameMapping[brand.BrandName]
    }))
    .slice(0, 5) || [];

  const handleBrandClick = (brandId: string) => {
    setLocation(`/brands/${brandId}`);
  };


  return (
    // FIXED: Responsive padding
    <section className="relative overflow-hidden py-8 sm:py-10 lg:py-12 bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
          {/* Left Content */}
          <div className="space-y-4 sm:space-y-5 lg:space-y-6">
            {/* FIXED: Responsive heading */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
              Gift Vouchers,
              <br />
              <span className="text-primary">Made Simple</span>
            </h1>

            {/* FIXED: Responsive description */}
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-md">
              Buy and redeem gift vouchers from top brands — instantly and securely and get guaranteed cashbacks. Both Online & Offline.
            </p>

            {/* 🔥 MOBILE SEARCH BAR (Animated) */}
            <div className="hidden">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 sm:h-5 w-4 sm:w-5 text-primary" />
                <Input
                  placeholder="Search brands, categories..."
                  className="
                    pl-10 sm:pl-12 h-10 sm:h-12 
                    text-sm
                    rounded-full border border-primary/40
                    hover:border-primary
                    focus:border-primary
                    focus:ring-2 focus:ring-primary/40
                    w-full
                    transition-all duration-300 ease-in-out
                  "
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Button
                className="rounded-full px-4 sm:px-6 lg:px-8 h-10 sm:h-12 text-sm"
                onClick={handleSearch}
              >
                Search
              </Button>
            </div>

            {/* POPULAR TAGS - FIXED: Responsive */}
            <div className="flex items-center gap-0.5">
              <span className="text-xs sm:text-sm font-semibold whitespace-nowrap">Trending:</span>

              {isLoading ? (
                // Loading skeleton
                [1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="h-5 sm:h-7 w-16 sm:w-20 bg-white/20 rounded-full animate-pulse"
                  />
                ))
              ) : (
                trendingBrands.map((brand) => (
                  <button
                    key={brand.BrandId}
                    onClick={() => handleBrandClick(brand.BrandId)}
                    className="rounded-full text-[10px] sm:text-xs h-5 sm:h-7 px-1.5 sm:px-3 whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  >
                    {brand.displayName}
                  </button>
                ))
              )}


            </div>
          </div>

          {/* VIDEO PLAYER - FIXED: Responsive sizing with mobile close button */}
          {showVideo && (
            <div className="relative flex justify-center lg:justify-end mt-6 md:mt-0">
              {/* Close button - ONLY on mobile */}
              <button
                onClick={() => setShowVideo(false)}
                className="absolute top-2 right-2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-1.5 transition-all md:hidden"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>



              {/* Video Container */}
              <div className="relative w-full max-w-sm lg:max-w-md rounded-2xl overflow-hidden group">

                {/* Text Overlay - Shows only when video is NOT playing */}
                {/* {!isPlaying && (
                <div className="absolute top-2 left-2 z-10">
                  <p className="text-black text-xs font-medium drop-shadow-sm">
                    Customer Journey Explained...
                  </p>
                </div>
              )} */}
                <video
                  ref={videoRef}
                  src={heroGif}
                  className="w-full h-auto object-cover"
                  loop
                  playsInline
                  onEnded={() => setIsPlaying(false)}
                />

                {/* Play/Pause Button Overlay - Shows on hover OR when paused */}
                <button
                  onClick={togglePlayPause}
                  className={`
      absolute inset-0 flex items-center justify-center 
      bg-black/30 transition-all
      ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}
    `}
                  aria-label={isPlaying ? "Pause video" : "Play video"}
                >
                  <div className="bg-white/90 hover:bg-white rounded-full p-4 transition-all group-hover:scale-110">
                    {isPlaying ? (
                      <Pause className="h-8 w-8 text-primary" />
                    ) : (
                      <Play className="h-8 w-8 text-primary ml-1" />
                    )}
                  </div>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
