
import React, { useState, useEffect, useRef } from 'react';
import { X, Check, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface ScratchpadDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ScratchpadDrawer = ({ open, onOpenChange }: ScratchpadDrawerProps) => {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveCheck, setShowSaveCheck] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Auto-save with debounce
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    if (content.trim()) {
      saveTimeoutRef.current = setTimeout(() => {
        // Save to localStorage for persistence
        localStorage.setItem('scratchpad-content', content);
        setLastSaved(new Date());
        setShowSaveCheck(true);
        
        // Hide checkmark after animation
        setTimeout(() => setShowSaveCheck(false), 2000);
      }, 500);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content]);

  // Load content on mount
  useEffect(() => {
    const saved = localStorage.getItem('scratchpad-content');
    if (saved) {
      setContent(saved);
    }
  }, []);

  // Format current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClear = () => {
    setContent('');
    localStorage.removeItem('scratchpad-content');
    setLastSaved(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle slash commands
    if (e.key === '/') {
      // TODO: Implement slash menu for /task and /meeting
      console.log('Slash command triggered');
    }
    
    // Handle Cmd+Enter for todo conversion
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      // TODO: Implement "Convert highlighted todos" modal
      console.log('Convert todos triggered');
    }
  };

  // Process content to highlight #T1234 patterns and "todo:" text
  const processContent = (text: string) => {
    return text
      .replace(/(#T\d+)/g, '<span class="bg-purple-100 text-purple-800 px-1 rounded">$1</span>')
      .replace(/(todo:)/gi, '<span class="bg-yellow-100 text-yellow-800 px-1 rounded font-medium">$1</span>');
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="fixed right-0 top-0 h-full w-[350px] rounded-none border-l">
        <DrawerHeader className="border-b border-gray-200 flex flex-row items-center justify-between py-3 px-4">
          <div>
            <DrawerTitle className="text-sm font-medium text-gray-900">
              Scratchpad
            </DrawerTitle>
            <DrawerDescription className="text-xs text-gray-500 mt-1">
              {getCurrentDateTime()}
            </DrawerDescription>
          </div>
          <div className="flex items-center space-x-2">
            {showSaveCheck && (
              <div className="flex items-center text-green-600 animate-fade-in">
                <Check className="w-4 h-4" />
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DrawerHeader>
        
        <div className="flex-1 p-4">
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing… Use /task or /meeting for quick actions"
            className="min-h-[calc(100vh-120px)] resize-none border-0 focus:ring-0 focus-visible:ring-0 p-0 text-sm"
          />
        </div>
        
        {lastSaved && (
          <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
            Last saved: {lastSaved.toLocaleTimeString()}
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default ScratchpadDrawer;
