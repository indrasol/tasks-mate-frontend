
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface TaskDescriptionFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const TaskDescriptionField = ({ value, onChange }: TaskDescriptionFieldProps) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
        Description
      </Label>
      <Textarea
        id="description"
        placeholder="Provide detailed information about this task"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="resize-none"
      />
    </div>
  );
};

export default TaskDescriptionField;
