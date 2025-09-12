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
      let copyText = id;
      
      // ------------------------------------------------------------
      // 1. Build the deep-link URL that should open the item inside
      //    the TasksMate app when clicked.
      // ------------------------------------------------------------
      const appBase = env.APP_URL || "https://tasksmate.indrasol.com";
      let deepLink = appBase; // will be overwritten below if we recognise the prefix

      if (copyText.startsWith("T")) {
        deepLink = `${appBase}/tasks/${copyText}?org_id=${org_id}`;
      } else if (copyText.startsWith("B")) {
        deepLink = `${appBase}/tester-zone/runs/${tracker_id}/bugs/${copyText}?org_id=${org_id}`;
      } else if (copyText.startsWith("TR")) {
        deepLink = `${appBase}/tester-zone/runs/${copyText}?org_id=${org_id}`;
      } else if (copyText.startsWith("P")) {
        deepLink = `${appBase}/projects/${copyText}?org_id=${org_id}`;
      } else if (copyText.startsWith("O")) {
        deepLink = `${appBase}/dashboard?org_id=${org_id}`;
      }

      // ------------------------------------------------------------
      // 2. Prefer copying a rich clipboard item: we copy **plain text**
      //    that is just the ID (for terminals / plain-text editors) and
      //    **HTML** that renders the ID but is hyper-linked to the URL.
      //    Many modern apps (Slack, Gmail, Notion, etc.) understand the
      //    text/html clipboard flavour and will therefore paste a
      //    clickable link whose visible label is the ID.
      // ------------------------------------------------------------
      const htmlSnippet = `<a href=\"${deepLink}\">${copyText}</a>`;

      // navigator.clipboard.write is not supported everywhere.  We fall
      // back to writeText(URL) if it fails.
      // @ts-ignore – ClipboardItem is available in most evergreen
      // browsers but not yet in the TS lib shipped with the repo.
      if (navigator.clipboard && navigator.clipboard.write) {
        // @ts-ignore – suppress TS until lib.dom.d.ts is bumped
        const item = new ClipboardItem({
          // Plain text version → just the raw ID (better DX in code editors)
          "text/plain": new Blob([copyText], { type: "text/plain" }),
          // Rich HTML version  → ID that links to deepLink
          "text/html": new Blob([htmlSnippet], { type: "text/html" })
        });
        // @ts-ignore – write() exists in modern browsers
        await navigator.clipboard.write([item]);
      } else {
        // Fallback – at worst copy the full URL so that the user still
        // gets something useful.
        await navigator.clipboard.writeText(deepLink);
      }
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

