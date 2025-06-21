
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface TaskDescriptionFieldProps {
  description: string;
  onChange: (value: string) => void;
}

const TaskDescriptionField = ({ description, onChange }: TaskDescriptionFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="taskDescription">Description</Label>
      <Textarea
        id="taskDescription"
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter task description"
        rows={3}
      />
    </div>
  );
};

export default TaskDescriptionField;
