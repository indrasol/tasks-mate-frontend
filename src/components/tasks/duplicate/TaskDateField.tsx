
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TaskDateFieldProps {
  targetDate: string;
  onChange: (value: string) => void;
}

const TaskDateField = ({ targetDate, onChange }: TaskDateFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="targetDate">Target Date</Label>
      <Input
        id="targetDate"
        type="date"
        value={targetDate}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
};

export default TaskDateField;
