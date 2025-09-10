import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      onClick={toggleTheme} 
      aria-label="Toggle theme"
      className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      ) : (
        <Moon className="h-4 w-4 text-gray-600 dark:text-gray-300" />
      )}
    </Button>
  );
}


