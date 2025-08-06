
import React, { useState, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { 
  ArrowLeft,
  Calendar, 
  Users, 
  Target, 
  MoreVertical,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit,
  Settings,
  MessageSquare,
  FileText,
  Upload,
  Link,
  File,
  ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/services/apiService";
import { API_ENDPOINTS } from "@/../config";

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'completed' | 'on-hold' | 'planning';
  progress: number;
  startDate: string;
  endDate: string;
  teamMembers: Array<Member>;
  tasksCount: number;
  completedTasks: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
}

interface Member{
    initials: string;
    name: string;
    role: string;
    designation:string;
  }


interface Resource {
  id: string;
  type: 'file' | 'url';
  name: string;
  url?: string;
  size?: string;
  uploadedBy: string;
  uploadedAt: string;
}

const ProjectDetail = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);  
  const [resources, setResources] = useState<Resource[]>([]);
  const [newUrl, setNewUrl] = useState('');
  const [newUrlName, setNewUrlName] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      try {
        const res = await api.get<any>(`${API_ENDPOINTS.PROJECTS}/detail/${id}`);
        // Map API response to local Project shape
        const mapped: Project = {
          id: res.project_id,
          name: res.name,
          description: res.description,
          status: res.status,
          progress: Number(res.progress_percent ?? 0),
          startDate: res.start_date ?? '',
          endDate: res.end_date ?? '',
          teamMembers: (res.team_members ?? []).map((m: any) => ({
            initials: m.initials || m.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '',
            name: m.name || '',
            role: m.role || '',
          })),
          tasksCount: res.tasks_total ?? 0,
          completedTasks: res.tasks_completed ?? 0,
          priority: res.priority,
          category: res.category || 'General'
        };
        setProject(mapped);
      } catch (err) {
        setProject(null);
      }
    };
    fetchProject();
  }, [id]);

   // Fetch resources separately
  const fetchResources = async () => {
    if (!id) return;
    try {
      const res = await api.get<Resource[]>(`${API_ENDPOINTS.PROJECTS_RESOURCES}?project_id=${id}`);
      setResources(res);
    } catch (err) {
      setResources([]);
    }
  };

  useEffect(() => {
    // fetchResources();
    // eslint-disable-next-line
  }, [id]);

  // Fetch team members separately
  const fetchTeamMembers = async () => {
    if (!id) return;
    try {
      const res = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS_MEMBERS}?project_id=${id}`);
      setTeamMembers(
        (res ?? []).map((m: any) => ({
          initials: m.initials || m.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '',
          name: m.name || '',
          role: m.role || '',
          designation: m.designation || '',
        }))
      );
    } catch (err) {
      setTeamMembers([]);
    }
  };

  useEffect(() => {
    // fetchTeamMembers();
    // eslint-disable-next-line
  }, [id]);

  // Add new URL resource
  const handleAddUrl = async () => {
    if (!newUrl || !newUrlName || !project) return;
    try {
      const res = await api.post<any>(`${API_ENDPOINTS.PROJECTS_RESOURCES}/${project.id}`, {
        project_id:project.id,
        type: 'url',
        name: newUrlName,
        url: newUrl,
        uploadedBy: user?.user_metadata?.username,
      });
      // setResources([...resources, res]);
      setNewUrl('');
      setNewUrlName('');
      fetchResources();
    } catch (err) {
      // handle error
    }
  };

  // Upload file resource
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !project) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(e.target.files).forEach(file => {
      formData.append('files', file);
    });
    formData.append('uploadedBy', user?.email || 'Current User');
    try {
      const res = await api.post<any[]>(`${API_ENDPOINTS.PROJECTS_RESOURCES}/${project.id}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const res_upload = await api.post<any>(`${API_ENDPOINTS.PROJECTS_RESOURCES}/${project.id}`, {
        project_id:project.id,
        type: 'url',
        name: newUrlName,
        url: newUrl,
        uploadedBy: user?.user_metadata?.username,
      });

      fetchResources();
    } catch (err) {
      // handle error
    }
    setUploading(false);
  };

  
  // Remove member (DELETE with user_id and project_id)
  const handleRemoveMember = async (member: Member) => {
    if (!project) return;
    try {
      await api.del(
        `${API_ENDPOINTS.PROJECTS_MEMBERS}/${member.name}/${project.id}`,{}
      );
      fetchTeamMembers();
    } catch (err) {
      // handle error
    }
  };

  // Change role (PUT with user_id and project_id)
  const handleChangeRole = async (member: Member, newRole: string) => {
    if (!project) return;
    try {
      await api.put(
        `${API_ENDPOINTS.PROJECTS_MEMBERS}/${member.name}/${project.id}`,
        { role: newRole }
      );
      fetchTeamMembers();
    } catch (err) {
      // handle error
    }
  };

  // Change designation (PUT with user_id and project_id)
  const handleChangeDesignation = async (member: Member, newDesignation: string) => {
    if (!project) return;
    try {
      await api.put(
        `${API_ENDPOINTS.PROJECTS_MEMBERS}/${member.name}/${project.id}`,
        { designation: newDesignation }
      );
      fetchTeamMembers();
    } catch (err) {
      // handle error
    }
  };

  // Remove resource (DELETE with resource_id and project_id)
  const handleDeleteResource = async (resource: Resource) => {
    if (!project) return;
    try {
      await api.del(
        `${API_ENDPOINTS.PROJECTS_RESOURCES}/${resource.id}?project_id=${project.id}`,{}
      );
      fetchResources();
    } catch (err) {
      // handle error
    }
  };

  // Update resource (PUT with resource_id and project_id)
  const handleRenameResource = async (resource: Resource, newName: string) => {
    if (!project) return;
    try {
      await api.put(
        `${API_ENDPOINTS.PROJECTS_RESOURCES}/${resource.id}?project_id=${project.id}`,
        { name: newName }
      );
      fetchResources();
    } catch (err) {
      // handle error
    }
  };
  

  if (loading || !project) {
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
      default: return <Target className="w-4 h-4" />;
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



  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainNavigation />

      <div className="ml-64 transition-all duration-300">
        {/* Header */}
        <div className="px-6 py-6 bg-white/50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate('/projects')}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Project
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">
                    Archive Project
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h1 className="font-sora font-bold text-3xl text-gray-900">{project.name}</h1>
                                  <Badge className="text-sm font-mono bg-blue-600 text-white">
                  {project.id}
                </Badge>
                </div>
                <p className="text-gray-600 text-lg max-w-3xl">{project.description}</p>
                
                <div className="flex items-center gap-4 mt-4">
                  <Badge className={`flex items-center gap-1 ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                  </Badge>
                  <Badge className={getPriorityColor(project.priority)}>
                    {project.priority.toUpperCase()} PRIORITY
                  </Badge>
                  <Badge variant="outline">{project.category}</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{project.progress}%</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <Progress value={project.progress} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tasks</p>
                      <p className="text-2xl font-bold text-gray-900">{project.completedTasks}/{project.tasksCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Team Members</p>
                      <p className="text-2xl font-bold text-gray-900">{project.teamMembers.length}</p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Days Left</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="resources">Resources</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Project Timeline */}
                  <Card className="lg:col-span-2 glass border-0 shadow-tasksmate">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Calendar className="w-5 h-5" />
                        Project Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Start Date</span>
                          <span className="font-medium">{new Date(project.startDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">End Date</span>
                          <span className="font-medium">{new Date(project.endDate).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Duration</span>
                          <span className="font-medium">
                            {Math.ceil((new Date(project.endDate).getTime() - new Date(project.startDate).getTime()) / (1000 * 60 * 60 * 24))} days
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Members */}
                  <Card className="glass border-0 shadow-tasksmate">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        Team Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {teamMembers.map((member, index) => (
                          <div key={index} className="flex items-center gap-3">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-tasksmate-gradient text-white text-xs">
                                {member.initials}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{member.name}</p>
                              <p className="text-xs text-gray-600">{member.role}</p>
                              <p className="text-xs text-gray-600">{member.designation}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>



              <TabsContent value="resources" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Upload File Section */}
                  <Card className="glass border-0 shadow-tasksmate">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Upload className="w-5 h-5" />
                        Upload File
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-sm text-gray-600 mb-2">Drag and drop files here, or click to browse</p>
                        <input
                          type="file"
                          multiple
                          className="hidden"
                          id="file-upload"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
                        >
                          {uploading ? "Uploading..." : "Choose Files"}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Support for PDF, DOC, XLS, PNG, JPG files</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Add URL Section */}
                  <Card className="glass border-0 shadow-tasksmate">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Link className="w-5 h-5" />
                        Add URL
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                                                 <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">URL Name</label>
                           <Input
                             type="text"
                             value={newUrlName}
                             onChange={(e) => setNewUrlName(e.target.value)}
                             placeholder="e.g., Design Mockups, API Documentation"
                           />
                         </div>
                         <div>
                           <label className="block text-sm font-medium text-gray-700 mb-2">URL</label>
                           <Input
                             type="url"
                             value={newUrl}
                             onChange={(e) => setNewUrl(e.target.value)}
                             placeholder="https://example.com"
                           />
                         </div>
                        <Button 
                          className="w-full bg-tasksmate-gradient"
                                                     onClick={handleAddUrl}
                                                     disabled={!newUrl || !newUrlName}
                   
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add URL
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Resources List */}
                <Card className="glass border-0 shadow-tasksmate">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Project Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                                         <div className="space-y-3">
                       {resources.map((resource) => (
                        <div key={resource.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                              {resource.type === 'file' ? (
                                <File className="w-5 h-5 text-blue-600" />
                              ) : (
                                <ExternalLink className="w-5 h-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{resource.name}</p>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>Added by {resource.uploadedBy}</span>
                                <span>•</span>
                                <span>{new Date(resource.uploadedAt).toLocaleDateString()}</span>
                                {resource.size && (
                                  <>
                                    <span>•</span>
                                    <span>{resource.size}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {resource.type === 'url' ? (
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => window.open(resource.url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Open
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm">
                                <FileText className="w-4 h-4 mr-1" />
                                Download
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;
