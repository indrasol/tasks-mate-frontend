import { useState, type ReactNode, MouseEvent } from "react";
import { Badge } from "./badge";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface CopyableBadgeProps {
  copyText: string;
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
}

const CopyableBadge = ({ copyText, children, className, variant = "outline" }: CopyableBadgeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(copyText);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 900);
    } catch (_) {
      // ignore
    }
  };

  return (
    <Badge
      variant={variant}
      className={cn("relative cursor-pointer select-none overflow-hidden hover:bg-transparent", className)}
      title="Click to copy"
      onClick={handleCopy}
    >
      <span className={cn("transition-opacity duration-150 flex items-center", copied ? "opacity-0" : "opacity-100")}>{children}</span>
      <span
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-150",
          copied ? "opacity-100 scale-100" : "opacity-0 scale-75"
        )}
      >
        <Check className="h-3 w-3" />
      </span>
    </Badge>
  );
};

export default CopyableBadge;

