
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const MoodPoll = () => {
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [moodData] = useState({
    '😃': 45,
    '😐': 35,
    '😞': 20
  });

  const totalVotes = Object.values(moodData).reduce((sum, votes) => sum + votes, 0);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(selectedMood === mood ? null : mood);
  };

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600">Mood:</span>
      <div className="flex gap-1">
        {Object.entries(moodData).map(([emoji, votes]) => {
          const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
          const isSelected = selectedMood === emoji;
          
          return (
            <button
              key={emoji}
              onClick={() => handleMoodSelect(emoji)}
              className={`relative flex items-center gap-1 px-2 py-1 rounded-lg border transition-all ${
                isSelected 
                  ? 'bg-green-100 border-green-300 shadow-sm' 
                  : 'bg-white/80 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg">{emoji}</span>
              <Badge 
                variant="secondary" 
                className="text-xs bg-gray-100 text-gray-600"
              >
                {Math.round(percentage)}%
              </Badge>
              
              {/* Progress bar */}
              <div className="absolute bottom-0 left-0 h-1 bg-green-500 rounded-b-lg transition-all duration-500"
                   style={{ width: `${percentage}%` }} 
              />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default MoodPoll;
