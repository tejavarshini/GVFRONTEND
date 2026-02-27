import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Store, ShoppingCart } from "lucide-react";
import { useState, useEffect } from "react";
import type { Brand } from "@/types/brand";
import QuickBuyModal from "@/components/QuickBuyModal";

const FALLBACK = "/brand-placeholder.png";

interface BrandCardProps {
  brand: Brand;
}

async function validateImage(url: string): Promise<string> {
  try {
    // Create a promise that resolves when image loads or rejects on error
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject();
      img.src = url;

      // Timeout after 5 seconds
      setTimeout(() => reject(), 5000);
    });
  } catch {
    return FALLBACK;
  }
}

export default function BrandCard({ brand }: BrandCardProps) {
  const [imgSrc, setImgSrc] = useState(FALLBACK);
  const [isLoading, setIsLoading] = useState(true);
  const [showQuickBuy, setShowQuickBuy] = useState(false);


  const rawImage =
    brand.Images?.text ||
    brand.Images?.thumbnail ||
    brand.Images?.featured ||
    brand.Images?.base ||
    brand.Images?.mobile ||
    brand.Images?.small ||
    brand.Images?.raw ||
    null;

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      // Build the Gift360 CDN URL using BrandId
      const sabbpeUrl = `https://images.gift360.io/${brand.BrandId}.png`;

      if (!rawImage) {
        // No rawImage, try sabbpe URL directly
        console.log('No raw image, trying gift360 URL for:', brand.BrandName);
        try {
          const validatedUrl = await validateImage(sabbpeUrl);
          if (isMounted) {
            setImgSrc(validatedUrl);
            console.log('Gift360 image loaded for:', brand.BrandName);
          }
        } catch {
          console.error('Gift360 image also failed for:', brand.BrandName);
          if (isMounted) {
            setImgSrc(FALLBACK);
          }
        } finally {
          if (isMounted) {
            setIsLoading(false);
          }
        }
        return;
      }

      console.log('Loading image for brand:', brand.BrandName, 'URL:', rawImage);

      try {
        // Try the original image first
        const validatedUrl = await validateImage(rawImage);
        if (isMounted) {
          setImgSrc(validatedUrl);
          console.log('Image loaded successfully for:', brand.BrandName);
        }
      } catch (error) {
        console.error('Primary image failed for:', brand.BrandName, error);

        // Try sabbpe CDN as fallback
        console.log('Trying sabbpe fallback URL:', sabbpeUrl);
        try {
          const sabbpeValidated = await validateImage(sabbpeUrl);
          if (isMounted) {
            setImgSrc(sabbpeValidated);
            console.log('Sabbpe fallback loaded for:', brand.BrandName);
          }
        } catch (sabbpeError) {
          console.error('Sabbpe fallback also failed for:', brand.BrandName);
          if (isMounted) {
            setImgSrc(FALLBACK);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }


    loadImage();

    return () => {
      isMounted = false;
    };
  }, [rawImage, brand.BrandName, brand.BrandId]);

  return (
    <>
    <Link href={`/brands/${brand.BrandId}`}>
      <Card
        className="
        cursor-pointer rounded-2xl overflow-hidden h-full relative
        transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
        bg-neutral-50/90 dark:bg-neutral-800/70
        border border-neutral-300/40 dark:border-neutral-600/40 
      "
      >

        {/* FIXED: Responsive padding */}
        <CardContent className="p-2 sm:p-3 flex flex-col h-full">
          {/* Discount Badge - Top Right Corner */}
          {brand.Discount && parseFloat(brand.Discount) > 0 && (
            <div className="absolute top-2 right-2 z-10">
              <div className="bg-purple-600 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md shadow-lg flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                {parseFloat(brand.Discount).toFixed(1)}% Cashback
              </div>
            </div>
          )}

          <div className="flex flex-col items-center text-center space-y-2 flex-1">
            {/* FIXED: Responsive image container */}
            <div
              className="
    w-20 h-20 sm:w-24 sm:h-24
    overflow-hidden 
    flex items-center justify-center 
    flex-shrink-0
  "
            >

              {isLoading ? (
                <div className="animate-pulse bg-neutral-200 dark:bg-neutral-600 w-full h-full flex items-center justify-center">
                  <Store className="h-8 w-8 sm:h-10 sm:h-10 text-neutral-400" />
                </div>
              ) : imgSrc === FALLBACK ? (
                <img
                  src={FALLBACK}
                  alt={brand.BrandName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src={imgSrc}
                  alt={brand.BrandName}
                  className="w-full h-full object-contain"
                  onError={() => {
                    console.error('Image render error for:', brand.BrandName);
                    setImgSrc(FALLBACK);
                  }}
                />
              )}
            </div>

            {/* FIXED: Responsive brand name container */}
            <div className="min-h-[2.5rem] flex items-center justify-center">
              <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-neutral-100 line-clamp-2">
                {brand.BrandName}
              </h3>
            </div>

            {/* FIXED: Responsive category container */}
            <div className="min-h-[1.5rem] flex items-center justify-center">
              {brand.Category && (
                <span className="text-[10px] sm:text-xs px-2 py-0.5 bg-neutral-200 dark:bg-neutral-700 rounded-full whitespace-nowrap">
                  {brand.Category}
                </span>
              )}


            </div>
          </div>
                        {/* Quick Buy Button */}
<button
  onClick={(e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowQuickBuy(true);
  }}
  className="w-full mt-2 bg-primary text-white py-1.5 rounded-md font-semibold text-[10px] sm:text-xs flex items-center justify-center gap-1 hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-sm"
>

  <ShoppingCart className="h-3 w-3" />

  Quick Buy
</button>
        </CardContent>
      </Card>
    </Link>
  <QuickBuyModal
    brand={brand}
    isOpen={showQuickBuy}
    onClose={() => setShowQuickBuy(false)}
    brandImage={imgSrc}
  />
</>
);
}
