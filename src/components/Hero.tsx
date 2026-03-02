import { useState } from "react";
import { useLocation } from "wouter";
import { useBrands } from "@/hooks/useBrands";


export default function Hero() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, setLocation] = useLocation();
  const { data: brands, isLoading } = useBrands();



  const handleSearch = () => {
    console.log("Search:", searchQuery);
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
    <section className="relative overflow-hidden py-8 sm:py-10 lg:py-12 bg-transparent">
      <div className="w-full px-4 sm:px-6 lg:px-10 xl:px-16">
        <div className="flex flex-col gap-4 sm:gap-5">

          {/* Eyebrow badge */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700/50 text-purple-700 dark:text-purple-300 text-xs font-semibold tracking-wide">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              Trusted by 10,000+ happy gifters
            </span>
          </div>

          {/* Main headline */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight">
            India's{" "}
            <span className="text-primary">#1 Destination</span>
            <br />
            for Instant Gift Vouchers
          </h1>

          {/* Subheadline */}
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl">
            Shop from <span className="font-semibold text-foreground">374+ top brands</span> across 9 categories — get guaranteed cashbacks, instant delivery, and seamless redemption. Both Online & Offline.
          </p>

            {/* POPULAR TAGS */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-semibold whitespace-nowrap text-muted-foreground">Trending:</span>

              {isLoading ? (
                [1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-5 sm:h-7 w-16 sm:w-20 bg-muted rounded-full animate-pulse" />
                ))
              ) : (
                trendingBrands.map((brand) => (
                  <button
                    key={brand.BrandId}
                    onClick={() => handleBrandClick(brand.BrandId)}
                    className="rounded-full text-[10px] sm:text-xs h-5 sm:h-7 px-2 sm:px-3 whitespace-nowrap bg-purple-600 hover:bg-purple-700 text-white transition-colors"
                  >
                    {brand.displayName}
                  </button>
                ))
              )}
            </div>

        </div>
      </div>
    </section>
  );
}
