import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DateBadgeProps {
  date: string | Date | null | undefined;
  className?: string;
  format?: 'short' | 'long' | 'relative';
}

export default function DateBadge({ date, className, format = 'short' }: DateBadgeProps) {
  if (!date) {
    return (
      <Badge variant="outline" className={cn("text-xs text-gray-500", className)}>
        N/A
      </Badge>
    );
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return (
      <Badge variant="outline" className={cn("text-xs text-gray-500", className)}>
        Invalid Date
      </Badge>
    );
  }

  let formattedDate: string;

  switch (format) {
    case 'long':
      formattedDate = dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      break;
    case 'relative':
      const now = new Date();
      const diffInMs = now.getTime() - dateObj.getTime();
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      if (diffInDays === 0) {
        formattedDate = 'Today';
      } else if (diffInDays === 1) {
        formattedDate = 'Yesterday';
      } else if (diffInDays < 7) {
        formattedDate = `${diffInDays} days ago`;
      } else if (diffInDays < 30) {
        const weeks = Math.floor(diffInDays / 7);
        formattedDate = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
      } else {
        formattedDate = dateObj.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: dateObj.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
      }
      break;
    case 'short':
    default:
      formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
      break;
  }

  return (
    <Badge 
      variant="outline" 
      className={cn("text-xs font-medium", className)}
      title={dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
    >
      {formattedDate}
    </Badge>
  );
}
