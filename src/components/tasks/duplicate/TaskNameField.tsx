
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskNameFieldProps {
  name: string;
  onChange: (value: string) => void;
}

const TaskNameField = ({ name, onChange }: TaskNameFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="taskName">Task Name *</Label>
      <Input
        id="taskName"
        value={name}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter task name"
        required
      />
    </div>
  );
};

export default TaskNameField;
