
import MainNavigation from '@/components/navigation/MainNavigation';
import OrganizationsHeader from '@/components/navigation/OrganizationsHeader';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAvatar } from '@/services/AvatarContext';
import {
    AlertTriangle,
    Calendar,
    Camera,
    Loader2,
    Pencil,
    Upload,
    UserCheck
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface Profile {
    id: string;
    username: string;
    email: string;
    role?: string;
    created_at?: string;
    updated_at?: string;
    display_name?: string;
    avatar_url?: string;
}


const getRoleBadgeColor = (): string => {
    return 'bg-blue-500 hover:bg-blue-600';
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


const UserProfile = () => {
    // const [activeTab, setActiveTab] = useState('profile');
    // const [profile, setProfile] = useState<Profile | null>(null);
    // const [loading, setLoading] = useState(true);
    // const [passwordChangeOpen, setPasswordChangeOpen] = useState(false);
    const { user, session, loading } = useAuth();

    const navigate = useNavigate();

    const [searchParams] = useSearchParams();
    const orgId = useMemo(() => searchParams.get('org_id'), [searchParams]);


    // Add state
    const [currentPwd, setCurrentPwd] = useState("");
    const [newPwd, setNewPwd] = useState("");

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteReason, setDeleteReason] = useState('');
    const [deleting, setDeleting] = useState(false);

    // Access shared avatar context
    const { avatarUrl, updateAvatar, isEnlarged, setIsEnlarged, isUploading } = useAvatar();

    // Personal info edit state
    const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
    const [editUsername, setEditUsername] = useState('');
    const [editEmail, setEditEmail] = useState('');
    const [updatingProfile, setUpdatingProfile] = useState(false);

    // Avatar upload state
    const [avatarFile, setAvatarFile] = useState<File | null>(null);

    useEffect(() => {
        if (user?.user_metadata?.avatar_url) {
            // console.log(user?.user_metadata?.avatar_url, avatarUrl);
            //setAvatarUrl(user.user_metadata?.avatar_url || '');
        }
    }, [user, user?.user_metadata?.avatar_url, session]);

    // useEffect(() => {
    //     if (user) {
    //         fetchUserDetails();
    //     }
    // }, [user]);

    // const fetchUserDetails = async () => {
    //     try {
    //         // const { data, error } = await supabase
    //         //   .from('users')
    //         //   .select('*')
    //         //   .eq('id', user?.id)
    //         //   .single();

    //         // if (error) throw error;

    //         const profileDetails: Profile = {
    //             id: user?.id,
    //             username: user?.user_metadata?.username,
    //             email: user?.email,
    //             created_at: user?.created_at,
    //             updated_at: user?.updated_at,
    //             display_name: user?.email,
    //             avatar_url: user?.user_metadata?.avatar_url || "",
    //         }

    //         setProfile(profileDetails);
    //     } catch (error) {
    //         console.error('Error fetching profile:', error);
    //     } finally {
    //         setLoading(false);
    //     }
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
    //     e.preventDefault();
    //     if (!user?.email) return;

    //     try {
    //         await changePassword(currentPwd, newPwd);

    //         toast({ title: "Success", description: "Password updated" });
    //         setCurrentPwd(""); setNewPwd("");
    //         setPasswordChangeOpen(false);
    //     } catch (error: any) {
    //         toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    //     }
    // };




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
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
                <MainNavigation />
                <div className="flex-1 ml-64 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
            {/* <MainNavigation /> */}

            {/* {orgId ? (
                <MainNavigation />
            ) : (
                <OrganizationsHeader pageLabel='User Profile' />
            )}
            
            */}

            <OrganizationsHeader pageLabel='User Profile' />

            <div className="bg-transparent backdrop-blur-md rounded-lg p-3">
                <div className="flex flex-wrap justify-between items-center gap-3">
                    <Card className="w-full">
                        <CardHeader>
                            <div className="flex flex-row items-center space-x-2">
                                <CardTitle>Profile Information</CardTitle>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={openEditProfileModal}
                                    title='Edit Profile'
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {/* <form className="space-y-6"> */}
                            <div className="flex items-center space-x-6">

                                <Avatar className="w-20 h-20 cursor-pointer"
                                    onClick={() => setIsEnlarged(true)}>
                                    <AvatarImage src={avatarUrl || undefined} />
                                    <AvatarFallback>
                                        {user?.user_metadata?.display_name?.charAt(0) || user?.user_metadata?.username?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                {isUploading ? (
                                    <div className="flex items-center space-x-2">
                                        <Loader2 className="animate-spin h-4 w-4 text-green-600" />
                                        <span>Uploading...</span>
                                    </div>
                                ) :
                                    <label htmlFor="avatar-upload" className="cursor-pointer">
                                        <div title="Change Avatar" className="h-7 w-7 rounded-md flex items-center justify-center text-green-600 hover:text-green-700 hover:bg-green-50">
                                            <Camera className="h-4 w-4" />
                                            {/* <br></br>
                                            <span className="text-xs">Change Avatar</span> */}
                                        </div>
                                        {/* <Button onClick={(e) => e.preventDefault()} type='button' variant="outline" className="flex items-center space-x-2">
                                        <Upload className="w-4 h-4" />
                                        <span>Change Avatar</span>
                                    </Button>
                                     */}


                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />
                                    </label>
                                }
                                {/* <label htmlFor="avatar-upload" className="cursor-pointer">
                                    <Button type='button' variant="outline" className="flex items-center space-x-2">
                                        <Upload className="w-4 h-4" />
                                        <span>Upload Avatar</span>
                                        <input
                                            type="file"
                                            id="avatar-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleAvatarChange}
                                        />

                                    </Button>
                                </label> */}
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                {/* <div className="space-y-2">
                                        <Label htmlFor="displayName">Display Name</Label>
                                        <Input
                                            id="displayName"
                                            value={profile?.display_name || ''}
                                            onChange={(e) => setProfile(prev => prev ? { ...prev, display_name: e.target.value } : null)}
                                        />
                                    </div> */}
                                <div className="space-y-2 my-2">
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Username</h4>
                                    <p className="text-base">{user?.user_metadata?.username || 'No username available'}</p>
                                </div>
                                {/* <div className="space-y-2 my-2">
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Role</h4>
                                    <Badge variant="default" className="bg-blue-500 hover:bg-blue-600">
                                        <UserCheck className="w-3 h-3 mr-1" /> {user?.user_metadata?.role || 'User'}
                                    </Badge>
                                </div> */}
                                {/* </div>
                            <div className="grid grid-cols-2 gap-4"> */}
                                <div className="space-y-2 my-2">
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Email</h4>
                                    <p className="text-base">{user?.email || 'No email available'}</p>

                                </div>
                                <div className="space-y-2 my-2">
                                    <h4 className="text-sm font-medium text-gray-500 mb-1">Joined on</h4>
                                    <Badge variant="outline" className={`transition-colors duration-300 ${getCreatedAtBadgeColor()}`}>
                                        <Calendar className="w-3 h-3 mr-1" /> {formatDate(user?.created_at)}
                                    </Badge>
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
                            {/* </form> */}
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
                        <p className="mb-4 text-gray-700 dark:text-gray-300">
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
                        {/* <div className="flex flex-col items-center space-y-2">
                            <div className="text-sm font-medium text-gray-500">Profile Picture</div>
                            <Avatar className="w-20 h-20">
                                <AvatarImage src={avatarUrl || undefined} />
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
                        </div> */}
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

export default UserProfile;
