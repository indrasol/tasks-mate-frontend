
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { X } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { RichTextEditor } from "../ui/rich-text-editor";

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

interface DuplicateTaskSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceTask: Task;
}

const DuplicateTaskSidebar = ({ open, onOpenChange, sourceTask }: DuplicateTaskSidebarProps) => {
  const navigate = useNavigate();
  
  // Generate new task ID
  const generateTaskId = () => `T${Math.floor(Math.random() * 9000) + 1000}`;
  
  const [formData, setFormData] = useState({
    id: generateTaskId(),
    name: `Copy of ${sourceTask.name}`,
    description: sourceTask.description,
    status: "todo", // Reset to todo for new task
    owner: "",
    targetDate: "",
    tags: sourceTask.tags || [],
  });
  const [tagInput, setTagInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.owner.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Create duplicated task object
    const duplicatedTask: Task = {
      id: formData.id,
      name: formData.name,
      description: formData.description,
      status: formData.status,
      owner: formData.owner,
      targetDate: formData.targetDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      comments: 0,
      progress: 0,
      tags: formData.tags,
      createdBy: formData.owner,
      createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    
    console.log("Duplicating task:", duplicatedTask);
    
    // In a real app, you would add this task to your global state or database
    // For now, we'll just show success and navigate to catalog
    toast({
      title: "Success",
      description: `Task ${duplicatedTask.id} created successfully!`,
      variant: "default"
    });
    
    onOpenChange(false);
    
    // Navigate to tasks catalog to see the new task
    navigate('/tasks_catalog');
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
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-[600px] bg-white">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold text-gray-900">Duplicate Task</SheetTitle>
              <SheetDescription className="text-gray-600 mt-2">
                Create a copy of "{sourceTask.name}" with a new ID and customizable details.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="taskId" className="text-sm font-semibold text-gray-700">
                Task ID
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="taskId"
                  value={formData.id}
                  readOnly
                  className="h-12 text-base bg-gray-50"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData(prev => ({ ...prev, id: generateTaskId() }))}
                  className="h-12 px-4"
                >
                  New ID
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                Task Name *
              </Label>
              <Input
                id="name"
                placeholder="Enter a descriptive task name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="h-12 text-base"
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700">
                Description
              </Label>
              <RichTextEditor
                content={formData.description}
                onChange={(content) => handleInputChange("description", content)}
                placeholder="Provide detailed information about this task"
                // onImageUpload={handleImageUpload}
                className="min-h-[175px]"
              />
              {/* <Textarea
                id="description"
                placeholder="Provide detailed information about this task"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={4}
                className="text-base resize-none"
              /> */}
            </div>

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
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    className="h-10 text-base flex-1"
                  />
                  <Button
                    type="button"
                    onClick={handleAddTag}
                    variant="outline"
                    className="h-10 px-4"
                    disabled={!tagInput.trim()}
                  >
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center space-x-1 bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        <span>{tag}</span>
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-blue-900"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="status" className="text-sm font-semibold text-gray-700">
                  Status
                </Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger className="h-12">
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
                <Select value={formData.owner} onValueChange={(value) => handleInputChange("owner", value)}>
                  <SelectTrigger className="h-12">
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

            <div className="space-y-3">
              <Label htmlFor="targetDate" className="text-sm font-semibold text-gray-700">
                Target Date
              </Label>
              <Input
                id="targetDate"
                type="date"
                value={formData.targetDate}
                onChange={(e) => handleInputChange("targetDate", e.target.value)}
                className="h-12"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                className="flex-1 h-12 text-base"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base bg-tasksmate-gradient hover:scale-105 transition-transform"
              >
                Create Duplicate
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default DuplicateTaskSidebar;
