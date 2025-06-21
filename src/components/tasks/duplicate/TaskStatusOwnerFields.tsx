
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TaskStatusOwnerFieldsProps {
  status: string;
  owner: string;
  onStatusChange: (value: string) => void;
  onOwnerChange: (value: string) => void;
}

const TaskStatusOwnerFields = ({
  status,
  owner,
  onStatusChange,
  onOwnerChange
}: TaskStatusOwnerFieldsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todo">To Do</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="owner">Owner *</Label>
        <Input
          id="owner"
          value={owner}
          onChange={(e) => onOwnerChange(e.target.value)}
          placeholder="Enter owner name"
          required
        />
      </div>
    </div>
  );
};

export default TaskStatusOwnerFields;
