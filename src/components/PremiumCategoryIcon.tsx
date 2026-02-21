import { motion } from 'framer-motion';
import {
  Gamepad2,
  UtensilsCrossed,
  ShoppingBag,
  Shirt,
  PlaneTakeoff,
  Joystick,
  Sparkles,
  Gem,
  Dumbbell,
  type LucideIcon
} from 'lucide-react';
import { useGuide } from '@/contexts/GuideContext';

export type CategoryType = 
  | 'food' 
  | 'ecommerce' 
  | 'fashion' 
  | 'travel' 
  | 'gaming' 
  | 'wellness' 
  | 'jewellery' 
  | 'entertainment' 
  | 'sports';

interface PremiumCategoryIconProps {
  type: CategoryType;
  id?: string;
  isActive?: boolean;
  isHovered?: boolean;
  isGuided?: boolean; // Optional override
}

// Map category types to Lucide icons
const iconMap: Record<CategoryType, LucideIcon> = {
  entertainment: Gamepad2,
  food: UtensilsCrossed,
  ecommerce: ShoppingBag,
  fashion: Shirt,
  travel: PlaneTakeoff,
  gaming: Joystick,
  wellness: Sparkles,
  jewellery: Gem,
  sports: Dumbbell
};

// Category-specific color themes
const colorConfig: Record<CategoryType, {
  bg: string;
  bgGuided: string;
  text: string;
  shadowGuided: string;
}> = {
  food: {
    bg: 'bg-orange-100/70',
    bgGuided: 'bg-orange-200/80',
    text: 'text-orange-600',
    shadowGuided: 'shadow-[0_0_22px_rgba(249,115,22,0.45)]'
  },
  ecommerce: {
    bg: 'bg-blue-100/70',
    bgGuided: 'bg-blue-200/80',
    text: 'text-blue-600',
    shadowGuided: 'shadow-[0_0_22px_rgba(59,130,246,0.45)]'
  },
  fashion: {
    bg: 'bg-pink-100/70',
    bgGuided: 'bg-pink-200/80',
    text: 'text-pink-600',
    shadowGuided: 'shadow-[0_0_22px_rgba(236,72,153,0.45)]'
  },
  travel: {
    bg: 'bg-sky-100/70',
    bgGuided: 'bg-sky-200/80',
    text: 'text-sky-600',
    shadowGuided: 'shadow-[0_0_22px_rgba(14,165,233,0.45)]'
  },
  gaming: {
    bg: 'bg-violet-100/70',
    bgGuided: 'bg-violet-200/80',
    text: 'text-violet-600',
    shadowGuided: 'shadow-[0_0_22px_rgba(139,92,246,0.45)]'
  },
  wellness: {
    bg: 'bg-rose-100/70',
    bgGuided: 'bg-rose-200/80',
    text: 'text-rose-600',
    shadowGuided: 'shadow-[0_0_22px_rgba(244,63,94,0.45)]'
  },
  jewellery: {
    bg: 'bg-amber-100/70',
    bgGuided: 'bg-amber-200/80',
    text: 'text-amber-600',
    shadowGuided: 'shadow-[0_0_22px_rgba(245,158,11,0.45)]'
  },
  sports: {
    bg: 'bg-emerald-100/70',
    bgGuided: 'bg-emerald-200/80',
    text: 'text-emerald-600',
    shadowGuided: 'shadow-[0_0_22px_rgba(16,185,129,0.45)]'
  },
  entertainment: {
    bg: 'bg-purple-100/70',
    bgGuided: 'bg-purple-200/80',
    text: 'text-purple-600',
    shadowGuided: 'shadow-[0_0_22px_rgba(168,85,247,0.45)]'
  }
};

// Export helper function to get text color for category labels
export function getCategoryTextColor(type: CategoryType): string {
  return colorConfig[type].text;
}

export default function PremiumCategoryIcon({ 
  type,
  id,
  isActive = false, 
  isHovered = false,
  isGuided: isGuidedProp
}: PremiumCategoryIconProps) {
  const Icon = iconMap[type];
  const colors = colorConfig[type];
  const { guideTarget } = useGuide();
  
  // Use prop if provided, otherwise check context
  const isGuided = isGuidedProp !== undefined ? isGuidedProp : (id && guideTarget === id);

  return (
    <motion.div
      className="relative w-full h-full rounded-2xl bg-white/70 backdrop-blur-md shadow-sm hover:shadow-md flex items-center justify-center overflow-hidden transition-all"
      initial={{ opacity: 0 }}
      animate={{ 
        opacity: 1,
        y: isHovered ? -4 : 0,
        scale: isActive ? 1.05 : isHovered ? 1.04 : 1
      }}
      whileTap={{ scale: 0.95 }}
      transition={{
        opacity: { duration: 0.4 },
        y: { duration: 0.25, ease: "easeOut" },
        scale: { duration: 0.2 }
      }}
    >
      {/* Shimmer effect for guided state */}
      {isGuided && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/30 to-transparent"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}

      {/* Soft Glow Container */}
      <div 
        className={`w-full h-full rounded-2xl backdrop-blur-sm flex items-center justify-center transition-all duration-300 ${
          isGuided 
            ? `${colors.bgGuided} ${colors.shadowGuided}` 
            : colors.bg
        }`}
      >
        {/* Icon with breathing and pulse animations */}
        <motion.div
          className="flex items-center justify-center"
          animate={
            isGuided
              ? {
                  scale: [1, 1.08, 1],
                }
              : !isHovered
              ? {
                  scale: [1, 1.05, 1],
                }
              : {
                  scale: 1.05
                }
          }
          transition={{
            scale: {
              duration: isGuided ? 1.5 : 3,
              repeat: Infinity,
              ease: "easeInOut"
            }
          }}
        >
          <Icon className={`w-5 h-5 ${colors.text}`} strokeWidth={2.6} />
        </motion.div>
      </div>
    </motion.div>
  );
}
