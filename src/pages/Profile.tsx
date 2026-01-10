import { useAuthContext } from "@/contexts/AuthContext";
import { useLogout } from "@/hooks/useLogout";
import { useFetchWallet } from "@/hooks/useFetchWallet"; // ✅ Use existing hook
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, User, Mail, Wallet } from "lucide-react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

export default function Profile() {
  const { user, logout: contextLogout } = useAuthContext();
  const logoutMutation = useLogout();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  // ✅ Fetch wallet balance using existing hook
  const { data: walletData, isLoading: walletLoading } = useFetchWallet(user?.clientId);

  const handleLogout = () => {
    if (!user?.token) return;

    logoutMutation.mutate(
      { token: user.token },
      {
        onSuccess: (message) => {
          contextLogout();
          localStorage.removeItem('shopping_cart');
          toast({
            title: "Logged out",
            description: message,
            duration: 3000,
          });
          setLocation("/login");
        },
        onError: () => {
          contextLogout();
          localStorage.removeItem('shopping_cart');
          toast({
            title: "Logged out",
            description: "You have been logged out",
            duration: 3000,
          });
          setLocation("/login");
        },
      }
    );
  };

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-1 py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Back Button */}
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-6 gap-2 hover:bg-accent"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {/* Profile Card */}
          <div className="bg-card border border-border rounded-lg shadow-sm p-6 md:p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-10 w-10 text-primary" />
              </div>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-center mb-8">
              My Profile
            </h1>

            {/* User Info */}
            <div className="space-y-6 mb-8">
              {/* Name */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Name</p>
                  <p className="font-medium text-foreground">{user?.name || "User"}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <p className="font-medium text-foreground break-all">{user?.email || "No email"}</p>
                </div>
              </div>

              {/* ✅ Wallet Balance - NEW SECTION */}
              <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20">
                <Wallet className="h-5 w-5 text-primary mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">Total Points</p>
                  {walletLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">Loading...</p>
                    </div>
                  ) : walletData ? (
                    <p className="text-2xl font-bold text-primary">
                      {walletData.totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Unable to load balance</p>
                  )}
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <Button
              onClick={handleLogout}
              variant="destructive"
              className="w-full gap-2 h-11"
              disabled={logoutMutation.isPending}
            >
              <LogOut className="h-5 w-5" />
              {logoutMutation.isPending ? "Logging out..." : "Logout"}
            </Button>
          </div>
        </div>
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
