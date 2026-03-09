// pages/CartPage.tsx - Complete responsive implementation
import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import { useInitiatePayment } from "@/hooks/useInitiatePayment";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useExternalScript } from "@/hooks/useExternalScript";
import { useGeneratePaymentToken } from "@/hooks/useGeneratePaymentToken";
import { useFetchWallet } from "@/hooks/useFetchWallet";
import { Checkbox } from "@/components/ui/checkbox";
import { Wallet } from "lucide-react";
import MobileBottomNav from "@/components/MobileBottomNav";
import { useValidateOrder } from "@/hooks/useValidateOrder";
import { encrypt } from "@/utils/encryption";
import { useCart } from "@/hooks/useCart";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useEasebuzzScript } from "@/hooks/useEasebuzzScript";
import { useEasebuzzInitiatePayment } from "@/hooks/useEasebuzzInitiatePayment";

const FALLBACK = "/brand-placeholder.png";

// Image validation function
async function validateImage(url: string): Promise<string> {
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = () => reject();
      img.src = url;
      setTimeout(() => reject(), 5000);
    });
  } catch {
    return FALLBACK;
  }
}

// Component to handle image loading
function CartItemImage({ src, alt }: { src?: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(FALLBACK);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      if (!src || src === FALLBACK) {
        setIsLoading(false);
        return;
      }

      try {
        const validatedUrl = await validateImage(src);
        if (isMounted) setImgSrc(validatedUrl);
      } catch {
        if (isMounted) setImgSrc(FALLBACK);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadImage();
    return () => {
      isMounted = false;
    };
  }, [src]);

  return (
    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center">
      {isLoading ? (
        <div className="animate-pulse bg-neutral-200 dark:bg-neutral-600 w-full h-full" />
      ) : (
        <img
          src={imgSrc}
          alt={alt}
          className="w-full h-full object-contain p-2"
          onError={() => setImgSrc(FALLBACK)}
        />
      )}
    </div>
  );
}

const getGuestCartCount = (): number => {
  try {
    const stored = localStorage.getItem("guestCart");
    if (!stored) return 0;
    const items = JSON.parse(stored) as Array<{ quantity: number }>;
    return items.reduce((sum, item) => sum + item.quantity, 0);
  } catch {
    return 0;
  }
};

export default function Cart() {
  const { user, isAuthenticated } = useAuthContext();
  const guestCartCount = !isAuthenticated ? getGuestCartCount() : 0;
  const {
    cart,
    isLoading: cartLoading,
    isError: cartError,
    updateQuantity,
    removeFromCart,
    clearCart,
    generateOrderRequest,
  } = useCart(user?.clientId);
  const createOrderMutation = useCreateOrder();
  const generateTokenMutation = useGeneratePaymentToken();
  const paymentMutation = useInitiatePayment();
  const validateOrderMutation = useValidateOrder();

  const easebuzzPaymentMutation = useEasebuzzInitiatePayment();

  const scriptStatus = useExternalScript(import.meta.env.VITE_ATOM_SCRIPT_URL);
  const easebuzzScriptStatus = useEasebuzzScript();

  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);

  const [itemToDelete, setItemToDelete] = useState<{
    itemId: string;
    brandName: string;
  } | null>(null);

  // NEW: Wallet feature
  const [useWalletBalance, setUseWalletBalance] = useState(false);
  const { data: walletData } = useFetchWallet(user?.clientId);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center pb-20 md:pb-0">
          <div className="text-center space-y-4 sm:space-y-6 p-4 sm:p-8">
            <ShoppingBag className="h-20 w-20 sm:h-24 sm:w-24 mx-auto text-muted-foreground/50" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Please Login
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                You need to be logged in to view your cart
              </p>
            </div>

            {/* ADD THIS SECTION HERE */}
            {guestCartCount > 0 && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  You have <strong>{guestCartCount} item(s)</strong> in your
                  cart
                </p>
                <p className="text-xs text-muted-foreground">
                  Login to sync your cart and proceed to checkout
                </p>
              </div>
            )}
            <Link href="/login">
              <Button
                size="lg"
                className="rounded-full mt-4 sm:mt-8 h-11 sm:h-12"
              >
                Login to Continue
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (cartLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  if (cartError) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Error Loading Cart</h1>
            <p className="text-muted-foreground">Please try again</p>
            <Link href="/brands">
              <Button>Back to Shopping</Button>
            </Link>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  // Safety check - remove the old one at line 104-111
  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/30">
        <Header />
        <main className="flex-1 flex items-center justify-center pb-20 md:pb-0">
          <div className="text-center space-y-4 sm:space-y-6 p-4 sm:p-8">
            <ShoppingBag className="h-20 w-20 sm:h-24 sm:w-24 mx-auto text-muted-foreground/50" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Your Cart is Empty
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground">
                Start shopping to add items to your cart
              </p>
            </div>
            <Link href="/brands">
              <Button
                size="lg"
                className="rounded-full mt-4 sm:mt-8 h-11 sm:h-12"
              >
                Start Shopping
              </Button>
            </Link>
          </div>
        </main>
        <Footer />
        <MobileBottomNav />
      </div>
    );
  }

  const handleQuantityUpdate = (itemId: string, newQuantity: number) => {
    if (updatingItemId === itemId) return;
    setUpdatingItemId(itemId);
    updateQuantity(itemId, newQuantity);
    setTimeout(() => setUpdatingItemId(null), 650);
  };

  const handleRemoveClick = (itemId: string, brandName: string) => {
    setItemToDelete({ itemId, brandName });
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      removeFromCart(itemToDelete.itemId);
      toast({
        title: "Item Removed",
        description: `${itemToDelete.brandName} has been removed from your cart`,
      });
      setItemToDelete(null);
    }
  };

  const cancelDelete = () => {
    setItemToDelete(null);
  };

  // Calculate brand totals
  const brandTotals = cart.items.reduce((acc, item) => {
    const key = `${item.brandId}-${item.unitValue}`;
    if (acc[key]) {
      acc[key].quantity += item.quantity;
      acc[key].total += item.lineTotal;
    } else {
      acc[key] = {
        brand: item.brandName,
        quantity: item.quantity,
        price: item.unitValue,
        total: item.lineTotal,
      };
    }
    return acc;
  }, {} as Record<string, { brand: string; quantity: number; price: number; total: number }>);

  const walletBalance = walletData?.totalBalance || 0;
  const cartTotal = cart.totalAmount;

  const maxWalletUsage = cartTotal * 0.5;

  const walletDeduction = useWalletBalance
    ? Math.min(walletBalance, maxWalletUsage)
    : 0;
  const finalAmount = cartTotal - walletDeduction;

  // Step 1: Create Order in Database
  const handlePayNow = (gateway: "ntt" | "easebuzz") => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please login to place an order",
        variant: "destructive",
      });
      setLocation("/login");
      return;
    }

    if (!user?.clientId) {
      toast({
        title: "Error",
        description: "User client ID not found. Please login again.",
        variant: "destructive",
      });
      return;
    }

    const orderRequest = generateOrderRequest();

    if (!orderRequest) {
      toast({
        title: "Error",
        description: "Unable to create order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    orderRequest.order.walletUsed = useWalletBalance;
    orderRequest.order.walletAmount = useWalletBalance ? walletDeduction : 0.0;

    console.log(`Creating order with ${gateway.toUpperCase()} gateway`);
    console.log("Order request:", orderRequest);
    console.log("Final amount after wallet:", finalAmount);
    console.log("Wallet used:", useWalletBalance);

    // Step 1: Create order in database
    createOrderMutation.mutate(orderRequest, {
      onSuccess: (orderResponse) => {
        console.log("Order created successfully:", orderResponse);
        validateOrder(orderRequest.order.orderNumber, gateway);
      },
      onError: (error: unknown) => {
        // ✅ Change any to unknown
        console.error("Order creation error:", error);

        // ✅ Type-safe error handling
        let errorMessage = "Failed to create order. Please try again.";

        if (error && typeof error === "object") {
          if (
            "response" in error &&
            error.response &&
            typeof error.response === "object"
          ) {
            if (
              "data" in error.response &&
              error.response.data &&
              typeof error.response.data === "object"
            ) {
              if (
                "message" in error.response.data &&
                typeof error.response.data.message === "string"
              ) {
                errorMessage = error.response.data.message;
              } else if (typeof error.response.data === "string") {
                errorMessage = error.response.data;
              }
            }
          } else if ("message" in error && typeof error.message === "string") {
            errorMessage = error.message;
          }
        }

        toast({
          title: "Order creation failed",
          description: errorMessage,
          variant: "destructive",
        });
      },
    });
  };

  const validateOrder = (orderNumber: string, gateway: "ntt" | "easebuzz") => {
    console.log("🔍 Validating order:", orderNumber);

    validateOrderMutation.mutate(
      {
        orderNumber: orderNumber,
        cartTotal: cartTotal,
        walletAmount: walletDeduction,
        walletUsed: useWalletBalance,
      },
      {
        onSuccess: (validationResponse) => {
          console.log("✅ Validation response:", validationResponse);

          if (!validationResponse.valid) {
            toast({
              title: "Validation Failed",
              description: validationResponse.message,
              variant: "destructive",
            });
            return;
          }

          console.log(
            "💳 Payment required. Amount:",
            validationResponse.amountToPay
          );

          generatePaymentToken(
            validationResponse.amountToPay,
            orderNumber,
            gateway
          );
        },
        onError: (error) => {
          console.error("❌ Validation error:", error);
          toast({
            title: "Validation Failed",
            description:
              error.message || "Failed to validate order. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const generatePaymentToken = (
    amount: number,
    orderNumber: string,
    gateway: "ntt" | "easebuzz"
  ) => {
    console.log("Generating payment token for order:", orderNumber);

    // Generate unique merchant order ref
    // eslint-disable-next-line react-hooks/purity
    const uniqueOrderRef = `MOR-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    generateTokenMutation.mutate(uniqueOrderRef, {
      onSuccess: (tokenResponse) => {
        console.log("Payment token generated successfully:", tokenResponse);

        // Extract the actual token string
        const token = tokenResponse.sabbpe_token;
        
        if (!token) {
          console.error("No token in response:", tokenResponse);
          toast({
            title: "Token generation failed",
            description: "No token received from server",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Token Generated",
          description: `Redirecting to ${
            gateway === "easebuzz" ? "Easebuzz" : "NTT Data"
          }...`,
        });

        // Route to appropriate gateway
        if (gateway === "easebuzz") {
          initiateEasebuzzPayment(amount, orderNumber, token);
        } else {
          initiatePayment(amount, orderNumber, token);
        }
      },
      onError: (error) => {
        console.error("Token generation error:", error);
        toast({
          title: "Token generation failed",
          description: "Failed to generate payment token. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  // Step 2: Initiate Payment
  const initiatePayment = async (
    amount: number,
    orderNumber: string,
    token: string
  ) => {
    console.log("Initiating payment with token:", token);

    // Check if script is loaded
    if (scriptStatus !== "ready") {
      toast({
        title: "Payment system loading",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    // Check if AtomPaynetz is available
    if (typeof window.AtomPaynetz !== "function") {
      console.error("AtomPaynetz not available:", window.AtomPaynetz);
      toast({
        title: "Payment system error",
        description:
          "Payment gateway not initialized. Please refresh the page.",
        variant: "destructive",
      });
      return;
    }

    if (!user?.clientId) {
      toast({
        title: "Error",
        description: "User information missing. Please login again.",
        variant: "destructive",
      });
      return;
    }

    const dataToEncrypt = `${orderNumber}|${user.clientId}`;

    const encryptedData = await encrypt(dataToEncrypt);

    // Call the payment process API
    paymentMutation.mutate(
      { amount, orderNumber: orderNumber, encryptedData: encryptedData, token },
      {
        onSuccess: (data) => {
          console.log("Payment process response:", data);

          if (data.responseDetails?.txnStatusCode !== "OTS0000") {
            toast({
              title: "Payment initiation failed",
              description:
                data.responseDetails?.txnDescription || "Please try again",
              variant: "destructive",
            });
            return;
          }

          const options = {
            atomTokenId: data.atomTokenId,
            merchId: import.meta.env.VITE_PAYMENT_TRANSACTION_MERCHANTID,
            custEmail: "contact@gift360.io",
            custMobile: "9876543210",
            returnUrl: import.meta.env.VITE_PAYMENT_RETURN_BACKEND_URL,
          };

          console.log("Opening payment gateway:", options);

          try {
            new window.AtomPaynetz(options, import.meta.env.VITE_PAYMENT_ENV);
            clearCart();
          } catch (error) {
            console.error("Payment gateway error:", error);
            toast({
              title: "Payment error",
              description: "Failed to open payment gateway. Please try again.",
              variant: "destructive",
            });
          }
        },
        onError: (error) => {
          console.error("Payment process error:", error);
          toast({
            title: "Payment failed",
            description: "Failed to initiate payment. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  };

  const initiateEasebuzzPayment = async (
    amount: number,
    orderNumber: string,
    token: string
  ) => {
    console.log("💳 Initiating Easebuzz payment");

    if (easebuzzScriptStatus !== "ready") {
      toast({
        title: "Payment system loading",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    // Use SabbPe initiate format.
    // Send encrypted_order_ref so callback txnid maps to the actual order number.
    if (!user?.clientId) {
      toast({
        title: "Error",
        description: "User information missing. Please login again.",
        variant: "destructive",
      });
      return;
    }
    const encryptedOrderRef = await encrypt(`${orderNumber}|${user.clientId}`);

    const paymentRequest = {
      sabbpe_token: token,
      amount: amount,
      productinfo: import.meta.env.VITE_SABBPE_PRODUCT_INFO || "Gift Voucher Purchase",
      frontend_url: (import.meta.env.VITE_PAYMENT_RETURN_URL || "http://localhost:5173/payment-result").replace(/\/payment-result\/?$/, ""),
      encrypted_order_ref: encryptedOrderRef,
      client_id: user.clientId, // ✅ Explicitly pass client_id for udf2
      customer: {
        firstname: import.meta.env.VITE_PAYMENT_CUSTFIRSTNAME || user?.name || "Test",
        email: import.meta.env.VITE_PAYMENT_CUSTEMAIL || user?.email || "contact@sabbpe.com",
        phone: import.meta.env.VITE_PAYMENT_CUSTMOBILE || user?.mobile || "9876543210",
      },
    };

    console.log("📤 Easebuzz payment request:", paymentRequest);

    easebuzzPaymentMutation.mutate(paymentRequest, {
      onSuccess: (response) => {
        console.log("✅ Easebuzz response:", response);

        const isSuccess =
          response.status === 1 || response.status === true;

        if (!isSuccess) {
          toast({
            title: "Payment initiation failed",
            description:
              response.message ||
              "Unable to initiate payment. Please try again.",
            variant: "destructive",
          });
          return;
        }

        // Sabbpe returns payment_url (with underscore)
        const paymentUrl = response.payment_url || (response as { paymentUrl?: string }).paymentUrl || response.data;

        if (!paymentUrl) {
          console.error("❌ No payment URL in response:", response);
          toast({
            title: "Payment error",
            description: "Invalid payment response. Please try again.",
            variant: "destructive",
          });
          return;
        }

        console.log("🔑 Redirecting to payment URL:", paymentUrl);

        window.location.href = paymentUrl;
        clearCart();
      },
      onError: (error) => {
        console.error("❌ Easebuzz error:", error);
        toast({
          title: "Payment failed",
          description: "Failed to initiate Easebuzz payment. Please try again.",
          variant: "destructive",
        });
      },
    });
  };

  const isProcessing =
    createOrderMutation.isPending ||
    validateOrderMutation.isPending ||
    generateTokenMutation.isPending ||
    paymentMutation.isPending ||
    easebuzzPaymentMutation.isPending;

  return (
    <div className="min-h-screen flex flex-col bg-muted/30">
      <Header />

      <main className="flex-1">
        <div className="border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3 sm:mb-4">
              Shopping Cart
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground">
              {cart.items.length} {cart.items.length === 1 ? "item" : "items"}{" "}
              in your cart
            </p>
          </div>
        </div>

        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              {cart.items.map((item) => (
                <Card key={item.itemId}>
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex gap-4 sm:gap-6">
                      <CartItemImage src={item.image} alt={item.brandName} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3 sm:gap-4 mb-2 sm:mb-3">
                          <div>
                            <h3 className="font-semibold text-base sm:text-lg mb-0.5 sm:mb-1">
                              {item.brandName}
                            </h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              ₹{item.unitValue.toFixed(2)} each
                            </p>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 sm:h-9 sm:w-9 hover:bg-destructive/10 hover:text-destructive transition-colors"
                            onClick={() =>
                              handleRemoveClick(item.itemId, item.brandName)
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
                          <div className="flex items-center gap-2 sm:gap-3">
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 sm:h-8 sm:w-8 transition-all"
                              onClick={() =>
                                handleQuantityUpdate(
                                  item.itemId,
                                  item.quantity - 1
                                )
                              }
                              disabled={
                                item.quantity <= 1 ||
                                updatingItemId === item.itemId
                              }
                              aria-label="Decrease quantity"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">
                              {item.quantity}
                            </span>

                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7 sm:h-8 sm:w-8 transition-all"
                              onClick={() =>
                                handleQuantityUpdate(
                                  item.itemId,
                                  item.quantity + 1
                                )
                              }
                              disabled={updatingItemId === item.itemId}
                              aria-label="Increase quantity"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <p className="text-lg sm:text-xl font-bold text-primary">
                            ₹{item.lineTotal.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-20">
                <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                  <h2 className="text-xl sm:text-2xl font-bold">
                    Order Summary
                  </h2>

                  <div className="space-y-2 sm:space-y-3">
                    {Object.entries(brandTotals).map(([key, data]) => (
                      <div key={key} className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm text-muted-foreground">
                            {data.brand}
                          </span>
                          <span className="font-medium text-xs sm:text-sm">
                            {data.quantity} × ₹{data.price.toFixed(2)} = ₹
                            {data.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}

                    <Separator className="my-3 sm:my-4" />

                    {/* NEW: Wallet Balance Section - Always show, disable if zero */}
                    <div
                      className={`
                        p-3 sm:p-4 rounded-lg border transition-all
                        ${
                          walletBalance > 0
                            ? "bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border-purple-200 dark:border-purple-800"
                            : "bg-muted/50 border-muted-foreground/20 opacity-60"
                        }
                      `}
                    >
                      <div className="flex items-start gap-2 sm:gap-3">
                        <Checkbox
                          id="useWallet"
                          checked={useWalletBalance}
                          onCheckedChange={(checked) =>
                            setUseWalletBalance(checked as boolean)
                          }
                          disabled={walletBalance <= 0}
                          className="mt-0.5"
                        />
                        <div className="flex-1">
                          <label
                            htmlFor="useWallet"
                            className={`
                              text-sm sm:text-base font-medium flex items-center gap-2
                              ${
                                walletBalance > 0
                                  ? "cursor-pointer"
                                  : "cursor-not-allowed"
                              }
                            `}
                          >
                            <Wallet
                              className={`
                                h-4 w-4 
                                ${
                                  walletBalance > 0
                                    ? "text-purple-600 dark:text-purple-400"
                                    : "text-muted-foreground"
                                }
                              `}
                            />
                            Redeem Wallet Points
                          </label>

                          {/* ✅ NEW: Show 50% limit info */}
                          <p
                            className={`text-xs sm:text-sm mt-1 ${
                              walletBalance > 0
                                ? "text-muted-foreground"
                                : "text-muted-foreground/60"
                            }`}
                          >
                            Available: ₹{walletBalance.toFixed(2)} • Max: ₹
                            {maxWalletUsage.toFixed(2)} (50% of cart)
                          </p>

                          {walletBalance <= 0 && (
                            <p className="text-xs sm:text-sm text-muted-foreground/60 mt-1 italic">
                              No wallet balance available
                            </p>
                          )}

                          {/* ✅ UPDATED: Show actual deduction amount */}
                          {useWalletBalance && walletDeduction > 0 && (
                            <p className="text-xs sm:text-sm font-medium text-green-600 dark:text-green-400 mt-1">
                              -₹{walletDeduction.toFixed(2)} will be deducted
                              {walletBalance > maxWalletUsage && (
                                <span className="block text-xs text-muted-foreground mt-0.5">
                                  (Limited to 50% of cart value)
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base text-muted-foreground">
                        Subtotal
                      </span>
                      <span className="font-medium text-sm sm:text-base">
                        ₹{cartTotal.toFixed(2)}
                      </span>
                    </div>

                    {/* Show wallet deduction if applied */}
                    {useWalletBalance && walletDeduction > 0 && (
                      <div className="flex items-center justify-between text-green-600 dark:text-green-400">
                        <span className="text-sm sm:text-base flex items-center gap-1">
                          <Wallet className="h-4 w-4" />
                          Wallet Deduction
                        </span>
                        <span className="font-medium text-sm sm:text-base">
                          -₹{walletDeduction.toFixed(2)}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm sm:text-base text-muted-foreground">
                        Processing Fee
                      </span>
                      <span className="font-medium text-sm sm:text-base">
                        ₹0.00
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-semibold">
                      Total to Pay
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-primary">
                      ₹{finalAmount.toFixed(2)}
                    </span>
                  </div>

                  {/* Payment Gateway Selection - SINGLE SABBPE BUTTON */}
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground text-center font-medium">
                      Choose Payment Gateway
                    </p>

                    {/* SabbPe (Easebuzz) Button - Single centered button */}
                    <Button
                      size="lg"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 h-11 sm:h-12 text-sm sm:text-base transition-all shadow-md hover:shadow-lg"
                      onClick={() => handlePayNow("easebuzz")}
                      disabled={
                        isProcessing || easebuzzScriptStatus !== "ready"
                      }
                    >
                      {easebuzzScriptStatus === "loading" ? (
                        "Loading..."
                      ) : easebuzzScriptStatus === "error" ? (
                        "Error"
                      ) : easebuzzPaymentMutation.isPending ? (
                        "Processing..."
                      ) : (
                        "Pay with SabbPe"
                      )}
                    </Button>

                    {/* Loading/Error Status */}
                    {(createOrderMutation.isPending ||
                      validateOrderMutation.isPending ||
                      generateTokenMutation.isPending) && (
                      <p className="text-xs text-center text-muted-foreground animate-pulse">
                        {createOrderMutation.isPending && "Creating order..."}
                        {validateOrderMutation.isPending &&
                          "Validating order..."}
                        {generateTokenMutation.isPending &&
                          "Generating secure token..."}
                      </p>
                    )}
                  </div>

                  <Link href="/brands">
                    <Button
                      variant="outline"
                      className="w-full h-10 sm:h-11 text-sm sm:text-base"
                    >
                      Continue Shopping
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>

      <AlertDialog
        open={!!itemToDelete}
        onOpenChange={(open) => !open && cancelDelete()}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{" "}
              <span className="font-semibold text-foreground">
                "{itemToDelete?.brandName}"
              </span>{" "}
              from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
