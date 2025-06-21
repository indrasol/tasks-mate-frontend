
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TaskIdFieldProps {
  taskId: string;
  onGenerateNewId: () => void;
}

const TaskIdField = ({ taskId, onGenerateNewId }: TaskIdFieldProps) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="taskId" className="text-sm font-semibold text-gray-700">
        Task ID
      </Label>
      <div className="flex items-center space-x-2">
        <Input
          id="taskId"
          value={taskId}
          readOnly
          className="flex-1 bg-gray-50"
        />
        <Button
          type="button"
          variant="outline"
          onClick={onGenerateNewId}
        >
          New ID
        </Button>
      </div>
    </div>
  );
};

export default TaskIdField;
