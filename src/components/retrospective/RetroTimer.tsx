
import { useState, useEffect } from "react";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface RetroTimerProps {
  initialMinutes: number;
  onTimeUp?: () => void;
}

const RetroTimer = ({ initialMinutes, onTimeUp }: RetroTimerProps) => {
  const [timeLeft, setTimeLeft] = useState(initialMinutes * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [hasShaken, setHasShaken] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            if (onTimeUp) onTimeUp();
            if (!hasShaken) {
              setHasShaken(true);
              // Trigger shake animation
              document.getElementById('timer-pill')?.classList.add('animate-shake');
              setTimeout(() => {
                document.getElementById('timer-pill')?.classList.remove('animate-shake');
              }, 1000);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeLeft, onTimeUp, hasShaken]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isWarning = timeLeft <= 180 && timeLeft > 0; // Last 3 minutes
  const isDanger = timeLeft === 0;

  const formatTime = (mins: number, secs: number) => {
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const resetTimer = () => {
    setTimeLeft(initialMinutes * 60);
    setIsRunning(false);
    setHasShaken(false);
  };

  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  return (
    <div className="flex items-center gap-2" id="timer-container">
      <Badge 
        id="timer-pill"
        variant="outline"
        className={`flex items-center gap-2 px-3 py-1 text-sm font-mono transition-all ${
          isDanger 
            ? 'bg-red-100 border-red-300 text-red-700' 
            : isWarning 
              ? 'bg-amber-100 border-amber-300 text-amber-700'
              : 'bg-blue-100 border-blue-300 text-blue-700'
        }`}
      >
        <Timer className="w-4 h-4" />
        {formatTime(minutes, seconds)}
      </Badge>

      <div className="flex gap-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleTimer}
          className="h-6 w-6 p-0"
        >
          {isRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
        </Button>
        
        <Button
          size="sm"
          variant="ghost"
          onClick={resetTimer}
          className="h-6 w-6 p-0"
        >
          <RotateCcw className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
};

export default RetroTimer;
