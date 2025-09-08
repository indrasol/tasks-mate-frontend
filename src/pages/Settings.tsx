import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertTriangle,
  Building2,
  Calendar,
  Camera,
  CreditCard,
  Download,
  Info,
  Pencil,
  Trash2,
  Upload,
  User,
  UserCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';
import MainNavigation from '@/components/navigation/MainNavigation';
import CopyableBadge from '@/components/ui/copyable-badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_ENDPOINTS } from '@/config';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { api } from '@/services/apiService';
import { useAvatar } from '@/services/AvatarContext';
import { Organization } from '@/types/organization';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

// interface Profile {
//   id: string;
//   username: string;
//   email: string;
//   created_at?: string;
//   updated_at?: string;
//   display_name?: string;
//   avatar_url?: string;
// }

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

const orgPlan = (plan: string) => {
  switch (plan) {
    case 'free':
      return 'Free';
    case 'pro':
      return 'Pro';
    case 'enterprise':
      return 'Enterprise';
    default:
      return 'Unknown';
  }
};

const orgLimits = (plan: string) => {
  switch (plan) {
    case 'free':
      return {
        projects: 10,
        members: 10,
        storage: 1,
      };
    case 'pro':
      return {
        projects: 10,
        members: 10,
        storage: 1,
      };
    case 'enterprise':
      return {
        projects: 10,
        members: 10,
        storage: 1,
      };
    default:
      return {
        projects: 10,
        members: 10,
        storage: 1,
      };
  }
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  // Access shared avatar context
  const { avatarUrl, updateAvatar, isEnlarged, setIsEnlarged, isUploading } = useAvatar();

  // Organization edit state
  const [isEditOrgModalOpen, setIsEditOrgModalOpen] = useState(false);
  const [editOrgName, setEditOrgName] = useState('');
  const [editOrgDescription, setEditOrgDescription] = useState('');
  const [updating, setUpdating] = useState(false);

  // Organization delete state
  const [isDeleteOrgModalOpen, setIsDeleteOrgModalOpen] = useState(false);
  const [deleteReasonType, setDeleteReasonType] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [deleteOrgIdConfirm, setDeleteOrgIdConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Personal info edit state
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Avatar upload state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  // Get org details similar to other screens
  const currentOrgId = useCurrentOrgId();
  const { data: org, isLoading: currentOrgLoading, refetch: refetchOrg } = useCurrentOrganization(currentOrgId);

  // ---------------- Organization Edit ----------------
  const openEditOrgModal = () => {
    if (!org) return;
    setEditOrgName(org.name || '');
    setEditOrgDescription(org.description || '');
    setIsEditOrgModalOpen(true);
  };

  const handleUpdateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!org) return;
    if (!editOrgName.trim()) return;

    setUpdating(true);
    toast({
      title: "Updating organization",
      description: "Please wait...",
    });

    try {
      const payload = {
        org_id: org.org_id,
        name: editOrgName.trim(),
        description: editOrgDescription.trim() || undefined,
      };

      await api.put(`${API_ENDPOINTS.ORGANIZATIONS}/${org.org_id}`, payload);

      toast({
        title: 'Success',
        description: 'Organization updated successfully'
      });

      setIsEditOrgModalOpen(false);
      refetchOrg(); // Reload the organization data
    } catch (error) {
      console.error('Error updating organization:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to update organization',
        variant: 'destructive'
      });
    } finally {
      setUpdating(false);
    }
  };

  // ---------------- Delete Organization ----------------
  const openDeleteOrgModal = () => {
    if (!org) return;
    setDeleteReasonType('');
    setCustomReason('');
    setDeleteOrgIdConfirm('');
    setIsDeleteOrgModalOpen(true);
  };

  // Handle change of reason type
  const handleReasonTypeChange = (value: string) => {
    setDeleteReasonType(value);
  };

  const handleDeleteOrganization = async () => {
    if (!org) return;

    // Check if a reason is provided
    if (deleteReasonType === '') {
      toast({
        title: 'Reason required',
        description: 'Please select a reason for deletion.',
        variant: 'destructive'
      });
      return;
    }

    // If "Other" is selected, make sure custom reason is provided
    if (deleteReasonType === 'other' && !customReason.trim()) {
      toast({
        title: 'Comment required',
        description: 'Please provide comments for "Other" reason.',
        variant: 'destructive'
      });
      return;
    }

    // Check if org ID confirmation matches
    if (deleteOrgIdConfirm !== org.org_id) {
      toast({
        title: 'Invalid confirmation',
        description: 'The organization ID entered does not match.',
        variant: 'destructive'
      });
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

      await api.del(`${API_ENDPOINTS.ORGANIZATIONS}/${org.org_id}`, { delete_reason: finalReason });

      toast({
        title: 'Deleted',
        description: 'Organization deleted successfully'
      });

      setIsDeleteOrgModalOpen(false);
      navigate('/org'); // Redirect to organizations page
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to delete organization',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  // ---------------- Profile Edit ----------------
  const openEditProfileModal = () => {
    if (!user) return;

    setEditUsername(user.user_metadata?.username || '');
    setEditEmail(user.email || '');
    setIsEditProfileModalOpen(true);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdatingProfile(true);
    toast({
      title: "Updating profile",
      description: "Please wait...",
    });

    try {
      // Implement profile update logic here - would depend on your auth provider
      // For example with Supabase:
      // await supabase.auth.updateUser({
      //   email: editEmail,
      //   data: { username: editUsername }
      // });

      toast({
        title: 'Success',
        description: 'Profile updated successfully'
      });

      setIsEditProfileModalOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  // ---------------- Avatar Upload ----------------
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatarFile(file);

      // Validate file
      const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!validImageTypes.includes(file.type)) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file (JPEG, PNG, GIF, WEBP)',
          variant: 'destructive'
        });
        setAvatarFile(null);
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 5MB',
          variant: 'destructive'
        });
        setAvatarFile(null);
        return;
      }

      try {
        // Use the context's updateAvatar function
        // This will handle both the Supabase upload and updating user metadata
        await updateAvatar(file);
      } catch (error) {
        console.error('Error uploading avatar:', error);
        // The updateAvatar function already displays error toasts
      } finally {
        setAvatarFile(null);
        // Allow re-selecting the same file again in the future
        if (e.target) {
          e.target.value = '';
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <MainNavigation />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>

        </div>
      </div>
    );
  }

  if (currentOrgLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <MainNavigation />
        <div className="flex-1 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          <br></br>
          <p>Loading organization details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainNavigation />

      <div className="flex-1 transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        <div className="px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your organization settings</p>
          </div>

          <div className="space-y-6">
            {/* Personal Information Card */}
            {/* <Card>
              <CardHeader>
                <div className="flex flex-row items-center space-x-2">
                  <CardTitle>Personal Information</CardTitle>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                    onClick={openEditProfileModal}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="h-7 w-7 rounded-md flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50">
                      <Camera className="h-4 w-4" />
                    </div>
                    <input 
                      type="file" 
                      id="avatar-upload" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleAvatarChange}
                    />
                  </label>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Username</h4>
                    <div className="flex items-center space-x-2">
                      <Avatar 
                        className="w-8 h-8 cursor-pointer"
                        onClick={() => setIsEnlarged(true)}
                      >
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-gradient-to-br from-green-100 to-blue-100 text-green-600">
                          {(user?.user_metadata?.username || user?.email || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <p className="text-base font-medium">{user?.user_metadata?.username || 'No username set'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Role</h4>
                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                      <UserCheck className="w-3 h-3 mr-1" /> User
                    </Badge>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                    <p className="text-base">{user?.email || 'No email available'}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Joined on</h4>
                    <Badge variant="outline" className={`transition-colors duration-300 ${getCreatedAtBadgeColor()}`}>
                      <Calendar className="w-3 h-3 mr-1" /> {formatDate(user?.created_at)}
                    </Badge>
                  </div>
                </div>
                
              </CardContent>
            </Card> */}

            {/* Organization Details Card */}
            <Card>
              <CardHeader>
                <div className="flex flex-row items-center space-x-2">
                  <CardTitle>Organization Details</CardTitle>
                  {org?.role === 'owner' || org?.role === 'admin' ? (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                        onClick={openEditOrgModal}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {org?.role === 'owner' && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={openDeleteOrgModal}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                  {/* Column 1 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Organization name</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-lg flex items-center justify-center shadow-sm">
                        <Building2 className="w-3 h-3 text-green-600 dark:text-green-400" />
                      </div>
                      <p className="text-base font-medium">{org?.name || 'Unnamed Organization'}</p>
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Your role</h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Badge
                            variant="default"
                            className={`transition-colors duration-300 ${getRoleBadgeColor()}`}
                          >
                            <UserCheck className="w-3 h-3 mr-1" /> {capitalizeWords(org?.role)}
                          </Badge>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Your role in this organization</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>

                  {/* Column 1 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
                    <p className="text-base">{org?.description || 'No description available'}</p>
                  </div>

                  {/* Column 2 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Organization ID</h4>
                    {org?.org_id && (
                      <CopyableBadge copyText={org?.org_id} org_id={org?.org_id} variant="outline" className={`transition-colors duration-300 ${getOrgIdBadgeColor()}`}>
                        <Info className="w-3 h-3 mr-1" /> {org?.org_id}
                      </CopyableBadge>
                    )}
                  </div>

                  {/* Column 1 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Projects</h4>
                    <p className="text-base font-medium cursor-pointer text-green-600" onClick={() => navigate(`/projects?org_id=${org?.org_id}`)}>{org?.project_count || 'No'} projects</p>
                  </div>

                  {/* Column 2 */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-1">Team Members</h4>
                    <p className="text-base font-medium cursor-pointer text-green-600" onClick={() => navigate(`/team-members?org_id=${org?.org_id}`)}>{org?.member_count || 'No'} members</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Profile Edit Modal */}
      <Dialog open={isEditProfileModalOpen} onOpenChange={setIsEditProfileModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                placeholder="Enter your username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
            <div className="flex flex-col items-center space-y-2">
              <div className="text-sm font-medium text-gray-500">Profile Picture</div>
              <Avatar className="w-20 h-20">
                <AvatarImage src={avatarUrl} />
                <AvatarFallback className="bg-gradient-to-br from-green-100 to-blue-100 text-green-600 text-lg">
                  {editUsername.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => setIsEnlarged(true)}
              >
                {isUploading ? 'Uploading...' : 'View Full Size'}
              </Button>
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-green-500 hover:bg-green-600"
                disabled={updatingProfile}
              >
                {updatingProfile ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Organization Edit Modal */}
      <Dialog open={isEditOrgModalOpen} onOpenChange={setIsEditOrgModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organization</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdateOrganization} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={editOrgName}
                onChange={(e) => setEditOrgName(e.target.value)}
                placeholder="Enter organization name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="orgDescription">Description</Label>
              <Input
                id="orgDescription"
                value={editOrgDescription}
                onChange={(e) => setEditOrgDescription(e.target.value)}
                placeholder="Describe your organization"
              />
            </div>
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-green-500 hover:bg-green-600"
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Organization Delete Modal */}
      <Dialog open={isDeleteOrgModalOpen} onOpenChange={setIsDeleteOrgModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Organization</DialogTitle>
          </DialogHeader>
          <div>
            <p className="mb-4 text-gray-700">
              Are you sure you want to delete <b>{org?.name}</b>? This action cannot be undone.
            </p>

            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
              <p className="text-sm text-amber-800 flex items-center flex-wrap">
                To confirm deletion, please enter the
                <span className="mx-1" onClick={(e) => e.stopPropagation()}>
                  <CopyableBadge copyText={org?.org_id || ''} org_id={org?.org_id || ''} variant="outline" className={`transition-colors duration-300 ${getOrgIdBadgeColor()}`}>
                    {org?.org_id}
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
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Enter specific reason"
                    required
                  />
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setIsDeleteOrgModalOpen(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleDeleteOrganization}
                disabled={
                  deleting ||
                  deleteOrgIdConfirm !== org?.org_id ||
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

      {/* Enlarged Avatar Modal */}
      <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
        <DialogContent className="sm:max-w-md flex flex-col items-center p-0 gap-0 overflow-hidden">
          <div className="w-full h-full">
            <img
              src={avatarUrl || undefined}
              alt={`${user?.user_metadata?.username || 'User'}'s avatar`}
              className="w-full h-auto object-contain"
              onError={(e) => {
                // If image loading fails, show the initials fallback
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            {/* Fallback if the image fails to load */}
            {!avatarUrl && (
              <div className="flex items-center justify-center bg-gray-100 w-full h-64">
                <div className="flex items-center justify-center w-32 h-32 text-3xl font-bold text-white bg-green-500 rounded-full">
                  {(user?.user_metadata?.username || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;