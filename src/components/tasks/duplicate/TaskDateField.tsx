
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface TaskDateFieldProps {
  value: string;
  onChange: (value: string) => void;
}

const TaskDateField = ({ value, onChange }: TaskDateFieldProps) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="targetDate" className="text-sm font-semibold text-gray-700">
        Target Date
      </Label>
      <Input
        id="targetDate"
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default TaskDateField;
