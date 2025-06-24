
import React from 'react';
import { Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ScratchpadButtonProps {
  onClick: () => void;
}

const ScratchpadButton = ({ onClick }: ScratchpadButtonProps) => {
  return (
    <Button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-green-500 hover:bg-green-600 shadow-lg hover:shadow-xl transition-all duration-200 z-50"
      style={{
        filter: 'drop-shadow(0 4px 12px rgba(34, 197, 94, 0.3))'
      }}
    >
      <Edit3 className="w-6 h-6 text-white" />
    </Button>
  );
};

export default ScratchpadButton;
