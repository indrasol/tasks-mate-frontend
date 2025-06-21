
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      <div className="space-y-3">
        <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
          Status
        </Label>
        <Select value={status} onValueChange={onStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="todo">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                <span>To Do</span>
              </div>
            </SelectItem>
            <SelectItem value="in-progress">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>In Progress</span>
              </div>
            </SelectItem>
            <SelectItem value="completed">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Completed</span>
              </div>
            </SelectItem>
            <SelectItem value="blocked">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Blocked</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label htmlFor="owner" className="text-sm font-semibold text-gray-700">
          Owner *
        </Label>
        <Select value={owner} onValueChange={onOwnerChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select owner" />
          </SelectTrigger>
          <SelectContent className="bg-white border shadow-lg z-50">
            <SelectItem value="JD">John Doe (JD)</SelectItem>
            <SelectItem value="SK">Sarah Kim (SK)</SelectItem>
            <SelectItem value="MR">Mike Rodriguez (MR)</SelectItem>
            <SelectItem value="AM">Anna Miller (AM)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default TaskStatusOwnerFields;
