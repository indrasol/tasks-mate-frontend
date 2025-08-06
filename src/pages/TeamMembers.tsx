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
  Plus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_ENDPOINTS } from '../../config';
import { api } from '@/services/apiService';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MainNavigation from '@/components/navigation/MainNavigation';
import { useSearchParams } from 'react-router-dom';
import { BackendOrgMember, BackendOrgMemberInvite, OrgMember, OrgMemberInvite } from '@/types/organization';
import { format } from 'path';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [updating, setUpdating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [invitedTeamMembers, setInvitedTeamMembers] = useState<OrgMember[]>([]);
  const [loadingInvited, setLoadingInvited] = useState(true);
  const [searchQueryInvited, setSearchQueryInvited] = useState('');


  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);
  const [designationOptions, setDesignationOptions] = useState<string[]>([]);
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const orgId = searchParams.get('org_id');

  useEffect(() => {
    if (user && orgId) {
      fetchTeamMembers();
      fetchInvitedTeamMembers();
    }
  }, [user, orgId]);

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

  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      // This would need to be implemented based on current organization
      const data = await api.get<BackendOrgMember[]>(API_ENDPOINTS.ORGANIZATION_MEMBERS + `/${orgId}`);

      const formattedOrgs: OrgMember[] = (data || []).map((org) => {
        const formattedOrg: OrgMember = {

          id: org.id,
          email: org.email,
          role: org.role,
          joined_at: org.accepted_at || org.invited_at || org.updated_at || '',
          // project_count: org.project_count  || 0, // Default to 0 if not provided
          designation: org.designation || undefined, // Keep as undefined if not provided
        };

        // Log each formatted org for debugging
        // console.log(`Formatted org ${org.org_id}:`, formattedOrg);
        return formattedOrg;
      });

      console.log(formattedOrgs);

      setTeamMembers(formattedOrgs);


      // For now, showing mock data
      // setTeamMembers([
      //   {
      //     id: '1',
      //     username: 'john.doe',
      //     display_name: 'John Doe',
      //     role: 'owner',
      //     joined_at: '2024-01-15',
      //     project_count: 5
      //   },
      //   {
      //     id: '2',
      //     username: 'jane.smith',
      //     display_name: 'Jane Smith',
      //     role: 'admin',
      //     joined_at: '2024-02-01',
      //     project_count: 3
      //   },
      //   {
      //     id: '3',
      //     username: 'mike.rodriguez',
      //     display_name: 'Mike Rodriguez',
      //     role: 'member',
      //     joined_at: '2024-03-10',
      //     project_count: 2
      //   },
      //   {
      //     id: '4',
      //     username: 'sarah.kim',
      //     display_name: 'Sarah Kim',
      //     role: 'admin',
      //     joined_at: '2024-02-20',
      //     project_count: 4
      //   }
      // ]);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setTeamMembers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitedTeamMembers = async () => {
    setLoadingInvited(true);
    try {
      // This would need to be implemented based on current organization
      const data = await api.get<BackendOrgMemberInvite[]>(API_ENDPOINTS.ORGANIZATION_INVITES + `/org/${orgId}`);

      const formattedOrgs: OrgMemberInvite[] = (data || []).map((org) => {
        const formattedOrg: OrgMemberInvite = {

          id: org.id,
          email: org.email,
          role: org.role,
          sent_at: org.sent_at || '',
          // project_count: org.project_count  || 0, // Default to 0 if not provided
          designation: org.designation || undefined, // Keep as undefined if not provided
        };

        // Log each formatted org for debugging
        // console.log(`Formatted org ${org.org_id}:`, formattedOrg);
        return formattedOrg;
      });

      console.log(formattedOrgs);

      setInvitedTeamMembers(formattedOrgs);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setInvitedTeamMembers([]);
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
        email: inviteEmail.trim(),
        role: inviteRole.trim(),
        // designations: selectedDesignation ?? undefined,
      };

      const data = await api.post(API_ENDPOINTS.ORGANIZATION_INVITES, payload);

      // Add the newly created organization member directly to state to avoid a full refetch
      // const newOrg: Organization = {
      //   org_id: data.org_id,
      //   name: data.name,
      //   description: data.description,
      //   role: data.role,
      //   designation: data.designation, // Keep as received from backend
      //   project_count: data.project_count ?? 0,
      //   member_count: data.member_count ?? 1,  // Default to 1 (the creator) if not provided
      //   created_by: data.created_by,
      //   created_at: data.created_at
      // };

      // setOrganizations(prev => [newOrg, ...prev]);

      fetchInvitedTeamMembers(); // Refresh team members list

      // This would need organization context
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

  const handleChangeDesignation = (memberId: string, value: string) => {
    setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m, designation: value } : m));
    // TODO: call backend API to persist designation change
  };

  const handleRemoveTeamMember = (memberId: string) => {
    // setTeamMembers(prev => prev.map(m => m.id === memberId ? { ...m } : m));
    // TODO: call backend API to persist designation change
  };

  const [filteredTeamMembers, setFilteredTeamMembers] = useState<OrgMember[]>([]);

  useEffect(() => {
    setFilteredTeamMembers(teamMembers);
  }, [teamMembers]);

  const [filteredInvitedTeamMembers, setFilteredInvitedTeamMembers] = useState<OrgMember[]>([]);

  useEffect(() => {
    setFilteredInvitedTeamMembers(invitedTeamMembers);
  }, [invitedTeamMembers]);

  // const filteredTeamMembers = teamMembers.filter(member =>
  //   member
  //   // member.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //   // member.username.toLowerCase().includes(searchQuery.toLowerCase())
  // );

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
          member.role.toLowerCase().includes(e.target.value.toLowerCase())
        )
      );
    }
  }

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
          member.role.toLowerCase().includes(e.target.value.toLowerCase())
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
                              <SelectItem value="admin">Admin</SelectItem>
                              <SelectItem value="member">Member</SelectItem>
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
                    {/* <TableHead>Member</TableHead> */}
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Designation</TableHead>
                    {/* <TableHead>Projects</TableHead> */}
                    <TableHead>Joined</TableHead>
                    <TableHead>Remove</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTeamMembers.map((member) => (
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
                        <Select defaultValue={member.role} disabled={member.role === 'owner'}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner" disabled>Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={member.designation ?? undefined} onValueChange={(val) => handleChangeDesignation(member.id, val)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {designationOptions.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {/* <TableCell>{member.project_count}</TableCell> */}
                      <TableCell>{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{member.role !== 'owner' && <Button onClick={() => handleRemoveTeamMember(member.id)}>Remove</Button>}</TableCell>
                    </TableRow>
                  ))}
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
                    {/* <TableHead>Member</TableHead> */}
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Designation</TableHead>
                    <TableHead>Invited</TableHead>
                    <TableHead>Cancel</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitedTeamMembers.map((member) => (
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
                        <Select defaultValue={member.role} disabled={member.role === 'owner'}>
                          <SelectTrigger className="w-24">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="owner" disabled>Owner</SelectItem>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="member">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select value={member.designation ?? undefined} onValueChange={(val) => handleChangeDesignation(member.id, val)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {designationOptions.map(opt => (
                              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      {/* <TableCell>{member.project_count}</TableCell> */}
                      <TableCell>{member.joined_at ? new Date(member.joined_at).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{<Button onClick={() => handleRemoveTeamMember(member.id)}>Remove</Button>}</TableCell>
                    </TableRow>
                  ))}
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