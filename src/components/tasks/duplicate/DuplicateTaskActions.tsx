
import { Button } from "@/components/ui/button";
import { Save, Copy } from "lucide-react";

interface DuplicateTaskActionsProps {
  onCancel: () => void;
  onSubmit: () => void;
}

const DuplicateTaskActions = ({ onCancel, onSubmit }: DuplicateTaskActionsProps) => {
  return (
    <div className="flex gap-3 pt-4 border-t">
      <Button 
        type="button" 
        variant="outline" 
        onClick={onCancel}
        className="flex-1"
      >
        Cancel
      </Button>
      <Button 
        type="submit" 
        className="flex-1 bg-tasksmate-gradient hover:scale-105 transition-transform"
        onClick={onSubmit}
      >
        Create Task
      </Button>
    </div>
  );
};

export default DuplicateTaskActions;
