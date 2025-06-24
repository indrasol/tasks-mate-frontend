
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Bell, 
  Settings, 
  User, 
  LogOut,
  ChevronDown,
  Calendar,
  ClipboardList,
  BarChart3,
  Home,
  Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
}

const MainNavigation = ({ onNewTask, onNewMeeting }: MainNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

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
      name: 'Meetings', 
      path: '/meetings', 
      icon: Calendar,
      isActive: location.pathname.startsWith('/meetings')
    },
    { 
      name: 'Reports', 
      path: '/reports', 
      icon: BarChart3,
      isActive: location.pathname.startsWith('/reports')
    }
  ];

  const handleQuickAction = () => {
    if (location.pathname.startsWith('/meetings')) {
      onNewMeeting?.();
    } else if (location.pathname.startsWith('/tasks')) {
      onNewTask?.();
    } else {
      // Default to new task
      onNewTask?.();
    }
  };

  const getQuickActionText = () => {
    if (location.pathname.startsWith('/meetings')) {
      return 'New Meeting';
    } else if (location.pathname.startsWith('/tasks')) {
      return 'New Task';
    }
    return 'Quick Add';
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-8">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
              <span className="font-sora font-bold text-xl text-gray-900">TasksMate</span>
            </Link>

            {/* Main Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      item.isActive
                        ? 'bg-green-50 text-green-700 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Search Bar */}
          <div className="hidden lg:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tasks, meetings, or reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-50 border-gray-200 focus:bg-white focus:border-green-500 focus:ring-green-500/20"
              />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Action Button */}
            <Button
              onClick={handleQuickAction}
              className="bg-green-500 hover:bg-green-600 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {getQuickActionText()}
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 bg-red-500 text-white text-xs flex items-center justify-center">
                  3
                </Badge>
              </Button>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center space-x-2 hover:bg-gray-50">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <span className="hidden md:block text-sm font-medium text-gray-700">John Doe</span>
                  <ChevronDown className="w-4 h-4 text-gray-500" />
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
      </div>
    </nav>
  );
};

export default MainNavigation;
