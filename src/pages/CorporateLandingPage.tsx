// pages/CorporateLandingPage.tsx
// Corporate-specific landing page for employee rewards redemption
import { useConfig } from "@/contexts/ConfigContext";
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import CategoriesSection from '@/components/CategoriesSection';
import MobileBottomNav from "@/components/MobileBottomNav";
import VoucherCard from '@/components/VoucherCard';
import StepCircle from '@/components/StepCircle';
import CorporateJourneyCycle from '@/components/CorporateJourneyCycle';
import { vouchers } from '@/data/vouchers';
import { Award, Gift, Shield, Briefcase, Tag, Users, Upload, CheckCircle } from "lucide-react";

export default function CorporateLandingPage() {
    const { config } = useConfig();
    const featuredVouchers = vouchers.filter((v) => v.featured);
    const homeConfig = config.homePage;

    // Highlight chips data for corporate rewards
    const highlights = [
        { icon: Award, text: "Employee Rewards", color: "bg-purple-100 text-purple-700" },
        { icon: Gift, text: "Bulk Redemption", color: "bg-indigo-100 text-indigo-700" },
        { icon: Shield, text: "Secure Distribution", color: "bg-pink-100 text-pink-700" }
    ];

    // Instruction steps with corporate batch-based flow
    const steps = [
        {
            id: 1,
            title: "Select Voucher",
            description: "Choose brand vouchers for employee rewards",
            icon: <Briefcase className="h-5 w-5 text-purple-600" />
        },
        {
            id: 2,
            title: "Select Denomination",
            description: "Choose reward value or points allocation",
            icon: <Tag className="h-5 w-5 text-pink-600" />
        },
        {
            id: 3,
            title: "Add to Employee Batch",
            description: "Build your employee rewards allocation",
            icon: <Users className="h-5 w-5 text-blue-600" />
        },
        {
            id: 4,
            title: "Upload Employee Sheet",
            description: "Submit Excel with EmployeeID, Email, and Amount",
            icon: <Upload className="h-5 w-5 text-green-600" />
        },
        {
            id: 5,
            title: "Redeem Rewards",
            description: "System calculates total and locks batch after redemption",
            icon: <CheckCircle className="h-5 w-5 text-orange-600" />
        }
    ];

    return (
        <div className="min-h-screen flex flex-col">
            {config.header.enabled && <Header />}

            <main className="flex-1 pb-20 md:pb-0">
                {/* CORPORATE HERO BANNER */}
                <section className="relative overflow-hidden px-4 py-4 md:py-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="max-w-4xl mx-auto">
                            {/* Hero Banner Card */}
                            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-sm p-4 md:p-6 space-y-3">
                                {/* Corporate Mode Badge */}
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                                    <Award className="h-3.5 w-3.5" />
                                    <span>Corporate Rewards</span>
                                </div>
                                
                                {/* Title */}
                                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
                                    Reward Your Employees with{" "}
                                    <span className="text-primary">SabbPe Corporate Rewards</span>
                                </h1>

                                {/* Subtitle */}
                                <p className="text-sm sm:text-base text-muted-foreground">
                                    Bulk voucher allocation, flexible denominations, and seamless employee redemption.
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
                                        Need assistance with corporate rewards?{" "}
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

                            {/* Employee Batch Summary Card */}
                            <div className="mt-6">
                                <div className="bg-white rounded-xl shadow-md border border-gray-200 p-5">
                                    <h3 className="text-base font-bold text-gray-900 mb-4">
                                        Employee Batch Summary
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                                            <p className="text-xs text-gray-600 mb-1">Total Employees</p>
                                            <p className="text-lg font-bold text-gray-900">0</p>
                                        </div>
                                        <div className="text-center p-3 bg-indigo-50 rounded-lg">
                                            <p className="text-xs text-gray-600 mb-1">Total Amount</p>
                                            <p className="text-lg font-bold text-gray-900">₹0</p>
                                        </div>
                                        <div className="text-center p-3 bg-pink-50 rounded-lg">
                                            <p className="text-xs text-gray-600 mb-1">Upload Status</p>
                                            <p className="text-sm font-semibold text-gray-700">Pending</p>
                                        </div>
                                    </div>
                                    
                                    {/* Status Badge - Shown after redemption */}
                                    <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                        <p className="text-xs text-amber-800 flex items-center gap-2">
                                            <Shield className="h-4 w-4" />
                                            <span className="font-medium">Batch Status:</span>
                                            <span>Ready to Redeem</span>
                                        </p>
                                    </div>

                                    {/* CTA Button */}
                                    <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg font-semibold text-sm hover:shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-2">
                                        <CheckCircle className="h-5 w-5" />
                                        Redeem Rewards
                                    </button>
                                    
                                    {/* Post-redemption note (hidden initially) */}
                                    <p className="text-xs text-gray-500 text-center mt-3">
                                        After redemption, batch will be locked and credentials released by SabbPe team
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* CORPORATE JOURNEY CYCLE */}
                <section className="bg-gradient-to-br from-purple-50 to-indigo-50 py-8">
                    <CorporateJourneyCycle />
                </section>

                {/* CATEGORIES SECTION WITH LABEL */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4 pt-6">
                    <div className="text-center mb-6">
                        <p className="text-sm sm:text-base text-muted-foreground font-medium">
                            Select Category to Build Employee Batch
                        </p>
                    </div>
                </section>
                
                {/* CATEGORIES SECTION */}
                <CategoriesSection buttonLabel="Add to Batch" />

                {/* FEATURED VOUCHERS */}
                {homeConfig.featuredVouchers.enabled && (
                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
                        <div className="flex items-center justify-between mb-6 sm:mb-8">
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-bold">Featured Vouchers</h2>
                                <p className="text-sm sm:text-base text-muted-foreground mt-1 sm:mt-2">
                                    Popular rewards for employee recognition programs
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
