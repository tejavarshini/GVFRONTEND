import { useEffect, useState, useRef, useMemo } from "react";
import { Link, useLocation } from "wouter";
import {
  ShoppingCart,
  Menu,
  Search,
  Sun,
  Moon,
  MapPin,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/useCart";
import { useAuthContext } from "@/contexts/AuthContext";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/contexts/SimpleTheme";
import { useBrandNames } from "@/hooks/useBrandNames";

import logoImg from "@/attached_assets/generated_images/logo.png";
import { AuthButton } from "./AuthButton";
import { useConfig } from "@/contexts/ConfigContext";

import CategoryNav from "./CategoryNav";

import { useFetchWallet } from "@/hooks/useFetchWallet";
import { WalletOdometer } from "@/components/WalletOdometer";

// Types
interface LocationData {
  city: string;
  state: string;
  pincode: string;
  area?: string;
  district?: string;
}

interface PostOffice {
  Name: string;
  District: string;
  State: string;
  Pincode: string;
}

// Location utilities
function getSavedLocation(): LocationData | null {
  const data = localStorage.getItem("user_location");
  return data ? JSON.parse(data) : null;
}

function saveLocation(loc: LocationData) {
  localStorage.setItem("user_location", JSON.stringify(loc));
}

async function fetchIPLocation(): Promise<LocationData> {
  const res = await fetch("https://ipapi.co/json/");
  const data = await res.json();
  return {
    city: data.city || "Unknown",
    state: data.region || "",
    pincode: data.postal || "",
    area: data.city || "",
  };
}

async function fetchLocationsByPincode(pincode: string): Promise<PostOffice[]> {
  const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  const data = await res.json();
  return data[0]?.PostOffice || [];
}

export default function Header() {
  const { config } = useConfig();
  const { user, isAuthenticated } = useAuthContext();

  const { totalItems } = useCart(user?.clientId);


  const { data: walletData } = useFetchWallet(user?.clientId);
  const walletPoints = walletData?.totalBalance ?? 0;
  const { theme, toggleTheme } = useTheme();
  // const [location] = useLocation();

  // Local states for location system
  const [userLocation, setUserLocation] = useState<LocationData | null>(() =>
    getSavedLocation()
  );

  const [, setLocation] = useLocation();

  const [openLocationModal, setOpenLocationModal] = useState(false);
  const [pincode, setPincode] = useState("");
  const [list, setList] = useState<PostOffice[]>([]);
  const [selected, setSelected] = useState<PostOffice | null>(null);
  const [headerSearchQuery, setHeaderSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // ❌ COMMENTED OUT: Old functionality (uncomment to restore)
  const { data: brands = [] } = useBrandNames();

  // ✅ Check if we're on home page

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/brands", label: "Brands" },
    // { href: "/categories", label: "Categories" },
    // { href: "/offers", label: "Offers" },
  ];

  const handleHeaderSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && headerSearchQuery.trim()) {
      setLocation(
        `/brands?search=${encodeURIComponent(headerSearchQuery.trim())}`
      );
      setHeaderSearchQuery("");
    }
  };

  useEffect(() => {
    if (userLocation) return;

    async function init() {
      try {
        const ipLoc = await fetchIPLocation();
        saveLocation(ipLoc);
        setUserLocation(ipLoc);
      } catch (err) {
        console.log("IP location error:", err);
      }
    }

    init();
  }, [userLocation]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter brands based on search query
  // Filter brands based on search query
  const filteredBrandSuggestions = useMemo(() => {
    let results = brands;

    if (headerSearchQuery.trim()) {
      const query = headerSearchQuery.toLowerCase();
      results = brands.filter((brand: any) => {
        const brandName = brand.BrandName || brand.brandName || "";
        return brandName.toLowerCase().includes(query);
      });
    }

    // Sort alphabetically, moving number-starting names to the end
    return results.sort((a: any, b: any) => {
      const nameA = (a.BrandName || a.brandName || "").trim();
      const nameB = (b.BrandName || b.brandName || "").trim();

      const startsWithNumberA = /^\d/.test(nameA);
      const startsWithNumberB = /^\d/.test(nameB);

      // If one starts with number and other doesn't, number goes last
      if (startsWithNumberA && !startsWithNumberB) return 1;
      if (!startsWithNumberA && startsWithNumberB) return -1;

      // Both start with letter or both start with number - sort alphabetically
      return nameA.localeCompare(nameB, undefined, { sensitivity: "base" });
    });
  }, [brands, headerSearchQuery]);

  const handleSearchFocus = () => {
    setShowSuggestions(true);
  };

  const handleBrandClick = (brand: any) => {
    const brandId = brand.BrandId || brand.brandId;
    if (brandId) {
      setLocation(`/brands/${brandId}`);
      setHeaderSearchQuery("");
      setShowSuggestions(false);
    }
  };

  if (!config?.header?.enabled) return null;
  const headerConfig = config.header;
  // const enabledLinks = headerConfig.navigation.links.filter(
  //   (link) => link.enabled
  // );

  return (
    <>
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 lg:h-20 gap-2">
            {/* LOGO - FIXED: Responsive sizing */}
            {headerConfig.logo.enabled && (
              <Link href="/">
                <button className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-accent/50 transition">
                  <img
                    src={logoImg}
                    alt="Logo"
                    className="h-10 sm:h-12 lg:h-16"
                  />
                </button>
              </Link>
            )}

            {/* MOBILE SEARCH BUTTON - Visible only on mobile, between logo and profile */}
            {/* {headerConfig.searchBar.enabled && (
              <Sheet open={openMobileSearch} onOpenChange={setOpenMobileSearch}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden"
                  >
                    <Search className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="top" className="h-auto max-h-[80vh] overflow-hidden flex flex-col">
                  <div className="space-y-4 pt-6 flex-shrink-0">
                    <h3 className="text-lg font-semibold">Search Brands</h3>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                      <Input
                        ref={searchInputRef}
                        placeholder="Search brands..."
                        value={headerSearchQuery}
                        onChange={(e) => {
                          setHeaderSearchQuery(e.target.value);
                          setShowSuggestions(true); // Show suggestions when typing
                        }}
                        onFocus={handleSearchFocus} // Keep this - shows suggestions when input is clicked
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && headerSearchQuery.trim()) {
                            setLocation(`/brands?search=${encodeURIComponent(headerSearchQuery.trim())}`);
                            setHeaderSearchQuery("");
                            setOpenMobileSearch(false);
                            setShowSuggestions(false);
                          }
                        }}
                        className="pl-10 h-12 text-base"
                        autoFocus
                      />

                    </div>
                    <p className="text-sm text-muted-foreground">
                      {showSuggestions && filteredBrandSuggestions.length > 0
                        ? "Tap a brand to view details"
                        : "Press Enter to search"}
                    </p>
                  </div>

                  {showSuggestions && filteredBrandSuggestions.length > 0 && (
                    <div className="mt-4 flex-1 overflow-y-auto">
                      <div className="space-y-1">
                        {filteredBrandSuggestions.map((brand: any, index: number) => {
                          const brandName = brand.BrandName || brand.brandName || "";
                          const brandCategory = brand.Category || brand.category || "";

                          return (
                            <button
                              key={index}
                              type="button"
                              onTouchStart={(e) => {
                                e.stopPropagation();
                              }}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();

                                const brandId = brand.BrandId || brand.brandId;
                                console.log('Brand clicked:', brand, 'ID:', brandId);

                                if (brandId) {

                                  window.location.href = `/brands/${brandId}`;
                                }
                              }}
                              className="w-full px-4 py-3 text-left hover:bg-muted active:bg-muted transition-colors border-b border-border last:border-0 flex flex-col gap-1 rounded-lg"
                            >
                              <span className="text-sm font-medium">{brandName}</span>
                              {brandCategory && (
                                <span className="text-xs text-muted-foreground">
                                  {brandCategory}
                                </span>
                              )}
                            </button>

                          );
                        })}
                      </div>
                    </div>
                  )}
                </SheetContent>

              </Sheet>
            )} */}

            {/* NAV LINKS - Desktop only */}
            {/* {headerConfig.navigation.enabled && (
              <nav className="hidden md:flex items-center gap-2">
                {enabledLinks.map((link) => {
                  const isActive = location === link.href;
                  return (
                    <Link key={link.href} href={link.href}>
                      <Button
                        variant="ghost"
                        className={`px-3 lg:px-4 py-2 text-sm font-medium ${isActive
                          ? "text-primary bg-primary/10"
                          : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                          }`}
                      >
                        {link.label}
                      </Button>
                    </Link>
                  );
                })}
              </nav>
            )} */}

            {/* SEARCH BAR - Mobile: compact between logo and profile, Desktop: full */}
            {headerConfig.searchBar.enabled && (
              <div className="flex items-center relative mx-2 flex-1 md:flex-initial md:mx-4 lg:mx-6">
                {/* Search Icon - Responsive */}
                <Search
                  className="
      absolute 
      left-2 sm:left-3 lg:left-4 
      h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-5 lg:w-5 
      text-primary/70
      pointer-events-none
      z-10
    "
                />

                {/* Search Input - Fully Responsive */}
                <div className="relative flex-1 max-w-full md:max-w-xl">
                  <Input
                    ref={searchInputRef}
                    placeholder="Search brands..."
                    value={headerSearchQuery}
                    onChange={(e) => {
                      setHeaderSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={handleSearchFocus}
                    onKeyDown={handleHeaderSearch}
                    className="
      pl-8 sm:pl-10 lg:pl-12 
      pr-3 sm:pr-4
      h-8 sm:h-9 lg:h-11 
      text-xs sm:text-sm
      rounded-full 
      border border-primary/40 
      hover:border-primary 
      focus:border-primary
      focus:ring-2 
      focus:ring-primary/40
      bg-background 
      transition-all
      w-full
    "
                  />

                  {/* Suggestions Dropdown */}
                  {showSuggestions && filteredBrandSuggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute top-full left-2 md:left-0 right-2 md:right-0 mt-2 bg-background border border-border rounded-lg shadow-xl max-h-[40vh] md:max-h-64 overflow-y-auto z-[999]"
                    >
                      {filteredBrandSuggestions.map(
                        (brand: any, index: number) => {
                          const brandName =
                            brand.BrandName || brand.brandName || "";
                          const brandCategory =
                            brand.Category || brand.category || "";

                          return (
                            <button
                              key={index}
                              onClick={() => handleBrandClick(brand)}
                              className="w-full px-3 py-2.5 md:px-4 md:py-3 text-left hover:bg-muted active:bg-muted/50 transition-colors border-b border-border last:border-0 flex flex-col gap-0.5 md:gap-1"
                            >
                              <span className="text-xs md:text-sm font-medium">
                                {brandName}
                              </span>
                              {brandCategory && (
                                <span className="text-[10px] md:text-xs text-muted-foreground">
                                  {brandCategory}
                                </span>
                              )}
                            </button>
                          );
                        }
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              {/* LOCATION BUTTON - FIXED: Better mobile display */}
              {headerConfig.locationButton.enabled && (
                <Button
                  variant="outline"
                  className="hidden sm:flex rounded-full px-2 sm:px-3 py-1 items-center gap-1 text-xs sm:text-sm"
                  onClick={() => setOpenLocationModal(true)}
                >
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                  <span className="max-w-[60px] sm:max-w-[100px] truncate">
                    {userLocation ? userLocation.city : "Location"}
                  </span>
                </Button>
              )}

              {/* ORDERS BUTTON */}
              {isAuthenticated && (
                <Link href="/orders">
                  <Button
                    variant="outline"
                    className="hidden md:flex items-center gap-2 rounded-full px-3 py-1 border-primary/40 hover:bg-primary/5 hover:border-primary"
                  >
                    <Package className="h-4 w-4" />
                    <span className="text-sm font-medium">Orders</span>
                  </Button>
                </Link>
              )}

              {/* AUTH BUTTON */}
              {/* Profile with wallet odometer overlay */}
              <div className="relative hidden md:block">
                {isAuthenticated && walletPoints > 0 && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 hidden md:block">
                    <WalletOdometer value={walletPoints} />
                  </div>
                )}
                {headerConfig.authButton.enabled && <AuthButton />}
              </div>

              {/* THEME SWITCH */}
              {headerConfig.themeToggle.enabled && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={toggleTheme}
                  className="h-9 w-9 sm:h-10 sm:w-10"
                >
                  {theme === "light" ? (
                    <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
                  ) : (
                    <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
                  )}
                </Button>
              )}

              {/* CART */}
              {headerConfig.cart.enabled && (
                <Link href="/cart" className="hidden md:inline-flex">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 sm:h-10 sm:w-10"
                  >
                    <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5" />
                    {totalItems > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] bg-primary text-white rounded-full text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow-md">
                        {totalItems}
                      </span>
                    )}
                  </Button>
                </Link>
              )}

              {/* MOBILE MENU */}
              <Sheet>
                <SheetTrigger asChild className="md:hidden">
                  <Button size="icon" variant="ghost" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="w-72 px-6 py-8 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <img src={logoImg} alt="Logo" className="h-10" />
                    <span className="text-xl font-bold">GiftVault</span>
                  </div>

                  <nav className="flex flex-col gap-2">
                    {navLinks.map((link) => (
                      <Link key={link.href} href={link.href}>
                        <button className="px-4 py-3 text-left text-base rounded-lg hover:bg-primary/10 w-full">
                          {link.label}
                        </button>
                      </Link>
                    ))}

                    {/* Orders in Mobile Menu */}
                    {isAuthenticated && (
                      <Link href="/orders">
                        <button className="px-4 py-3 text-left text-base rounded-lg hover:bg-primary/10 w-full flex items-center gap-3">
                          <Package className="h-5 w-5" />
                          Orders
                        </button>
                      </Link>
                    )}
                  </nav>

                  {/* Location in Mobile Menu */}
                  {headerConfig.locationButton.enabled && (
                    <div className="mt-6 pt-6 border-t">
                      <Button
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2"
                        onClick={() => setOpenLocationModal(true)}
                      >
                        <MapPin className="w-4 h-4" />
                        {userLocation ? userLocation.city : "Set Location"}
                      </Button>
                    </div>
                  )}
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {/* Category Navigation - Hidden on Mobile */}
          <div className="hidden md:block">
            <CategoryNav />
          </div>

          {/* ✅ MARQUEE with smooth animation */}

          {/* {headerConfig.marquee.enabled && !brandsLoading && brands.length > 0 && (
            <div
              className={`
      relative w-full overflow-hidden bg-card py-5 border-t border-border
      transition-all duration-500 ease-in-out
      ${isHomePage ? 'max-h-20 sm:max-h-24 opacity-100' : 'max-h-0 opacity-0'}
    `}
            >
              <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-card to-transparent" />
              <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-card to-transparent" />

              <Marquee
                gradient={false}
                speed={60}
                pauseOnHover={true}
                className="flex items-center"
              >
                {brands.map((brand, index) => (
                  <Link
                    key={`${brand.BrandId}-${index}`}
                    href={`/brands?brand=${encodeURIComponent(brand.BrandName)}`}
                  >
                    <div
                      className="inline-flex items-center px-12 text-2xl max-sm:text-lg font-semibold uppercase tracking-wider text-foreground transition-colors duration-300 hover:text-accent"
                      style={{ letterSpacing: '0.05em' }}
                    >
                      {brand.BrandName}
                    </div>
                  </Link>
                ))}
              </Marquee>
            </div>
          )} */}
        </div>
      </header>

      {/* LOCATION MODAL - FIXED: Responsive */}
      {openLocationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white dark:bg-neutral-900 p-4 sm:p-6 rounded-xl shadow-xl w-full max-w-md">
            <h2 className="text-base sm:text-lg font-semibold mb-4">
              Update Location
            </h2>

            <div className="flex gap-2">
              <Input
                placeholder="Enter Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                className="h-10"
              />
              <Button
                onClick={async () => {
                  const result = await fetchLocationsByPincode(pincode);
                  setList(result);
                }}
                className="h-10"
              >
                Search
              </Button>
            </div>

            {list.length > 0 && (
              <select
                className="w-full border rounded-lg mt-4 p-2 text-sm dark:bg-neutral-800"
                onChange={(e) => {
                  const value = e.target.value;
                  if (value !== "default") {
                    setSelected(JSON.parse(value));
                  }
                }}
              >
                <option value="default">Select Area</option>
                {list.map((loc) => (
                  <option key={loc.Name} value={JSON.stringify(loc)}>
                    {loc.Name}, {loc.District}, {loc.State}
                  </option>
                ))}
              </select>
            )}

            <div className="flex justify-end mt-6 gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setOpenLocationModal(false);
                  setList([]);
                  setSelected(null);
                  setPincode("");
                }}
                className="h-9 px-4 text-sm"
              >
                Cancel
              </Button>

              <Button
                disabled={!selected}
                onClick={() => {
                  if (selected) {
                    const formatted: LocationData = {
                      city: selected.Name,
                      district: selected.District,
                      state: selected.State,
                      pincode: selected.Pincode,
                    };

                    saveLocation(formatted);
                    setUserLocation(formatted);
                    setOpenLocationModal(false);
                    setList([]);
                    setSelected(null);
                    setPincode("");
                  }
                }}
                className="h-9 px-4 text-sm"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
