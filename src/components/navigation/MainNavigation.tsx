
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
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
  Check,
  Users,
  MoreVertical,
  Edit,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import AddProjectModal from '@/components/meetings/AddProjectModal';
import { useToast } from '@/hooks/use-toast';

interface MainNavigationProps {
  onNewTask?: () => void;
  onNewMeeting?: () => void;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  teamLead: string;
  members: TeamMember[];
}

const MainNavigation = ({ onNewTask, onNewMeeting }: MainNavigationProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "TasksMate",
      description: "Main task management platform",
      teamLead: "John Doe",
      members: [
        { id: "john", name: "John Doe", role: "Team Lead" },
        { id: "jane", name: "Jane Smith", role: "Developer" },
        { id: "alex", name: "Alex Johnson", role: "Designer" }
      ]
    },
    {
      id: "2",
      name: "Mobile App",
      description: "Cross-platform mobile application",
      teamLead: "Mike Wilson",
      members: [
        { id: "mike", name: "Mike Wilson", role: "Team Lead" },
        { id: "sarah", name: "Sarah Davis", role: "Developer" },
        { id: "tom", name: "Tom Brown", role: "QA Engineer" }
      ]
    },
    {
      id: "3",
      name: "Analytics Dashboard",
      description: "Real-time analytics and reporting dashboard",
      teamLead: "Emily Chen",
      members: [
        { id: "emily", name: "Emily Chen", role: "Team Lead" },
        { id: "david", name: "David Lee", role: "Data Scientist" },
        { id: "lisa", name: "Lisa Wang", role: "Frontend Developer" }
      ]
    }
  ]);

  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

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
      name: 'Meet books', 
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

  const handleAddProject = (projectData: Project) => {
    setProjects(prev => [...prev, projectData]);
  };

  const handleEditProject = (projectId: string) => {
    toast({
      title: "Edit Project",
      description: "Edit functionality will be implemented soon.",
    });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast({
      title: "Success",
      description: "Project deleted successfully!",
    });
  };

  return (
    <>
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

                {/* Projects Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200">
                      <Users className="w-4 h-4" />
                      <span>Projects</span>
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-80 bg-white border border-gray-200 shadow-lg">
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-gray-900">Projects</h3>
                        <Button 
                          onClick={() => setIsAddProjectModalOpen(true)} 
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 h-7 px-2"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add
                        </Button>
                      </div>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {projects.map((project) => (
                          <div key={project.id} className="group p-3 border border-gray-200 rounded-lg hover:border-green-200 transition-colors">
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm text-gray-900 truncate">{project.name}</h4>
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{project.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className="bg-blue-100 text-blue-700 text-xs">{project.teamLead}</Badge>
                                  <span className="text-xs text-gray-500">{project.members.length} members</span>
                                </div>
                              </div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <MoreVertical className="w-3 h-3" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
                                  <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-red-600 focus:text-red-600"
                                    onClick={() => handleDeleteProject(project.id)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Right Actions */}
            <div className="flex items-center space-x-3">
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

      <AddProjectModal
        open={isAddProjectModalOpen}
        onOpenChange={setIsAddProjectModalOpen}
        onAddProject={handleAddProject}
      />
    </>
  );
};

export default MainNavigation;
