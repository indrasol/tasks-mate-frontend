import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Users,
  Search,
  Plus,
  X
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '../../config';
import { api } from '@/services/apiService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MainNavigation from '@/components/navigation/MainNavigation';
import { useSearchParams } from 'react-router-dom';
import { BackendOrg, BackendOrgMember, BackendOrgMemberInvite, OrgMember, OrgMemberInvite } from '@/types/organization';
import { format } from 'path';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';

interface TeamMember {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  role: string;
  designation?: string;
  joined_at: string;
  project_count: number;
}

const TeamMembers = () => {
  const [teamMembers, setTeamMembers] = useState<OrgMember[]>([]);
  const [teamMembersError, setTeamMembersError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [invitedTeamMembers, setInvitedTeamMembers] = useState<OrgMemberInvite[]>([]);
  const [invitedTeamMembersError, setInvitedTeamMembersError] = useState('');
  const [loadingInvited, setLoadingInvited] = useState(true);
  const [searchQueryInvited, setSearchQueryInvited] = useState('');

  const [currentUserOrgRole, setCurrentUserOrgRole] = useState('');


  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get('org_id');

  const { data: currentOrganization } = useCurrentOrganization(orgId);

  // console.log(currentOrganization,'currentOrganization');

  useEffect(() => {
    if (user && orgId) {
      fetchTeamMembers();
      fetchInvitedTeamMembers();
    }
  }, [user, orgId]);

  const [inviteDesignation, setInviteDesignation] = useState('');
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  // Fetch designations
  useEffect(() => {
    const fetchDesignations = async () => {
      try {
        const data = await api.get<{ name: string }[]>(API_ENDPOINTS.DESIGNATIONS);
        setDesignationOptions(data.map(d => d.name));
      } catch (err) {
        console.error('Error fetching designations', err);
      }
    };
    fetchDesignations();
  }, []);

  const [inviteRole, setInviteRole] = useState('member');
  const [roleOptions, setRoleOptions] = useState<string[]>(["owner", "admin", "member"]);
  // Fetch designations
  // useEffect(() => {
  //   const fetchRoles = async () => {
  //     try {
  //       const data = await api.get<{ name: string }[]>(API_ENDPOINTS.USER_ROLES);
  //       setRoleOptions(data.map(d => d.name));
  //     } catch (err) {
  //       console.error('Error fetching roles', err);
  //     }
  //   };
  //   fetchRoles();
  // }, []);

  const fetchTeamMembers = async () => {
    setLoading(true);
    setTeamMembersError('');
    try {
      // This would need to be implemented based on current organization
      const data = await api.get<BackendOrgMember[]>(API_ENDPOINTS.ORGANIZATION_MEMBERS + `/${orgId}`);

      const formattedOrgs: OrgMember[] = (data || []).map((org) => {
        const formattedOrg: OrgMember = {
          id: org.id,
          org_id: org.org_id,
          user_id: org.user_id,
          email: org.email,
          role: org.role,
          joined_at: org.accepted_at || org.invited_at || org.updated_at || '',
          designation: org.designation || undefined,
        };

        return formattedOrg;
      });

      setTeamMembers(formattedOrgs);

      setCurrentUserOrgRole(formattedOrgs.find(org => org.user_id === user?.id)?.role || 'member');

    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembersError('Error fetching team members');
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitedTeamMembers = async () => {
    setLoadingInvited(true);
    setInvitedTeamMembersError('');
    try {
      // This would need to be implemented based on current organization
      const data = await api.get<BackendOrgMemberInvite[]>(API_ENDPOINTS.ORGANIZATION_INVITES + `/org/${orgId}`);

      const formattedOrgs: OrgMemberInvite[] = (data || []).map((org) => {
        const formattedOrg: OrgMemberInvite = {

          id: org.id,
          org_id: org.org_id,
          email: org.email,
          role: org.role,
          sent_at: org.sent_at || '',
          designation: org.designation || undefined,
        };

        return formattedOrg;
      });

      setInvitedTeamMembers(formattedOrgs);
    } catch (error) {
      console.error('Error fetching invited team members:', error);
      setInvitedTeamMembers([]);
      setInvitedTeamMembersError('Error fetching invited team members');
    } finally {
      setLoadingInvited(false);
    }
  };

  const handleInviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteEmail) return;
    if (!inviteEmail.trim() || !inviteRole.trim()) return;

    setUpdating(true);

    try {
      const payload = {
        org_id: orgId,
        org_name: currentOrganization?.name,
        email: inviteEmail.trim(),
        role: inviteRole.trim(),
        designation: inviteDesignation.trim(),
      };

      // console.log(payload);

      const data = await api.post(API_ENDPOINTS.ORGANIZATION_INVITES, payload);

      fetchInvitedTeamMembers(); // Refresh team members list

      toast({
        title: "Success",
        description: "Invitation sent successfully"
      });
      setIsInviteModalOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  const handleChangeDesignation = async (orgId: string, memberId: string, value: string, email?: string, type?: string) => {

    // TODO: call backend API to persist designation change
    if (type === "invited") {
      try {
        const data = await api.put(API_ENDPOINTS.ORGANIZATION_INVITES + `/${memberId}`, {
          email: email,
          org_id: orgId,
          designation: value
        });
      } catch (error) {
        console.error('Error updating designation:', error);
        toast({
          title: "Error",
          description: "Failed to update designation",
          variant: "destructive"
        });
        return;
      }
    } else {
      try {
        const data = await api.put(API_ENDPOINTS.ORGANIZATION_MEMBERS + `/${memberId}/${orgId}`, {
          user_id: memberId,
          org_id: orgId,
          designation: value
        });
      } catch (error) {
        console.error('Error updating designation:', error);
        toast({
          title: "Error",
          description: "Failed to update designation",
          variant: "destructive"
        });
        return;
      }
    }
    toast({
      title: "Success",
      description: "Designation updated successfully"
    });
    if (type === "invited") {
      setInvitedTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, designation: value } : m));
    } else {
      setTeamMembers(prev => prev.map(m => m.user_id === memberId ? { ...m, designation: value } : m));
    }
  };

  const handleChangeRole = async (orgId: string, memberId: string, value: string, email?: string, type?: string) => {

    // TODO: call backend API to persist designation change
    if (type === "invited") {
      try {
        const data = await api.put(API_ENDPOINTS.ORGANIZATION_INVITES + `/${memberId}`, {
          email: email,
          org_id: orgId,
          role: value
        });
      } catch (error) {
        console.error('Error updating role:', error);
        toast({
          title: "Error",
          description: "Failed to update role",
          variant: "destructive"
        });
        return;
      }
    } else {
      try {
        const data = await api.put(API_ENDPOINTS.ORGANIZATION_MEMBERS + `/${memberId}/${orgId}`, {
          user_id: memberId,
          org_id: orgId,
          role: value
        });
      } catch (error) {
        console.error('Error updating role:', error);
        toast({
          title: "Error",
          description: "Failed to update role",
          variant: "destructive"
        });
        return;
      }
    }
    toast({
      title: "Success",
      description: "Role updated successfully"
    });
    if (type === "invited") {
      setInvitedTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, role: value } : m));
    } else {
      setTeamMembers(prev => prev.map(m => m.user_id === memberId ? { ...m, role: value } : m));
    }
  };


  const handleRemoveTeamMember = async (orgId: string, memberId: string, type?: string) => {
    // setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m } : m));
    // TODO: call backend API to persist designation change

    // TODO: call backend API to persist designation change
    if (type === "invited") {
      try {
        const data = await api.del(API_ENDPOINTS.ORGANIZATION_INVITES + `/${memberId}`, {
          org_id: orgId
        });
      } catch (error) {
        console.error('Error removing member:', error);
        toast({
          title: "Error",
          description: "Failed to remove member",
          variant: "destructive"
        });
        return;
      }
    } else {
      try {
        const data = await api.del(API_ENDPOINTS.ORGANIZATION_MEMBERS + `/${memberId}/${orgId}`);
      } catch (error) {
        console.error('Error removing member:', error);
        toast({
          title: "Error",
          description: "Failed to remove member",
          variant: "destructive"
        });
        return;
      }
    }
    toast({
      title: "Success",
      description: "Member removed successfully"
    });
    if (type === "invited") {
      setInvitedTeamMembers(prev => prev.filter(m => m.id !== memberId));
    } else {
      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
    }
  };

  const [filteredTeamMembers, setFilteredTeamMembers] = useState<OrgMember[]>([]);

  useEffect(() => {
    setFilteredTeamMembers(teamMembers);
  }, [teamMembers]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    // This will automatically filter the team members based on the search query
    if (e.target.value.trim() === '') {
      setFilteredTeamMembers(teamMembers);
    }
    else {
      setFilteredTeamMembers(
        teamMembers.filter(member =>
          member.email?.toLowerCase().includes(e.target.value.toLowerCase()) ||
          member.role.toLowerCase().includes(e.target.value.toLowerCase()) ||
          member.designation.toLowerCase().includes(e.target.value.toLowerCase()) ||
          member.joined_at.toLowerCase().includes(e.target.value.toLowerCase())
        )
      );
    }
  }

  const [filteredInvitedTeamMembers, setFilteredInvitedTeamMembers] = useState<OrgMemberInvite[]>([]);

  useEffect(() => {
    setFilteredInvitedTeamMembers(invitedTeamMembers);
  }, [invitedTeamMembers]);

  const handleFilterChangeInvited = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQueryInvited(e.target.value);
    // This will automatically filter the team members based on the search query
    if (e.target.value.trim() === '') {
      setFilteredInvitedTeamMembers(invitedTeamMembers);
    }
    else {
      setFilteredInvitedTeamMembers(
        invitedTeamMembers.filter(member =>
          member.email?.toLowerCase().includes(e.target.value.toLowerCase()) ||
          member.role.toLowerCase().includes(e.target.value.toLowerCase()) ||
          member.designation.toLowerCase().includes(e.target.value.toLowerCase()) ||
          member.sent_at.toLowerCase().includes(e.target.value.toLowerCase())
        )
      );
    }
  }

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

  function capitalizeFirstLetter(opt: string): React.ReactNode {
    // replace underscores with spaces
    opt = opt.replace(/_/g, ' ');
    // capitalize first letter of each word
    opt = opt.replace(/\b\w/g, (char) => char.toUpperCase());
    return opt;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainNavigation />

      <div className="flex-1 transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        <div className="w-full px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
            <p className="text-gray-600 mt-2">Manage your organization's team members and their roles</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Team Members ({filteredTeamMembers.length})
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Filter by name/email..."
                      value={searchQuery}
                      onChange={(e) => handleFilterChange(e)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
                    <DialogTrigger asChild>
                      <Button className="bg-green-500 hover:bg-green-600">
                        <Plus className="w-4 h-4 mr-2" />
                        Invite Member
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Invite Team Member</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleInviteTeamMember} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="inviteEmail">Email *</Label>
                          <Input
                            id="inviteEmail"
                            type="email"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            placeholder="colleague@example.com"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inviteRole">Role</Label>
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {roleOptions.map((role) => (
                                <SelectItem key={role} value={role}>
                                  {capitalizeFirstLetter(role)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="inviteDesignation">Designation</Label>
                          <Select value={inviteDesignation} onValueChange={setInviteDesignation}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {designationOptions.map((designation) => (
                                <SelectItem key={designation} value={designation}>
                                  {capitalizeFirstLetter(designation)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button type="submit" className="w-full bg-green-500 hover:bg-green-600">
                          Send Invite
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeamMembers.length > 0 ? filteredTeamMembers.map((member) => (
                    <TableRow key={member.email}>
                      {/* <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>
                              {member.display_name?.charAt(0) || member.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.display_name || member.username}</div>
                            <div className="text-sm text-gray-500">@{member.username}</div>
                          </div>
                        </div>
                      </TableCell> */}
                      <TableCell className="text-gray-600">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={member.role} disabled={member.role === 'owner'} onValueChange={(val) => handleChangeRole(member.org_id, member.user_id, val)}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map(role => (
                              <SelectItem key={role} value={role}
                               disabled={(!(currentUserOrgRole === 'owner') && role === 'owner') || (!(currentUserOrgRole === 'owner' || currentUserOrgRole === 'admin') && role === 'admin')}
                               >
                                {capitalizeFirstLetter(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={member.designation ?? undefined} onValueChange={(val) => handleChangeDesignation(member.org_id, member.user_id, val)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {designationOptions.map(opt => (
                              <SelectItem key={opt} value={opt}>{capitalizeFirstLetter(opt)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{member.role !== 'owner' &&

                        <div className="flex w-10 items-center gap-2">
                          <X className="w-4 h-4 text-red-500" onClick={() => handleRemoveTeamMember(member.org_id, member.user_id)} />
                        </div>
                      }</TableCell>

                    </TableRow>
                  )) : <TableRow><TableCell colSpan={6} className="h-24 text-center">{teamMembersError ? (<span>{teamMembersError} <br></br> <Button onClick={fetchTeamMembers} variant="outline">Refresh</Button></span>) : loading ? 'Loading...' : 'No team members'}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Pending Invitations ({filteredInvitedTeamMembers.length})
                </CardTitle>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Filter by name/email..."
                      value={searchQueryInvited}
                      onChange={(e) => handleFilterChangeInvited(e)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Cancel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitedTeamMembers.length > 0 ? filteredInvitedTeamMembers.map((member) => (
                    <TableRow key={member.id}>
                      {/* <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarImage src={member.avatar_url} />
                            <AvatarFallback>
                              {member.display_name?.charAt(0) || member.username.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{member.display_name || member.username}</div>
                            <div className="text-sm text-gray-500">@{member.username}</div>
                          </div>
                        </div>
                      </TableCell> */}
                      <TableCell className="text-gray-600">
                        {member.email}
                      </TableCell>
                      <TableCell>
                        <Select defaultValue={member.role} disabled={member.role === 'owner'}  onValueChange={(val) => handleChangeRole(member.org_id, member.id, val, member.email, "invited")}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {roleOptions.map(role => (
                              <SelectItem key={role} value={role} disabled={!(currentUserOrgRole === 'owner' && role === 'owner') && !(currentUserOrgRole === 'owner' || currentUserOrgRole === 'admin') && role === 'admin'}>
                                {capitalizeFirstLetter(role)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={member.designation ?? undefined} onValueChange={(val) => handleChangeDesignation(member.org_id, member.id, val, member.email, "invited")}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {designationOptions.map(opt => (
                              <SelectItem key={opt} value={opt}>{capitalizeFirstLetter(opt)}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>{member.sent_at ? new Date(member.sent_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{member.role !== 'owner' &&
                        <div className="flex w-10 items-center gap-2">
                          <X className="w-4 h-4 text-red-500" onClick={() => handleRemoveTeamMember(member.org_id, member.id, "invited")} />
                        </div>
                      }</TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={6} className="h-24 text-center">{invitedTeamMembersError ? (<span>{invitedTeamMembersError} <br></br> <Button onClick={fetchInvitedTeamMembers} variant="outline">Refresh</Button></span>) : loadingInvited ? 'Loading...' : 'No invited members'}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};

export default TeamMembers; 