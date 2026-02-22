import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { AlertCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImg from "@/attached_assets/generated_images/logo.png";
import { useSendOtp } from "@/hooks/useSendOtp";
import { useLoginWithOtp } from "@/hooks/useLoginWithOtp";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const isSessionExpired = searchParams.includes("session=expired");

  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpInfoMessage, setOtpInfoMessage] = useState("");

  const sendOtpMutation = useSendOtp();
  const loginWithOtpMutation = useLoginWithOtp();
  const { setUser } = useAuthContext();
  const { toast } = useToast();
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (isSessionExpired) {
      const timer = setTimeout(() => {
        window.history.replaceState({}, '', '/login');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [isSessionExpired]);

  const validateMobile = (mobile: string) => {
    return /^[0-9]{10}$/.test(mobile);
  };

  const validateOtp = (otp: string) => {
    return /^[0-9]{4,6}$/.test(otp);
  };

  const handleSendOtp = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");
    setOtpInfoMessage("");
    setOtpSent(false);
    setOtp("");

    if (!mobile.trim()) {
      setMobileError("Mobile number is required");
      return;
    }

    if (!validateMobile(mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number");
      return;
    }

    setMobileError("");
    console.log("Sending:", { mobileNumber: mobile, email: email.trim() });

    sendOtpMutation.mutate({ mobileNumber: mobile, email: email.trim() }, {
      onSuccess: (data) => {
        if (data.notRegistered) {
          setError("Mobile number not registered. Please register first.");
          toast({
            title: "Not registered",
            description: "This mobile number is not registered. Please sign up first.",
            variant: "destructive",
            duration: 4000,
          });
          return;
        }
        if (data.success) {
          setOtpSent(true);
          setOtpInfoMessage(data.message || "OTP sent successfully");
          toast({
            title: "OTP sent",
            description: data.message || "OTP has been sent to your mobile number",
            duration: 3000,
          });
        }
      },
      onError: (err: any) => {
        if (err?.response?.data) {
          const serverMessage =
            typeof err.response.data === "string"
              ? err.response.data
              : err.response.data.message || "Failed to send OTP. Please try again.";
          setError(serverMessage);
        } else {
          setError("Failed to send OTP. Please try again.");
        }
        toast({
          title: "Error",
          description: err?.response?.data?.message || "Failed to send OTP. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      },
    });
  };

  const handleOtpLogin = (e: React.MouseEvent) => {
    e.preventDefault();
    setError("");

    if (!mobile.trim()) {
      setError("Please enter your mobile number and request an OTP first.");
      return;
    }

    if (!validateMobile(mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (!validateOtp(otp)) {
      setError("Please enter a valid 4-6 digit OTP");
      return;
    }

    loginWithOtpMutation.mutate(
      { mobileNumber: mobile.trim(), otp, email: email.trim() },
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
              title: "Welcome back!",
              description: data.message || "Login successful",
              duration: 3000,
            });

            setTimeout(() => {
              setLocation("/");
            }, 500);
          } else {
            setError(data.message || "OTP login failed");
          }
        },
        onError: (err: any) => {
          const data = err?.response?.data;
          const serverMessage =
            typeof data === "string"
              ? data
              : data?.message || "OTP login failed. Please try again.";
          setError(serverMessage);
          toast({
            title: "Error",
            description: serverMessage,
            variant: "destructive",
            duration: 3000,
          });
        },
      }
    );
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
              : "Sign in with your mobile number and OTP"}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          {isSessionExpired && (
            <div className="flex items-center gap-2 p-4 mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg text-yellow-700 dark:text-yellow-400 text-sm">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>Your session has expired. Please login again.</span>
            </div>
          )}

          <div className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
<div>
  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
    Email
  </label>
  <Input
    type="email"
    placeholder="Enter your registered email"
    value={email}
    onChange={(e) => { setEmail(e.target.value); setError(""); }}
    disabled={otpSent}
    className="h-12"
  />
</div>
            {/* Mobile Number */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Mobile Number
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <span className="absolute left-10 top-1/2 -translate-y-1/2 text-gray-700 dark:text-gray-300 font-medium text-sm pointer-events-none z-10">
                    +91
                  </span>
                  <Input
                    type="tel"
                    placeholder="Enter your mobile number"
                    value={mobile}
                    maxLength={10}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!/^[0-9]*$/.test(value)) return;
                      setMobile(value);
                      setMobileError("");
                      setError("");
                    }}
                    disabled={otpSent}
                    className="pl-16 pr-4 h-12 w-full"
                  />
                </div>
                <Button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={
                    !validateMobile(mobile) ||
                    sendOtpMutation.isPending ||
                    otpSent
                  }
                  className={`h-12 px-4 sm:px-6 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 ${
                    otpSent
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {sendOtpMutation.isPending
                    ? "Sending..."
                    : otpSent
                    ? "Resend"
                    : "Send OTP"}
                </Button>
              </div>
              {mobileError && (
                <p className="text-red-500 text-sm mt-1">{mobileError}</p>
              )}
              {otpInfoMessage && otpSent && (
                <p className="text-green-500 text-sm mt-1">{otpInfoMessage}</p>
              )}
            </div>

            {/* OTP Input - Show only after OTP is sent */}
            {otpSent && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Enter OTP
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Enter 4-6 digit OTP"
                    value={otp}
                    maxLength={6}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (!/^[0-9]*$/.test(value)) return;
                      setOtp(value);
                      setError("");
                    }}
                    className="h-12"
                  />
                  <Button
                    type="button"
                    onClick={handleOtpLogin}
                    disabled={
                      !validateOtp(otp) || loginWithOtpMutation.isPending
                    }
                    className="h-12 px-4 sm:px-6 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 bg-purple-600 hover:bg-purple-700"
                  >
                    {loginWithOtpMutation.isPending
                      ? "Verifying..."
                      : "Verify & Login"}
                  </Button>
                </div>
              </div>
            )}
          </div>

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
