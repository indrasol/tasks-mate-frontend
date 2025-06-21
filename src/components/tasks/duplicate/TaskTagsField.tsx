
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface TaskTagsFieldProps {
  tags: string[];
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onTagInputKeyPress: (e: React.KeyboardEvent) => void;
}

const TaskTagsField = ({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  onTagInputKeyPress
}: TaskTagsFieldProps) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="tags" className="text-sm font-semibold text-gray-700">
        Tags
      </Label>
      <div className="space-y-2">
        <div className="flex space-x-2">
          <Input
            id="tags"
            placeholder="Enter a tag and press Enter"
            value={tagInput}
            onChange={(e) => onTagInputChange(e.target.value)}
            onKeyPress={onTagInputKeyPress}
            className="flex-1"
          />
          <Button
            type="button"
            onClick={onAddTag}
            variant="outline"
            disabled={!tagInput.trim()}
          >
            Add
          </Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="flex items-center space-x-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
              >
                <span>{tag}</span>
                <X
                  className="h-3 w-3 cursor-pointer hover:text-blue-900"
                  onClick={() => onRemoveTag(tag)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskTagsField;
