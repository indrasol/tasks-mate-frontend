import { useState } from "react";
import { Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import RetroCard from "./RetroCard";

interface RetroItem {
  id: string;
  text: string;
  author: string;
  authorAvatar?: string;
  votes: number;
  votedBy: string[];
  lane: 'went-well' | 'didnt-go-well' | 'ideas';
}

interface RetroLaneProps {
  title: string;
  color: 'mint' | 'peach' | 'sky';
  items: RetroItem[];
  onAddItem: (text: string) => void;
  onUpdateItem: (id: string, text: string) => void;
  onDeleteItem: (id: string) => void;
  onVoteItem: (id: string) => void;
  onCreateTask: (item: RetroItem) => void;
  disabled?: boolean;
  showVoting?: boolean;
  currentUser?: string;
}

const RetroLane = ({
  title,
  color,
  items,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onVoteItem,
  onCreateTask,
  disabled = false,
  showVoting = false,
  currentUser = ""
}: RetroLaneProps) => {
  const [newItemText, setNewItemText] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const colorClasses = {
    mint: 'bg-green-50 border-green-100',
    peach: 'bg-orange-50 border-orange-100', 
    sky: 'bg-blue-50 border-blue-100'
  };

  const headerColors = {
    mint: 'bg-green-100/50 text-green-800',
    peach: 'bg-orange-100/50 text-orange-800',
    sky: 'bg-blue-100/50 text-blue-800'
  };

  const handleAddItem = () => {
    if (newItemText.trim()) {
      onAddItem(newItemText);
      setNewItemText("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddItem();
    } else if (e.key === 'Escape') {
      setNewItemText("");
      setIsAdding(false);
    }
  };

  return (
    <div className={`rounded-xl border-2 ${colorClasses[color]} min-h-[600px] flex flex-col`}>
      {/* Lane Header */}
      <div className={`p-4 rounded-t-xl ${headerColors[color]} border-b border-white/30`}>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-sm opacity-75">{items.length} items</p>
      </div>

      {/* Lane Content */}
      <div className="flex-1 p-4 space-y-3">
        {/* Existing Items */}
        {items.map((item) => (
          <RetroCard
            key={item.id}
            item={item}
            onUpdate={onUpdateItem}
            onDelete={onDeleteItem}
            onVote={onVoteItem}
            onCreateTask={onCreateTask}
            disabled={disabled}
            showVoting={showVoting}
            currentUser={currentUser}
          />
        ))}

        {/* Add New Item */}
        {!disabled && (
          <div className="space-y-2">
            {isAdding ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-xl border-2 border-dashed border-gray-300 p-3">
                <Input
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your item..."
                  className="border-none bg-transparent p-0 text-sm focus-visible:ring-0"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <Button
                    size="sm"
                    onClick={handleAddItem}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Add
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsAdding(false);
                      setNewItemText("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="ghost"
                className="w-full h-12 border-2 border-dashed border-gray-300 hover:border-gray-400 hover:bg-white/50 transition-all"
                onClick={() => setIsAdding(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add item
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RetroLane;
