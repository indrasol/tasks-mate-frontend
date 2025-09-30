import { API_ENDPOINTS } from '@/config';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { useProjects } from '@/hooks/useProjects';
import { api } from '@/services/apiService';
import { AlertCircle, Loader2, X } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import { capitalizeFirstLetter, deriveDisplayFromEmail } from '@/lib/projectUtils';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { BackendOrgMember } from '@/types/organization';

interface NewBugModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  runId: string;
  projectId?: string;
  projectName?: string; // Made optional
}

const NewBugModal = ({ open, onOpenChange, runId, projectId, projectName }: NewBugModalProps) => {
  const { projects, loading: loadingProjects } = useProjects();
  const currentOrgId = useCurrentOrgId();
  // Organization members for Owner dropdown
  const { data: orgMembersRaw } = useOrganizationMembers(currentOrgId);

  const orgMembers: BackendOrgMember[] = useMemo(() => (orgMembersRaw?.map((m: any) => ({
    ...m,
    name: ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id,
  })).map((m: any) => ({
    ...m,
    displayName: deriveDisplayFromEmail(m.name).displayName,
    initials: deriveDisplayFromEmail(m.name).initials,
  })) ?? []) as BackendOrgMember[], [orgMembersRaw]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    severity: 'medium', // Default to medium severity
    projectId: '',
    projectName: '',
    tags: [] as string[],
    assignee: '',
  });
  const [newTag, setNewTag] = useState('');

  // Set default project if provided
  useEffect(() => {
    if (!projects || projects.length === 0) return;
    let foundProject = null;

    if (projectId) {
      foundProject = projects.find(p => p.id === projectId);
    } else if (projectName) {
      foundProject = projects.find(p => p.name === projectName);
    }
    if (foundProject) {
      setFormData(prev => ({
        ...prev,
        projectId: foundProject.id,
        projectName: foundProject.name
      }));
    }
  }, [projectId, projectName, projects]);

  // useEffect(() => {
  //   handleAddTag(formData.projectId);
  // },[formData.projectId])

  const handleAddTag = (projectId?: string) => {
    let tagValue = '';
    if(projectId){
      tagValue = projects?.find(p => p.id === projectId)?.name?.trim()
    }
    else if (newTag){
      tagValue = newTag.trim()
    }
    if (tagValue && !formData.tags.includes(tagValue)) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagValue]
      });
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectId || !formData.title || !formData.description || !formData.severity) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // Prepare bug data
      const bugData = {
        org_id: currentOrgId,
        project_id: formData.projectId,
        project_name: formData.projectName,
        title: formData.title,
        description: formData.description,
        priority: formData.severity,
        status: 'open', // Default status for new bugs
        tags: [formData.projectName, ...formData.tags],
        tracker_id: runId,
        assignee: formData.assignee,
        // Add any additional fields required by your API
      };

      // Show loading toast
      const loadingToast = toast({
        title: "Creating Bug",
        description: "Please wait while we create your bug report...",
      });

      // Call API to create bug
      await api.post(API_ENDPOINTS.BUGS, bugData);

      // Close the modal and reset form
      onOpenChange(false);
      setFormData({
        title: '',
        description: '',
        severity: 'medium',
        projectId: '',
        projectName: projectName || '',
        tags: [],
        assignee: ''
      });

      // Show success toast
      toast({
        title: "Success",
        description: "Bug reported successfully!",
        variant: "default"
      });

      // Refresh parent BugBoard component with the run ID
      // console.log(`Dispatching bug-created event with run ID: ${runId}`);
      const event = new CustomEvent('bug-created', {
        detail: { id: runId }
      });
      window.dispatchEvent(event);

    } catch (error) {
      console.error('Error creating bug:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to report bug. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProjectChange = (projectId: string) => {
    const selectedProject = projects.find(p => p.id === projectId);
    if (selectedProject) {
      setFormData({
        ...formData,
        projectId: projectId,
        projectName: selectedProject.name
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[600px] sm:max-w-full sm:max-w-full bg-white dark:bg-gray-900 flex flex-col p-0 max-h-screen">
        {/* Modern Green Header */}
        <div className="relative bg-tasksmate-gradient p-6 flex-shrink-0">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <AlertCircle className="h-5 w-5 text-white" />
                </div>
                <div>
                  <SheetTitle className="text-2xl font-bold text-white font-sora">
                    Report New Bug
                  </SheetTitle>
                </div>
              </div>
            </div>
            <SheetDescription className="text-white/90 text-sm leading-relaxed">
              Fill in the details below to report a new bug. Be as specific as possible to help resolve the issue.
            </SheetDescription>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-2">
          <div className="px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="title" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bug Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the bug"
                  className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="description" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the bug..."
                  rows={4}
                  className="min-h-[100px] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="project" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Project</Label>
                <Select value={formData.projectId} onValueChange={handleProjectChange}>
                  <SelectTrigger className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    {loadingProjects ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading projects...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Select project" />
                    )}
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    {projects.length === 0 && !loadingProjects && (
                      <SelectItem value="no-projects" disabled>No projects available</SelectItem>
                    )}
                    {projects.sort((a, b) => a.name.localeCompare(b.name)).map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800">{project.name}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="tags" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tags</Label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {formData.projectName ? (
                    <Badge className="bg-teal-100 text-teal-800 text-xs mr-1">{formData.projectName}</Badge>
                  ) : (
                    <span>Select a project above</span>
                  )}
                  {formData.projectName && " will be automatically added to this bug"}
                </p>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add tag and press Enter"
                    className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                  <Button type="button" onClick={() => handleAddTag()} variant="outline" size="sm" className="h-12">
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                        {tag}
                        <X
                          className="w-3 h-3 cursor-pointer hover:text-red-500"
                          onClick={() => handleRemoveTag(tag)}
                        />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label htmlFor="severity" className="text-sm font-semibold text-gray-700 dark:text-gray-300">Bug Severity</Label>
                <Select value={formData.severity} onValueChange={(value) => setFormData({ ...formData, severity: value })}>
                  <SelectTrigger className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select severity level" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-3">
                <Label htmlFor="owner" className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Assignee
                </Label>
                <Select value={formData.assignee} onValueChange={(value) => setFormData({ ...formData, assignee: value })}>
                  <SelectTrigger className="h-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-gray-800 border dark:border-gray-700 shadow-lg z-50">

                    {orgMembers.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((m) => {
                      return (
                        <SelectItem key={m.user_id} value={String(m.name)}>
                          {m.displayName} {m.designation ? `(${capitalizeFirstLetter(m.designation)})` : ""}
                        </SelectItem>
                      );
                    })}

                  </SelectContent>
                </Select>
              </div>



              <div className="pb-6">
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isSubmitting}
                    className="flex-1 h-12 text-base"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 h-12 text-base bg-tasksmate-gradient hover:scale-105 transition-transform"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : 'Report Bug'}
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

export default NewBugModal;
