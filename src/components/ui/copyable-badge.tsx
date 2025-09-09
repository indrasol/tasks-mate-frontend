import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Check, Copy } from "lucide-react";
import { MouseEvent, useState, type ReactNode } from "react";
import { Badge } from "./badge";
import { env } from "@/config/env";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface CopyableBadgeProps {
  copyText: string;
  children: ReactNode;
  className?: string;
  variant?: BadgeVariant;
  org_id: string;
}

const CopyableBadge = ({ org_id, copyText, children, className, variant = "outline" }: CopyableBadgeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: MouseEvent) => {
    e.stopPropagation();
    try {
      // ------------------------------------------------------------
      // 1. Build the deep-link URL that should open the item inside
      //    the TasksMate app when clicked.
      // ------------------------------------------------------------
      const appBase = env.APP_URL || "https://tasksmate.indrasol.com";
      let deepLink = appBase; // will be overwritten below if we recognise the prefix

      if (copyText.startsWith("T")) {
        deepLink = `${appBase}/tasks/${copyText}?org_id=${org_id}`;
      } else if (copyText.startsWith("B")) {
        deepLink = `${appBase}/tester-zone/runs/${copyText}/bugs/${copyText}?org_id=${org_id}`;
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
        description: "Copied to clipboard",
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
      variant={variant}
      className={cn("relative cursor-pointer select-none overflow-hidden hover:bg-transparent", className)}
      title="Click to copy"
      onClick={handleCopy}
    >
      <span className={cn("transition-opacity duration-150 flex items-center", copied ? "opacity-0" : "opacity-100")}>{children}
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

export default CopyableBadge;

