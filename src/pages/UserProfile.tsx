
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import {
    AlertTriangle,
    ChevronDown
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
// import { supabase } from '@/integrations/supabase/client';
import MainNavigation from '@/components/navigation/MainNavigation';
import OrganizationsHeader from '@/components/navigation/OrganizationsHeader';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface Profile {
    id: string;
    username: string;
    email: string;
    created_at?: string;
    updated_at?: string;
    display_name?: string;
    avatar_url?: string;
}


const UserProfile = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
    const { user, changePassword } = useAuth();
    const navigate = useNavigate();


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

    const handleBack = () => {
        navigate('/org');
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
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* <MainNavigation /> */}

            <OrganizationsHeader pageLabel='User Profile' />


            <div className="bg-transparent backdrop-blur-md rounded-lg p-3">
                    <div className="flex flex-wrap justify-between items-center gap-3">
                    <Card className="w-full">
                                <CardHeader>
                                    <CardTitle>Profile Information</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <form className="space-y-6">
                                        <div className="flex items-center space-x-6">
                                            <Avatar className="w-20 h-20">
                                                {/* <AvatarImage src={profile?.avatar_url} /> */}
                                                <AvatarFallback>
                                                    {profile?.display_name?.charAt(0) || profile?.username?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            {/* <Button variant="outline" className="flex items-center space-x-2">
                        <Upload className="w-4 h-4" />
                        <span>Upload Avatar</span>
                      </Button> */}
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
                                        </Collapsible>

                                        <div className="flex items-start pt-6 border-t">
                                            <Button variant="destructive" className="flex items-center space-x-2 mr-2">
                                                <AlertTriangle className="w-4 h-4" />
                                                <span>Delete Account</span>
                                            </Button>
                                            <Button variant="secondary" className="flex items-center space-x-2"
                                                onClick={handleBack}
                                            >
                                                <span>Back to Organizations</span>
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                    </div>
                </div>

            
        </div>
    );
};

export default UserProfile;
