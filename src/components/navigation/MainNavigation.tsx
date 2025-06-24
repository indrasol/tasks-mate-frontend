
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Settings, 
  User, 
  LogOut,
  ChevronDown,
  Calendar,
  ClipboardList,
  BarChart3,
  Home,
  Check,
  Users,
  Menu,
  X,
  Edit3,
  Beaker
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface MainNavigationProps {
  onNewTask?: () => void;
  onNewMeeting?: () => void;
  onScratchpadOpen?: () => void;
}

const MainNavigation = ({ onNewTask, onNewMeeting, onScratchpadOpen }: MainNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navigationItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: Home,
      isActive: location.pathname === '/'
    },
    { 
      name: 'Tasks', 
      path: '/tasks_catalog', 
      icon: ClipboardList,
      isActive: location.pathname.startsWith('/tasks')
    },
    { 
      name: 'Meeting books', 
      path: '/meetings', 
      icon: Calendar,
      isActive: location.pathname.startsWith('/meetings')
    },
    { 
      name: 'Projects', 
      path: '/projects', 
      icon: Users,
      isActive: location.pathname.startsWith('/projects')
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: BarChart3,
      isActive: location.pathname.startsWith('/reports')
    },
    { 
      name: 'Tester zone', 
      path: '/tester-zone', 
      icon: Beaker,
      isActive: location.pathname.startsWith('/tester-zone')
    },
    { 
      name: 'Scratchpad', 
      path: '/scratchpad', 
      icon: Edit3,
      isActive: location.pathname.startsWith('/scratchpad')
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
          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full flex items-center space-x-2 hover:bg-gray-50 justify-start">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                {!isCollapsed && (
                  <>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-gray-700">John Doe</p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">John Doe</p>
                <p className="text-xs text-gray-500">john.doe@company.com</p>
              </div>
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600 focus:text-red-600">
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
