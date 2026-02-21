import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { AlertCircle, Smartphone, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImg from "@/attached_assets/generated_images/logo.png";
import { useLoginWithOtp } from "@/hooks/useLoginWithOtp";
import { useSendOtp } from "@/hooks/useSendOtp";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

export default function Login() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const isSessionExpired = searchParams.includes("session=expired");

  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [reqId, setReqId] = useState("");
  const [step, setStep] = useState<"mobile" | "otp">("mobile");
  const [countdown, setCountdown] = useState(0);

  const sendOtpMutation = useSendOtp();
  const loginMutation = useLoginWithOtp();
  const { setUser } = useAuthContext();
  const { toast } = useToast();

  useEffect(() => {
    if (isSessionExpired) {
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', '/login');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSessionExpired]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validateMobile = (mobile: string) => {
    return /^[0-9]{10}$/.test(mobile);
  };

  const validateMobileForm = () => {
    if (!mobileNumber.trim()) {
      setError("Mobile number is required");
      return false;
    }

    if (!validateMobile(mobileNumber)) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }

    return true;
  };

  const validateOtpForm = () => {
    if (!otp || otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return false;
    }
    return true;
  };

  const isLoading = sendOtpMutation.isPending || loginMutation.isPending;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateMobileForm()) return;

    sendOtpMutation.mutate(mobileNumber, {
      onSuccess: (data) => {
        if (data.type === "success") {
          setReqId(data.message); // MSG91 returns reqId in message field
          setStep("otp");
          setCountdown(30);
          toast({
            title: "OTP Sent",
            description: `OTP has been sent to +91-${mobileNumber}`,
            duration: 3000,
          });
        } else {
          setError("Failed to send OTP. Please try again.");
        }
      },
      onError: () => {
        setError("Failed to send OTP. Please try again.");
      },
    });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateOtpForm()) return;

    loginMutation.mutate(
      {
        reqId,
        otp,
      },
      {
        onSuccess: (data) => {
          if (data.token && data.userInfo) {
            setUser({
              name: data.userInfo.name,
              email: data.userInfo.email,
              mobile: data.userInfo.mobile,
              token: data.token,
              clientId: data.userInfo.clientId,
            });

            toast({
              title: `Welcome back, ${data.userInfo.name}!`,
              description: data.message,
              duration: 3000,
            });

            setTimeout(() => {
              setLocation("/");
            }, 500);
          } else {
            setError(data.message || "Login Failed");
          }
        },
        onError: (error: any) => {
          if (error.response?.status === 400) {
            setError("Invalid OTP. Please try again.");
          } else {
            setError("Login failed. Please try again.");
          }
        },
      }
    );
  };

  const handleResendOtp = () => {
    setError("");
    setOtp("");
    sendOtpMutation.mutate(mobileNumber, {
      onSuccess: (data) => {
        if (data.type === "success") {
          setReqId(data.message);
          setCountdown(30);
          toast({
            title: "OTP Resent",
            description: `OTP has been resent to +91-${mobileNumber}`,
            duration: 3000,
          });
        }
      },
    });
  };

  const handleChangeNumber = () => {
    setStep("mobile");
    setOtp("");
    setError("");
    setCountdown(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center">
              <img
                src={logoImg}
                alt="Logo"
                className="max-w-[190%] max-h-[190%] object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {isSessionExpired ? "Session Expired" : "Welcome Back"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isSessionExpired
              ? "Your session has expired. Please login again to continue."
              : "Sign in to your account to continue"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {isSessionExpired && (
            <div className="flex items-center gap-2 p-4 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>Your session has expired. Please login again.</span>
            </div>
          )}

          <form onSubmit={step === "mobile" ? handleSendOtp : handleVerifyOtp} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === "mobile" ? (
              <>
                {/* Mobile Number */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Enter your 10-digit mobile number"
                      value={mobileNumber}
                      maxLength={10}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "");
                        setMobileNumber(value);
                        setError("");

                        if (value && !/^[0-9]{10}$/.test(value)) {
                          setMobileError("Please enter a valid 10-digit mobile number");
                        } else {
                          setMobileError("");
                        }
                      }}
                      className="pl-10 h-12"
                    />
                  </div>
                  {mobileError && (
                    <p className="text-red-500 text-sm mt-1">{mobileError}</p>
                  )}
                </div>

                <Button className="w-full h-12" type="submit" disabled={isLoading || !!mobileError}>
                  {isLoading ? "Sending OTP..." : (
                    <span className="flex items-center justify-center gap-2">
                      Send OTP
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </>
            ) : (
              <>
                {/* OTP Input */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Enter OTP
                    </label>
                    <button
                      type="button"
                      onClick={handleChangeNumber}
                      className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                    >
                      Change Number
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    OTP sent to +91-{mobileNumber}
                  </p>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={(value) => {
                        setOtp(value);
                        setError("");
                      }}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <div className="mt-4 text-center">
                    {countdown > 0 ? (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Resend OTP in {countdown}s
                      </p>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={isLoading}
                        className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors disabled:opacity-50"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </div>

                <Button className="w-full h-12" type="submit" disabled={isLoading || otp.length !== 6}>
                  {isLoading ? "Verifying..." : "Verify & Login"}
                </Button>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{" "}
              <Link href="/register">
                <button className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                  Sign up
                </button>
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
