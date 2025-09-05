
import MainNavigation from '@/components/navigation/MainNavigation';
import OrganizationsHeader from '@/components/navigation/OrganizationsHeader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
    AlertTriangle
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

    const [searchParams] = useSearchParams();
    const orgId = useMemo(() => searchParams.get('org_id'), [searchParams]);


    // Add state
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleting, setDeleting] = useState(false);

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




    const handleDeleteAccount = async () => {
        if (!user?.email) return;
        // open custom confirmation dialog 
        setDeleteModalOpen(true);
    };

    const handleDeleteUserCall = async () => {
        if (!user) return;
        if (!deleteReason.trim()) {
            toast({ title: 'Reason required', description: 'Please provide a reason for deletion.', variant: 'destructive' });
            return;
        }
        setDeleting(true);
        try {
            // await api.del(`${API_ENDPOINTS.USER}`, { delete_reason: deleteReason });
            toast({ title: 'Deleted', description: 'Account deleted successfully' });
            // signOut();
            // navigate('/org');
        } catch (error) {
            console.error('Error deleting account:', error);
            toast({ title: 'Error', description: (error as Error).message || 'Failed to delete account', variant: 'destructive' });
        } finally {
            setDeleting(false);
        }
    };

    const handleBack = () => {
        if (orgId) {
            navigate(`/dashboard?org_id=${orgId}`);
        } else {
            navigate('/org');
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

                                <div className="flex items-start pt-6 border-t">
                                    <Button variant="destructive" className="flex items-center space-x-2 mr-2"
                                        type='button' onClick={handleDeleteAccount}
                                    >
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Delete Account</span>
                                    </Button>
                                    <Button variant="secondary" className="flex items-center space-x-2"
                                        type="button" onClick={handleBack}
                                    >
                                        <span>Back to Organizations</span>
                                    </Button>


                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen} >
                <DialogContent aria-describedby='Delete User' aria-description='Delete User'>
                    <DialogHeader>
                        <div className="flex items-center flex-wrap gap-2">
                            <DialogTitle>Delete Account</DialogTitle>
                        </div>
                    </DialogHeader>
                    <div>
                        <p className="mb-4 text-gray-700">
                            Are you sure you want to delete your account? This action cannot be undone.
                        </p>
                        <div className="space-y-2">
                            <Label htmlFor="deleteReason">Reason for deletion <span className="text-red-500">*</span></Label>
                            <Input
                                id="deleteReason"
                                value={deleteReason}
                                onChange={e => setDeleteReason(e.target.value)}
                                placeholder="Enter reason"
                                required
                            />
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <Button variant="outline" onClick={() => setDeleteModalOpen(false)} disabled={deleting}>
                                Cancel
                            </Button>
                            <Button
                                className="bg-red-500 hover:bg-red-600 text-white"
                                onClick={handleDeleteUserCall}
                                disabled={deleting}
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>



        </div>
    );
};

export default UserProfile;
