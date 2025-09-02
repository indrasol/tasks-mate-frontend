import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitch: () => void;
}

export function SignInModal({ open, onOpenChange, onSwitch }: SignInModalProps) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [isOtp, setIsOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSubmitting, setOTPSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [resendOtpTimer, setResendOtpTimer] = useState(0);
  const [resendOtpTimerInterval, setResendOtpTimerInterval] = useState<NodeJS.Timeout | null>(null);

  const [isResendOtpDisabled, setIsResendOtpDisabled] = useState(false);

  const handleResendOtpCountdown = () => {
    let timer = 60;
    const interval = setInterval(() => {
      timer--;
      setResendOtpTimer(timer);
      setIsResendOtpDisabled(true);
      if (timer === 0) {
        clearInterval(interval);
        setResendOtpTimerInterval(null);
        setIsResendOtpDisabled(false);
      }
    }, 1000);
    setResendOtpTimerInterval(interval);
  };

  const { signIn, signInWithOtp, verifyOtp, forgotPassword } = useAuth();

  const navigate = useNavigate();

  const { search } = useLocation();
  const searchParams = new URLSearchParams(search);
  const orgId = searchParams.get("org_id");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isOtp) {
        await verifyOtp(identifier, otp);
      } else {
        await signIn(identifier, password);
      }

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });

      onOpenChange(false);

      navigate(orgId ? `/dashboard?org_id=${orgId}` : "/org");
    } catch (error: any) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setIdentifier("");
    setPassword("");
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await forgotPassword(identifier);
      toast({ title: "Check your inbox", description: "We sent you a password reset e-mail." });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: "Failed to send reset password link", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSend = async (e) => {
    e.preventDefault();
    setOTPSubmitting(true);
    try {
      await signInWithOtp(identifier);
      toast({ title: "Check your inbox", description: "OTP sent successfully." });
      setIsOtp(true);
      setOtpSent(true);
    } catch (err: any) {
      toast({ title: "Failed to send OTP", description: err.message, variant: "destructive" });
    } finally {
      setOTPSubmitting(false);
      handleResendOtpCountdown();
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) resetForm();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to TasksMate</DialogTitle>
          <DialogDescription>
            Enter your email or username and password to sign in
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSignIn} className="space-y-4">
          <div>
            <Label htmlFor="signin-identifier">Email or Username</Label>
            <Input
              id="signin-identifier"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="Enter your email or username"
              required
            />
          </div>

          {!isOtp && (
            <div>
              <div className="flex justify-between h-5">
                <Label htmlFor="signin-password">Password</Label>
              </div>
              <div>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

          )}
          {isOtp && (
            <div>
              <div className="flex justify-between h-5">
                <Label htmlFor="signin-otp">OTP</Label>
                <button
                  type="button"
                  className="text-sm text-green-600 cursor-pointer  disabled:opacity-50"
                  onClick={handleOtpSend}
                  disabled={otpSubmitting || isResendOtpDisabled || loading}
                >


                  {(otpSent ? (otpSubmitting ? "Sending OTP..." : (resendOtpTimer > 0 ? "Re-send OTP (" + resendOtpTimer + "s)" : "Re-send OTP")) : (otpSubmitting ? "Sending OTP..." : "Send OTP"))}

                  {/* {(otpSubmitting ? "Sending OTP..." : (isOtp ? (resendOtpTimer > 0 ? "Re-send OTP (" + resendOtpTimer + "s)" : "Re-send OTP") : "Send OTP"))} */}
                </button>
              </div>
              <div >

                <Input
                  id="signin-otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter your OTP"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              className="text-sm text-green-600 cursor-pointer  disabled:opacity-50"
              onClick={() => setIsOtp(!isOtp)}
              disabled={loading}
            >
              {/* {(otpSubmitting ? "Sending OTP..." : (isOtp ? (resendOtpTimer > 0 ? "Re-send OTP (" + resendOtpTimer + "s)" : "Re-send OTP") : "Login with OTP"))} 
              
              */}

              {isOtp ? "Sign in with Password" : "Sign in with OTP"}
            </button>
            <button
              type="button"
              className="text-sm text-green-600 cursor-pointer  disabled:opacity-50"
              onClick={handleSend}
              disabled={submitting}
            >
              {submitting ? "Sending reset password link…" : "Forgot password?"}
            </button>
          </div>
          <Button
            type="submit"
            className="w-full bg-tasksmate-gradient cursor-pointer disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
          <p className="text-center text-xs mt-4">
            Don't have an account?{" "}
            <button
              type="button"
              className="text-green-600 cursor-pointer  font-medium"
              onClick={() => {
                onOpenChange(false);
                onSwitch?.();
              }}
            >
              Sign up instead
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}