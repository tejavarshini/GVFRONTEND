import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle,
  Smartphone,
  CaseUpper,
  CaseLower,
  Hash,
  Sparkles,
  Ruler,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImg from "@/attached_assets/generated_images/logo.png";
import { useSignup } from "@/hooks/useSignup";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [mobileError, setMobileError] = useState("");

  const signupMutation = useSignup();
  const { toast } = useToast();

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateMobile = (mobile: string) => /^[0-9]{10}$/.test(mobile);

  const validatePassword = (pass: string) => {
    const strongRegex =
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|:;"'<>,.?/~`]).{8,16}$/;
    return strongRegex.test(pass);
  };

  const validateForm = () => {
    if (!fullName.trim()) {
      setError("Full name is required");
      return false;
    }
    if (!email.trim()) {
      setError("Email is required");
      return false;
    }
    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (!mobile.trim()) {
      setError("Mobile number is required");
      return false;
    }
    if (!validateMobile(mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return false;
    }
    if (!password) {
      setError("Password is required");
      return false;
    }
    if (!validatePassword(password)) {
      setError(
        "Password must be 8–16 characters and include uppercase, lowercase, number, and special character"
      );
      return false;
    }
    if (!confirmPassword) {
      setError("Please confirm your password");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    return true;
  };

  const isLoading = signupMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    signupMutation.mutate(
      {
        name: fullName,
        mobile,
        email,
        password,
      },
      {
        onSuccess: (message) => {
          toast({
            title: "Success!",
            description: message,
            duration: 3000,
          });
          // Automatically log them in after signup or redirect to login
          setLocation("/login");
        },
        onError: (error: any) => {
          if (error.response?.status === 400) {
            // Backend validation errors
            const errors = error.response.data as Record<string, string>;
            const errorMessage = Object.values(errors).join(", ");
            setError(errorMessage);
          } else if (error.response?.status === 409) {
            // Duplicate email or mobile
            setError(error.response.data); // "Email already exists" or "Mobile Number already exists"
          } else {
            setError(error.message || "Registration failed. Please try again.");
          }
        },
      }
    );
  };

  const passwordsMatch =
    password && confirmPassword && password === confirmPassword;

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
            Sign up to get started with gift vouchers
          </p>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
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
                    setNameError(
                      e.target.value.trim() ? "" : "Please enter your full name"
                    );
                  }}
                  className="pl-10 pr-10 h-12"
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
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);

                    if (!validateEmail(value)) {
                      setEmailError("Please enter a valid email");
                    } else {
                      setEmailError("");
                    }
                  }}
                  className="pl-10 pr-10 h-12"
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
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Enter your mobile number"
                  value={mobile}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (!/^[0-9]*$/.test(value)) return;
                    setMobile(value);

                    if (!validateMobile(value)) {
                      setMobileError(
                        "Please enter a valid 10-digit mobile number"
                      );
                    } else {
                      setMobileError("");
                    }
                  }}
                  className="pl-10 pr-10 h-12"
                />
              </div>
              {mobileError && (
                <p className="text-red-500 text-sm mt-1">{mobileError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError("");
                  }}
                  className="pl-10 pr-10 h-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Password Rules */}
            <div className="flex items-center justify-between mt-3">
              {/* Uppercase */}
              <div className="relative group">
                <CaseUpper
                  className={`h-6 w-6 transition-colors ${
                    /[A-Z]/.test(password) ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-7 hidden group-hover:block 
                bg-black text-white text-xs px-2 py-1 rounded shadow"
                >
                  Must contain at least 1 uppercase letter
                </span>
              </div>

              {/* Lowercase */}
              <div className="relative group">
                <CaseLower
                  className={`h-6 w-6 transition-colors ${
                    /[a-z]/.test(password) ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-7 hidden group-hover:block 
                bg-black text-white text-xs px-2 py-1 rounded shadow"
                >
                  Must contain at least 1 lowercase letter
                </span>
              </div>

              {/* Number */}
              <div className="relative group">
                <Hash
                  className={`h-6 w-6 transition-colors ${
                    /\d/.test(password) ? "text-green-500" : "text-red-500"
                  }`}
                />
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-7 hidden group-hover:block 
                bg-black text-white text-xs px-2 py-1 rounded shadow"
                >
                  Must contain at least 1 number
                </span>
              </div>

              {/* Special Character */}
              <div className="relative group">
                <Sparkles
                  className={`h-6 w-6 transition-colors ${
                    /[!@#$%^&*()_+\-={}[\]|:;"'<>,.?/~`]/.test(password)
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                />
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-7 hidden group-hover:block 
                bg-black text-white text-xs px-2 py-1 rounded shadow"
                >
                  Must contain at least 1 special character
                </span>
              </div>

              {/* Length */}
              <div className="relative group">
                <Ruler
                  className={`h-6 w-6 transition-colors ${
                    password.length >= 8 && password.length <= 16
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                />
                <span
                  className="absolute left-1/2 -translate-x-1/2 bottom-7 hidden group-hover:block 
                bg-black text-white text-xs px-2 py-1 rounded shadow"
                >
                  Password length must be 8–16 characters
                </span>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError("");
                  }}
                  className={`pl-10 pr-10 h-12 ${
                    passwordsMatch
                      ? "border-green-500 focus:border-green-500"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>

              {passwordsMatch && (
                <div className="flex items-center gap-2 mt-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Passwords match</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <Button className="w-full h-12" type="submit" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{" "}
              <Link href="/login">
                <button className="font-semibold text-purple-600">
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
