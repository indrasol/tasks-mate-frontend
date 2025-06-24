
import { useState } from "react";
import { Search, Plus, Users, User, Grid3X3, List, MoreVertical, Edit, Eye, Trash2 } from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface Project {
  id: string;
  name: string;
  description: string;
  teamLead: string;
  teamMembers: string[];
  status: 'active' | 'completed' | 'on-hold';
  createdAt: string;
}

// Mock data
const initialProjects: Project[] = [
  {
    id: "1",
    name: "TasksMate Mobile App",
    description: "Mobile application for task management with real-time collaboration features",
    teamLead: "Sarah Johnson",
    teamMembers: ["John Doe", "Alice Smith", "Bob Wilson"],
    status: "active",
    createdAt: "2024-06-20"
  },
  {
    id: "2", 
    name: "Analytics Dashboard",
    description: "Comprehensive analytics dashboard for business intelligence and reporting",
    teamLead: "Mike Chen",
    teamMembers: ["Emma Davis", "James Brown", "Lisa Garcia"],
    status: "active",
    createdAt: "2024-06-18"
  },
  {
    id: "3",
    name: "API Integration",
    description: "Third-party API integration for enhanced platform capabilities",
    teamLead: "David Rodriguez",
    teamMembers: ["Anna Taylor", "Tom Anderson"],
    status: "completed",
    createdAt: "2024-06-15"
  }
];

const Projects = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamLead: '',
    teamMembers: [] as string[],
    newMember: ''
  });

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.teamLead.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.teamLead.trim()) {
      toast({
        title: "Error",
        description: "Project name and team lead are required",
        variant: "destructive"
      });
      return;
    }

    const newProject: Project = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      teamLead: formData.teamLead,
      teamMembers: formData.teamMembers,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setProjects(prev => [newProject, ...prev]);
    
    // Reset form
    setFormData({
      name: '',
      description: '',
      teamLead: '',
      teamMembers: [],
      newMember: ''
    });
    
    setIsNewProjectModalOpen(false);
    
    toast({
      title: "Success",
      description: "Project created successfully!",
    });
  };

  const addTeamMember = () => {
    if (formData.newMember.trim()) {
      setFormData(prev => ({
        ...prev,
        teamMembers: [...prev.teamMembers, prev.newMember.trim()],
        newMember: ''
      }));
    }
  };

  const removeTeamMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      teamMembers: prev.teamMembers.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (status: Project['status']) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: 'Active' },
      completed: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Completed' },
      'on-hold': { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'On Hold' }
    };
    
    const config = statusConfig[status];
    return (
      <Badge className={`${config.bg} ${config.text} hover:${config.bg}`}>
        {config.label}
      </Badge>
    );
  };

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-32 h-32 mb-6 bg-green-50 rounded-full flex items-center justify-center">
        <Users className="w-16 h-16 text-green-500" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No projects yet</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Create your first project to start organizing your team and track progress.
      </p>
      <Button 
        onClick={() => setIsNewProjectModalOpen(true)}
        className="bg-green-500 hover:bg-green-600 hover:scale-105 transition-all duration-200"
      >
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Project
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <main className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-sora text-gray-900">Projects</h1>
            <p className="text-gray-600 mt-1">Manage and track your team projects</p>
          </div>
          
          <Button 
            onClick={() => setIsNewProjectModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Project
          </Button>
        </div>

        {/* Search and View Toggle */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search projects by name, description, or team lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
            />
          </div>
          
          <div className="flex bg-white rounded-lg p-1 border border-gray-200">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className={viewMode === 'grid' ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              <Grid3X3 className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className={viewMode === 'list' ? 'bg-green-500 hover:bg-green-600' : ''}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Projects Display */}
        {filteredProjects.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <div className={viewMode === 'grid' ? 'grid gap-6 sm:grid-cols-2 lg:grid-cols-3' : 'space-y-4'}>
            {filteredProjects.map((project) => (
              <Card 
                key={project.id} 
                className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-gray-200 hover:border-green-500/30 group ${
                  viewMode === 'list' ? 'flex flex-row' : ''
                }`}
              >
                <CardContent className={`p-6 ${viewMode === 'list' ? 'flex-1 flex items-center justify-between' : ''}`}>
                  {viewMode === 'grid' ? (
                    <>
                      {/* Grid View */}
                      <div className="flex items-center justify-between mb-4">
                        {getStatusBadge(project.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                        {project.name}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {project.description}
                      </p>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">{project.teamLead}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {project.teamMembers.length} team members
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* List View */}
                      <div className="flex items-center gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                              {project.name}
                            </h3>
                            {getStatusBadge(project.status)}
                          </div>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-1">
                            {project.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>Lead: {project.teamLead}</span>
                            <span>{project.teamMembers.length} members</span>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600 focus:text-red-600">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      <Dialog open={isNewProjectModalOpen} onOpenChange={setIsNewProjectModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-green-500" />
              Create New Project
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Mobile App Development"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of the project..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="teamLead">Team Lead *</Label>
              <Input
                id="teamLead"
                placeholder="e.g., Sarah Johnson"
                value={formData.teamLead}
                onChange={(e) => setFormData(prev => ({ ...prev, teamLead: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Team Members</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Add team member name"
                  value={formData.newMember}
                  onChange={(e) => setFormData(prev => ({ ...prev, newMember: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTeamMember())}
                />
                <Button type="button" onClick={addTeamMember} size="icon" variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {formData.teamMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.teamMembers.map((member, index) => (
                    <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
                      <span>{member}</span>
                      <button
                        type="button"
                        onClick={() => removeTeamMember(index)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <span className="w-3 h-3">×</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsNewProjectModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-green-500 hover:bg-green-600">
                Create Project
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Projects;
