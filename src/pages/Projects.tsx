
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Search, 
  Calendar, 
  Users, 
  Target, 
  MoreVertical,
  FolderOpen,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold' | 'planning';
  progress: number;
  startDate: string;
  endDate: string;
  teamMembers: string[];
  tasksCount: number;
  completedTasks: number;
  priority: 'high' | 'medium' | 'low';
  budget?: number;
  category: string;
}

const Projects = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Sample projects data
  const [projects] = useState<Project[]>([
    {
      id: "P001",
      name: "TasksMate Mobile App",
      description: "Develop mobile application for TasksMate with cross-platform compatibility",
      status: "active",
      progress: 65,
      startDate: "2024-01-15",
      endDate: "2024-06-30",
      teamMembers: ["JD", "SK", "MR"],
      tasksCount: 24,
      completedTasks: 16,
      priority: "high",
      budget: 50000,
      category: "Development"
    },
    {
      id: "P002",
      name: "UI/UX Redesign",
      description: "Complete redesign of the user interface with modern design principles",
      status: "active",
      progress: 40,
      startDate: "2024-02-01",
      endDate: "2024-05-15",
      teamMembers: ["SK", "AM"],
      tasksCount: 18,
      completedTasks: 7,
      priority: "medium",
      budget: 25000,
      category: "Design"
    },
    {
      id: "P003",
      name: "Security Audit",
      description: "Comprehensive security review and implementation of security measures",
      status: "completed",
      progress: 100,
      startDate: "2024-01-01",
      endDate: "2024-03-15",
      teamMembers: ["MR", "JD"],
      tasksCount: 12,
      completedTasks: 12,
      priority: "high",
      budget: 15000,
      category: "Security"
    },
    {
      id: "P004",
      name: "API Integration",
      description: "Integration with third-party APIs for enhanced functionality",
      status: "planning",
      progress: 10,
      startDate: "2024-04-01",
      endDate: "2024-07-30",
      teamMembers: ["AM", "MR"],
      tasksCount: 8,
      completedTasks: 1,
      priority: "medium",
      category: "Development"
    }
  ]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "on-hold": return "bg-yellow-100 text-yellow-800";
      case "planning": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <Clock className="w-4 h-4" />;
      case "completed": return <CheckCircle2 className="w-4 h-4" />;
      case "on-hold": return <AlertCircle className="w-4 h-4" />;
      case "planning": return <Target className="w-4 h-4" />;
      default: return <FolderOpen className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-100 text-red-800";
      case "medium": return "bg-orange-100 text-orange-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchQuery === "" || 
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === "all" || project.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainNavigation />

      <div className="ml-64 transition-all duration-300">
        {/* Page Header */}
        <div className="px-6 py-6 bg-white/50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 mb-2">Projects</h1>
              <p className="text-gray-600">Manage and track all your projects in one place</p>
            </div>
            <Button className="bg-tasksmate-gradient hover:scale-105 transition-transform flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 bg-white/30 border-b border-gray-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button 
                  variant={filterStatus === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("all")}
                >
                  All
                </Button>
                <Button 
                  variant={filterStatus === "active" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("active")}
                >
                  Active
                </Button>
                <Button 
                  variant={filterStatus === "completed" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("completed")}
                >
                  Completed
                </Button>
                <Button 
                  variant={filterStatus === "planning" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilterStatus("planning")}
                >
                  Planning
                </Button>
              </div>
            </div>
            
            <div className="relative w-96">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search projects..." 
                className="pl-10 bg-white/80 border-gray-300 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <Card key={project.id} className="glass border-0 shadow-tasksmate micro-lift cursor-pointer group hover:scale-105 transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {project.name}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {project.id}
                        </Badge>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>View Details</DropdownMenuItem>
                          <DropdownMenuItem>Edit Project</DropdownMenuItem>
                          <DropdownMenuItem>Archive</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600 line-clamp-2">{project.description}</p>
                    
                    {/* Status and Priority */}
                    <div className="flex items-center gap-2">
                      <Badge className={`text-xs flex items-center gap-1 ${getStatusColor(project.status)}`}>
                        {getStatusIcon(project.status)}
                        {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(project.priority)}`}>
                        {project.priority.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {/* Progress */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-tasksmate-gradient h-2 rounded-full transition-all duration-300"
                          style={{ width: `${project.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Tasks Summary */}
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Target className="w-4 h-4" />
                        <span>{project.completedTasks}/{project.tasksCount} tasks</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(project.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {/* Team Members */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-500" />
                        <span className="text-sm text-gray-600">Team</span>
                      </div>
                      <div className="flex -space-x-2">
                        {project.teamMembers.slice(0, 3).map((member, index) => (
                          <Avatar key={index} className="w-6 h-6 border-2 border-white">
                            <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                              {member}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {project.teamMembers.length > 3 && (
                          <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs text-gray-600">+{project.teamMembers.length - 3}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Budget */}
                    {project.budget && (
                      <div className="pt-2 border-t border-gray-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Budget</span>
                          <span className="font-medium text-green-600">${project.budget.toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <FolderOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg mb-2">No projects found</p>
                <p className="text-gray-400 mb-4">Create your first project to get started</p>
                <Button className="bg-tasksmate-gradient hover:scale-105 transition-transform">
                  <Plus className="w-4 h-4 mr-2" />
                  New Project
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Projects;
