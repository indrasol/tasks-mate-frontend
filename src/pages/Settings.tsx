
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import {
  AlertTriangle,
  Calendar,
  CreditCard,
  Download,
  User
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';
import MainNavigation from '@/components/navigation/MainNavigation';
import { useAuth } from '@/hooks/useAuth';

interface Profile {
  id: string;
  username: string;
  email: string;
  created_at?: string;
  updated_at?: string;
  display_name?: string;
  avatar_url?: string;
}


const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
  const { user, changePassword } = useAuth();


  // Add state
  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");

  useEffect(() => {
    if (user) {
      fetchUserDetails();
    }
  }, [user]);

  const fetchUserDetails = async () => {
    try {
      // const { data, error } = await supabase
      //   .from('users')
      //   .select('*')
      //   .eq('id', user?.id)
      //   .single();

      // if (error) throw error;

      const profileDetails: Profile = {
        id: user?.id,
        username: user?.user_metadata?.username,
        email: user?.email,
        created_at: user?.created_at,
        updated_at: user?.updated_at,
        display_name: user?.email,
        avatar_url: ""
      }

      setProfile(profileDetails);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };



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

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    try {
      await changePassword(currentPwd, newPwd);

      toast({ title: "Success", description: "Password updated" });
      setCurrentPwd(""); setNewPwd("");
      setPasswordChangeOpen(false);
    } catch (error: any) {
      toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <MainNavigation />

      <div className="flex-1 ml-64">
        <div className="max-w-6xl mx-auto px-6 py-8">
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

                    <div className="flex justify-between items-center pt-6 border-t">
                      {/* <Button type="submit" className="bg-green-500 hover:bg-green-600">
                        Save Changes
                      </Button> */}
                      <Button variant="destructive" className="flex items-center space-x-2">
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


          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Settings;
