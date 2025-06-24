
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Check, 
  Plus, 
  LogOut, 
  Calendar, 
  Users, 
  BarChart3, 
  Settings,
  FileText,
  Bell,
  Search
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MainNavigationProps {
  onNewTask?: () => void;
  onNewMeeting?: () => void;
}

const MainNavigation = ({ onNewTask, onNewMeeting }: MainNavigationProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [notifications] = useState(3); // Placeholder for notification count

  const navigationItems = [
    {
      title: "Tasks",
      href: "/tasks_catalog",
      icon: Check,
      description: "Manage and track your tasks",
      isActive: location.pathname.includes("/tasks")
    },
    {
      title: "Meetings",
      href: "/meetings",
      icon: Calendar,
      description: "Schedule and manage meetings",
      isActive: location.pathname.includes("/meetings"),
      badge: "New"
    },
    {
      title: "Reports",
      href: "/reports",
      icon: BarChart3,
      description: "View analytics and insights",
      isActive: location.pathname.includes("/reports"),
      badge: "Soon"
    }
  ];

  const quickActions = [
    {
      title: "New Task",
      icon: Check,
      action: onNewTask,
      shortcut: "⌘T"
    },
    {
      title: "New Meeting",
      icon: Calendar,
      action: onNewMeeting,
      shortcut: "⌘M"
    }
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-16 items-center px-6">
        {/* Logo and Brand */}
        <div className="flex items-center space-x-4">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
              <Check className="h-5 w-5 text-white" />
            </div>
            <span className="font-sora font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              TasksMate
            </span>
          </Link>
          
          {/* Divider */}
          <div className="h-6 w-px bg-gray-300" />
        </div>

        {/* Main Navigation */}
        <div className="flex flex-1 items-center justify-between">
          <NavigationMenu className="ml-6">
            <NavigationMenuList>
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  <NavigationMenuTrigger className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent hover:bg-gray-100/80 data-[state=open]:bg-gray-100/80",
                    item.isActive && "bg-tasksmate-gradient-soft text-tasksmate-green-end font-semibold"
                  )}>
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.title}
                    {item.badge && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "ml-2 text-xs",
                          item.badge === "New" && "bg-green-100 text-green-700",
                          item.badge === "Soon" && "bg-blue-100 text-blue-700"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="grid gap-3 p-6 w-80">
                      <div className="grid gap-1">
                        <NavigationMenuLink 
                          href={item.href}
                          className="group grid h-auto w-full justify-start gap-1 rounded-md bg-white p-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50"
                        >
                          <div className="flex items-center gap-2">
                            <item.icon className="h-5 w-5 text-tasksmate-green-end" />
                            <div className="text-sm font-medium leading-none">{item.title}</div>
                          </div>
                          <div className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                            {item.description}
                          </div>
                        </NavigationMenuLink>
                      </div>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-3">
            {/* Quick Actions Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="bg-tasksmate-gradient hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                  <Plus className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white/95 backdrop-blur">
                {quickActions.map((action, index) => (
                  <DropdownMenuItem 
                    key={index}
                    onClick={action.action}
                    className="flex items-center justify-between cursor-pointer hover:bg-gray-50"
                  >
                    <div className="flex items-center">
                      <action.icon className="h-4 w-4 mr-3 text-tasksmate-green-end" />
                      {action.title}
                    </div>
                    <Badge variant="secondary" className="text-xs font-mono">
                      {action.shortcut}
                    </Badge>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Search Button */}
            <Button variant="ghost" size="icon" className="hover:bg-gray-100/80">
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <div className="relative">
              <Button variant="ghost" size="icon" className="hover:bg-gray-100/80">
                <Bell className="h-4 w-4" />
                {notifications > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs bg-red-500 text-white border-2 border-white">
                    {notifications}
                  </Badge>
                )}
              </Button>
            </div>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-gray-100/80">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-tasksmate-gradient text-white">
                      {user?.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur" align="end" forceMount>
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-sm">{user?.email}</p>
                    <p className="text-xs text-muted-foreground">Free Plan</p>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer">
                  <Users className="mr-2 h-4 w-4" />
                  Team Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Preferences
                </DropdownMenuItem>
                <DropdownMenuItem className="hover:bg-gray-50 cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Documentation
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  className="hover:bg-red-50 text-red-600 cursor-pointer"
                  onClick={signOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
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
