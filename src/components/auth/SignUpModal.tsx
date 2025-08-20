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
import { useNavigate } from "react-router-dom";

interface SignUpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitch: () => void;
}

export function SignUpModal({ open, onOpenChange, onSwitch }: SignUpModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Trim username and password to prevent whitespace-only input
    if (username.trim() === "" || password.trim() === "") {
      toast({
        title: "Invalid input",
        description: "Username and Password cannot be empty or just spaces.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    try {
      const msg = await signUp({ email, password, username });

      toast({
        title: "Success",
        description: msg,
      });

      onOpenChange(false);
      setEmail("");
      setPassword("");
      setUsername("");

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Error creating account",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create your TasksMate account</DialogTitle>
          <DialogDescription>
            Join thousands of teams organizing their work with TasksMate
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="johndoe"
              required
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Spacebar") {
                  e.preventDefault();
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@company.com"
              required
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Spacebar") {
                  e.preventDefault();
                }
              }}
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
              minLength={6}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Spacebar") {
                  e.preventDefault();
                }
              }}
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-tasksmate-gradient"
            disabled={loading}
          >
            {loading ? "Creating account..." : "Sign Up"}
          </Button>

          <p className="text-center text-xs mt-4">
            Already have an account?{" "}
            <button
              type="button"
              className="text-green-600 hover:underline font-medium"
              onClick={() => {
                onOpenChange(false);
                onSwitch?.();
              }}
            >
              Sign in instead
            </button>
          </p>


        </form>
      </DialogContent>
    </Dialog>
  );
}