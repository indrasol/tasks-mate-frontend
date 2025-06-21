
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  owner: string;
  targetDate: string;
  comments: number;
  progress: number;
  tags?: string[];
  createdBy?: string;
  createdDate?: string;
}

interface DuplicateTaskHeaderProps {
  sourceTask: Task;
}

const DuplicateTaskHeader = ({ sourceTask }: DuplicateTaskHeaderProps) => {
  return (
    <DialogHeader className="space-y-4">
      <DialogTitle className="text-2xl font-bold text-gray-900">Duplicate Task</DialogTitle>
      <DialogDescription className="text-gray-600">
        Create a copy of "{sourceTask.name}" with a new ID and customizable details.
      </DialogDescription>
    </DialogHeader>
  );
};

export default DuplicateTaskHeader;
