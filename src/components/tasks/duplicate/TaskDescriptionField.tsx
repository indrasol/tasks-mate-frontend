
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";

interface TaskDescriptionFieldProps {
  description: string;
  onChange: (value: string) => void;
}

const TaskDescriptionField = ({ description, onChange }: TaskDescriptionFieldProps) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="taskDescription">Description</Label>
      <RichTextEditor
        content={description}
        onChange={(content) => onChange(content)}
        placeholder="Provide detailed information about this task. You can also elaborate longer or update inside the task after creation"
        // onImageUpload={handleImageUpload}
        className="min-h-[175px]"
      />
      {/* <Textarea
        id="taskDescription"
        value={description}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Enter task description"
        rows={3}
      /> */}
    </div>
  );
};

export default TaskDescriptionField;
