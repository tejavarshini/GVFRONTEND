import { useState, useEffect } from "react";
import { X, Plus, Minus, ShoppingCart, ChevronDown, Loader2 } from "lucide-react";
import type { Brand } from "@/types/brand";
// import { useCart } from "@/hooks/useCart";
import { useToast } from "@/hooks/use-toast";
import { useBrandDetails } from "@/hooks/useBrandDetails";
import { useAuthContext } from "@/contexts/AuthContext";
import { useCreateOrder } from "@/hooks/useCreateOrder";
import { useInitiatePayment } from "@/hooks/useInitiatePayment";
import { useGeneratePaymentToken } from "@/hooks/useGeneratePaymentToken";
import { useValidateOrder } from "@/hooks/useValidateOrder";
import { useExternalScript } from "@/hooks/useExternalScript";
import { encrypt } from "@/utils/encryption";


interface QuickBuyModalProps {
  brand: Brand;
  isOpen: boolean;
  onClose: () => void;
  brandImage: string;
}

export default function QuickBuyModal({
  brand,
  isOpen,
  onClose,
  brandImage,
}: QuickBuyModalProps) {
  const [amount, setAmount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [error, setError] = useState("");

  const { user } = useAuthContext();
//   const { addToCart } = useCart(user?.clientId);
  const { toast } = useToast();
//   const { cart } = useCart(user?.clientId);
const createOrderMutation = useCreateOrder();
const generateTokenMutation = useGeneratePaymentToken();
const paymentMutation = useInitiatePayment();
const validateOrderMutation = useValidateOrder();
const scriptStatus = useExternalScript(import.meta.env.VITE_ATOM_SCRIPT_URL);

const { data: brandDetails, isLoading } = useBrandDetails(brand.BrandId, {
  enabled: isOpen, // ✅ Only fetch when modal is open
});

const minPrice = brandDetails?.minPrice || 0;
const maxPrice = brandDetails?.maxPrice || 0;
const isFixedType = brandDetails?.BrandType?.toLowerCase() === "fixed";
const isVariableType = brandDetails?.BrandType?.toLowerCase() === "variable";

  // Initialize amount for fixed type
  useEffect(() => {
if (isFixedType && brandDetails?.DenominationList?.length > 0) {
  setAmount(brandDetails.DenominationList[0].toString());
}
  }, [isFixedType, brandDetails?.DenominationList]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setAmount(v);
    if (!v) return setError("");

    const num = Number(v);
    if (isNaN(num)) return setError("Enter a valid number");
    if (num < minPrice) return setError(`Minimum amount is ₹${minPrice}`);
    if (num > maxPrice) return setError(`Maximum amount is ₹${maxPrice}`);
    setError("");
  };

  const handleDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAmount(e.target.value);
    setError("");
  };

  const isValidAmount = () => {
    if (!amount) return false;
    if (isFixedType) {
      return brandDetails?.DenominationList?.includes(Number(amount));
    }
    if (isVariableType) {
      return !error && Number(amount) >= minPrice && Number(amount) <= maxPrice;
    }
    return false;
  };

const handlePayNow = async () => {
  if (!isValidAmount()) return;

  // Check if cart has items
//   if (cart && cart.items && cart.items.length > 0) {
//     toast({
//       title: "Cart Not Empty",
//       description: "Please empty your cart before making a quick purchase.",
//       variant: "destructive",
//     });
//     return;
//   }

  if (!user?.clientId) {
    toast({
      title: "Error",
      description: "User client ID not found. Please login again.",
      variant: "destructive",
    });
    return;
  }

  // Generate orderNumber exactly like useCart does
  const today = new Date();
  const yymmdd =
    today.getFullYear().toString().slice(-2) +
    String(today.getMonth() + 1).padStart(2, "0") +
    String(today.getDate()).padStart(2, "0");
  const uuid = window.crypto.randomUUID();
  const orderNumber = "ORD" + yymmdd + uuid.replace(/-/g, "").slice(0, 12).toUpperCase();

  const totalAmount = Number(amount) * quantity;

  // Create order request with ALL required fields
// Create order request with ALL required fields
const orderRequest = {
  order: {
    clientId: user.clientId,
    orderNumber: orderNumber,
    totalAmount: totalAmount,
    currency: "INR",
    status: "PENDING",
    walletUsed: false,     // ✅ ADD THIS
    walletAmount: 0.0,     // ✅ ADD THIS
  },
  items: [
    {
      brandId: brand.BrandId,
      quantity: quantity,
      unitValue: Number(amount),
      lineTotal: totalAmount,
      meta: "{}",
    },
  ],
};


  console.log("Creating quick buy order:", orderRequest);

  // Step 1: Create order in database
  createOrderMutation.mutate(orderRequest, {
    onSuccess: (orderResponse) => {
      console.log("Order created successfully:", orderResponse);
      // Use the orderNumber we generated
      validateOrder(orderNumber, totalAmount);
    },
    onError: (error: any) => {
      console.error("Order creation error:", error);
      console.error("Error response:", error.response?.data);
      
      let errorMessage = "Failed to create order. Please try again.";
      
      if (error && typeof error === "object") {
        if ("response" in error && error.response && typeof error.response === "object") {
          if ("data" in error.response && error.response.data && typeof error.response.data === "object") {
            if ("message" in error.response.data && typeof error.response.data.message === "string") {
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


const validateOrder = (orderNumber: string, totalAmount: number) => {
  console.log("Validating order:", orderNumber);
  validateOrderMutation.mutate(
    {
      orderNumber: orderNumber,
      cartTotal: totalAmount,
      walletAmount: 0,
      walletUsed: false,
    },
    {
      onSuccess: (validationResponse) => {
        console.log("Validation response:", validationResponse);
        if (!validationResponse.valid) {
          toast({
            title: "Validation Failed",
            description: validationResponse.message,
            variant: "destructive",
          });
          return;
        }
        console.log("Payment required. Amount:", validationResponse.amountToPay);
        generatePaymentToken(validationResponse.amountToPay, orderNumber);
      },
      onError: (error: any) => {
        console.error("Validation error:", error);
        toast({
          title: "Validation Failed",
          description: error.message || "Failed to validate order. Please try again.",
          variant: "destructive",
        });
      },
    }
  );
};

const generatePaymentToken = (amount: number, orderNumber: string) => {
  console.log("Generating payment token for order:", orderNumber);
  generateTokenMutation.mutate(undefined, {
    onSuccess: (token) => {
      console.log("Payment token generated successfully:", token);
      toast({
        title: "Token Generated",
        description: "Payment token generated successfully.",
      });
      initiatePayment(amount, orderNumber, token);
    },
    onError: (error: any) => {
      console.error("Token generation error:", error);
      toast({
        title: "Token generation failed",
        description: "Failed to generate payment token. Please try again.",
        variant: "destructive",
      });
    },
  });
};

const initiatePayment = async (amount: number, orderNumber: string, token: string) => {
  console.log("Initiating payment with token:", token);

  if (scriptStatus !== "ready") {
    toast({
      title: "Payment system loading",
      description: "Please wait a moment and try again.",
      variant: "destructive",
    });
    return;
  }

  if (typeof (window as any).AtomPaynetz !== "function") {
    console.error("AtomPaynetz not available:", (window as any).AtomPaynetz);
    toast({
      title: "Payment system error",
      description: "Payment gateway not initialized. Please refresh the page.",
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

  paymentMutation.mutate(
    {
      amount,
      orderNumber: orderNumber,
      encryptedData,
      token,
    },
    {
      onSuccess: (data) => {
        console.log("Payment process response:", data);
        if (data.responseDetails?.txnStatusCode !== "OTS0000") {
          toast({
            title: "Payment initiation failed",
            description: `${data.responseDetails?.txnDescription}. Please try again`,
            variant: "destructive",
          });
          return;
        }

        const options = {
          atomTokenId: data.atomTokenId,
          merchId: import.meta.env.VITE_PAYMENT_TRANSACTION_MERCHANTID,
          custEmail: "contact@sabbpe.com",
          custMobile: "9876543210",
          returnUrl: import.meta.env.VITE_PAYMENT_RETURN_BACKEND_URL,
        };

        console.log("Opening payment gateway", options);

        try {
          new (window as any).AtomPaynetz(options, import.meta.env.VITE_PAYMENT_ENV);
          onClose(); // Close modal after payment gateway opens
        } catch (error) {
          console.error("Payment gateway error:", error);
          toast({
            title: "Payment error",
            description: "Failed to open payment gateway. Please try again.",
            variant: "destructive",
          });
        }
      },
      onError: (error: any) => {
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

const isProcessing =
  createOrderMutation.isPending ||
  validateOrderMutation.isPending ||
  generateTokenMutation.isPending ||
  paymentMutation.isPending;


  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-border">
            <div className="flex items-center gap-3">
              <img
                src={brandImage}
                alt={brand.BrandName}
                className="w-12 h-12 object-contain rounded-lg bg-muted/30"
              />
              <div>
                <h3 className="font-bold text-lg">{brand.BrandName}</h3>
                <p className="text-xs text-muted-foreground">Quick Buy</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-6 space-y-4">
            {isLoading ? (
  <div className="py-12 flex items-center justify-center">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
) : (
  <>

            {/* Select Amount */}
            {isFixedType && (
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Select Amount
                </label>
                <div className="relative">
                  <select
                    value={amount}
                    onChange={handleDropdownChange}
                    className="w-full h-12 pl-4 pr-10 text-base border border-border rounded-lg outline-none transition-all bg-background appearance-none cursor-pointer focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    {brandDetails?.DenominationList && brandDetails?.DenominationList.length > 0 ? (
                      brandDetails?.DenominationList.map((denomination, index) => (
                        <option key={`${denomination}-${index}`} value={denomination}>
                          ₹{denomination.toLocaleString()}
                        </option>
                      ))
                    ) : (
                      <option value="">No denominations available</option>
                    )}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
            )}

            {isVariableType && (
              <div>
                <label className="text-sm font-semibold mb-2 block">
                  Enter Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <input
                    type="number"
                    value={amount}
                    onChange={handleAmountChange}
                    placeholder={`${minPrice} - ${maxPrice}`}
                    className={`w-full h-12 pl-7 pr-4 text-base border rounded-lg outline-none transition-all bg-background ${
                      error
                        ? "border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : isValidAmount()
                        ? "border-green-500 focus:ring-2 focus:ring-green-500/20"
                        : "border-border focus:border-primary focus:ring-2 focus:ring-primary/20"
                    }`}
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                    {error}
                  </p>
                )}
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="text-sm font-semibold mb-2 flex items-center gap-2">
                Quantity
                {brand?.Discount && Number(brand.Discount) > 0 && (
                  <span className="ml-auto flex items-center gap-1 bg-purple-600 text-white px-2 py-1 rounded-md text-xs font-bold">
                    ⭐ {Number(brand.Discount).toFixed(1)}% Cashback
                  </span>
                )}
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-12 h-12 rounded-lg border border-border bg-background hover:bg-accent transition-colors flex items-center justify-center"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 h-12 rounded-lg border border-border text-center font-semibold text-base bg-background"
                />
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-12 h-12 rounded-lg border border-border bg-background hover:bg-accent transition-colors flex items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Total Amount */}
            {isValidAmount() && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-2xl font-bold text-primary">
                    ₹{(Number(amount) * quantity).toLocaleString()}
                  </span>
                </div>
              </div>
            )}
              </>
)}

          </div>

{/* Footer */}
<div className="p-4 sm:p-6 border-t border-border">
  <button
    disabled={!isValidAmount() || isProcessing || scriptStatus !== "ready"}
    onClick={handlePayNow}
    className={`w-full h-12 rounded-lg text-base font-bold flex items-center justify-center gap-2 transition-all ${
      isValidAmount() && !isProcessing && scriptStatus === "ready"
        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
        : "bg-muted text-muted-foreground cursor-not-allowed opacity-60"
    }`}
  >
    <ShoppingCart className="h-5 w-5" />
    {scriptStatus === "loading" && "Loading Payment System..."}
    {scriptStatus === "error" && "Payment System Error"}
    {createOrderMutation.isPending && "Creating Order..."}
    {validateOrderMutation.isPending && "Validating Order..."}
    {generateTokenMutation.isPending && "Generating Token..."}
    {paymentMutation.isPending && "Initiating Payment..."}
    {!isProcessing && scriptStatus === "ready" && `Pay ₹${(Number(amount) * quantity).toLocaleString()}`}
  </button>
</div>

        </div>
      </div>
    </>
  );
}
