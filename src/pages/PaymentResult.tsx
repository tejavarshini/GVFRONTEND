// pages/PaymentResult.tsx - Professional Generic Payment Status
import { useEffect, useState, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { useUpdateOrderStatus } from "@/hooks/useUpdateOrderStatus";
import { useFetchCoupons } from "@/hooks/useFetchCoupons";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";
import { decrypt } from "@/utils/encryption";

export default function PaymentResult() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const { toast } = useToast();
  const { user } = useAuthContext();
  const updateStatusMutation = useUpdateOrderStatus();
  const fetchCouponsMutation = useFetchCoupons();

  const [loading, setLoading] = useState(true);
  const [statusUpdated, setStatusUpdated] = useState(false);
  const [couponsFetched, setCouponsFetched] = useState(false);
  const [decryptedOrderNumber, setDecryptedOrderNumber] = useState<string>("");
  const [decryptedClientId, setDecryptedClientId] = useState<string>("");

  // Parse params for BOTH gateways (NTT Data & Easebuzz)
  const paymentData = useMemo(() => {
    const params = new URLSearchParams(searchParams);
    
    // NTT Data: ?txnId=ENCRYPTED (capital I)
    const nttTxnId = params.get("txnId");
    
    // Easebuzz: ?status=SUCCESS&txnid=ENCRYPTED (lowercase i)
    const easebuzzStatus = params.get("status");
    const easebuzzTxnId = params.get("txnid");
    
    const error = params.get("error");

    console.log("💳 Payment callback received:", {
      nttTxnId: nttTxnId ? "present" : "null",
      easebuzzStatus,
      easebuzzTxnId: easebuzzTxnId ? "present" : "null",
      error,
    });

    let status: "success" | "error" | "pending" = "error";
    let message = "";
    let encryptedTransactionId = "";
    let gateway: "ntt" | "easebuzz" = "ntt";

    // Easebuzz detection (has both status + txnid)
    if (easebuzzStatus && easebuzzTxnId) {
      gateway = "easebuzz";
      encryptedTransactionId = easebuzzTxnId;

      const statusLower = easebuzzStatus.toLowerCase();
      
      if (statusLower === "success") {
        status = "success";
        message = "Your payment has been processed successfully!";
      } else if (statusLower === "failure") {
        status = "error";
        message = "Payment could not be processed. Please try again.";
      } else if (statusLower === "usercancelled") {
        status = "error";
        message = "Payment was cancelled. You have not been charged.";
      } else if (statusLower === "pending") {
        status = "pending";
        message = "Your payment is being processed. This may take a few moments.";
      } else {
        status = "error";
        message = "Payment status could not be determined.";
      }
    }
    // NTT Data detection (only txnId with capital I)
    else if (nttTxnId) {
      gateway = "ntt";
      encryptedTransactionId = nttTxnId;
      status = "success";
      message = "Your payment has been processed successfully!";
    }
    // Error parameter
    else if (error) {
      status = "error";
      
      switch (error) {
        case "invalid_signature":
          message = "Payment verification failed. Please contact support.";
          break;
        case "invalid_transaction":
          message = "Invalid transaction. Please try again.";
          break;
        case "txn_not_found":
          message = "Transaction not found. Please contact support.";
          break;
        case "callback_processing_failed":
          message = "Payment processing error. Please contact support.";
          break;
        default:
          message = "Payment could not be completed. Please try again.";
      }
    }
    // No valid params
    else {
      status = "error";
      message = "Invalid payment response. Please contact support.";
    }

    return {
      status,
      message,
      encryptedTransactionId,
      gateway,
    };
  }, [searchParams]);

  // Decrypt transaction ID and extract order number + clientId
  useEffect(() => {
    const decryptTransactionId = async () => {
      if (paymentData.encryptedTransactionId) {
        try {
          const decrypted = await decrypt(paymentData.encryptedTransactionId);
          const parts = decrypted.split("|");
          const orderNumber = parts[0];
          const clientIdFromToken = parts[1] || "";
          setDecryptedOrderNumber(orderNumber);
          setDecryptedClientId(clientIdFromToken);
          console.log("✅ Order Number:", orderNumber);
          console.log("✅ Client ID from token:", clientIdFromToken);
        } catch (error) {
          console.error("❌ Decryption failed:", error);
          setDecryptedOrderNumber(paymentData.encryptedTransactionId);
        }
      }
    };

    decryptTransactionId();
  }, [paymentData.encryptedTransactionId]);

  // Initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Update order status and fetch coupons
  useEffect(() => {
    if (!loading && !statusUpdated && paymentData.encryptedTransactionId) {
      const orderStatus = paymentData.status === "success" ? "PAID" : "FAILED";

      updateStatusMutation.mutate(
        {
          orderNumber: paymentData.encryptedTransactionId,
          status: orderStatus,
        },
        {
          onSuccess: () => {
            setStatusUpdated(true);

            if (orderStatus === "PAID") {
              toast({
                title: "Order Confirmed",
                description: `Order #${decryptedOrderNumber} has been successfully placed.`,
              });

              // Get client ID - first from decrypted token, then fallbacks
              let clientId: string | null = decryptedClientId || null;
              if (!clientId && user?.clientId) {
                clientId = user.clientId;
              } else if (!clientId) {
                const authUserString = localStorage.getItem("authUser");
                if (authUserString) {
                  try {
                    const authUser = JSON.parse(authUserString);
                    clientId = authUser.clientId || null;
                  } catch (parseError) {
                    console.error("Failed to parse authUser:", parseError);
                  }
                }
              }

              console.log("🔑 Client ID resolved:", clientId);

              // Fetch coupons
              if (clientId && !couponsFetched && decryptedOrderNumber) {
                fetchCouponsMutation.mutate(
                  {
                    clientId: clientId,
                    orderNumber: decryptedOrderNumber,
                  },
                  {
                    onSuccess: () => {
                      setCouponsFetched(true);
                      toast({
                        title: "Vouchers Ready!",
                        description:
                          "Your vouchers have been generated and sent to your email.",
                      });
                    },
                    onError: () => {
                      toast({
                        title: "Note",
                        description:
                          "Order confirmed. Vouchers will be available shortly.",
                        variant: "default",
                      });
                    },
                  }
                );
              }
            }
          },
          onError: () => {
            toast({
              title: "Update Required",
              description:
                "Payment received but order status needs verification. Please contact support if this persists.",
              variant: "destructive",
            });
          },
        }
      );
    } else if (!loading && !paymentData.encryptedTransactionId) {
      toast({
        title: "Error",
        description: "Transaction information missing. Please contact support.",
        variant: "destructive",
      });
    }
  }, [
    loading,
    statusUpdated,
    paymentData.encryptedTransactionId,
    paymentData.status,
    decryptedOrderNumber,
    decryptedClientId,
    couponsFetched
  ]);

  // Status UI helpers
  const getStatusIcon = () => {
    if (loading) {
      return <Loader2 className="h-20 w-20 text-primary animate-spin" />;
    }
    switch (paymentData.status) {
      case "success":
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 dark:bg-green-900/30 rounded-full animate-pulse" />
            <CheckCircle2 className="h-20 w-20 text-green-600 dark:text-green-500 relative z-10" />
          </div>
        );
      case "pending":
        return <Clock className="h-20 w-20 text-yellow-600 dark:text-yellow-500" />;
      case "error":
      default:
        return <XCircle className="h-20 w-20 text-red-600 dark:text-red-500" />;
    }
  };

  const getStatusTitle = () => {
    if (loading) return "Processing...";
    switch (paymentData.status) {
      case "success":
        return "Payment Successful";
      case "pending":
        return "Payment Pending";
      case "error":
      default:
        return "Payment Failed";
    }
  };

  const getStatusColor = () => {
    switch (paymentData.status) {
      case "success":
        return "text-green-700 dark:text-green-400";
      case "pending":
        return "text-yellow-700 dark:text-yellow-400";
      case "error":
      default:
        return "text-red-700 dark:text-red-400";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted/30 to-muted/10">
      <Header />

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-12 sm:py-16 flex items-center justify-center">
        <Card className="w-full shadow-xl border-2">
          <CardHeader className="text-center pb-6 pt-8">
            <div className="flex justify-center mb-6">
              {getStatusIcon()}
            </div>
            
            <CardTitle className={`text-2xl sm:text-3xl font-bold mb-2 ${getStatusColor()}`}>
              {getStatusTitle()}
            </CardTitle>
            
            <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
              {paymentData.message}
            </p>
          </CardHeader>

          <CardContent className="space-y-6 pb-8">
            {/* Order Number Display */}
            {decryptedOrderNumber && (
              <div className="bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5 p-5 rounded-xl border border-primary/20">
                <p className="text-xs sm:text-sm text-muted-foreground mb-1 font-medium">
                  Order Number
                </p>
                <p className="text-xl sm:text-2xl font-mono font-bold tracking-wide text-foreground">
                  #{decryptedOrderNumber}
                </p>
              </div>
            )}

            {/* Processing Status Indicators */}
            {!loading && paymentData.encryptedTransactionId && (
              <div className="space-y-3 pt-2">
                {/* Order Status Update */}
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">
                        Confirming order...
                      </span>
                    </>
                  ) : statusUpdated && paymentData.status === "success" ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                      <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                        Order confirmed
                      </span>
                    </>
                  ) : updateStatusMutation.isError ? (
                    <>
                      <XCircle className="h-4 w-4 text-red-600 dark:text-red-500 flex-shrink-0" />
                      <span className="text-sm text-red-700 dark:text-red-400">
                        Status update pending
                      </span>
                    </>
                  ) : null}
                </div>

                {/* Voucher Generation Status */}
                {statusUpdated && paymentData.status === "success" && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    {fetchCouponsMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">
                          Generating vouchers...
                        </span>
                      </>
                    ) : couponsFetched ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-500 flex-shrink-0" />
                        <span className="text-sm text-green-700 dark:text-green-400 font-medium">
                          Vouchers sent to your email
                        </span>
                      </>
                    ) : fetchCouponsMutation.isError ? (
                      <>
                        <Clock className="h-4 w-4 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                        <span className="text-sm text-yellow-700 dark:text-yellow-400">
                          Vouchers being processed
                        </span>
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            )}

            {/* Error Warning */}
            {!loading && !paymentData.encryptedTransactionId && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
                  ⚠️ Transaction details unavailable. Please contact support with your payment reference.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              {paymentData.status === "success" ? (
                <>
                  <Button
                    size="lg"
                    className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => setLocation("/orders")}
                  >
                    View My Orders
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 h-12 text-base font-semibold"
                    onClick={() => setLocation("/")}
                  >
                    Continue Shopping
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    size="lg"
                    className="flex-1 h-12 text-base font-semibold shadow-md hover:shadow-lg transition-all"
                    onClick={() => setLocation("/cart")}
                  >
                    Return to Cart
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="flex-1 h-12 text-base font-semibold"
                    onClick={() => setLocation("/")}
                  >
                    Go to Home
                  </Button>
                </>
              )}
            </div>

            {/* Support Section */}
            {paymentData.status === "error" && (
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Need assistance with your payment?
                </p>
                <a
                  href="mailto:support@sabbpe.com"
                  className="text-sm font-medium text-primary hover:underline inline-flex items-center gap-1"
                >
                  Contact Support →
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
