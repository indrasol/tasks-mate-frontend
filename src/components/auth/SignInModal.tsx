
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SignInModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignInModal({ open, onOpenChange }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const { toast } = useToast();

  const handleEmailPasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });

      onOpenChange(false);
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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/tasks_catalog`,
        },
      });

      if (error) throw error;

      setOtpSent(true);
      toast({
        title: "Check your email",
        description: "We've sent you a login code.",
      });
    } catch (error: any) {
      toast({
        title: "Error sending login code",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) throw error;

      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Invalid code",
        description: "Please check your code and try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setOtp("");
    setOtpSent(false);
  };

  return (
    <Dialog open={open} onOpenChange={(open) => {
      onOpenChange(open);
      if (!open) resetForm();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sign in to TasksMate</DialogTitle>
          <DialogDescription>
            Choose your preferred sign in method
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="password" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="magic-link">Magic Link</TabsTrigger>
          </TabsList>
          
          <TabsContent value="password" className="space-y-4">
            <form onSubmit={handleEmailPasswordSignIn} className="space-y-4">
              <div>
                <Label htmlFor="signin-email">Email</Label>
                <Input
                  id="signin-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>
              <div>
                <Label htmlFor="signin-password">Password</Label>
                <Input
                  id="signin-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-tasksmate-gradient"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </TabsContent>
          
          <TabsContent value="magic-link" className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <Label htmlFor="magic-email">Email</Label>
                  <Input
                    id="magic-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-tasksmate-gradient"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Send Login Code"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <Label htmlFor="otp">Login Code</Label>
                  <Input
                    id="otp"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit code"
                    required
                    maxLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-tasksmate-gradient"
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Sign In"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={resetForm}
                >
                  Use different email
                </Button>
              </form>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
