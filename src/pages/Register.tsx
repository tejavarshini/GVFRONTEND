import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Mail,
  AlertCircle,
  CheckCircle,
  Smartphone,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImg from "@/attached_assets/generated_images/logo.png";
import { useToast } from "@/hooks/use-toast";
import { useRegisterSendOtp } from "@/hooks/useRegisterSendOtp";
import { useRegisterVerifyOtp } from "@/hooks/useRegisterVerifyOtp";
import { useAuthContext } from "@/contexts/AuthContext";
import { decodeJwtPayload } from "@/api/authApi";

export default function Register() {
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  const [error, setError] = useState("");
  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const registerSendOtpMutation = useRegisterSendOtp();
  const registerVerifyOtpMutation = useRegisterVerifyOtp();
  const { setUser } = useAuthContext();

  const { toast } = useToast();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateMobile = (mobile: string) => /^[0-9]{10}$/.test(mobile);

  const validateOtp = (otp: string) => /^[0-9]{4,6}$/.test(otp);

  const validateRegistrationForm = () => {
    let isValid = true;
    setError("");
    setNameError("");
    setEmailError("");
    setMobileError("");

    if (!fullName.trim()) {
      setNameError("Full name is required");
      isValid = false;
    }

    if (!email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!validateEmail(email)) {
      setEmailError("Please enter a valid email");
      isValid = false;
    }

    if (!mobile.trim()) {
      setMobileError("Mobile number is required");
      isValid = false;
    } else if (!validateMobile(mobile)) {
      setMobileError("Please enter a valid 10-digit mobile number");
      isValid = false;
    }

    return isValid;
  };

  const handleSendOtp = async () => {
    if (!validateRegistrationForm()) {
      return;
    }

    // Reset OTP states when resending
    setOtp("");
    setOtpSent(false);

    registerSendOtpMutation.mutate(mobile, {
      onSuccess: (data) => {
        if (data.alreadyRegistered) {
          toast({
            title: "Mobile already registered",
            description: data.message || "This mobile number is already registered. Please login.",
            variant: "destructive",
            duration: 4000,
          });
          // Redirect to login after showing message
          setTimeout(() => {
            setLocation("/login");
          }, 2000);
          return;
        }
        if (data.success) {
          setOtpSent(true);
          toast({
            title: "OTP Sent!",
            description: data.message || "OTP has been sent to your mobile number",
            duration: 3000,
          });
        }
      },
      onError: (error: any) => {
        toast({
          title: "Error",
          description: error.response?.data?.message || error.message || "Failed to send OTP. Please try again.",
          variant: "destructive",
          duration: 3000,
        });
      },
    });
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      toast({
        title: "Error",
        description: "Please enter the OTP",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!validateOtp(otp)) {
      toast({
        title: "Error",
        description: "Please enter a valid 4-6 digit OTP",
        variant: "destructive",
        duration: 3000,
      });
      return;
    }

    if (!validateRegistrationForm()) {
      return;
    }

    registerVerifyOtpMutation.mutate(
      { fullName, email, mobileNumber: mobile, otp },
      {
        onSuccess: (data) => {
          if (data.success && data.token) {
            const payload = decodeJwtPayload(data.token);
            setUser({
              name: fullName,
              email,
              mobile,
              token: data.token,
              clientId: payload.userId ?? "",
            });
            toast({
              title: "Registration successful!",
              description: data.message || "Welcome. You are now logged in.",
              duration: 3000,
            });
            setTimeout(() => {
              setLocation("/");
            }, 500);
          }
        },
        onError: (error: any) => {
          toast({
            title: "Error",
            description: error.response?.data?.message || error.message || "Invalid OTP. Please try again.",
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
        {/* Logo */}
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
            Create Account
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sign up with your mobile number and OTP
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <div className="space-y-6">
            {/* Error box */}
            {error && (
              <div
                className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 
              border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm"
              >
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
              </div>
            )}

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value);
                    setNameError("");
                  }}
                  disabled={otpSent}
                  className="pl-10 pr-4 h-12"
                />
              </div>
              {nameError && (
                <p className="text-red-500 text-sm mt-1">{nameError}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);
                    setEmailError("");
                  }}
                  disabled={otpSent}
                  className="pl-10 pr-4 h-12"
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
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
                    !validateEmail(email) ||
                    !fullName.trim() ||
                    registerSendOtpMutation.isPending ||
                    otpSent
                  }
                  className={`h-12 px-4 sm:px-6 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 ${
                    otpSent
                      ? "bg-green-500 hover:bg-green-600"
                      : "bg-purple-600 hover:bg-purple-700"
                  }`}
                >
                  {registerSendOtpMutation.isPending
                    ? "Sending..."
                    : otpSent
                    ? "Resend"
                    : "Send OTP"}
                </Button>
              </div>
              {mobileError && (
                <p className="text-red-500 text-sm mt-1">{mobileError}</p>
              )}
              {otpSent && !mobileError && (
                <p className="text-green-500 text-sm mt-1 flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  OTP sent successfully
                </p>
              )}
            </div>

            {/* OTP Verification - Show only after OTP is sent */}
            {otpSent && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Enter OTP
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Enter 4-6 digit OTP"
                      value={otp}
                      maxLength={6}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!/^[0-9]*$/.test(value)) return;
                        setOtp(value);
                      }}
                      className="pl-4 pr-4 h-12 w-full"
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={
                      !validateOtp(otp) ||
                      registerVerifyOtpMutation.isPending
                    }
                    className="h-12 px-4 sm:px-6 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 bg-purple-600 hover:bg-purple-700"
                  >
                    {registerVerifyOtpMutation.isPending
                      ? "Verifying..."
                      : "Verify OTP"}
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Switch to Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login">
                <button className="font-semibold text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors">
                  Sign in
                </button>
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
          By creating an account, you agree to our Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
