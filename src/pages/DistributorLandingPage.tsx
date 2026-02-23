// pages/DistributorLandingPage.tsx
// Distributor-specific landing page with modified hero section
import { useConfig } from "@/contexts/ConfigContext";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoriesSection from '@/components/CategoriesSection';
import MobileBottomNav from "@/components/MobileBottomNav";
import VoucherCard from '@/components/VoucherCard';
import StepCircle from '@/components/StepCircle';
import { vouchers } from '@/data/vouchers';
import { ShoppingBag, Percent, Zap, Briefcase, ShoppingCart, CreditCard, Mail, Tag } from "lucide-react";

export default function DistributorLandingPage() {
    const { config } = useConfig();
    const featuredVouchers = vouchers.filter((v) => v.featured);
    const homeConfig = config.homePage;

    // Highlight chips data
    const highlights = [
        { icon: ShoppingBag, text: "Bulk Offers", color: "bg-purple-100 text-purple-700" },
        { icon: Percent, text: "Attractive Discounts", color: "bg-indigo-100 text-indigo-700" },
        { icon: Zap, text: "Priority Processing", color: "bg-pink-100 text-pink-700" }
    ];

    // Instruction steps with icons and descriptions
    const steps = [
        {
            id: 1,
            title: "Select Voucher",
            description: "Choose your preferred brand",
            icon: <Briefcase className="h-5 w-5 text-purple-600" />
        },
        {
            id: 2,
            title: "Select Discount / Denomination",
            description: "Pick discount & value",
            icon: <Tag className="h-5 w-5 text-pink-600" />
        },
        {
            id: 3,
            title: "Add to Cart",
            description: "Review & confirm quantity",
            icon: <ShoppingCart className="h-5 w-5 text-blue-600" />
        },
        {
            id: 4,
            title: "Make Payment",
            description: "Secure & fast checkout",
            icon: <CreditCard className="h-5 w-5 text-purple-600" />
        },
        {
            id: 5,
            title: "Receive Multiple Voucher Orders",
            description: "Instant delivery to your dashboard",
            icon: <Mail className="h-5 w-5 text-orange-600" />
        }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            {config.header.enabled && <Header />}

            <main className="flex-1 pb-20 md:pb-0">
                {/* DISTRIBUTOR HERO BANNER */}
                <section className="relative overflow-hidden px-4 py-4 md:py-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="max-w-4xl mx-auto">
                            {/* Hero Banner Card */}
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-sm p-4 md:p-6 space-y-3">
                                {/* Distributor Mode Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                    <Briefcase className="h-3.5 w-3.5" />
                                    <span>Distributor Mode</span>
                                </div>
                                
                                {/* Title */}
                                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                                    Come buy with us as a{" "}
                                    <span className="text-primary">SabbPe Preferred Partner</span>
                                </h1>

                                {/* Subtitle */}
                                <p className="text-sm sm:text-base text-muted-foreground">
                                    Bulk gift vouchers with attractive discounts and faster order processing.
                                </p>

                                {/* Feature Highlight Chips */}
                                <div className="flex flex-wrap gap-2 pt-1">
                                    {highlights.map((highlight, index) => {
                                        const Icon = highlight.icon;
                                        return (
                                            <div
                                                key={index}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${highlight.color} text-xs font-medium`}
                                            >
                                                <Icon className="h-3 w-3" />
                                                <span>{highlight.text}</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Helper Text */}
                                <div className="pt-2">
                                    <p className="text-sm text-gray-500">
                                        Need distributor pricing support?{" "}
                                        <a 
                                            href="mailto:contact@sabbpe.com" 
                                            className="text-violet-600 font-semibold hover:underline"
                                        >
                                            contact@sabbpe.com
                                        </a>
                                    </p>
                                </div>
                            </div>

                            {/* Instruction Steps */}
                            <div className="space-y-4 pt-6 md:pt-8">
                                <h2 className="text-lg md:text-xl font-bold text-center text-gray-900">
                                    HOW IT{" "}
                                    <span className="relative inline-block text-purple-600">
                                        WORKS
                                        <span className="absolute bottom-0 left-0 right-0 h-1 bg-purple-600"></span>
                                    </span>
                                </h2>
                                <StepCircle steps={steps} />
                            </div>
                        </div>
                    </div>
                </section>

                {/* CATEGORIES SECTION WITH LABEL */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
                    <div className="text-center mb-6">
                        <p className="text-sm sm:text-base text-muted-foreground font-medium">
                            Select Category to Start Bulk Ordering
                        </p>
                    </div>
                </section>
                
                {/* CATEGORIES SECTION - Same as customer flow */}
                <CategoriesSection buttonLabel="Bulk Buy" />

                {/* FEATURED VOUCHERS - Same as customer flow */}
                {homeConfig.featuredVouchers.enabled && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                        <div className="flex items-center justify-between mb-6 sm:mb-8">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold">Featured Vouchers</h2>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                                    Bulk purchase options with exclusive discounts
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6">
                            {featuredVouchers.map((voucher) => (
                                <VoucherCard key={voucher.id} voucher={voucher} showBulkContext={true} />
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
