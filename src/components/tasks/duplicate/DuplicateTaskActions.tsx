
import { Button } from "@/components/ui/button";

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
        onClick={onSubmit}
        className="flex-1 bg-tasksmate-gradient hover:scale-105 transition-transform"
      >
        Create Duplicate
      </Button>
    </div>
  );
};

export default DuplicateTaskActions;
