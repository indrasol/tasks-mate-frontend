
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
import { X } from "lucide-react";
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
}

const NewTaskModal = ({ open, onOpenChange, onTaskCreated, defaultTags = [] }: NewTaskModalProps) => {
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
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  // Mock data for bugs and projects
  const availableBugs = [
    { id: 'BUG-001', title: 'Login button not responsive on mobile' },
    { id: 'BUG-002', title: 'Task deletion confirmation dialog missing' },
    { id: 'BUG-003', title: 'Profile image upload fails silently' },
  ];

  const availableProjects = [
    { id: 'PRJ-001', name: 'TasksMate Web' },
    { id: 'PRJ-002', name: 'Mobile App' },
    { id: 'PRJ-003', name: 'API Integration' },
  ];

  // Set default tags when modal opens
  useEffect(() => {
    if (open && defaultTags.length > 0) {
      setFormData(prev => ({
        ...prev,
        tags: [...defaultTags]
      }));
    }
  }, [open, defaultTags]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.owner.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Generate task ID
    const taskId = `T${Math.floor(Math.random() * 9000) + 1000}`;
    
    // Combine all tags (form tags + bug IDs + project IDs)
    const allTags = [
      ...formData.tags,
      ...selectedBugs,
      ...selectedProjects
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
    setSelectedProjects([]);
    
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

  const handleProjectSelect = (projectId: string) => {
    if (!selectedProjects.includes(projectId)) {
      setSelectedProjects(prev => [...prev, projectId]);
    }
  };

  const handleRemoveProject = (projectId: string) => {
    setSelectedProjects(prev => prev.filter(id => id !== projectId));
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle className="text-2xl font-bold text-gray-900">Create New Task</SheetTitle>
              <SheetDescription className="text-gray-600 mt-2">
                Add a new task to your project. Fill in the details below to get started.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        
        <div className="mt-8">
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

            <div className="space-y-3">
              <Label htmlFor="projects" className="text-sm font-semibold text-gray-700">
                Projects (Optional)
              </Label>
              <Select onValueChange={handleProjectSelect}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select projects to link" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg z-50">
                  {availableProjects.filter(project => !selectedProjects.includes(project.id)).map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.id} - {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedProjects.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedProjects.map((projectId) => {
                    const project = availableProjects.find(p => p.id === projectId);
                    return (
                      <Badge
                        key={projectId}
                        variant="secondary"
                        className="flex items-center space-x-1 bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        <span>{project?.id}</span>
                        <X
                          className="h-3 w-3 cursor-pointer hover:text-green-900"
                          onClick={() => handleRemoveProject(projectId)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
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
                Create Task
              </Button>
            </div>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default NewTaskModal;
