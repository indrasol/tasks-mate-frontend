import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Badge } from "./badge";
import { env } from "@/config/env";

interface CopyableIdBadgeProps {
  id: string;
  org_id: string;
  className?: string;
  isCompleted?: boolean;
  copyLabel?: string; // Label used in toast e.g., "Task" or "Tracker"
}

const CopyableIdBadge = ({ id, org_id, className, isCompleted = false, copyLabel = "Task" }: CopyableIdBadgeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let copyTextUrl = `${env.APP_URL || "http://tasksmate.indrasol.com"}`;

      if (id.startsWith("T")) {
        copyTextUrl = `${copyTextUrl}/tasks/${id}?org_id=${org_id}`;
      } else if (id.startsWith("B")) {
        copyTextUrl = `${copyTextUrl}/tester-zone/runs/${id}/bugs/${id}?org_id=${org_id}`;
      } else if (id.startsWith("TR")) {
        copyTextUrl = `${copyTextUrl}/tester-zone/runs/${id}?org_id=${org_id}`;
      } else if (id.startsWith("P")) {
        copyTextUrl = `${copyTextUrl}/projects/${id}?org_id=${org_id}`;
      } else if (id.startsWith("O")) {
        copyTextUrl = `${copyTextUrl}/dashboard?org_id=${org_id}`;
      }
      await navigator.clipboard.writeText(copyTextUrl);
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
      <span className={cn("transition-opacity duration-150 flex items-center", copied ? "opacity-0" : "opacity-100")}>{id}
        <span className="ml-2">
          <Copy className="h-3 w-3" />
        </span>
      </span>
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

