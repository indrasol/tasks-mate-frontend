
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Building2,
  Calendar,
  CreditCard,
  Download,
  Info,
  User,
  UserCheck
} from 'lucide-react';
import { useEffect, useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';
import MainNavigation from '@/components/navigation/MainNavigation';
import CopyableBadge from '@/components/ui/copyable-badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { API_ENDPOINTS } from '@/config';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { api } from '@/services/apiService';
import { Organization } from '@/types/organization';
import { useNavigate } from 'react-router-dom';

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
  // const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(false);
  // const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  // const { user, changePassword } = useAuth();
  const { user } = useAuth();

  // Add state
  // const [currentPwd, setCurrentPwd] = useState("");
  // const [newPwd, setNewPwd] = useState("");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  // get org details similar to other screens
  const currentOrgId = useCurrentOrgId();
  const { data: org, isLoading: currentOrgLoading } = useCurrentOrganization(currentOrgId);

  // ---------------- Delete Organization ----------------


  const [deleteOrgModalOpen, setDeleteOrgModalOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const navigate = useNavigate();

  const openDeleteModal = (org: Organization) => {
    setOrgToDelete(org);
    setDeleteReason('');
    setDeleteOrgModalOpen(true);
  };

  const handleDeleteOrganization = async () => {
    if (!orgToDelete) return;
    if (!deleteReason.trim()) {
      toast({ title: 'Reason required', description: 'Please provide a reason for deletion.', variant: 'destructive' });
      return;
    }
    setDeleting(true);
    try {
      toast({
        title: "Deleting organization",
        description: "Please wait...",
      });
      await api.del(`${API_ENDPOINTS.ORGANIZATIONS}/${orgToDelete.org_id}`, { delete_reason: deleteReason });
      toast({ title: 'Deleted', description: 'Organization deleted successfully' });
      setDeleteOrgModalOpen(false);
      setOrgToDelete(null);
      navigate('/org');
    } catch (error) {
      console.error('Error deleting organization:', error);
      toast({ title: 'Error', description: (error as Error).message || 'Failed to delete organization', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  // useEffect(() => {
  //   if (user) {
  //     fetchUserDetails();
  //   }
  // }, [user]);

  // const fetchUserDetails = async () => {
  //   try {
  //     // const { data, error } = await supabase
  //     //   .from('users')
  //     //   .select('*')
  //     //   .eq('id', user?.id)
  //     //   .single();

  //     // if (error) throw error;

  //     const profileDetails: Profile = {
  //       id: user?.id,
  //       username: user?.user_metadata?.username,
  //       email: user?.email,
  //       created_at: user?.created_at,
  //       updated_at: user?.updated_at,
  //       display_name: user?.email,
  //       avatar_url: ""
  //     }

  //     setProfile(profileDetails);
  //   } catch (error) {
  //     console.error('Error fetching profile:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };



  // const handleProfileUpdate = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!profile) return;

  //   try {
  //     // const { error } = await supabase
  //     //   .from('users')
  //     //   .update({
  //     //     display_name: profile.display_name,
  //     //     username: profile.username
  //     //   })
  //     //   .eq('id', user?.id);

  //     // if (error) throw error;

  //     toast({
  //       title: "Success",
  //       description: "Profile updated successfully"
  //     });
  //   } catch (error) {
  //     console.error('Error updating profile:', error);
  //     toast({
  //       title: "Error",
  //       description: "Failed to update profile",
  //       variant: "destructive"
  //     });
  //   }
  // };

  // const handlePasswordChange = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (!user?.email) return;

  //   try {
  //     await changePassword(currentPwd, newPwd);

  //     toast({ title: "Success", description: "Password updated" });
  //     setCurrentPwd(""); setNewPwd("");
  //     setPasswordChangeOpen(false);
  //   } catch (error: any) {
  //     toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
  //   }
  // };

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainNavigation />

      <div className="flex-1 transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        <div className="px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your organization settings</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Security</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Billing</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm group-hover:shadow-md group-hover:scale-110 transition-all duration-300">
                      <Building2 className="w-6 h-6 text-green-600 dark:text-green-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">{org?.name}</h3>
                        <div className="flex items-center flex-wrap gap-2">
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
                          {org?.org_id && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span onClick={(e) => e.stopPropagation()}>
                                    <CopyableBadge copyText={org?.org_id} variant="outline" className={`transition-colors duration-300 ${getOrgIdBadgeColor()}`}>
                                      <Info className="w-3 h-3 mr-1" /> {org?.org_id}
                                    </CopyableBadge>
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Organization ID</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {org?.created_by && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className={`transition-colors duration-300 ${getCreatorBadgeColor()}`}>
                                    <User className="w-3 h-3 mr-1" /> {org?.created_by}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Created by</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          {org?.created_at && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge variant="outline" className={`transition-colors duration-300 ${getCreatedAtBadgeColor()}`}>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                                      <circle cx="12" cy="12" r="10" />
                                      <polyline points="12 6 12 12 16 14" />
                                    </svg> {formatDate(org?.created_at)}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Created at</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mt-1 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                        {org?.description}
                      </p>

                    </div>
                  </div>
                  <form className="space-y-6">
                    {/* <div className="flex items-center space-x-6">
                      <Avatar className="w-20 h-20">
                        <AvatarImage src={profile?.avatar_url} />
                        <AvatarFallback>
                          {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <Button variant="outline" className="flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Upload Avatar</span>
                      </Button>
                    </div> */}

                    {/* <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="displayName">Display Name</Label>
                        <Input
                          id="displayName"
                          value={profile?.display_name || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                          id="username"
                          value={profile?.username || ''}
                          onChange={(e) => setProfile(prev => prev ? { ...prev, username: e.target.value } : null)}
                        />
                      </div>
                    </div> */}

                    {/* <Collapsible open={passwordChangeOpen} onOpenChange={setPasswordChangeOpen}>
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" className="flex items-center space-x-2">
                          <span>Change Password</span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>

                            <Input id="currentPassword" type="password" value={currentPwd}
                              onChange={(e) => setCurrentPwd(e.target.value)} required />

                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" value={newPwd}
                              onChange={(e) => setNewPwd(e.target.value)} required />
                          </div>
                        </div>
                        <div className="flex justify-between items-center pt-6 border-t">
                          <Button onClick={handlePasswordChange} type="submit" className="bg-green-500 hover:bg-green-600">
                            Save new password
                          </Button>
                        </div>
                      </CollapsibleContent>
                    </Collapsible> */}

                    <div className="flex justify-between items-center pt-6 ">
                      {/* <Button type="submit" className="bg-green-500 hover:bg-green-600">
                        Save Changes
                      </Button> */}
                      <Button variant="destructive" className="flex items-center space-x-2"
                        disabled={org?.role !== 'owner'}
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Delete Org</span>
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Plan & Usage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="font-semibold">{org?.plan || 'Free'} Plan</h3>
                        <p className="text-sm text-gray-600">Perfect for getting started</p>
                      </div>
                      <Badge variant="secondary">Current Plan</Badge>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Projects</span>
                          <span>{org?.project_count || 0} / {orgLimits(org?.plan || 'free').projects}</span>
                        </div>
                        <Progress value={org?.project_count ? (org?.project_count / orgLimits(org?.plan || 'free').projects) * 100 : 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Team Members</span>
                          <span>{org?.member_count || 0} / {orgLimits(org?.plan || 'free').members}</span>
                        </div>
                        <Progress value={org?.member_count ? (org?.member_count / orgLimits(org?.plan || 'free').members) * 100 : 0} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Storage</span>
                          <span>{org?.storage || 0} / {orgLimits(org?.plan || 'free').storage} GB</span>
                        </div>
                        <Progress value={org?.storage ? (org?.storage / orgLimits(org?.plan || 'free').storage) * 100 : 0} className="h-2" />
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <Button className="bg-green-500 hover:bg-green-600">
                      Upgrade Plan
                    </Button>
                    <Button variant="outline">
                      Add Payment Method
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Billing History</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>{formatDate(org?.created_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>$0.00</TableCell>
                        <TableCell>
                          <Badge variant="default">Paid</Badge>
                        </TableCell>
                        <TableCell>
                          {orgPlan(org?.plan || 'free')}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            PDF
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>


          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
