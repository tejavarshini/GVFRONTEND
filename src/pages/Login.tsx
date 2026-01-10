import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { Eye, EyeOff, Mail, Lock, AlertCircle, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logoImg from "@/attached_assets/generated_images/logo.png";
import { useLogin } from "@/hooks/useLogin";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [, setLocation] = useLocation();
  const searchParams = useSearch();
  const isSessionExpired = searchParams.includes("session=expired");

  const [emailOrMobile, setEmailOrMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");

  const loginMutation = useLogin();
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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateMobile = (mobile: string) => {
    return /^[0-9]{10}$/.test(mobile);
  };

  const validateForm = () => {
    if (!emailOrMobile.trim()) {
      setError("Email or mobile number is required");
      return false;
    }

    const isEmail = validateEmail(emailOrMobile);
    const isMobile = validateMobile(emailOrMobile);

    if (!isEmail && !isMobile) {
      setError("Please enter a valid email or 10-digit mobile number");
      return false;
    }

    if (!password) {
      setError("Password is required");
      return false;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const isLoading = loginMutation.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    loginMutation.mutate(
      {
        emailOrMobile,
        password,
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
              title: `Welcome back!, ${data.userInfo.name}`,
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
        onError: (error) => {
          if (error.response?.status === 400) {
            const errors = error.response.data as Record<string, string>;
            const errorMessage = Object.values(errors).join(", ");
            setError(errorMessage);
          } else {
            setError("Login failed. Please check your credentials.");
          }
        },
      }
    );
  };

  const isMobileNumber = /^[0-9]+$/.test(emailOrMobile);

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

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Email or Mobile */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email or Mobile Number
              </label>
              <div className="relative">
                {isMobileNumber ? (
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                ) : (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                )}
                <Input
                  placeholder="Enter your email or mobile number"
                  value={emailOrMobile}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmailOrMobile(value);
                    setError("");

                    if (value.trim() === "") {
                      setEmailError("");
                      return;
                    }

                    if (/^[0-9]+$/.test(value)) {
                      if (!/^[0-9]{10}$/.test(value)) {
                        setEmailError("Please enter a valid mobile number");
                      } else {
                        setEmailError("");
                      }
                    } else {
                      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (!emailRegex.test(value)) {
                        setEmailError("Please enter a valid email");
                      } else {
                        setEmailError("");
                      }
                    }
                  }}
                  className="pl-10 h-12"
                />
              </div>
              {emailError && (
                <p className="text-red-500 text-sm mt-1">{emailError}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Password
                </label>
                <Link href="/forgot-password">
                  <button
                    type="button"
                    className="text-sm font-medium text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <Button className="w-full h-12" type="submit" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
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
