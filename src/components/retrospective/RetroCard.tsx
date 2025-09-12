
import { useState } from "react";
import { Edit2, Trash2, Rocket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface RetroItem {
  id: string;
  text: string;
  author: string;
  authorAvatar?: string;
  votes: number;
  votedBy: string[];
  lane: 'went-well' | 'didnt-go-well' | 'ideas';
}

interface RetroCardProps {
  item: RetroItem;
  onUpdate: (id: string, text: string) => void;
  onDelete: (id: string) => void;
  onVote: (id: string) => void;
  onCreateTask: (item: RetroItem) => void;
  disabled?: boolean;
  showVoting?: boolean;
  currentUser?: string;
}

const RetroCard = ({
  item,
  onUpdate,
  onDelete,
  onVote,
  onCreateTask,
  disabled = false,
  showVoting = false,
  currentUser = ""
}: RetroCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.text);
  const [isHovered, setIsHovered] = useState(false);

  const hasUserVoted = item.votedBy.includes(currentUser);
  const canCreateTask = showVoting && item.votes >= 1;

  const handleSave = () => {
    if (editText.trim() && editText !== item.text) {
      onUpdate(item.id, editText.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditText(item.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const handleVote = () => {
    if (!disabled && showVoting) {
      onVote(item.id);
      
      // Confetti effect when reaching 5 votes
      if (item.votes === 4 && !hasUserVoted) {
        // Trigger confetti animation
        // console.log("🎉 Confetti burst!");
      }
    }
  };

  return (
    <Card 
      className="group hover:shadow-lg transition-all duration-200 bg-white/80 backdrop-blur-sm border border-white/30"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={() => !disabled && setIsEditing(true)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSave}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
            )}
          </div>

          {/* Vote Button (Ideas lane only) */}
          {showVoting && !disabled && (
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={handleVote}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  hasUserVoted 
                    ? 'bg-green-500 border-green-500 shadow-lg shadow-green-200' 
                    : 'border-gray-300 hover:border-green-400 hover:bg-green-50'
                }`}
              >
                {hasUserVoted && (
                  <div className="w-full h-full rounded-full bg-green-500 animate-pulse" />
                )}
              </button>
              {item.votes > 0 && (
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-green-100 text-green-700 min-w-[20px] h-5 flex items-center justify-center"
                >
                  {item.votes}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-3">
          {/* Author Avatar */}
          <Avatar className="w-6 h-6">
            <AvatarImage src={item.authorAvatar} alt="Author" />
            <AvatarFallback className="text-xs bg-gray-100">
              {item.author.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {/* Action Buttons - Show on Hover */}
          {!disabled && isHovered && (
            <div className="flex gap-1 opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-blue-100"
                onClick={() => setIsEditing(true)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-red-100"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
              {canCreateTask && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 hover:bg-green-100"
                  onClick={() => onCreateTask(item)}
                >
                  <Rocket className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RetroCard;
