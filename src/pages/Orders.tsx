// pages/OrdersPage.tsx
import { Link } from "wouter";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthContext } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import MobileBottomNav from "@/components/MobileBottomNav";

const FALLBACK_IMAGE = "/brand-placeholder.png";

// Image validation
async function validateImage(url: string): Promise<string> {
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject();
      img.src = url;
      setTimeout(() => reject(), 3000);
    });
  } catch {
    return FALLBACK_IMAGE;
  }
}

// Image component
function BrandImage({ src, alt }: { src?: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(FALLBACK_IMAGE);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      if (!src || src === FALLBACK_IMAGE) {
        setIsLoading(false);
        return;
      }

      try {
        const validatedUrl = await validateImage(src);
        if (isMounted) setImgSrc(validatedUrl);
      } catch {
        if (isMounted) setImgSrc(FALLBACK_IMAGE);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadImage();
    return () => { isMounted = false; };
  }, [src]);

  return (
    <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
      {isLoading ? (
        <div className="animate-pulse bg-neutral-200 dark:bg-neutral-600 w-full h-full" />
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          className="w-full h-full object-cover"
          onError={() => setImgSrc(FALLBACK_IMAGE)}
        />
      )}
    </div>
  );
}

export default function Orders() {
  const { user, isAuthenticated } = useAuthContext();
  const { data, isLoading, isError, refetch } = useOrders(user?.clientId);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30";
      case "PAID":
      case "COMPLETED":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30";
      case "FAILED":
      case "CANCELLED":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case "PENDING":
        return <Clock className="h-3 w-3" />;
      case "PAID":
      case "COMPLETED":
        return <CheckCircle className="h-3 w-3" />;
      case "FAILED":
      case "CANCELLED":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Package className="h-3 w-3" />;
    }
  };

  // Parse images from meta
  const getImageUrl = (meta: any): string => {
    if (!meta || !meta.images) return FALLBACK_IMAGE;
    
    try {
      const images = typeof meta.images === 'string' ? JSON.parse(meta.images) : meta.images;
      return images.text || images.raw || images.thumbnail || images.featured || FALLBACK_IMAGE;
    } catch {
      return FALLBACK_IMAGE;
    }
  };

  // Not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center space-y-6">
            <ShoppingBag className="h-20 w-20 mx-auto text-muted-foreground/50" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Please Login</h1>
              <p className="text-muted-foreground">
                You need to be logged in to view your orders
              </p>
            </div>
            <Link href="/login">
              <Button size="lg">Login to Continue</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground">Loading your orders...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error
  if (isError) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-6">
            <XCircle className="h-20 w-20 mx-auto text-red-500" />
            <div>
              <h1 className="text-3xl font-bold mb-2">Error Loading Orders</h1>
              <p className="text-muted-foreground">Failed to load orders. Please try again.</p>
            </div>
            <Button onClick={() => refetch()} size="lg">Retry</Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Filter visible orders and sort from latest to oldest
  const visibleOrders = (data?.orders || [])
    .filter(order => order.status.toUpperCase() !== "PENDING")
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA; // Latest first (descending order)
    });

  // No orders
  if (visibleOrders.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4 py-20">
          <div className="text-center space-y-6">
            <Package className="h-20 w-20 mx-auto text-muted-foreground/50" />
            <div>
              <h1 className="text-3xl font-bold mb-2">No Orders Yet</h1>
              <p className="text-muted-foreground">Start shopping to see your orders here</p>
            </div>
            <Link href="/brands">
              <Button size="lg">Start Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      <main className="flex-1 bg-muted/30">
        {/* Header */}
        <div className="border-b bg-background">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">My Orders</h1>
                <p className="text-muted-foreground">
                  Track and manage your orders
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
          <div className="space-y-4">
            {visibleOrders.map((order) => {
              const orderDate = new Date(order.created_at);
              const itemsWithMeta = order.items.filter(item => item.meta && Object.keys(item.meta).length > 0);
              const displayItems = itemsWithMeta.length > 0 ? itemsWithMeta : order.items.slice(0, 3);

              return (
                <Card key={order.order_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    {/* Order Header */}
                    <div className="p-4 sm:p-6 border-b bg-muted/30">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3 flex-wrap">
                            <h3 className="font-semibold text-base">
                              Order #{order.order_number.slice(-8)}
                            </h3>
                            <Badge variant="outline" className={`${getStatusColor(order.status)} flex items-center gap-1 text-xs`}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            {format(orderDate, "MMM dd, yyyy · hh:mm a")}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold text-primary">
                              ₹{order.total_amount.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Order Items Preview */}
                    <div className="p-4 sm:p-6">
                      <div className="space-y-3">
                        {displayItems.map((item) => {
                          const brandName = item.meta && 'brand_name' in item.meta 
                            ? item.meta.brand_name 
                            : `Brand ${item.brand_id.slice(0, 8)}`;
                          const imageUrl = getImageUrl(item.meta);
                          const category = item.meta && 'category' in item.meta ? item.meta.category : '';

                          return (
                            <div
                              key={item.order_item_id}
                              className="flex items-center gap-4 p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors"
                            >
                              <BrandImage src={imageUrl} alt={brandName} />
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">{brandName}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  {category && <span>{category}</span>}
                                  <span>·</span>
                                  <span>Qty: {item.quantity}</span>
                                  <span>·</span>
                                  <span>₹{item.unit_value.toFixed(2)} each</span>
                                </div>
                              </div>

                              <p className="font-semibold text-sm whitespace-nowrap">
                                ₹{item.line_total.toFixed(2)}
                              </p>
                            </div>
                          );
                        })}

                        {order.items.length > 3 && displayItems.length === 3 && (
                          <p className="text-center text-sm text-muted-foreground py-2">
                            +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 flex gap-3">
                      <Link href={`/orders/${order.order_id}`}>
                        <Button variant="outline" className="flex-1 sm:flex-initial">
                          View Details
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>

                      {order.status === "PENDING" && (
                        <Button className="flex-1 sm:flex-initial">
                          Complete Payment
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}