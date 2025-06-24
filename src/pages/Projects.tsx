
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Search, 
  Users, 
  User, 
  Edit, 
  Trash2, 
  MoreVertical,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import ViewToggle from '@/components/tasks/ViewToggle';
import AddProjectModal from '@/components/meetings/AddProjectModal';
import { useToast } from '@/hooks/use-toast';
import MainNavigation from '@/components/navigation/MainNavigation';

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

const Projects = () => {
  const { toast } = useToast();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);
  
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "TasksMate",
      description: "Main task management platform for organizing team workflows and tracking project progress",
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
      description: "Cross-platform mobile application for iOS and Android with real-time synchronization",
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
      description: "Real-time analytics and reporting dashboard with advanced data visualization and insights",
      teamLead: "Emily Chen",
      members: [
        { id: "emily", name: "Emily Chen", role: "Team Lead" },
        { id: "david", name: "David Lee", role: "Data Scientist" },
        { id: "lisa", name: "Lisa Wang", role: "Frontend Developer" }
      ]
    },
    {
      id: "4",
      name: "E-commerce Platform",
      description: "Full-featured e-commerce solution with payment integration and inventory management",
      teamLead: "Robert Taylor",
      members: [
        { id: "robert", name: "Robert Taylor", role: "Team Lead" },
        { id: "maria", name: "Maria Garcia", role: "Backend Developer" },
        { id: "james", name: "James Wilson", role: "Frontend Developer" },
        { id: "anna", name: "Anna Brown", role: "UX Designer" }
      ]
    }
  ]);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.teamLead.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  const ProjectCard = ({ project }: { project: Project }) => (
    <Card className="group hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-green-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 mb-2">{project.name}</h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">{project.description}</p>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <Badge className="bg-blue-100 text-blue-700 text-xs">{project.teamLead}</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-500">{project.members.length} members</span>
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
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
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex flex-wrap gap-2">
          {project.members.slice(0, 3).map((member) => (
            <div key={member.id} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs">
              <span>{member.name}</span>
            </div>
          ))}
          {project.members.length > 3 && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 text-xs">
              <span>+{project.members.length - 3} more</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const ProjectListItem = ({ project }: { project: Project }) => (
    <Card className="group hover:shadow-md transition-all duration-200 border border-gray-200 hover:border-green-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900 mb-1">{project.name}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-1">{project.description}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <Badge className="bg-blue-100 text-blue-700 text-xs">{project.teamLead}</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-500">{project.members.length} members</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1 max-w-xs">
                {project.members.slice(0, 4).map((member) => (
                  <div key={member.id} className="bg-gray-100 rounded-full px-2 py-1 text-xs">
                    {member.name}
                  </div>
                ))}
                {project.members.length > 4 && (
                  <div className="bg-gray-100 rounded-full px-2 py-1 text-xs">
                    +{project.members.length - 4}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <MoreVertical className="w-4 h-4" />
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
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/meetings">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage your team projects and collaborate effectively</p>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <ViewToggle view={view} onViewChange={setView} />
            <Button 
              onClick={() => setIsAddProjectModalOpen(true)}
              className="bg-green-500 hover:bg-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Project
            </Button>
          </div>
        </div>

        {/* Projects Display */}
        <div className="space-y-6">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? "Try adjusting your search terms" : "Get started by creating your first project"}
              </p>
              <Button 
                onClick={() => setIsAddProjectModalOpen(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>
          ) : (
            <>
              {view === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProjects.map((project) => (
                    <ProjectListItem key={project.id} project={project} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <AddProjectModal
        open={isAddProjectModalOpen}
        onOpenChange={setIsAddProjectModalOpen}
        onAddProject={handleAddProject}
      />
    </div>
  );
};

export default Projects;
