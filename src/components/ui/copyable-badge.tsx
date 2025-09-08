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
      let copyTextUrl = `${env.APP_URL || "http://tasksmate.indrasol.com"}`;

      if (copyText.startsWith("T")) {
        copyTextUrl = `${copyTextUrl}/tasks/${copyText}?org_id=${org_id}`;
      } else if (copyText.startsWith("B")) {
        copyTextUrl = `${copyTextUrl}/tester-zone/runs/${copyText}/bugs/${copyText}?org_id=${org_id}`;
      } else if (copyText.startsWith("TR")) {
        copyTextUrl = `${copyTextUrl}/tester-zone/runs/${copyText}?org_id=${org_id}`;
      } else if (copyText.startsWith("P")) {
        copyTextUrl = `${copyTextUrl}/projects/${copyText}?org_id=${org_id}`;
      } else if (copyText.startsWith("O")) {
        copyTextUrl = `${copyTextUrl}/dashboard?org_id=${org_id}`;
      }
      await navigator.clipboard.writeText(copyTextUrl);
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

