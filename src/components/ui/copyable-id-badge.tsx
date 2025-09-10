import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { Badge } from "./badge";
import { env } from "@/config/env";

interface CopyableIdBadgeProps {
  id: string;
  org_id: string;
  tracker_id?: string;
  className?: string;
  isCompleted?: boolean;
  copyLabel?: string; // Label used in toast e.g., "Task" or "Tracker"
}

const CopyableIdBadge = ({ id, org_id, tracker_id, className, isCompleted = false, copyLabel = "Task" }: CopyableIdBadgeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      let copyTextToCopy = id;
      
      // For organization IDs, copy just the org_id instead of the full URL
      if (id.startsWith("O")) {
        copyTextToCopy = id;
      } else {
        // For other types (Tasks, Bugs, etc.), keep the full URL behavior
        let copyTextUrl = `${env.APP_URL || "http://tasksmate.indrasol.com"}`;

        if (id.startsWith("T")) {
          copyTextUrl = `${copyTextUrl}/tasks/${id}?org_id=${org_id}`;
          copyTextToCopy = copyTextUrl;
        } else if (id.startsWith("B")) {
          copyTextUrl = `${copyTextUrl}/tester-zone/runs/${tracker_id}/bugs/${id}?org_id=${org_id}`;
          copyTextToCopy = copyTextUrl;
        } else if (id.startsWith("TR")) {
          copyTextUrl = `${copyTextUrl}/tester-zone/runs/${id}?org_id=${org_id}`;
          copyTextToCopy = copyTextUrl;
        } else if (id.startsWith("P")) {
          copyTextUrl = `${copyTextUrl}/projects/${id}?org_id=${org_id}`;
          copyTextToCopy = copyTextUrl;
        }
      }
      
      await navigator.clipboard.writeText(copyTextToCopy);
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
        "max-w-full min-w-0 flex-shrink",
        isCompleted ? "line-through text-black" : "text-white",
        className
      )}
      title={`Click to copy ID: ${id}`}
      onClick={handleCopy}
    >
      <span className={cn(
        "transition-opacity duration-150 flex items-center min-w-0 flex-shrink",
        copied ? "opacity-0" : "opacity-100"
      )}>
        <span className="truncate flex-shrink min-w-0">{id}</span>
        <span className="ml-1 sm:ml-2 flex-shrink-0">
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

