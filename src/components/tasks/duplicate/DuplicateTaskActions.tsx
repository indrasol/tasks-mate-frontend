
import { Button } from "@/components/ui/button";

interface DuplicateTaskActionsProps {
  onCancel: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

const DuplicateTaskActions = ({ onCancel, onSubmit }: DuplicateTaskActionsProps) => {
  return (
    <div className="flex justify-end space-x-3 pt-6 border-t">
      <Button type="button" variant="outline" onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" onClick={onSubmit} className="bg-tasksmate-gradient hover:scale-105 transition-transform">
        Create Duplicate Task
      </Button>
    </div>
  );
};

export default DuplicateTaskActions;
