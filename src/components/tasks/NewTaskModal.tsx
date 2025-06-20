
import { useState } from "react";
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
import { X } from "lucide-react";
import { toast } from "sonner";

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewTaskModal = ({ open, onOpenChange }: NewTaskModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "todo",
    owner: "",
    targetDate: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.owner.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Generate task ID
    const taskId = `T${Math.floor(Math.random() * 9000) + 1000}`;
    
    console.log("Creating new task:", { ...formData, id: taskId });
    
    toast.success("Task created successfully!");
    
    // Reset form
    setFormData({
      name: "",
      description: "",
      status: "todo",
      owner: "",
      targetDate: "",
    });
    
    onOpenChange(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
