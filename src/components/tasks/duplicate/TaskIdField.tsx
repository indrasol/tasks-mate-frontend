
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RefreshCw } from "lucide-react";

interface TaskIdFieldProps {
  taskId: string;
  onRegenerateId: () => void;
}

const TaskIdField = ({ taskId, onRegenerateId }: TaskIdFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="taskId">Task ID</Label>
      <div className="flex gap-2">
        <Input
          id="taskId"
          value={taskId}
          readOnly
          className="bg-gray-50"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onRegenerateId}
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default TaskIdField;
