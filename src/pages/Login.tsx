import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Check, KanbanSquare, LayoutDashboard, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const Login = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendOtpTimer, setResendOtpTimer] = useState(0);
  const [isResendOtpDisabled, setIsResendOtpDisabled] = useState(false);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  // Determine whether we are signing up or logging in
  const [mode, setMode] = useState<"signup" | "login">("login");

  // Helper to switch modes and reset form/flow state
  const handleModeChange = (newMode: "signup" | "login") => {
    setMode(newMode);
    // Reset form fields & OTP flow for clean UX
    setUsername("");
    setEmail("");
    setOtp("");
    setIsOtpSent(false);
    setResendOtpTimer(0);
    setIsResendOtpDisabled(false);
  };

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const orgId = searchParams.get("org_id");

  // Features array for animated cards
  const features = [
    {
      icon: <LayoutDashboard className="h-6 w-6 text-tasksmate-green-end" />,
      title: "Unified metrics dashboard",
      description: "All your project, task & bug metrics in one powerful view — plus a scratchpad for quick notes.",
      badge: "Insights"
    },
    {
      icon: <MessageCircle className="h-6 w-6 text-tasksmate-green-end" />,
      title: "Comment & collaborate",
      description: "Keep everyone in sync with threaded discussions",
      avatars: true
    },
    {
      icon: <KanbanSquare className="h-6 w-6 text-tasksmate-green-end" />,
      title: "Projects, tasks & bugs united",
      description: "Seamlessly manage your projects, tasks, and bug tracker in a single workspace",
      badge: "Suite"
    }
  ];

  // Feature animation effect
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeatureIndex((prevIndex) => (prevIndex + 1) % features.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const { signInWithOtp, verifyOtp } = useAuth();

  // Utility: check if email already has an account
  const checkIfRegistered = async (emailToCheck: string): Promise<boolean> => {
    try {
      // We attempt a dummy sign-in OTP request with shouldCreateUser=false.
      // If Supabase returns error "User not found", we treat as unregistered.
      await signInWithOtp(emailToCheck, undefined, false);
      return true; // request succeeded, user exists
    } catch (err: any) {
      if (err?.message?.toLowerCase().includes("user not found") || err?.status === 400) {
        return false;
      }
      // other errors propagate
      throw err;
    }
  };

  const handleResendOtpCountdown = () => {
    let timer = 60;
    const interval = setInterval(() => {
      timer--;
      setResendOtpTimer(timer);
      setIsResendOtpDisabled(true);
      if (timer === 0) {
        clearInterval(interval);
        setIsResendOtpDisabled(false);
      }
    }, 1000);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "Email required",
        description: "Please enter your email address",
        variant: "destructive",
      });
      return;
    }

    if (mode === "signup" && !username) {
      toast({
        title: "Username required",
        description: "Please enter your username",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Logic differs slightly per mode

      try {
        await signInWithOtp(
          email,
          mode === "signup" ? username : undefined,
          mode === "signup" // shouldCreateUser true only for signup mode
        );
      } catch (err: any) {
        // In login mode, treat "Signups not allowed" / "User not found" as missing account
        if (
          mode === "login" &&
          (err?.message?.toLowerCase().includes("user not found") ||
            err?.message?.toLowerCase().includes("signup") ||
            err?.status === 400)
        ) {
          toast({
            title: "Account not found",
            description: "Please sign up first.",
            variant: "destructive",
          });
          handleModeChange("signup");
          return;
        }
        // Unknown error – surface to user
        throw err;
      }
      toast({
        title: "OTP Sent",
        description: "Check your email for the one-time password",
      });
      setIsOtpSent(true);
      handleResendOtpCountdown();
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !otp) {
      toast({
        title: "Missing information",
        description: "Please enter both email and OTP",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await verifyOtp(email, otp, mode === "signup" ? username : undefined);
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
      navigate(orgId ? `/dashboard?org_id=${orgId}` : "/org");
    } catch (error: any) {
      toast({
        title: "Verification failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side - Animated Feature Cards */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-white via-slate-50 to-slate-100 px-16 py-12 items-center justify-center">
        <div className="relative space-y-6 w-full">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-tasksmate-gradient opacity-5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-tasksmate-gradient opacity-5 rounded-full blur-3xl pointer-events-none" />

          <div className="text-center space-y-2 mb-6">
            <h2 className="font-sora font-bold text-2xl">
              Everything you need to <span className="bg-tasksmate-gradient bg-clip-text text-transparent">stay organized</span>
            </h2>
            <p className="text-gray-600 text-sm">Powerful features that make task management effortless</p>
          </div>

          <div className="space-y-5">
            {features.map((feature, index) => (
              <Card
                key={index}
                className={`glass border-0 shadow-tasksmate transition-all duration-500 transform ${activeFeatureIndex === index
                  ? "opacity-100 translate-y-0 scale-100"
                  : "opacity-40 translate-y-2 scale-95"
                  }`}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    {feature.icon}
                    {feature.badge && (
                      <Badge className="bg-tasksmate-gradient text-white border-0">
                        {feature.badge}
                      </Badge>
                    )}
                    {feature.avatars && (
                      <div className="flex -space-x-2">
                        <Avatar className="w-6 h-6 border-2 border-white">
                          <AvatarFallback className="text-xs bg-tasksmate-green-end text-white">S</AvatarFallback>
                        </Avatar>
                        <Avatar className="w-6 h-6 border-2 border-white">
                          <AvatarFallback className="text-xs bg-tasksmate-green-end text-white">M</AvatarFallback>
                        </Avatar>
                        <Avatar className="w-6 h-6 border-2 border-white">
                          <AvatarFallback className="text-xs bg-tasksmate-green-end text-white">A</AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                  </div>
                  <h3 className="font-sora font-semibold text-lg">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex justify-center space-x-2 mt-6">
            {features.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${activeFeatureIndex === index ? "bg-tasksmate-green-end w-4" : "bg-gray-300"
                  }`}
                onClick={() => setActiveFeatureIndex(index)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right side - Login form and TasksMate branding */}
      <div className="w-full lg:w-1/2 flex flex-col p-6">
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-tasksmate-green-end transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Home
          </button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center">
                  <Check className="h-5 w-5 text-white" />
                </div>
                <div className="flex items-baseline space-x-2">
                  <span className="font-sora font-bold text-xl">TasksMate</span>
                  <a
                    href="https://indrasol.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    by Indrasol
                  </a>
                </div>
              </div>

              <div className="text-center mb-4">
                <p className="text-gray-500 text-sm">
                  Enter your details to get started
                </p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 space-y-6">
              <div className="flex justify-center space-x-4">
                <button
                  type="button"
                  className={`text-sm font-medium transition-colors ${mode === 'login' ? 'text-tasksmate-green-end' : 'text-gray-500'}`}
                  onClick={() => handleModeChange('login')}
                >
                  Login
                </button>
                <button
                  type="button"
                  className={`text-sm font-medium transition-colors ${mode === 'signup' ? 'text-tasksmate-green-end' : 'text-gray-500'}`}
                  onClick={() => handleModeChange('signup')}
                >
                  Sign Up
                </button>
              </div>
              {!isOtpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  {mode === 'signup' && (
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        type="text"
                        placeholder="johndoe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-tasksmate-gradient hover:bg-tasksmate-gradient"
                    disabled={loading}
                  >
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </Button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <Label htmlFor="otp">One-Time Password</Label>
                      <button
                        type="button"
                        className="text-sm text-tasksmate-green-end font-medium disabled:opacity-50"
                        onClick={handleSendOtp}
                        disabled={isResendOtpDisabled || loading}
                      >
                        {resendOtpTimer > 0
                          ? `Resend OTP (${resendOtpTimer}s)`
                          : "Resend OTP"}
                      </button>
                    </div>
                    <Input
                      id="otp"
                      type="text"
                      placeholder="Enter your OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500">
                      Check your email inbox for OTP
                    </p>
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-tasksmate-gradient hover:bg-tasksmate-gradient"
                    disabled={loading}
                  >
                    {loading ? "Verifying..." : "Verify OTP"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
