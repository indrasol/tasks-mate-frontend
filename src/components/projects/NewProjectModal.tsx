
import React, { useState, useMemo, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Target, Users, UserCheck } from 'lucide-react';
import type { BackendOrgMember } from "@/types/organization";
import { useOrganizations } from "@/hooks/useOrganizations";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => void;
  /** Organization ID in which the new project is being created */
  orgId?: string;
}

const NewProjectModal = ({ isOpen, onClose, onSubmit, orgId }: NewProjectModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    owner: '',
    teamMembers: [] as string[],
    priority: 'low',
    status: 'not_started',
    startDate: '',
    endDate: ''
  });

  // Fetch organization members
  // If an orgId was passed explicitly use that, otherwise fall back to the first
  // organization the current user belongs to.
  const { data: organizations } = useOrganizations();
  const effectiveOrgId = orgId ?? organizations?.[0]?.id;
  const { data: orgMembersRaw, isLoading: membersLoading, refetch: refetchOrgMembers } = useOrganizationMembers(effectiveOrgId);

  // Refresh members list whenever the modal is opened to ensure latest data
  useEffect(() => {
    if (isOpen) {
      refetchOrgMembers();
    }
  }, [isOpen, refetchOrgMembers]);
  const orgMembers: BackendOrgMember[] = (orgMembersRaw ?? []) as BackendOrgMember[];

  type TeamMember = { id: string; displayName: string; initials: string };
  const availableTeamMembers: TeamMember[] = useMemo(
    () =>
      orgMembers.map((m) => {
        const usernamePart = m.email.split("@")[0];
        const tokens = usernamePart.split(/[._-]+/).filter(Boolean);
        const displayTokens = tokens.map((t) =>
          t.length === 1 ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1)
        );
        const displayName = displayTokens.join(" ");
        const initials = displayTokens.map((t) => t[0]).join("").toUpperCase();
        return { id: m.user_id, displayName, initials };
      }),
    [orgMembers]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description || !formData.owner) {
      return;
    }
    
    onSubmit(formData);
    setFormData({
      name: '',
      description: '',
      owner: '',
      teamMembers: [],
      priority: 'low',
      status: 'not_started',
      startDate: '',
      endDate: ''
    });
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTeamMemberToggle = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(memberId)
        ? prev.teamMembers.filter(id => id !== memberId)
        : [...prev.teamMembers, memberId]
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if(!open) onClose(); }}>
      <SheetContent className="w-[400px] sm:w-[540px] bg-white flex flex-col p-0 max-h-screen">
        <div className="relative bg-tasksmate-gradient p-6 flex-shrink-0">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Target className="h-5 w-5 text-white" />
              </div>
              <SheetTitle className="text-2xl font-bold text-white font-sora">
                Create New Project
              </SheetTitle>
            </div>
            <p className="text-white/90 text-sm leading-relaxed">
              Turn your ideas into reality. Fill in the details to kickstart a new project.
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1 px-6">
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Project Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Project Name *</Label>
            <Input
              id="name"
              placeholder="Enter project name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe your project goals and objectives"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full min-h-[100px]"
              required
            />
          </div>

          {/* Status and Priority Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planning">Planning</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="not_started">Not Started</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Priority</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => handleInputChange('priority', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange('startDate', e.target.value)}
                className="w-full"
                max={formData.endDate || undefined}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date</Label>
              <Input
                type="date"
                value={formData.endDate}
                onChange={(e) => handleInputChange('endDate', e.target.value)}
                className="w-full"
                min={formData.startDate || undefined}
              />
            </div>
          </div>

          {/* Project Owner */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <UserCheck className="w-4 h-4" />
              Project Owner *
            </Label>
            <Select value={formData.owner} onValueChange={(value) => handleInputChange('owner', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select project owner" />
              </SelectTrigger>
              <SelectContent>
                {availableTeamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.displayName} ({member.initials})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Team Members */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Users className="w-4 h-4" />
              Team Members
            </Label>
            <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
              {membersLoading ? (
                <p className="text-sm text-gray-500">Loading members...</p>
              ) : (
                <>
                  <div className="space-y-2">
                {availableTeamMembers.map((member) => (
                  <div key={member.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`member-${member.id}`}
                      checked={formData.teamMembers.includes(member.id)}
                      onChange={() => handleTeamMemberToggle(member.id)}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label 
                      htmlFor={`member-${member.id}`} 
                      className="text-sm cursor-pointer flex-1"
                    >
                      {member.displayName} ({member.initials})
                    </label>
                  </div>
                ))}
                  </div>
                  {availableTeamMembers.length === 0 && (
                    <p className="text-sm text-gray-500 italic">No organization members found</p>
                  )}
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">
              Selected: {formData.teamMembers.length} member{formData.teamMembers.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-tasksmate-gradient hover:scale-105 transition-transform"
              disabled={!formData.name || !formData.description || !formData.owner}
            >
              Create Project
            </Button>
          </div>
        </form>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NewProjectModal;
