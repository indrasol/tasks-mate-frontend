
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  User, 
  CreditCard, 
  Users, 
  Upload, 
  Search, 
  Plus, 
  ChevronDown,
  Calendar,
  Download,
  AlertTriangle 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import MainNavigation from '@/components/navigation/MainNavigation';

interface Profile {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
}

interface TeamMember {
  id: string;
  username: string;
  display_name?: string;
  avatar_url?: string;
  role: string;
  joined_at: string;
  project_count: number;
}

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('member');
  const [loading, setLoading] = useState(true);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchTeamMembers();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamMembers = async () => {
    try {
      // This would need to be implemented based on current organization
      // For now, showing mock data
      setTeamMembers([
        {
          id: '1',
          username: 'john.doe',
          display_name: 'John Doe',
          role: 'owner',
          joined_at: '2024-01-15',
          project_count: 5
        },
        {
          id: '2', 
          username: 'jane.smith',
          display_name: 'Jane Smith',
          role: 'admin',
          joined_at: '2024-02-01',
          project_count: 3
        }
      ]);
    } catch (error) {
      console.error('Error fetching team members:', error);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: profile.display_name,
          username: profile.username
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile updated successfully"
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  const handleInviteTeamMember = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
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
    }
  };

  const filteredTeamMembers = teamMembers.filter(member =>
    member.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      
      <div className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account and organization settings</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center space-x-2">
                <User className="w-4 h-4" />
                <span>Profile</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center space-x-2">
                <CreditCard className="w-4 h-4" />
                <span>Billing</span>
              </TabsTrigger>
              <TabsTrigger value="team" className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Team Members</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div className="flex items-center space-x-6">
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
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
                    </div>

                    <Collapsible open={passwordChangeOpen} onOpenChange={setPasswordChangeOpen}>
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
                            <Input id="currentPassword" type="password" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input id="newPassword" type="password" />
                          </div>
                        </div>
                      </CollapsibleContent>
                    </Collapsible>

                    <div className="flex justify-between items-center pt-6 border-t">
                      <Button type="submit" className="bg-green-500 hover:bg-green-600">
                        Save Changes
                      </Button>
                      <Button variant="destructive" className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>Delete Account</span>
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
                        <h3 className="font-semibold">Free Plan</h3>
                        <p className="text-sm text-gray-600">Perfect for getting started</p>
                      </div>
                      <Badge variant="secondary">Current Plan</Badge>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Projects</span>
                          <span>2 / 3</span>
                        </div>
                        <Progress value={67} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Team Members</span>
                          <span>2 / 5</span>
                        </div>
                        <Progress value={40} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Storage</span>
                          <span>1.2 GB / 5 GB</span>
                        </div>
                        <Progress value={24} className="h-2" />
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
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span>Dec 1, 2024</span>
                          </div>
                        </TableCell>
                        <TableCell>$29.00</TableCell>
                        <TableCell>
                          <Badge variant="default">Paid</Badge>
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

            {/* Team Members Tab */}
            <TabsContent value="team" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Team Members</CardTitle>
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Filter by name/email..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
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
                        <TableHead>Member</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Projects</TableHead>
                        <TableHead>Joined</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTeamMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell>
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
                          </TableCell>
                          <TableCell className="text-gray-600">
                            {member.username}@example.com
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
                          <TableCell>{member.project_count}</TableCell>
                          <TableCell>{new Date(member.joined_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))}
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
