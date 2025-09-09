import { Button } from "@/components/ui/button";
import { useAuth } from '@/hooks/useAuth';
import { deriveDisplayFromEmail } from '@/lib/projectUtils';
import { Check, LogOut, User } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAvatar } from '@/services/AvatarContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ThemeToggle from '@/components/ui/theme-toggle';

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
    <div className="bg-white border-b border-gray-200 w-full">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex justify-between items-center">
          {/* Left — brand & title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-full bg-tasksmate-gradient flex items-center justify-center">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div className="flex items-baseline space-x-2">
                <span className="font-sora font-bold text-2xl">TasksMate</span>
                <a
                  href="https://indrasol.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  by Indrasol
                </a>
              </div>
            </div>
            <div className="h-6 w-px bg-gray-300 mx-2" />
            <h1 className="text-2xl font-bold text-gray-900">
              {pageLabel ? pageLabel : 'Your Organizations'}
            </h1>
          </div>

          {/* Right — theme, profile & sign-out */}
          <div className="flex items-center space-x-2">
            {/* <ThemeToggle /> */}
            <Button
              variant="ghost"
              className={`${isCollapsed ? "w-8 h-8 p-0" : "flex-1"} flex items-center space-x-2 hover:bg-gray-50 justify-start`}
              onClick={handleUserProfileNavigation}
            >
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                {/* <User className="w-4 h-4 text-white" /> */}
                <Avatar
                  className="w-8 h-8 cursor-pointer"
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
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {profileLabel}
                  </p>
                </div>
              )}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              className="w-8 h-8 hover:bg-red-50 hover:text-red-600 ml-2 flex-shrink-0"
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