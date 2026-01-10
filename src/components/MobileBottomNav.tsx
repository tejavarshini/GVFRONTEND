import { useState} from 'react';
import { Link, useLocation } from 'wouter';
import { Home, LayoutGrid, Store, User, ShoppingCart } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFetchWallet } from '@/hooks/useFetchWallet';
import { WalletOdometer } from '@/components/WalletOdometer';
import CategoriesBottomSheet from './CategoriesBottomSheet';
import { useCart } from '@/hooks/useCart';

export default function MobileBottomNav() {
  const [location] = useLocation();
  const { user, isAuthenticated } = useAuthContext();

  const { totalItems } = useCart(user?.clientId);


  const { data: walletData } = useFetchWallet(user?.clientId);
  const walletPoints = walletData?.totalBalance ?? 0;
  const [showCategories, setShowCategories] = useState(false);
  // const [shouldScrollToDeals, setShouldScrollToDeals] = useState(false);

  // Handle scrolling after navigation
  // useEffect(() => {
  //   if (shouldScrollToDeals && location === '/') {
  //     const timer = setTimeout(() => {
  //       const element = document.getElementById('top-brands-section');
  //       if (element) {
  //         element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //       }
  //       setShouldScrollToDeals(false);
  //     }, 100);
  //     return () => clearTimeout(timer);
  //   }
  // }, [location, shouldScrollToDeals]);

  // const handleHotDealsClick = () => {
  //   if (location !== '/') {
  //     setShouldScrollToDeals(true);  // ← USE THIS
  //     setLocation('/');               // ← USE THIS
  //   } else {
  //     const element = document.getElementById('top-brands-section');
  //     if (element) {
  //       element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  //     }
  //   }
  // };


  const navItems = [
    { icon: Home, label: 'HOME', href: '/', activeFor: ['/'] },
    { icon: LayoutGrid, label: 'CATEGORY', onClick: () => setShowCategories(true), activeFor: ['/brands'] },
    { icon: Store, label: 'ALL BRANDS', href: '/brands', activeFor: ['/brands'] },

    { icon: User, label: isAuthenticated ? 'PROFILE' : 'LOGIN', href: isAuthenticated ? '/profile' : '/login', activeFor: ['/profile', '/login'] },
    { icon: ShoppingCart, label: 'CART', href: '/cart', activeFor: ['/cart'], badge: totalItems > 0 ? totalItems : undefined },
  ];

  const isActive = (item: typeof navItems[0]) => {
    if (!item.activeFor) return false;
    return item.activeFor.some(path => location === path || location.startsWith(path + '/'));
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t border-border z-[100] safe-area-bottom shadow-lg">
        <div className="grid grid-cols-5 h-16">
{/* Mobile Bottom Navigation */}
{navItems.map((item, index) => {
  const Icon = item.icon;
  const active = isActive(item);
  const isProfileItem =
    item.label === (isAuthenticated ? "PROFILE" : "LOGIN");

  // CATEGORY button (uses onClick)
  if (item.onClick) {
    return (
      <button
        key={index}
        onClick={item.onClick}
        className="flex-1 flex flex-col items-center justify-center py-2 text-xs"
      >
        <Icon
          className={`h-5 w-5 mb-1 ${
            active ? "text-primary" : "text-muted-foreground"
          }`}
        />
        <span
          className={`text-[10px] ${
            active ? "text-primary font-semibold" : "text-muted-foreground"
          }`}
        >
          {item.label}
        </span>
      </button>
    );
  }

  // Regular link button (HOME, HOTDEALS, PROFILE/LOGIN, CART)
  return (
    <Link key={index} href={item.href!} className="flex-1">
      <div className="relative flex flex-col items-center justify-center py-3 text-xs">
        {/* Wallet points overlay only on PROFILE when logged in */}
        {isProfileItem && isAuthenticated && walletPoints > 0 && (
          <div className="absolute -top-0.5 left-1/2 -translate-x-1/2">
            {/* number + pts, no background */}
            <WalletOdometer value={walletPoints} />
          </div>
        )}

        <div className="relative">
          <Icon
            className={`h-5 w-5 mb-1 ${
              active ? "text-primary" : "text-muted-foreground"
            }`}
          />
          {item.badge && item.badge > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[16px] h-[16px] bg-primary text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-md">
              {item.badge}
            </span>
          )}
        </div>

        <span
          className={`text-[10px] ${
            active ? "text-primary font-semibold" : "text-muted-foreground"
          }`}
        >
          {item.label}
        </span>
      </div>
    </Link>
  );
})}



        </div>
      </nav>

      {/* Categories Bottom Sheet */}
      <CategoriesBottomSheet
        open={showCategories}
        onClose={() => setShowCategories(false)}
      />
    </>
  );
}
