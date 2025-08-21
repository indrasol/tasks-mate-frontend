import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";
import { useState } from "react";
import { Badge } from "./badge";

interface CopyableIdBadgeProps {
  id: string;
  className?: string;
  isCompleted?: boolean;
  copyLabel?: string; // Label used in toast e.g., "Task" or "Tracker"
}

const CopyableIdBadge = ({ id, className, isCompleted = false, copyLabel = "Task" }: CopyableIdBadgeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      toast({
        title: "Success",
        description: `${copyLabel} ID copied`,
        variant: "default"
      });
      setTimeout(() => setCopied(false), 900);
    } catch (err: any) {
      toast({
        title: "Failed to copy to clipboard",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  return (
    <Badge
      className={cn(
        "text-xs font-mono cursor-pointer select-none relative overflow-hidden",
        isCompleted ? "line-through text-black" : "text-white",
        className
      )}
      title="Click to copy ID"
      onClick={handleCopy}
    >
      <span className={cn("transition-opacity duration-150", copied ? "opacity-0" : "opacity-100")}>{id}</span>
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

export default CopyableIdBadge;

