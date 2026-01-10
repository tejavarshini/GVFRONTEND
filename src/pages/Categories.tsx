import { useState } from 'react';
import Header from '@/components/Header';
import CategoryCard from '@/components/CategoryCard';
import VoucherCard from '@/components/VoucherCard';
import Footer from '@/components/Footer';
import { categories } from '@/data/categories';
import { vouchers } from '@/data/vouchers';

export default function Categories() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredVouchers = selectedCategory
    ? vouchers.filter((v) => v.category === selectedCategory)
    : vouchers;

  return (
    /* ⭐ Background fade behind header */
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1">

        {/* PAGE HEADER */}
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-10 lg:px-8 md:px-10 py-12">
            <h1 className="text-4xl font-bold mb-4">Browse by Category</h1>
            <p className="text-muted-foreground text-lg">
              Discover gift vouchers organized by category
            </p>
          </div>
        </div>

        {/* CONTENT */}
        <section className="max-w-7xl mx-auto px-10 lg:px-8 md:px-10 py-12">

          {/* CATEGORY GRID */}
          <h2 className="text-2xl font-bold mb-6">Categories</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onClick={() =>
                  setSelectedCategory(
                    selectedCategory === category.id ? null : category.id
                  )
                }
              />
            ))}
          </div>

          {/* FILTER TITLE */}
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {selectedCategory
                ? `${categories.find((c) => c.id === selectedCategory)?.name} Vouchers`
                : "All Vouchers"}
            </h2>

            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-primary hover:underline"
              >
                Clear filter
              </button>
            )}
          </div>

          {/* VOUCHER GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredVouchers.map((voucher) => (
              <VoucherCard key={voucher.id} voucher={voucher} />
            ))}
          </div>

          {/* EMPTY STATE */}
          {filteredVouchers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No vouchers found in this category
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
