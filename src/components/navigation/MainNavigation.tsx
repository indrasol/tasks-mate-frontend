
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { deriveDisplayFromEmail } from '@/lib/projectUtils';
import { useAvatar } from '@/services/AvatarContext';
import {
  ArrowLeft,
  Bug,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit3,
  Home,
  Layers,
  LogOut,
  MapPin,
  RefreshCw,
  Settings,
  Star,
  User,
  Users,
  MessageSquare 
} from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import ThemeToggle from '@/components/ui/theme-toggle';

import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import type { SimpleOrg } from '@/hooks/useOrganizations';
import { useOrganizations } from '@/hooks/useOrganizations';

interface MainNavigationProps {
  onNewTask?: () => void;
  onNewMeeting?: () => void;
  onScratchpadOpen?: () => void;
}

type NavigationItem = {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
  isActive?: boolean;
};

const MainNavigation = ({ onNewTask, onNewMeeting, onScratchpadOpen }: MainNavigationProps) => {

  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { avatarUrl } = useAvatar();
  const [searchParams] = useSearchParams();
  const orgId = useMemo(() => searchParams.get('org_id'), [searchParams]);
  const { data: orgMembers = [] } = useOrganizationMembers(orgId || undefined);
  // Determine a friendly username to show in the sidebar
  const profileLabel = useMemo(() => {
    if (!user) return 'Profile';
    const usernameMeta = (user as any)?.user_metadata?.username;
    if (usernameMeta) return deriveDisplayFromEmail(usernameMeta).displayName;
    if (user.email) return deriveDisplayFromEmail(user.email).displayName;
    return 'Profile';
  }, [user]);

  const { data: orgList } = useOrganizations();
  const userOrganizations = (orgList ?? []) as SimpleOrg[];

  const [isCollapsed, setIsCollapsed] = useState(false);
  const currentOrgName = useMemo(() => {
    if (!orgId) return '';
    const currentOrg = userOrganizations.find((org) => org.id === orgId);
    console.log('Current org in MainNavigation:', currentOrg);
    return currentOrg?.name ?? '';
  }, [orgId, userOrganizations]);

  // Resolve designation for current user within current org (if available)
  const myDesignation = useMemo(() => {
    if (!user || !orgId) return '';
    const match = orgMembers.find((m) => {
      const emailMatch = m.email?.toLowerCase() === (user.email ?? '').toLowerCase();
      const idMatch = m.user_id === user.id;
      const usernameMatch = ((user as any)?.user_metadata?.username || '').toLowerCase() === (m.email || '').toLowerCase();
      return emailMatch || idMatch || usernameMatch;
    });
    if (match?.designation) {
      return match.designation;
    }
    return '';
  }, [orgMembers, user, orgId]);

  // Broadcast sidebar collapse
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('sidebar-toggle', { detail: { collapsed: isCollapsed } }));
    document.documentElement.style.setProperty('--sidebar-width', isCollapsed ? '4rem' : '16rem');
  }, [isCollapsed]);

  // Avoid duplicate fetches


  useEffect(() => {
    // Only fetch if user is logged in and orgId is set, and if the orgId has changed

    if (!user || !orgId) {
      return;
    }
















  }, [user, orgId]);



  const handleSignOut = async () => {
    await signOut();
  };

  const handleOrganizationSwitch = (newOrgId: string) => {
    const newParams = new URLSearchParams(location.search);
    newParams.set('org_id', newOrgId);
    navigate(`${location.pathname}?${newParams.toString()}`);
  };



  const navigationItems = useMemo(() => {

    const baseItems: NavigationItem[] = [
      { name: 'Dashboard', path: '/dashboard', icon: Home },
      { name: 'Projects', path: '/projects', icon: Layers },
      { name: 'Tasks', path: '/tasks_catalog', icon: ClipboardList },
      { name: 'Bug Tracker', path: '/tester-zone', icon: Bug },
      { name: 'Scratchpad', path: '/scratchpad', icon: Edit3 },
      { name: 'Members', path: '/team-members', icon: Users },
      { name: 'Settings', path: '/settings', icon: Settings },
      { name: 'Feedback', path: '/feedback', icon: MessageSquare  },
    ];


    return baseItems.map(item => {
      const fullPath = orgId
        ? `${item.path}${item.path.includes('?') ? '&' : '?'}org_id=${orgId}`
        : item.path;

      const isActive = location.pathname.startsWith(item.path);

      return {
        ...item,
        path: fullPath,
        isActive,
      };
    });
  }, [orgId, location.pathname]);

  const handleUserProfileNavigation = () => {
    if (orgId) {
      navigate(`/user-profile?org_id=${orgId}`);
    } else {
      navigate('/user-profile');
    }
  };

  const handleFeedback = () => {
    if (orgId) {
      navigate(`/feedback?org_id=${orgId}`);
    } else {
      navigate('/feedback');
    }
  };

  return (
    <nav className={`bg-white border-r border-gray-200 h-screen fixed left-0 top-0 z-50 shadow-sm transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!isCollapsed && (
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="font-sora font-bold text-xl text-gray-900">TasksMate</span>
            </Link>
          )}
          <div className="flex items-center gap-1">            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hover:bg-gray-100"
            >
              {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Organization Dropdown - Show only when inside an org */}
        {orgId && !isCollapsed && (
          <div className="px-3 py-2 border-b border-gray-100 space-y-2">
            {/* Back to Organizations Button */}
            <Button
              variant="ghost"
              onClick={() => navigate('/org')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Back to Organizations</span>
              </div>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <Building2 className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-700 truncate">
                      {currentOrgName || 'Loading...'}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white border shadow-lg">
                <DropdownMenuLabel className="font-medium text-gray-900">
                  Current Organization
                </DropdownMenuLabel>
                <DropdownMenuItem disabled className="text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  {currentOrgName}
                </DropdownMenuItem>


                {userOrganizations.length > 1 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="font-medium text-gray-900">
                      Switch Organization
                    </DropdownMenuLabel>
                    {userOrganizations
                      .filter(org => org.id !== orgId)
                      .map((org) => (
                        <DropdownMenuItem
                          key={org.id}
                          onClick={() => handleOrganizationSwitch(org.id)}
                          className="cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {org.name}
                        </DropdownMenuItem>
                      ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex flex-col h-full justify-between" >
          <div className="flex-1 py-4">
            <div className="space-y-1 px-3">
              {navigationItems.map((item) => {
                if (item.name === "Feedback") {
                  return null;
                }
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${item.isActive
                      ? 'bg-green-50 text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Send to last */}
          <div className="flex-10 justify-end items-end py-4">
            <div className="space-y-1 px-3">
              {navigationItems.map((item) => {
                if (item.name !== "Feedback") {
                  return null;
                }
                if (isCollapsed) {
                  return null;
                }
                const Icon = item.icon;

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${item.isActive
                      ? 'bg-green-50 text-green-700 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    title={isCollapsed ? item.name : undefined}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>{item.name}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

        </div>



        {/* Include Signout button here when collaped */}
        {
          isCollapsed &&
          <div className="flex flex-col items-center justify-between p-4 border-b border-gray-200">

            {/* Feedback Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleFeedback}
              className="w-8 h-8 hover:bg-gray-50 hover:text-gray-600 flex-shrink-0"
              title="Feedback"
            >
              <MessageSquare  className="w-4 h-4" />
            </Button>

            {/* <ThemeToggle /> */}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="w-8 h-8 hover:bg-red-50 hover:text-red-600 flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        }


        {/* Bottom Actions */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* User Profile Section */}
          <div className={`flex items-center justify-between ${isCollapsed ? 'flex-col' : 'flex-1'}`}>
            {/* <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className={`${isCollapsed ? 'w-8 h-8 p-0' : 'flex-1'} flex items-center space-x-2 hover:bg-gray-50 justify-start`}
                  onClick={handleUserProfileNavigation}
                >
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        {profileLabel}
                      </p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white border shadow-lg">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.email}
                    {myDesignation && (
                      <span className="text-gray-500"> ({myDesignation})</span>
                    )}
                  </p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu> */}

            {
              isCollapsed ? (
                <>
                  {/* Show only profile icon and also give drop down to select profile and logout options */}
                  {/* <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className={`${isCollapsed ? 'w-8 h-8 p-0' : 'flex-1'} flex items-center space-x-2 hover:bg-gray-50 justify-start`}
                        onClick={handleUserProfileNavigation}
                        title={profileLabel}
                      >
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="w-4 h-4 text-white" />
                        </div>
                        {!isCollapsed && (
                          <div className="flex-1 text-left min-w-0">
                            <p className="text-sm font-medium text-gray-700 truncate">
                              {
                                // limit until 15 characters
                                profileLabel.length > 15 ? profileLabel.substring(0, 15) + '...' : profileLabel
                              }
                            </p>
                          </div>
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-56 bg-white border shadow-lg">
                      <Button
                        variant="ghost"
                        className="w-full flex items-center space-x-2 hover:bg-gray-50 justify-start"
                        onClick={handleUserProfileNavigation}
                        title={profileLabel}
                      >
                        <div className="text-left min-w-0 text-sm font-medium text-gray-700 truncate">
                          {
                            // limit until 15 characters
                            profileLabel.length > 15 ? profileLabel.substring(0, 15) + '...' : profileLabel
                          }
                        </div>
                      </Button>
                      
                      <Button
                        variant="ghost"
                        className="w-full flex items-center space-x-2 hover:bg-gray-50 justify-start"
                        onClick={handleSignOut}
                        title="Sign Out"
                      >
                        <div className="text-left min-w-0 text-sm font-medium text-gray-700">
                          Sign out
                        </div>
                      </Button>
                    </DropdownMenuContent>
                  </DropdownMenu> */}
                  <Button
                    variant="ghost"
                    className={`${isCollapsed ? 'w-8 h-8 p-0' : 'flex-1'} flex items-center space-x-2 hover:bg-gray-50 justify-start`}
                    onClick={handleUserProfileNavigation}
                    title={profileLabel}
                  >
                    <Avatar 
                      className="w-8 h-8 cursor-pointer" 
                      // onClick={(e) => {
                      //   e.stopPropagation();
                      //   setIsEnlarged(true);
                      // }}
                    >
                      <AvatarImage src={avatarUrl || undefined} />
                      <AvatarFallback className="bg-green-500 text-white">
                        {(profileLabel || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {!isCollapsed && (
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {
                            // limit until 15 characters
                            profileLabel.length > 15 ? profileLabel.substring(0, 15) + '...' : profileLabel
                          }
                        </p>
                      </div>
                    )}
                  </Button>
                </>
              ) :
                (
                  <>
                    <Button
                      variant="ghost"
                      className={`${isCollapsed ? 'w-8 h-8 p-0' : 'flex-1'} flex items-center space-x-2 hover:bg-gray-50 justify-start`}
                      onClick={handleUserProfileNavigation}
                      title={profileLabel}
                    >
                      <Avatar 
                        className="w-8 h-8 cursor-pointer" 
                        // onClick={() => setIsEnlarged(true)}
                      >
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="bg-green-500 text-white">
                          {(profileLabel || 'U').charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {!isCollapsed && (
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-sm font-medium text-gray-700 truncate">
                            {
                              // limit until 15 characters
                              profileLabel.length > 15 ? profileLabel.substring(0, 15) + '...' : profileLabel
                            }
                          </p>
                        </div>
                      )}
                    </Button>

                    {/* <ThemeToggle /> */}

                    {/* Sign Out Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleSignOut}
                      className="w-8 h-8 hover:bg-red-50 hover:text-red-600 ml-2 flex-shrink-0"
                      title="Sign Out"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </>
                )
            }
          </div>
        </div>
      </div>
    </nav>
  );
  
  {/* Enlarged Avatar Modal */}
  // <Dialog open={isEnlarged} onOpenChange={setIsEnlarged}>
  //   <DialogContent className="sm:max-w-md flex flex-col items-center p-0 gap-0 overflow-hidden">
  //     <div className="w-full h-full">
  //       <img 
  //         src={avatarUrl || undefined} 
  //         alt={`${profileLabel}'s avatar`}
  //         className="w-full h-auto object-contain"
  //         onError={(e) => {
  //           // If image loading fails, show the initials fallback
  //           const target = e.target as HTMLImageElement;
  //           target.style.display = 'none';
  //         }}
  //       />
  //       {/* Fallback if the image fails to load */}
  //       {!avatarUrl && (
  //         <div className="flex items-center justify-center bg-gray-100 w-full h-64">
  //           <div className="flex items-center justify-center w-32 h-32 text-3xl font-bold text-white bg-green-500 rounded-full">
  //             {(profileLabel || 'U').charAt(0).toUpperCase()}
  //           </div>
  //         </div>
  //       )}
  //     </div>
  //   </DialogContent>
  // </Dialog>
};

export default MainNavigation;
