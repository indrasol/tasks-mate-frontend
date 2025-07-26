import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  owner: string;
  targetDate: string;
  comments: number;
  progress: number;
  tags: string[];
  createdBy: string;
  createdDate: string;
}

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: (task: Task) => void;
  defaultTags?: string[];
  isConvertingFromBug?: boolean;
  projectName?: string;
}

const NewTaskModal = ({ open, onOpenChange, onTaskCreated, defaultTags = [], isConvertingFromBug = false, projectName }: NewTaskModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "todo",
    owner: "",
    targetDate: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");
  const [selectedBugs, setSelectedBugs] = useState<string[]>([]);

  // Mock data for bugs
  const availableBugs = [
    { id: 'BUG-001', title: 'Login button not responsive on mobile' },
    { id: 'BUG-002', title: 'Task deletion confirmation dialog missing' },
    { id: 'BUG-003', title: 'Profile image upload fails silently' },
  ];

  // Set default tags when modal opens
  useEffect(() => {
    if (open && defaultTags.length > 0) {
      if (isConvertingFromBug) {
        // For bug conversion, set the bug ID as a non-editable tag
        setFormData(prev => ({
          ...prev,
          tags: [...defaultTags]
        }));
      } else {
        // For regular task creation with default tags
        setFormData(prev => ({
          ...prev,
          tags: [...defaultTags]
        }));
      }
    }
  }, [open, defaultTags, isConvertingFromBug]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.owner.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Generate task ID
    const taskId = `T${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Combine all tags (form tags + bug IDs + project name)
    const allTags = [
      ...(projectName ? [projectName] : []),
      ...formData.tags,
      ...selectedBugs
    ];
    
    // Create new task object
    const newTask: Task = {
      id: taskId,
      name: formData.name,
      description: formData.description,
      status: formData.status,
      owner: formData.owner,
      targetDate: formData.targetDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      comments: 0,
      progress: 0,
      tags: allTags,
      createdBy: formData.owner,
      createdDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    };
    
    console.log("Creating new task:", newTask);
    
    // Call the callback to add task to catalog
    onTaskCreated(newTask);
    
    toast.success("Task created successfully!");
    
    // Reset form
    setFormData({
      name: "",
      description: "",
      status: "todo",
      owner: "",
      targetDate: "",
      tags: [],
    });
    setTagInput("");
    setSelectedBugs([]);
    
    onOpenChange(false);
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
    // Don't allow removing default tags when converting from bug
    if (isConvertingFromBug && defaultTags.includes(tagToRemove)) {
      return;
    }
    
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

  const handleBugSelect = (bugId: string) => {
    if (!selectedBugs.includes(bugId)) {
      setSelectedBugs(prev => [...prev, bugId]);
    }
  };

  const handleRemoveBug = (bugId: string) => {
    setSelectedBugs(prev => prev.filter(id => id !== bugId));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white flex flex-col p-0 max-h-screen">
        {/* Modern Header */}
        <div className="relative bg-tasksmate-gradient p-6 flex-shrink-0">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Plus className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold text-white font-sora">
                    {isConvertingFromBug ? "Convert Bug to Task" : "Create New Task"}
                  </SheetTitle>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Sparkles className="h-4 w-4 text-white/80" />
              </div>
            </div>
            <SheetDescription className="text-white/90 text-sm leading-relaxed">
              {isConvertingFromBug 
                ? "Transform this bug report into an actionable task. The bug ID will be automatically linked."
                : "Transform your ideas into actionable tasks. Fill in the details below to bring your vision to life."
              }
            </SheetDescription>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-6">
          <div className="py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <Textarea
                  id="description"
                  placeholder="Provide detailed information about this task"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  rows={4}
                  className="text-base resize-none"
                />
              </div>

              {/* Only show bugs dropdown if not converting from bug */}
              {!isConvertingFromBug && (
                <div className="space-y-3">
                  <Label htmlFor="bugs" className="text-sm font-semibold text-gray-700">
                    Bugs (Optional)
                  </Label>
                  <Select onValueChange={handleBugSelect}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select bugs to link" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      {availableBugs.filter(bug => !selectedBugs.includes(bug.id)).map((bug) => (
                        <SelectItem key={bug.id} value={bug.id}>
                          {bug.id} - {bug.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBugs.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedBugs.map((bugId) => {
                        const bug = availableBugs.find(b => b.id === bugId);
                        return (
                          <Badge
                            key={bugId}
                            variant="secondary"
                            className="flex items-center space-x-1 bg-red-100 text-red-800 hover:bg-red-200"
                          >
                            <span>{bug?.id}</span>
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-red-900"
                              onClick={() => handleRemoveBug(bugId)}
                            />
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="tags" className="text-sm font-semibold text-gray-700">
                  Tags
                </Label>
                {projectName && (
                  <p className="text-xs text-gray-500">
                    <Badge className="bg-teal-100 text-teal-800 text-xs mr-1">{projectName}</Badge>
                    will be automatically added to this task
                  </p>
                )}
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
                      {formData.tags.map((tag, index) => {
                        const isDefaultBugTag = isConvertingFromBug && defaultTags.includes(tag);
                        return (
                          <Badge
                            key={index}
                            variant="secondary"
                            className={`flex items-center space-x-1 ${
                              isDefaultBugTag 
                                ? 'bg-red-100 text-red-800 hover:bg-red-200 border-red-300' 
                                : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                            }`}
                          >
                            <span>{tag}</span>
                            {!isDefaultBugTag && (
                              <X
                                className="h-3 w-3 cursor-pointer hover:text-blue-900"
                                onClick={() => handleRemoveTag(tag)}
                              />
                            )}
                          </Badge>
                        );
                      })}
                    </div>
                  )}
                  {isConvertingFromBug && formData.tags.some(tag => defaultTags.includes(tag)) && (
                    <p className="text-xs text-gray-500">
                      Bug ID tags cannot be removed when converting from a bug.
                    </p>
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

              <div className="pb-6">
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
                    {isConvertingFromBug ? "Convert to Task" : "Create Task"}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NewTaskModal;
