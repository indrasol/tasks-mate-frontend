import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from "@/components/ui/button";
import ThemeToggle from '@/components/ui/theme-toggle';
import { useAuth } from '@/hooks/useAuth';
import { deriveDisplayFromEmail } from '@/lib/projectUtils';
import { useAvatar } from '@/services/AvatarContext';
import { Check, LogOut } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

interface OrganizationsHeaderProps {
  pageLabel?: string
}

export default function OrganizationsHeader({
  pageLabel
}: OrganizationsHeaderProps) {

  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { avatarUrl } = useAvatar();
  const [searchParams] = useSearchParams();
  const orgId = useMemo(() => searchParams.get('org_id'), [searchParams]);


  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine a friendly username to show in the sidebar
  const profileLabel = useMemo(() => {
    if (!user) return 'Profile';
    const usernameMeta = (user as any)?.user_metadata?.username;
    if (usernameMeta) return deriveDisplayFromEmail(usernameMeta).displayName;
    if (user.email) return deriveDisplayFromEmail(user.email).displayName;
    return 'Profile';
  }, [user]);

  const handleUserProfileNavigation = () => {
    if (orgId) {
      navigate(`/user-profile?org_id=${orgId}`);
    } else {
      navigate('/user-profile');
    }
  };


  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 w-full">
      <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8 py-2 sm:py-4 md:py-5">
        <div className="flex flex-row justify-between items-center">
          {/* Left — brand & title */}
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="flex items-center space-x-2 sm:space-x-2 flex-shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-tasksmate-gradient flex items-center justify-center">
                <Check className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="flex items-baseline space-x-1 sm:space-x-2">
                <span className="font-sora font-bold text-lg sm:text-2xl text-gray-900 dark:text-white hidden sm:inline">TasksMate</span>
                <a
                  href="https://indrasol.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors hidden sm:inline"
                >
                  by Indrasol
                </a>
              </div>
            </div>
            <div className="h-4 w-px bg-gray-300 dark:bg-gray-600 mx-1 sm:mx-2 hidden sm:block" />
            <h1 className="text-base sm:text-lg md:text-2xl font-bold text-gray-900 dark:text-white truncate hidden sm:inline">
              {pageLabel ? pageLabel : 'Your Organizations'}
            </h1>
          </div>

          {/* Right — profile & sign-out */}
          <div className="flex items-center space-x-1 sm:space-x-2 justify-end">
            <ThemeToggle />
            <Button
              variant="ghost"
              className={`${isCollapsed ? "w-6 h-6 p-0" : "flex-1 sm:flex-initial"} flex items-center space-x-1 sm:space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700 justify-start min-w-0`}
              onClick={handleUserProfileNavigation}
            >
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                {/* <User className="w-4 h-4 text-white" /> */}
                <Avatar
                  className="w-6 h-6 cursor-pointer"
                // onClick={() => setIsEnlarged(true)}
                >
                  <AvatarImage src={avatarUrl || undefined} />
                  <AvatarFallback className="bg-green-500 text-white">
                    {(profileLabel || 'U').charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              {!isCollapsed && (
                <div className="flex-1 text-left min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate hidden sm:inline">
                    {profileLabel}
                  </p>
                </div>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="w-6 h-6 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 ml-1 sm:ml-2 flex-shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}