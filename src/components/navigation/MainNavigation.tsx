
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Settings, 
  User, 
  LogOut,
  Calendar,
  ClipboardList,
  Home,
  Check,
  Users,
  Menu,
  X,
  Edit3,
  Bug,
  TrendingUp,
  Building2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface MainNavigationProps {
  onNewTask?: () => void;
  onNewMeeting?: () => void;
  onScratchpadOpen?: () => void;
}

const MainNavigation = ({ onNewTask, onNewMeeting, onScratchpadOpen }: MainNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentOrgName, setCurrentOrgName] = useState<string>('');

  // Get org_id from URL params
  const urlParams = new URLSearchParams(location.search);
  const orgId = urlParams.get('org_id');

  useEffect(() => {
    const fetchOrganizationName = async () => {
      if (orgId && user) {
        try {
          const { data, error } = await supabase
            .from('organizations')
            .select('name')
            .eq('id', orgId)
            .single();

          if (error) {
            console.error('Error fetching organization name:', error);
            return;
          }

          setCurrentOrgName(data.name);
        } catch (error) {
          console.error('Error fetching organization:', error);
        }
      } else {
        setCurrentOrgName('');
      }
    };

    fetchOrganizationName();
  }, [orgId, user]);

  const handleSignOut = async () => {
    await signOut();
  };

  const navigationItems = [
    { 
      name: 'Dashboard', 
      path: orgId ? `/dashboard?org_id=${orgId}` : '/dashboard', 
      icon: Home,
      isActive: location.pathname === '/dashboard'
    },
    { 
      name: 'Projects', 
      path: orgId ? `/projects?org_id=${orgId}` : '/projects', 
      icon: Users,
      isActive: location.pathname.startsWith('/projects')
    },
    { 
      name: 'Tasks', 
      path: orgId ? `/tasks_catalog?org_id=${orgId}` : '/tasks_catalog', 
      icon: ClipboardList,
      isActive: location.pathname.startsWith('/tasks')
    },
    { 
      name: 'Meeting books', 
      path: orgId ? `/meetings?org_id=${orgId}` : '/meetings', 
      icon: Calendar,
      isActive: location.pathname.startsWith('/meetings')
    },
    { 
      name: 'Testing Books', 
      path: orgId ? `/tester-zone?org_id=${orgId}` : '/tester-zone', 
      icon: Bug,
      isActive: location.pathname.startsWith('/tester-zone')
    },
    { 
      name: 'Scratchpad', 
      path: orgId ? `/scratchpad?org_id=${orgId}` : '/scratchpad', 
      icon: Edit3,
      isActive: location.pathname.startsWith('/scratchpad')
    },
    { 
      name: 'Settings', 
      path: orgId ? `/settings?org_id=${orgId}` : '/settings', 
      icon: Settings,
      isActive: location.pathname.startsWith('/settings')
    }
  ];

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
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hover:bg-gray-100"
          >
            {isCollapsed ? <Menu className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </Button>
        </div>

        {/* Organization Pill - Show only when inside an org */}
        {orgId && !isCollapsed && (
          <div className="px-3 py-2 border-b border-gray-100">
            <Link 
              to="/org"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              title="Back to Organizations"
            >
              <Building2 className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700 truncate">
                {currentOrgName || 'Loading...'}
              </span>
            </Link>
          </div>
        )}

        {/* Navigation Items */}
        <div className="flex-1 py-4">
          <div className="space-y-1 px-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    item.isActive
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

        {/* Bottom Actions */}
        <div className="border-t border-gray-200 p-4 space-y-3">
          {/* User Profile Section */}
          <div className="flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className={`${isCollapsed ? 'w-8 h-8 p-0' : 'flex-1'} flex items-center space-x-2 hover:bg-gray-50 justify-start`}
                >
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  {!isCollapsed && (
                    <div className="flex-1 text-left min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">
                        Profile
                      </p>
                    </div>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 bg-white border shadow-lg">
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900">{user?.email}</p>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

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
          </div>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
