// pages/Home.tsx
// Updated: Added Moving Banner and Category Banner integrations
import { useConfig } from "@/contexts/ConfigContext";
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import VoucherCard from '@/components/VoucherCard';
import Footer from '@/components/Footer';
import { vouchers } from '@/data/vouchers';
import CategoriesSection from '@/components/CategoriesSection';
import MobileBottomNav from "@/components/MobileBottomNav";

// Import the new banner components
// import { MovingBanner } from '@/components/MovingBanner';
// import { bannerCategories } from '@/data/categories';

export default function Home() {
    const { config } = useConfig();
    const featuredVouchers = vouchers.filter((v) => v.featured);
    const homeConfig = config.homePage;

    return (
        <div className="min-h-screen flex flex-col">
            {config.header.enabled && <Header />}

            <main className="flex-1 pb-20 md:pb-0">
                {/* HERO SECTION */}
                {homeConfig.hero.enabled && <Hero />}

                {/* CATEGORIES SECTION */}
                <CategoriesSection />

                {/* DYNAMIC BANNERS SECTION - Below Categories */}
                {/* <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">

                    <div className="space-y-2 sm:space-y-12">
                        {bannerCategories.map((category, index) => (
                            <div key={index}>
                                <h3 className="text-xl sm:text-2xl font-semibold mb-3 text-gray-800 border-b-2 border-purple-200 pb-3">
                                    {category.title}
                                </h3>
                                <MovingBanner
                                    offers={category.offers}
                                    speed={50}
                                    pauseOnHover={true}
                                />
                            </div>
                        ))}
                    </div>
                </section> */}

                {/* TOP BRANDS BY CATEGORY - Hidden since layered scrolling shows all categories */}
                {/* <TopBrandsSection /> */}

                {/* FEATURED VOUCHERS */}
                {homeConfig.featuredVouchers.enabled && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                        <div className="flex items-center justify-between mb-6 sm:mb-8">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold">Featured Vouchers</h2>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                                    Handpicked selections from top brands
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                            {featuredVouchers.map((voucher) => (
                                <VoucherCard key={voucher.id} voucher={voucher} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {config.footer.enabled && <Footer />}
            <MobileBottomNav />
        </div>
    );
}