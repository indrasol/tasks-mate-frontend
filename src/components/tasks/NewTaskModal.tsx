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
import { taskService } from "@/services/taskService";
import { useAuth } from "@/hooks/useAuth";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/../config";
import { Project } from "@/types/projects";
import type { BackendOrgMember } from "@/types/organization";
import { deriveDisplayFromEmail, getPriorityColor } from "@/lib/projectUtils";
import { Task } from "@/types/tasks";
import { getStatusMeta } from "@/lib/projectUtils";

interface NewTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreated: (task: Task) => void;
  defaultTags?: string[];
  isConvertingFromBug?: boolean;
  initialData?: Partial<{
    projectId: string;
    name: string;
    description: string;
    status: string; // backend enum preferred (e.g., in_progress)
    priority: string;
    owner: string;
    startDate: string; // YYYY-MM-DD or ISO
    targetDate: string; // YYYY-MM-DD or ISO
    tags: string[];
  }>;
}

const NewTaskModal = ({ open, onOpenChange, onTaskCreated, defaultTags = [], isConvertingFromBug = false, initialData }: NewTaskModalProps) => {
  const [formData, setFormData] = useState({
    projectId: "",
    name: "",
    description: "",
    // Use backend enum values to avoid mapping bugs
    status: "not_started",
    priority: "low",
    // Store user_id for owner; will be sent as assignee_id
    owner: "",
    startDate: "",
    targetDate: "",
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const { user } = useAuth();

  const { data: organizations } = useOrganizations();
  const currentOrgId = useCurrentOrgId() ?? organizations?.[0]?.id;
  // Projects state populated from backend
  const [projects, setProjects] = useState<Project[]>([]);

  const [loadingProjects, setLoadingProjects] = useState(false);

  // Utility helpers -------------------------------------------------
  const priorityOptions = ["critical", "high", "medium", "low", "none"] as const;
  const statusOptions = [
    "in_progress",
    "not_started",
    "completed",
    "on_hold",
    "blocked",
    "archived",
  ] as const;

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      const orgId = currentOrgId;
      if (!user || !orgId) return;

      setLoadingProjects(true);

      try {
        const res = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS}/${orgId}`);
        const mapped: Project[] = res.map((p: any) => ({
          id: p.project_id,
          name: p.name,
          description: p.description,
          status: p.status,
          progress: Number(p.progress_percent ?? 0),
          startDate: p.start_date ?? p.created_at ?? '',
          endDate: p.end_date ?? '',
          teamMembers: p.team_members ?? [],
          tasksCount: p.tasks_total ?? 0,
          completedTasks: p.tasks_completed ?? 0,
          priority: p.priority,
          owner: p.owner ?? "",
          category: 'General',
        }));
        setProjects(mapped);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      }
      setLoadingProjects(false);
    };
    fetchProjects();
  }, [user, currentOrgId]);

  // Organization members for Owner dropdown
  const { data: orgMembersRaw } = useOrganizationMembers(currentOrgId);
  const orgMembers: BackendOrgMember[] = (orgMembersRaw ?? []) as BackendOrgMember[];

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

  // Initialize start date to today when modal opens
  useEffect(() => {
    if (open) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const iso = `${yyyy}-${mm}-${dd}`;
      setFormData((prev) => ({ ...prev, startDate: prev.startDate || iso }));
    }
  }, [open]);

  // Apply initial data for duplication/edit-like flows
  useEffect(() => {
    if (!open || !initialData) return;
    const normalizeDate = (d?: string) => {
      if (!d) return "";
      // If ISO string, take date part
      return d.length > 10 ? d.slice(0, 10) : d;
    };
    const normalizeStatus = (s?: string) => {
      if (!s) return undefined;
      return s.replace("in-progress", "in_progress");
    };
    setFormData(prev => ({
      projectId: initialData.projectId ?? prev.projectId,
      name: initialData.name ?? prev.name,
      description: initialData.description ?? prev.description,
      status: normalizeStatus(initialData.status) ?? prev.status,
      priority: initialData.priority ?? prev.priority,
      owner: initialData.owner ?? prev.owner,
      startDate: normalizeDate(initialData.startDate) || prev.startDate,
      targetDate: normalizeDate(initialData.targetDate) || prev.targetDate,
      tags: Array.isArray(initialData.tags) ? [...initialData.tags] : prev.tags,
    }));
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.projectId.trim() || !formData.owner.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const allTags = [...formData.tags];
      const payload = {
        org_id: currentOrgId,
        project_id: formData.projectId,
        title: formData.name,
        description: formData.description,
        // Send backend-compatible status values (e.g., in_progress)
        status: formData.status,
        // Send user_id to backend
        assignee: formData.owner,
        // Backend expects YYYY-MM-DD; allow empty as null
        start_date: formData.startDate || null,
        due_date: formData.targetDate || null,
        tags: allTags,
        priority: formData.priority,
      };
      const created: any = await taskService.createTask(payload);
      // Map backend response to Task type
      const newTask = {
        id: created.task_id,
        name: created.title,
        description: created.description,
        // Normalize for UI where we render in-progress with hyphen
        status: (created.status || "not_started").replace("in_progress", "in-progress"),
        priority: created.priority,
        owner: created.assignee,
        targetDate: created.due_date,
        comments: created.comments ?? 0,
        progress: created.progress ?? 0,
        tags: created.tags,
        createdBy: created.created_by,
        createdDate: created.created_at,
        projectId: created.project_id || formData.projectId,
      };
      onTaskCreated(newTask);
      toast.success("Task created successfully!");
      setFormData({ projectId: "", name: "", description: "", status: "not_started", priority: "low", owner: "", startDate: "", targetDate: "", tags: [] });
      setTagInput("");
      onOpenChange(false);
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

  // Bugs linking UI removed until backend endpoint is available.

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

              {/* Project Dropdown */}
              <div className="space-y-3">
                <Label htmlFor="project" className="text-sm font-semibold text-gray-700">
                  Project *
                </Label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) => handleInputChange("projectId", value)}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder={loadingProjects ? "Loading projects..." : "Select project"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg z-50">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bugs dropdown removed to avoid mock data; integrate once backend endpoint is available */}

              <div className="space-y-3">
                <Label htmlFor="tags" className="text-sm font-semibold text-gray-700">
                  Tags
                </Label>
                {/* No automatic tags applied */}
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
                            className={`flex items-center space-x-1 ${isDefaultBugTag
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
                      {statusOptions.map((status) => {
                        const meta = getStatusMeta(status);
                        return (
                          <SelectItem key={status} value={status}>
                            <span className={`px-2 py-1 rounded-full text-xs ${meta.color}`}>{meta.label}</span>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="priority" className="text-sm font-semibold text-gray-700">
                    Priority
                  </Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg z-50">
                      {priorityOptions.map((priority) => (
                        <SelectItem key={priority} value={priority}>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(priority)}`}>{priority.toUpperCase()}</span>
                        </SelectItem>
                      ))}
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

                      {orgMembers.map((m) => {
                        const username = ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id;
                        const { displayName } = deriveDisplayFromEmail(username);
                        return (
                          <SelectItem key={m.user_id} value={String(username)}>
                            {displayName} {m.designation ? `(${m.designation})` : ""}
                          </SelectItem>
                        );
                      })}

                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="startDate" className="text-sm font-semibold text-gray-700">
                    Start Date
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    className="h-12"
                  />
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
