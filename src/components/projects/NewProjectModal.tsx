
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
import { getStatusMeta, getPriorityColor, deriveDisplayFromEmail } from "@/lib/projectUtils";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (projectData: any) => void;
  /** Organization ID in which the new project is being created */
  orgId?: string;
  /** Optional edit mode props */
  mode?: 'create' | 'edit';
  initialData?: Partial<{
    name: string;
    description: string;
    owner: string;
    teamMembers: string[];
    priority: string;
    status: string;
    startDate: string;
    endDate: string;
  }>;
}

const NewProjectModal = ({ isOpen, onClose, onSubmit, orgId, mode = 'create', initialData }: NewProjectModalProps) => {
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
  const orgMembers: BackendOrgMember[] = useMemo(() => (orgMembersRaw?.map((m: any) => ({
    ...m,
    name: ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id,
  })).map((m: any) => ({
    ...m,
    displayName: deriveDisplayFromEmail(m.name).displayName,
    initials: deriveDisplayFromEmail(m.name).initials,
  })) ?? []) as BackendOrgMember[], [orgMembersRaw]);

  // Refresh members list whenever the modal is opened to ensure latest data
  useEffect(() => {
    if (isOpen) {
      refetchOrgMembers();
    }
  }, [isOpen, refetchOrgMembers]);



  // Apply initial data on open (edit mode)
  useEffect(() => {
    if (!isOpen || !initialData) return;
    setFormData(prev => ({
      name: initialData.name ?? prev.name,
      description: initialData.description ?? prev.description,
      owner: initialData.owner ?? prev.owner,
      teamMembers: initialData.teamMembers ?? prev.teamMembers,
      priority: initialData.priority ?? prev.priority,
      status: initialData.status ?? prev.status,
      startDate: initialData.startDate ?? prev.startDate,
      endDate: initialData.endDate ?? prev.endDate,
    }));
  }, [isOpen, initialData]);


  type TeamMember = { id: string; displayName: string; initials: string; designation?: string };
  const availableTeamMembers: TeamMember[] = useMemo(
    () =>
      orgMembers.map((m) => {
        // const usernamePart = m.email.split("@")[0];
        // const tokens = usernamePart.split(/[._-]+/).filter(Boolean);
        // const displayTokens = tokens.map((t) =>
        //   t.length === 1 ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1)
        // );
        // const displayName = displayTokens.join(" ");
        // const initials = displayTokens.map((t) => t[0]).join("").toUpperCase();
        return {
          id: m.user_id,
          displayName: m.displayName,
          initials: m.initials,
          designation: m.designation
        };
      }),
    [orgMembers]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      if (!formData.name || !formData.description || !formData.owner) {
        return;
      }
    }

    // Find the owner's designation from availableTeamMembers
    const ownerData = availableTeamMembers.find(member => member.id === formData.owner);
    const ownerDesignation = ownerData?.designation || "";

    // Collect designations for all team members
    const teamMemberDesignations = formData.teamMembers.map(memberId => {
      const member = availableTeamMembers.find(m => m.id === memberId);
      return {
        id: memberId,
        designation: member?.designation || ""
      };
    });

    // Add owner designation and team member designations to the form data
    const projectDataWithDesignations = {
      ...formData,
      ownerDesignation,
      teamMemberDesignations
    };

    onSubmit(projectDataWithDesignations);
    // setFormData({
    //   name: '',
    //   description: '',
    //   owner: '',
    //   teamMembers: [],
    //   priority: 'low',
    //   status: 'not_started',
    //   startDate: '',
    //   endDate: ''
    // });
  };

  const handleInputChange = (field: string, value: string | string[]) => {
    if (field === 'owner' && typeof value === 'string') {
      // When owner changes, remove that user from team members if present
      setFormData(prev => ({
        ...prev,
        owner: value,
        teamMembers: prev.teamMembers.filter(id => id !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleTeamMemberToggle = (memberId: string) => {
    // Don't allow the owner to be added as a team member
    if (memberId === formData.owner) return;

    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.includes(memberId)
        ? prev.teamMembers.filter(id => id !== memberId)
        : [...prev.teamMembers, memberId]
    }));
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <SheetContent className="w-[600px] sm:max-w-full sm:max-w-full bg-white dark:bg-gray-900 flex flex-col p-0 max-h-screen">
        <div className="bg-tasksmate-gradient p-6 flex-shrink-0">

          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Target className="h-5 w-5 text-white" />
            </div>
            <SheetTitle className="text-2xl font-bold text-white font-sora">
              {mode === 'edit' ? 'Edit Project' : 'Create New Project'}
            </SheetTitle>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">
            {mode === 'edit' ? 'Update your project details.' : 'Turn your ideas into reality. Fill in the details to kickstart a new project.'}
          </p>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="flex-1 px-2">
          <div className="px-4 py-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Project Name *</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  required
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your project goals and objectives"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full min-h-[100px] dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  required
                />
              </div>

              {/* Status and Priority Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleInputChange('status', value)}
                  >
                    <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <div className={`px-2 py-1 rounded-full text-xs ${getStatusMeta(formData.status).color}`}>
                        {getStatusMeta(formData.status).label}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {[
                        'planning',
                        'in_progress',
                        'on_hold',
                        'completed',
                        'archived',
                        'not_started',
                      ].map((s) => (
                        <SelectItem key={s} value={s}>
                          <span className={`px-2 py-1 rounded-full text-xs ${getStatusMeta(s).color}`}>
                            {getStatusMeta(s).label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => handleInputChange('priority', value)}
                  >
                    <SelectTrigger className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                      <div className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(formData.priority)}`}>
                        {formData.priority.toUpperCase()}
                      </div>
                    </SelectTrigger>
                    <SelectContent className="dark:bg-gray-800 dark:border-gray-700">
                      {['critical', 'high', 'medium', 'low', 'none'].map((p) => (
                        <SelectItem key={p} value={p}>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(p)}`}>
                            {p.toUpperCase()}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                    className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    max={formData.endDate || undefined}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">End Date</Label>
                  <Input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                    className="w-full dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    min={formData.startDate || undefined}
                  />
                </div>
              </div>

              {/* Project Owner */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <UserCheck className="w-4 h-4" />
                  Project Owner *
                </Label>
                <Select value={formData.owner} onValueChange={(value) => handleInputChange('owner', value)}>
                  <SelectTrigger className="dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                    <SelectValue placeholder="Select project owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTeamMembers.sort((a, b) => a.displayName.localeCompare(b.displayName)).map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.displayName} ({member.initials})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Team Members */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  Team Members
                </Label>
                <div className="border dark:border-gray-600 rounded-lg p-4 max-h-40 overflow-y-auto dark:bg-gray-700/50">
                  {membersLoading ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400">Loading members...</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        {availableTeamMembers
                          .filter(member => member.id !== formData.owner) // Exclude the selected owner
                          .sort((a, b) => a.displayName.localeCompare(b.displayName))
                          .map((member) => (
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
                                className="text-sm cursor-pointer flex-1 text-gray-700 dark:text-gray-300"
                              >
                                {member.displayName} ({member.initials})
                              </label>
                            </div>
                          ))}
                      </div>
                      {availableTeamMembers.filter(member => member.id !== formData.owner).length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                          {formData.owner ? "No other organization members found" : "No organization members found"}
                        </p>
                      )}
                    </>
                  )}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
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
                  className="bg-tasksmate-gradient font-medium text-white hover:scale-105 transition-transform"
                  disabled={mode === 'create' ? (!formData.name || !formData.description || !formData.owner) : false}
                >
                  {mode === 'edit' ? 'Save' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default NewProjectModal;
