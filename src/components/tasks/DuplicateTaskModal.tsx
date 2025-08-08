
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import DuplicateTaskHeader from "./duplicate/DuplicateTaskHeader";
import TaskIdField from "./duplicate/TaskIdField";
import TaskNameField from "./duplicate/TaskNameField";
import TaskDescriptionField from "./duplicate/TaskDescriptionField";
import TaskTagsField from "./duplicate/TaskTagsField";
import TaskStatusOwnerFields from "./duplicate/TaskStatusOwnerFields";
import TaskDateField from "./duplicate/TaskDateField";
import DuplicateTaskActions from "./duplicate/DuplicateTaskActions";
import { taskService } from "@/services/taskService";

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

interface DuplicateTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTask: Task;
}

const DuplicateTaskModal = ({ open, onOpenChange, sourceTask }: DuplicateTaskModalProps) => {
  const navigate = useNavigate();
  
  // Generate new task ID
  const generateTaskId = () => `T${Math.floor(Math.random() * 9000) + 1000}`;
  
  const [formData, setFormData] = useState({
    id: generateTaskId(),
    name: `Copy of ${sourceTask.name}`,
    description: sourceTask.description,
    status: "todo",
    owner: "",
    targetDate: "",
    tags: sourceTask.tags || [],
  });
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.owner.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const payload = {
        projectId: "demo-project-id", // TODO: Replace with real project ID if available
        name: formData.name,
        description: formData.description,
        status: formData.status,
        owner: formData.owner,
        targetDate: formData.targetDate,
        tags: formData.tags,
        priority: "none", // Add priority if needed
      };
      const created = await taskService.createTask(payload);
      toast.success(`Task ${created.task_id} created successfully!`);
      onOpenChange(false);
      navigate('/tasks_catalog');
    } catch (err: any) {
      toast.error(err.message || "Failed to create task");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Regenerate ID when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        id: generateTaskId(),
        name: `Copy of ${sourceTask.name}`,
        description: sourceTask.description,
        status: "todo",
        owner: "",
        targetDate: "",
        tags: sourceTask.tags || [],
      }));
      setTagInput("");
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DuplicateTaskHeader sourceTaskName={sourceTask.name} />
        
        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          <TaskIdField 
            taskId={formData.id}
            onRegenerateId={() => setFormData(prev => ({ ...prev, id: generateTaskId() }))}
          />

          <TaskNameField 
            name={formData.name}
            onChange={(value) => handleInputChange("name", value)}
          />

          <TaskDescriptionField 
            description={formData.description}
            onChange={(value) => handleInputChange("description", value)}
          />

          <TaskTagsField 
            tags={formData.tags}
            tagInput={tagInput}
            onTagInputChange={setTagInput}
            onAddTag={handleAddTag}
            onRemoveTag={handleRemoveTag}
            onTagInputKeyPress={handleTagInputKeyPress}
          />

          <TaskStatusOwnerFields 
            status={formData.status}
            owner={formData.owner}
            onStatusChange={(value) => handleInputChange("status", value)}
            onOwnerChange={(value) => handleInputChange("owner", value)}
          />

          <TaskDateField 
            targetDate={formData.targetDate}
            onChange={(value) => handleInputChange("targetDate", value)}
          />

          <DuplicateTaskActions 
            onCancel={() => onOpenChange(false)}
            onSubmit={() => {}}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DuplicateTaskModal;
