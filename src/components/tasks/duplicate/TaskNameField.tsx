
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TaskNameFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const TaskNameField = ({ value, onChange }: TaskNameFieldProps) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
        Task Name *
      </Label>
      <Input
        id="name"
        placeholder="Enter a descriptive task name"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required
      />
    </div>
  );
};

export default TaskNameField;
