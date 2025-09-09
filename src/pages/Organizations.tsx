import OrganizationsHeader from '@/components/navigation/OrganizationsHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import CopyableBadge from '@/components/ui/copyable-badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/apiService';
import { BackendOrg, Organization, OrganizationInvitation } from '@/types/organization';
import { ArrowRight, Building2, Check, ChevronDown, ChevronsUpDown, Layers, Mail, Pencil, Plus, Search, Trash2, User, UserCheck, Users, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_ENDPOINTS } from '@/config';
import { processDesignations } from '@/lib/utils';
const CopyOrgId = ({ id, children }: { id: string, children: React.ReactNode }) => (
  <span onClick={(e) => e.stopPropagation()}>
    <CopyableBadge copyText={id} org_id={id} variant="outline">
      {children}
    </CopyableBadge>
  </span>
);
// Helper functions for badge colors
// Helper function to capitalize first letter of each word
const capitalizeWords = (text: string | null | undefined): string => {
  if (!text) return 'No designation';

  return text
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const getRoleBadgeColor = (): string => {
  return 'bg-blue-500 hover:bg-blue-600';
};

const getDesignationBadgeColor = (): string => {
  return 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-400 group-hover:bg-violet-100 dark:group-hover:bg-violet-900/50';
};

const getOrgIdBadgeColor = (): string => {
  return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 group-hover:bg-emerald-100 dark:group-hover:bg-emerald-900/50';
};

const getCreatorBadgeColor = (): string => {
  return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-400 group-hover:bg-amber-100 dark:group-hover:bg-amber-900/50';
};

const getCreatedAtBadgeColor = (): string => {
  return 'border-cyan-200 bg-cyan-50 text-cyan-800 dark:border-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-900/50';
};

// Helper function to format date
const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Unknown date';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return 'Invalid date';
  }
};

const Organizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [invitations, setInvitations] = useState<OrganizationInvitation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingInvitations, setLoadingInvitations] = useState(true);
  const [invitesOpen, setInvitesOpen] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgDescription, setNewOrgDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  // Edit organization state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<Organization | null>(null);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgDescription, setEditOrgDescription] = useState('');
  const [updating, setUpdating] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'newest' | 'oldest' | 'projects'>('name');
  // Designation related state
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  const [selectedDesignation, setSelectedDesignation] = useState<string | null>('Organization Owner');
  const [newDesignationInput, setNewDesignationInput] = useState('');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (user) {
      console.log(user);
      fetchOrganizations();
      fetchInvitations();
    }
  }, [user]);


  // Fetch global designations once on mount
  useEffect(() => {
    fetchDesignations();
  }, []);

  // Also fetch (or refresh) when create modal opens
  useEffect(() => {
    if (isCreateModalOpen && designationOptions.length === 0) {
      fetchDesignations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCreateModalOpen]);

  const fetchDesignations = async () => {
    try {
      const data = await api.get<{ name: string }[]>(API_ENDPOINTS.DESIGNATIONS);
      const names = (data || []).map((d) => d.name);
      const processedDesignations = processDesignations(names);
      
      setDesignationOptions(processedDesignations);
      if (!selectedDesignation) {
        setSelectedDesignation('Organization Owner');
      }
    } catch (err) {
      console.error('Error fetching designations', err);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoadingInvitations(true);
      console.log('Fetching organization invitations');

      // Fetch pending invitations for the current user's email
      const data = await api.get<OrganizationInvitation[]>(`${API_ENDPOINTS.ORGANIZATION_INVITES}/user`);
      console.log('Raw invitation data:', data);

      setInvitations(data || []);
    } catch (error) {
      console.error('Error fetching invitations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load organization invitations',
        variant: 'destructive',
      });
    } finally {
      setLoadingInvitations(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      console.log('Fetching organizations via API');

      const data = await api.get<BackendOrg[]>(API_ENDPOINTS.ORGANIZATIONS);
      console.log('Raw data from backend:', data);

      const formattedOrgs: Organization[] = (data || []).map((org) => {
        const formattedOrg = {
          org_id: org.org_id, // Ensure org_id is always preserved
          name: org.name,
          project_count: org.project_count ?? 0,
          member_count: org.member_count ?? 0,
          description: org.description ?? 'No description provided',
          designation: org.designation, // Keep as is from the backend
          role: org.role || 'member', // Only fallback if actually null/undefined
          created_by: org.created_by,
          created_at: org.created_at,
        };

        // Log each formatted org for debugging
        console.log(`Formatted org ${org.org_id}:`, formattedOrg);
        return formattedOrg;
      });

      console.log('Formatted organizations:', formattedOrgs);
      setOrganizations(formattedOrgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to load organizations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Create Org
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim() || !newOrgDescription.trim()) return;

    // Clear any previous errors
    setNameError(null);
    setCreating(true);

    toast({
      title: "Creating organization",
      description: "Please wait...",
    });
    
    
    try {

      type BackendOrgResp = {
        org_id: string;
        name: string;
        description: string;
        role: string;
        designation?: string;
        project_count?: number;
        member_count?: number;
        created_by?: string;
        created_at?: string;
      };

      const payload = {
        name: newOrgName.trim(),
        description: newOrgDescription.trim() || undefined,
        // Only send designation if it's explicitly selected and not the default "Organization Owner"
        // The backend will handle setting "Organization Owner" for owners automatically
        designation: (selectedDesignation && selectedDesignation !== 'Organization Owner') 
          ? selectedDesignation 
          : undefined,
      };
      const data = await api.post<BackendOrgResp>(API_ENDPOINTS.ORGANIZATIONS, payload);

      // Log the received data from backend to verify

      // Add the newly created organization directly to state to avoid a full refetch
      const newOrg: Organization = {
        org_id: data.org_id,
        name: data.name,
        description: data.description,
        role: data.role,
        designation: data.designation, // Keep as received from backend
        project_count: data.project_count ?? 0,
        member_count: data.member_count ?? 1,  // Default to 1 (the creator) if not provided
        created_by: data.created_by,
        created_at: data.created_at
      };

      setOrganizations(prev => [newOrg, ...prev]);

      toast({
        title: 'Success',
        description: 'Organization created successfully',
      });

      setIsCreateModalOpen(false);
      setNewOrgName('');
      setNewOrgDescription('');
      setSelectedDesignation('Organization Owner');
      // Optionally, navigate to the dashboard of the new org
      // navigate(`/dashboard?org_id=${data.org_id}`);
    } catch (error) {
      console.error('Error creating organization:', error);

      // Check if it's an organization name already exists error (HTTP 409)
      const err = error as any;
      if (err.statusCode === 409 || (err.message && err.message.includes('already exists'))) {
        // Set the name error to display in the form
        setNameError('This organization name is already taken. Please choose a different name.');
        toast({
          title: 'Organization Name Already Exists',
          description: 'An organization with this name already exists. Please choose a different name.',
          variant: 'destructive',
        });
      } else {
        // Generic error handling
        toast({
          title: 'Error',
          description: (error as Error).message || 'Failed to create organization',
          variant: 'destructive',
        });
      }
    } finally {
      setCreating(false);
    }
  };

  // ---------------- Edit Organization ----------------
  const openEditModal = (org: Organization) => {
    setEditOrg(org);
    setEditOrgName(org.name);
    setEditOrgDescription(org.description);
    setSelectedDesignation(org.designation ?? null);
    setIsEditModalOpen(true);
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrg) return;
    if (!editOrgName.trim() || !editOrgDescription.trim()) return;

    setUpdating(true);
    toast({
      title: "Updating organization",
      description: "Please wait...",
    });
    try {
      const payload = {
        org_id: editOrg.org_id,
        name: editOrgName.trim(),
        description: editOrgDescription.trim(),
        // designations: selectedDesignation ?? undefined,
      };
      await api.put(`${API_ENDPOINTS.ORGANIZATIONS}/${editOrg.org_id}`, payload);
      // Update local state
      setOrganizations(prev => prev.map(o => o.org_id === editOrg.org_id ? { ...o, ...payload } : o));
      toast({ title: 'Success', description: 'Organization updated successfully' });
      setIsEditModalOpen(false);
      setEditOrg(null);
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({ title: 'Error', description: (error as Error).message || 'Failed to update organization', variant: 'destructive' });
    } finally {
      setUpdating(false);
    }
  };

  // ---------------- Delete Organization ----------------


  const [deleteOrgModalOpen, setDeleteOrgModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteReasonType, setDeleteReasonType] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [deleteOrgIdConfirm, setDeleteOrgIdConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const openDeleteModal = (org: Organization) => {
    setOrgToDelete(org);
    setDeleteReason('');
    setDeleteReasonType('');
    setCustomReason('');
    setDeleteOrgIdConfirm('');
    setDeleteOrgModalOpen(true);
  };

  // Handle change of reason type
  const handleReasonTypeChange = (value: string) => {
    setDeleteReasonType(value);
    
    if (value !== 'other') {
      // For predefined reasons, use the value directly
      setDeleteReason(value);
    } else {
      // For "Other", we'll use the custom reason when it's entered
      setDeleteReason('');
    }
  };
  
  // Handle custom reason change
  const handleCustomReasonChange = (value: string) => {
    setCustomReason(value);
    if (deleteReasonType === 'other') {
      setDeleteReason(`Other - ${value}`);
    }
  };
  
  const handleDeleteOrganization = async () => {
    if (!orgToDelete) return;
    
    // Check if a reason is provided (either through dropdown or custom input)
    if (deleteReasonType === '') {
      toast({ title: 'Reason required', description: 'Please select a reason for deletion.', variant: 'destructive' });
      return;
    }
    
    // If "Other" is selected, make sure custom reason is provided
    if (deleteReasonType === 'other' && !customReason.trim()) {
      toast({ title: 'Comment required', description: 'Please provide comments for "Other" reason.', variant: 'destructive' });
      return;
    }
    
    setDeleting(true);
    toast({
      title: "Deleting organization",
      description: "Please wait...",
    });
    
    try {
      // Use final reason - either selected value or "Other - custom reason"
      const finalReason = deleteReasonType === 'other' ? `Other - ${customReason}` : deleteReasonType;
      
      await api.del(`${API_ENDPOINTS.ORGANIZATIONS}/${orgToDelete.org_id}`, { delete_reason: finalReason });
      toast({ title: 'Deleted', description: 'Organization deleted successfully' });
      setOrganizations(prev => prev.filter(o => o.org_id !== orgToDelete.org_id));
      setDeleteOrgModalOpen(false);
      setOrgToDelete(null);
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({ title: 'Error', description: (error as Error).message || 'Failed to delete organization', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // const handleDeleteOrganization = async (org: Organization) => {
  //   const confirmDelete = window.confirm(`Are you sure you want to delete organization '${org.name}'? This action cannot be undone.`);
  //   if (!confirmDelete) return;
  //   try {
  //     await api.del(`${API_ENDPOINTS.ORGANIZATIONS}/${org.org_id}`, { 'delete_reason': 'Delete from app' });
  //     toast({ title: 'Deleted', description: 'Organization deleted successfully' });
  //     setOrganizations(prev => prev.filter(o => o.org_id !== org.org_id));
  //   } catch (error) {
  //     console.error('Error deleting organization:', error);
  //     toast({ title: 'Error', description: (error as Error).message || 'Failed to delete organization', variant: 'destructive' });
  //   }
  // };

  const handleOrgCardClick = (orgId: string) => {
    // Navigate to the team members page with the organization ID
    // navigate(`/team-members?org_id=${orgId}`);
    navigate(`/dashboard?org_id=${orgId}`);

  };

  const handleAcceptInvite = async (invitationId: string) => {
    try {
      toast({
        title: "Accepting invitation",
        description: "Please wait...",
      });
      await api.put(`${API_ENDPOINTS.ORGANIZATION_INVITES}/${invitationId}/accept`, {});
      toast({
        title: 'Invitation Accepted',
        description: 'You have joined the organization.',
      });
      // Refresh both organizations and invitations
      fetchOrganizations();
      fetchInvitations();
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept the invitation',
        variant: 'destructive',
      });
    }
  };

  const handleRejectInvite = async (invitationId: string) => {
    try {
      toast({
        title: "Rejecting invitation",
        description: "Please wait...",
      });
      await api.del(`${API_ENDPOINTS.ORGANIZATION_INVITES}/${invitationId}/reject`, {});
      toast({
        title: 'Invitation Rejected',
        description: 'The organization invitation has been declined.',
      });
      // Just refresh invitations as we're not joining the org
      fetchInvitations();
    } catch (error) {
      console.error('Error rejecting invitation:', error);
      toast({
        title: 'Error',
        description: 'Failed to reject the invitation',
        variant: 'destructive',
      });
    }
  };

  // Filter by search query - search across all fields
  const filteredOrganizations = organizations
    .filter(org => {
      const query = searchQuery.toLowerCase();
      return (
        org.name.toLowerCase().includes(query) ||
        org.description.toLowerCase().includes(query) ||
        org.role.toLowerCase().includes(query) ||
        org.designation?.toLowerCase().includes(query) ||
        org.org_id.toLowerCase().includes(query) ||
        `${org.project_count}`.includes(query) || // Search in project count as string
        `${org.member_count}`.includes(query) || // Search in member count as string
        org.created_by?.toLowerCase().includes(query) || // Search by creator
        (org.created_at && new Date(org.created_at).toLocaleDateString().includes(query)) // Search by date
      );
    })
    // Apply sorting
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'projects':
          return b.project_count - a.project_count;
        default:
          return a.name.localeCompare(b.name);
      }
    });



  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      {/* Organization Invitations Panel - Only shown when there are pending invitations */}
      {/* {invitations.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 py-3 px-4 sm:px-6 lg:px-8">
          <div className="max-w-screen-lg mx-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-blue-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <h3 className="text-sm font-medium">Organization Invitations</h3>
              </div>
              <div className="text-xs text-blue-600">
                {invitations.length} pending invitation{invitations.length !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="mt-2 space-y-2">
              {invitations.map(invite => (
                <div key={invite.invitation_id} className="bg-white rounded-md border border-blue-100 shadow-sm p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{invite.org_name} invitation</div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Invited by {invite.invited_by} on {formatDate(invite.invited_at)} • Role: {capitalizeWords(invite.role)}
                    </div>
                  </div>
                  <div className="flex items-center flex-wrap gap-2">
                    <button
                      onClick={() => handleAcceptInvite(invite.invitation_id)}
                      className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRejectInvite(invite.invitation_id)}
                      className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}


      {/* Header */}
      <OrganizationsHeader />

      {/* Organization Invitations Banner */}
      <div className="w-full px-4 sm:px-6 lg:px-8 mt-4">
        {loadingInvitations ? (
          <div className="h-12 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
        ) : invitations.length > 0 ? (
          <Collapsible open={invitesOpen} onOpenChange={setInvitesOpen} className="w-full">
            <div className="bg-gradient-to-r from-blue-50 via-purple-50 to-indigo-50 border border-indigo-100 rounded-lg shadow-sm">
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-2 text-indigo-700">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium text-sm">
                    You have {invitations.length} pending organization invitation{invitations.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <CollapsibleTrigger asChild>
                  <button
                    className="p-1 rounded-md hover:bg-white/40 transition-colors"
                    aria-label={invitesOpen ? 'Collapse' : 'Expand'}
                  >
                    <ChevronDown
                      className={`w-4 h-4 text-indigo-700 transition-transform duration-300 ${invitesOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent className="space-y-2 px-4 pb-4 transition-all duration-300">
                {invitations.map((invite) => (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between bg-white/60 dark:bg-gray-900/40 border border-indigo-100 rounded-md p-3 transform transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:bg-white/80 dark:hover:bg-gray-900/60"
                  >
                    <div>
                      <div className="font-medium text-gray-800 dark:text-gray-100">
                        Invitation to join <span className="font-semibold">{invite.org_name || invite.org_id}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">
                        Invited by {invite.invited_by} on {formatDate(invite.sent_at)} {invite.role && ` • Role: ${capitalizeWords(invite.role)}`} {invite.designation && ` • Designation: ${capitalizeWords(invite.designation)}`}
                      </div>
                    </div>
                    <div className="flex items-center flex-shrink-0 gap-2">
                      <button
                        onClick={() => handleAcceptInvite(invite.id)}
                        className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleRejectInvite(invite.id)}
                        className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </CollapsibleContent>
            </div>
          </Collapsible>
        ) : (
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-gray-500 text-sm flex items-center gap-2 shadow mb-3">
            <Mail className="w-4 h-4" />
            <span>No pending organization invitations</span>
          </div>
        )}
      </div>

      {/* Search, filters and tools bar - Modern floating style */}
      <div className="relative z-10 mt-4 bg-transparent">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="bg-transparent backdrop-blur-md rounded-lg p-3">
            <div className="flex flex-wrap justify-between items-center gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search by name, ID, role, description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-52 md:w-64 bg-transparent border-gray-200/50 transition-all duration-300 focus:w-72 md:focus:w-96"
                  />
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 bg-transparent border-gray-200/50">
                      <span>Sort by</span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-md border-gray-100">
                    <DropdownMenuItem onClick={() => setSortBy('name')} className="cursor-pointer">
                      {sortBy === 'name' && <Check className="mr-2 h-4 w-4" />} Name
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('newest')} className="cursor-pointer">
                      {sortBy === 'newest' && <Check className="mr-2 h-4 w-4" />} Newest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('oldest')} className="cursor-pointer">
                      {sortBy === 'oldest' && <Check className="mr-2 h-4 w-4" />} Oldest first
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setSortBy('projects')} className="cursor-pointer">
                      {sortBy === 'projects' && <Check className="mr-2 h-4 w-4" />} Most projects
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-3">
                <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-500 hover:bg-green-600">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Organization
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <div className="flex items-center flex-wrap gap-2">
                        <DialogTitle>Create Organization</DialogTitle>
                        {/* <Badge className="bg-blue-500 text-white ml-2">Owner</Badge> */}
                      </div>
                    </DialogHeader>
                    <form onSubmit={handleCreateOrganization} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="orgName">Organization Name *</Label>
                        <Input
                          id="orgName"
                          value={newOrgName}
                          onChange={(e) => {
                            setNewOrgName(e.target.value);
                            // Clear error when user types
                            if (nameError) setNameError(null);
                          }}
                          placeholder="Enter organization name"
                          className={nameError ? "border-red-500 focus:ring-red-500" : ""}
                          required
                        />
                        {nameError && (
                          <p className="text-sm text-red-500 mt-1">{nameError}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="orgDescription">Description *</Label>
                        <Input
                          id="orgDescription"
                          value={newOrgDescription}
                          onChange={(e) => setNewOrgDescription(e.target.value)}
                          placeholder="Describe your organization"
                          required
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full bg-green-500 hover:bg-green-600"
                        disabled={creating}
                      >
                        {creating ? 'Creating...' : 'Create'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Edit Organization Modal */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <div className="flex items-center flex-wrap gap-2">
                        <DialogTitle>Edit Organization</DialogTitle>
                      </div>
                    </DialogHeader>
                    <form onSubmit={handleUpdateOrganization} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="editOrgName">Organization Name *</Label>
                        <Input
                          id="editOrgName"
                          value={editOrgName}
                          onChange={(e) => setEditOrgName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editOrgDescription">Description *</Label>
                        <Input
                          id="editOrgDescription"
                          value={editOrgDescription}
                          onChange={(e) => setEditOrgDescription(e.target.value)}
                          required
                        />
                      </div>

                      <Button type="submit" className="w-full bg-green-500 hover:bg-green-600" disabled={updating}>
                        {updating ? 'Saving...' : 'Save Changes'}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>

                <Dialog open={deleteOrgModalOpen} onOpenChange={setDeleteOrgModalOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <div className="flex items-center flex-wrap gap-2">
                        <DialogTitle>Delete Organization</DialogTitle>
                      </div>
                    </DialogHeader>
                    <div>
                      <p className="mb-4 text-gray-700">
                        Are you sure you want to delete <b>{orgToDelete?.name}</b>? This action cannot be undone.
                      </p>
                      
                      <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-sm text-amber-800 flex items-center flex-wrap">
                          To confirm deletion, please enter the 
                          <span className="mx-1" onClick={(e) => e.stopPropagation()}>
                            <CopyableBadge copyText={orgToDelete?.org_id || ''} org_id={orgToDelete?.org_id || ''} variant="outline" className={`transition-colors duration-300 ${getOrgIdBadgeColor()}`}>
                              {orgToDelete?.org_id}
                            </CopyableBadge>
                          </span>
                        </p>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <Label htmlFor="deleteOrgIdConfirm">Enter organization ID to confirm <span className="text-red-500">*</span></Label>
                        <Input
                          id="deleteOrgIdConfirm"
                          value={deleteOrgIdConfirm}
                          onChange={e => setDeleteOrgIdConfirm(e.target.value)}
                          placeholder="Paste organization ID here"
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="deleteReason">Reason for deletion <span className="text-red-500">*</span></Label>
                        <Select value={deleteReasonType} onValueChange={handleReasonTypeChange}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="No longer needed">No longer needed</SelectItem>
                            <SelectItem value="Created by mistake">Created by mistake</SelectItem>
                            <SelectItem value="Moving to a different organization">Moving to a different organization</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {deleteReasonType === 'other' && (
                          <div className="mt-3 space-y-2">
                            <Label htmlFor="customReason">Please specify comments <span className="text-red-500">*</span></Label>
                            <Input
                              id="customReason"
                              value={customReason}
                              onChange={e => handleCustomReasonChange(e.target.value)}
                              placeholder="Enter specific reason"
                              required
                            />
                          </div>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 mt-6">
                        <Button variant="outline" onClick={() => setDeleteOrgModalOpen(false)} disabled={deleting}>
                          Cancel
                        </Button>
                        <Button
                          className="bg-red-500 hover:bg-red-600 text-white"
                          onClick={handleDeleteOrganization}
                          disabled={
                            deleting || 
                            deleteOrgIdConfirm !== orgToDelete?.org_id || 
                            !deleteReasonType ||
                            (deleteReasonType === 'other' && !customReason.trim())
                          }
                        >
                          {deleting ? 'Deleting...' : 'Delete'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {filteredOrganizations.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No organizations found' : 'Get started by creating your first organization'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Organizations help you manage projects and collaborate with your team'
              }
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            )}
          </div>
        ) : (
          <div className="rounded-md border shadow-tasksmate overflow-x-auto">
            <Table className="min-w-full">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="w-20 sm:w-24 md:w-28 text-center font-bold min-w-[5rem]">ID</TableHead>
                  <TableHead className="min-w-[200px] sm:min-w-[250px] md:w-80 font-bold">Organization</TableHead>
                  <TableHead className="w-24 sm:w-28 md:w-32 text-center font-bold">Role</TableHead>
                  <TableHead className="w-20 sm:w-24 md:w-28 text-center font-bold">Members</TableHead>
                  <TableHead className="w-24 sm:w-28 md:w-32 text-center font-bold">Projects</TableHead>
                  <TableHead className="w-28 sm:w-32 md:w-40 text-center font-bold">Created By</TableHead>
                  <TableHead className="w-28 sm:w-32 md:w-36 text-center font-bold">Created At</TableHead>
                  <TableHead className="w-20 sm:w-24 text-center font-bold flex-shrink-0">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow
                    key={org.org_id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <TableCell className="text-center p-2">
                      <div onClick={(e) => e.stopPropagation()} className="flex justify-center min-w-0">
                        <CopyableBadge 
                          copyText={org.org_id} 
                          org_id={org.org_id} 
                          variant="outline" 
                          className={`transition-colors duration-300 ${getOrgIdBadgeColor()} max-w-full min-w-0 flex-shrink`}
                        >
                          {org.org_id}
                        </CopyableBadge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div 
                            className="font-semibold text-gray-900 truncate hover:text-green-600 cursor-pointer transition-colors"
                            onClick={() => org.org_id && handleOrgCardClick(org.org_id)}
                            title="Click to view organization details"
                          >
                            {org.name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{org.description}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="default"
                        className={`transition-colors duration-300 ${getRoleBadgeColor()}`}
                      >
                        <UserCheck className="w-3 h-3 mr-1" /> {capitalizeWords(org.role)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center text-sm text-gray-600">
                        <Users className="w-4 h-4 mr-1 text-gray-500" />
                        <span>{org.member_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center text-sm text-gray-600">
                        <Layers className="w-4 h-4 mr-1 text-gray-500" />
                        <span>{org.project_count}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {org.created_by && (
                        <Badge variant="outline" className={`transition-colors duration-300 ${getCreatorBadgeColor()}`}>
                          <User className="w-3 h-3 mr-1" /> {org.created_by}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      {org.created_at && (
                        <Badge variant="outline" className={`transition-colors duration-300 ${getCreatedAtBadgeColor()}`}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                          </svg> {formatDate(org.created_at)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {org.is_invite ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleAcceptInvite(org.invitation_id)}
                              className="p-1.5 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                              title="Accept invitation"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectInvite(org.invitation_id)}
                              className="p-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                              title="Reject invitation"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button 
                              className="p-1.5 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors" 
                              onClick={() => org.org_id && handleOrgCardClick(org.org_id)}
                              title="View organization details"
                            >
                              <ArrowRight className="w-4 h-4" />
                            </button>
                            {(org.role === 'owner' || org.role === 'admin') && (
                              <button 
                                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-600 hover:text-green-600 transition-colors" 
                                onClick={() => openEditModal(org)}
                                title="Edit organization"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                            )}
                            {org.role === 'owner' && (
                              <button 
                                className="p-1.5 rounded-full hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors" 
                                onClick={() => openDeleteModal(org)}
                                title="Delete organization"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Organizations;