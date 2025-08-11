
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import CopyableBadge from "@/components/ui/copyable-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import NewProjectModal from '@/components/projects/NewProjectModal';
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  Users,
  Target,
  Pencil,
  Edit,
  MoreVertical,
  Check,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  Upload,
  Link,
  File,
  ExternalLink,
  Trash2
} from 'lucide-react';
// Dropdown removed for priority badge in header
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/services/apiService";
import { deriveDisplayFromEmail, getStatusMeta, getPriorityColor, type ProjectStatus } from "@/lib/projectUtils";
import { API_ENDPOINTS } from "@/../config";
import { useProjectStats } from "@/hooks/useProjectStats";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { BackendProjectResource, useProjectResources } from "@/hooks/useProjectResources";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { taskService } from '@/services/taskService';

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

interface Member {
  displayName?: string;
  initials: string;
  name: string;
  role: string;
  designation: string;
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useAuth() || { user: null, loading: true } as const;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const { data: stats } = useProjectStats(id);
  const { data: membersData } = useProjectMembers(id);
  const { data: resourcesData } = useProjectResources(id);
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newUrlName, setNewUrlName] = useState('');
  const [isEditUrlOpen, setIsEditUrlOpen] = useState(false);
  const [editUrlValue, setEditUrlValue] = useState('');
  const [editUrlName, setEditUrlName] = useState('');
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);
  const [isDeleteResourceOpen, setIsDeleteResourceOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('active');
  const [editPriority, setEditPriority] = useState<string>('medium');

  // Utility helpers -------------------------------------------------
  const priorityOptions = ["critical", "high", "medium", "low", "none"] as const;
  const statusOptions = [
    "planning",
    "in_progress",
    "on_hold",
    "completed",
    "archived",
    "not_started",
  ] as const;

  const updateProject = async (payload: Record<string, unknown>) => {
    if (!project) return;
    setProject(prev => (prev ? { ...prev, ...payload } as any : prev)); // optimistic
    try {
      await api.put(`${API_ENDPOINTS.PROJECTS}/${project.id}`, payload);
    } catch (err) {
      console.error("Failed to update project", err);
    }
  };

  const toggleComplete = () => {
    if (!project) return;
    const newStatus = project.status === "completed" ? "not_started" : "completed";
    updateProject({ status: newStatus });
  };

  const handlePriorityChange = (p: string) => updateProject({ priority: p });

  const openEditModal = () => {
    if (!project) return;
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!project) return;
    const payload: Record<string, unknown> = {};
    if (editName !== project.name) payload.name = editName;
    if (editDescription !== project.description) payload.description = editDescription;
    if (editStatus !== project.status) payload.status = editStatus;
    if (editPriority !== project.priority) payload.priority = editPriority;
    if (Object.keys(payload).length) {
      await updateProject(payload);
    }
    setEditOpen(false);
  };

  // Sync modal form values when opened
  useEffect(() => {
    if (editOpen && project) {
      setEditName(project.name);
      setEditDescription(project.description);
      setEditStatus(project.status as ProjectStatus);
      setEditPriority(project.priority);
    }
  }, [editOpen, project]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const handleDelete = async () => {
    if (!project) return;
    setConfirmOpen(true);
  };

  const [userRole, setUserRole] = useState<string | null>(null);

  // When react-query returns data, normalise into Member shape
  useEffect(() => {
    if (!membersData) return;
    setTeamMembers(
      membersData.map((m) => ({
        initials:
          m.email?.split("@")[0]?.[0]?.toUpperCase() ??
          m.username?.[0]?.toUpperCase() ?? "?",
        name: m.username || m.email || m.user_id,
        displayName: deriveDisplayFromEmail(m.email ?? m.username ?? m.user_id).displayName,
        role: m.role || "member",
        designation: m.designation || "",
      }))
    );
    setUserRole(membersData.find((member) => member.username === user?.user_metadata?.username)?.role);
  }, [membersData]);

  // When react-query returns data, normalise into Member shape
  useEffect(() => {
    if (!resourcesData) return;

    const resArr: Resource[] = resourcesData.map((r) => ({
      id: r.resource_id,
      type: r.resource_type as Resource['type'],
      name: r.resource_name,
      url: r.resource_url,
      size: r.resource_size,
      uploadedBy: r.created_by,
      uploadedAt: r.created_at,
    }));
    setResources(resArr);
  }, [resourcesData]);

  // Sync with sidebar collapse/expand events
  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    // Initialise based on current CSS var set by MainNavigation
    setSidebarCollapsed(
      getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem'
    );
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const [loadingProject, setLoadingProject] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      setLoadingProject(true);
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
      setLoadingProject(false);
    };
    fetchProject();
  }, [id]);

  // Fetch resources separately
  const fetchResources = useCallback(async () => {
    if (!project) return;

    setIsLoadingResources(true);
    try {
      const response: BackendProjectResource[] = await api.get<BackendProjectResource[]>(`${API_ENDPOINTS.PROJECT_RESOURCES}?project_id=${project.id}`);
      const resArr: Resource[] = response.map((r) => ({
        id: r.resource_id,
        type: r.resource_type as Resource['type'],
        name: r.resource_name,
        url: r.resource_url,
        size: r.resource_size,
        uploadedBy: r.created_by,
        uploadedAt: r.created_at,
      }));
      setResources(resArr);
    } catch (error) {
      console.error('Error fetching resources:', error);
      setResources([]);
    } finally {
      setIsLoadingResources(false);
    }
  }, [project]);

  // useEffect(() => {
  //   fetchResources();
  //   // eslint-disable-next-line
  // }, [id]);

  // Fetch team members separately
  const fetchTeamMembers = async () => {
    if (!id) return;
    try {
      const res = await api.get<any[]>(`${API_ENDPOINTS.PROJECT_MEMBERS}?project_id=${id}`);
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
      await api.post<any>(`${API_ENDPOINTS.PROJECT_RESOURCES}?project_id=${project.id}`, {
        project_id: project.id,
        project_name: project.name,
        resource_name: newUrlName,
        resource_url: newUrl,
        resource_type: 'url',
        created_by: user?.user_metadata?.username,
      });
      // setResources([...resources, res]);
      setNewUrl('');
      setNewUrlName('');
      fetchResources();
    } catch (err) {
      // handle error
    }
  };

  // Attachment upload
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !project?.id) return;
    try {
      for (const file of Array.from(files)) {
        // 1. Upload to Supabase Storage
        const { url, path, resourceId } = await taskService.uploadProjectResourceToStorage({
          projectId: project.id,
          file,
        });
        // 2. Save metadata to backend
        await api.post<any>(`${API_ENDPOINTS.PROJECT_RESOURCES}?project_id=${project.id}`, {
          project_id: project.id,
          resource_type: 'file',
          name: file.name,
          url: url,
          created_by: user?.user_metadata?.username,
          id: resourceId,
        });
      }
      fetchResources();
    } catch (err: any) {
    }
    setUploading(false);
  };


  // Remove member (DELETE with user_id and project_id)
  const handleRemoveMember = async (member: Member) => {
    if (!project) return;
    try {
      await api.del(
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`, {}
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
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`,
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
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`,
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
        `${API_ENDPOINTS.PROJECT_RESOURCES}/${resource.id}?project_id=${project.id}`, {}
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
        `${API_ENDPOINTS.PROJECT_RESOURCES}/${resource.id}?project_id=${project.id}`,
        { name: newName }
      );
      fetchResources();
    } catch (err) {
      // handle error
    }
  };

  const handleUpdateUrlResource = async (resource: Resource, name: string, urlStr: string) => {
    if (!project) return;
    try {
      await api.put(
        `${API_ENDPOINTS.PROJECT_RESOURCES}/${resource.id}?project_id=${project.id}`,
        { name, url: urlStr }
      );
      fetchResources();
    } catch (err) {
      // handle error
    }
  };

  const handleDownload = async (resource: Resource) => {
    if (!project) return;
    try {
      await api.get(
        `${API_ENDPOINTS.PROJECT_RESOURCES}/${resource.id}?project_id=${project.id}`
      );
      fetchResources();
    } catch (err) {
      // handle error
    }
  };


  const [addMemberOpen, setAddMemberOpen] = useState(false);

  const openAddMemberModal = () => {
    setAddMemberOpen(true);
  };

  const closeAddMemberModal = () => {
    setAddMemberOpen(false);
  };

  const handleAddMember = async (member: Member) => {
    if (!project) return;
    try {
      await api.post(
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`,
        { role: member.role }
      );
      fetchTeamMembers();
    } catch (err) {
      // handle error
    }
  };

  const handleDeleteMember = async (member: Member) => {
    if (!project) return;
    try {
      await api.del(
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`,
        { role: member.role }
      );
      fetchTeamMembers();
    } catch (err) {
      // handle error
    }
  };

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Project...</p>
        </div>
      </div>
    );
  }

  // if (loading || !project) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div>
  //     </div>
  //   );
  // }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <MainNavigation />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* Header */}
        <div className="px-6 pt-6 pb-11 bg-white/50 border-b border-gray-200">
          <div className="w-full">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate(`/projects?org_id=${searchParams.get('org_id') ?? ''}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </Button>


            </div>

            <div className="flex items-start justify-between">
              <div className="flex flex-col items-center">
                <div
                  onClick={toggleComplete}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${project.status === 'completed'
                    ? 'bg-tasksmate-gradient border-transparent'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  {project.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="w-1 h-10 rounded-full bg-blue-500 mt-2"></div>
              </div>
              <div className="flex-1 min-w-0 ml-3 space-y-2">
                {/* Top row: ID + status + priority + actions */}
                <div className="flex items-center gap-3">
                  <CopyableBadge copyText={project.id} variant="default" className="text-sm font-mono bg-blue-600 text-white hover:bg-blue-600 hover:text-white">
                    {project.id}
                  </CopyableBadge>
                  <Badge variant="secondary" className={`text-xs ${getStatusMeta(project.status).color}`}>
                    {getStatusMeta(project.status).label}
                  </Badge>
                  <Badge className={`text-xs ${getPriorityColor(project.priority)} hover:bg-inherit hover:text-inherit`}>
                    {project.priority.toUpperCase()}
                  </Badge>
                  <Edit
                    className="w-4 h-4 cursor-pointer hover:scale-110 transition"
                    onClick={() => setIsEditSheetOpen(true)}
                  />
                  <Trash2 className="w-4 h-4 cursor-pointer hover:scale-110 hover:text-red-600 transition" onClick={handleDelete} />
                </div>
                {/* Title on its own row beside vertical line */}
                <div className="mt-2">
                  <h1 className="font-sora font-bold text-3xl text-gray-900">{project.name}</h1>
                </div>
                {/* Description moved to card in Overview tab */}
              </div>
            </div>
          </div>
        </div>

        {/* Description above Stats */}
        <div className="px-6 py-4">
          <div className="w-full">
            <Card className="glass border-0 shadow-tasksmate mb-6">
              <CardHeader>
                <CardTitle className="font-sora">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-gray-700 whitespace-pre-line">
                  {project.description || '—'}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 py-2">
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Progress</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.progress_percent ?? project.progress}%</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <Progress value={stats?.progress_percent ?? project.progress} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Tasks Completed</p>
                      <p className="text-2xl font-bold text-gray-900">{stats?.tasks_completed ?? project.completedTasks}/{stats?.tasks_total ?? project.tasksCount}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Team Members stat card removed per request */}

              <Card className="glass border-0 shadow-tasksmate">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Days Left</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stats?.days_left ?? Math.ceil((new Date(project.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}
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
                        Team Members ({teamMembers.length})

                        {userRole === "owner" || userRole === "admin" && (
                          <Button variant="ghost" onClick={openAddMemberModal}>
                            <Plus className="w-4 h-4" />
                          </Button>
                        )}
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
                              <p className="text-sm font-medium">{member.displayName}</p>
                              <p className="text-xs text-gray-600">{member.role}</p>
                              <p className="text-xs text-gray-600">{member.designation}</p>
                            </div>

                            {
                              userRole === "owner" || userRole === "admin" && (
                                <Button variant="ghost" onClick={() => handleDeleteMember(member)}>
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
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
                          onChange={(e) => handleFileUpload(e.target.files)}
                          accept="*/*"
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
                                variant="ghost"
                                size="icon"
                                title="Open"
                                onClick={() => window.open(resource.url, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Download"
                                onClick={() => handleDownload(resource)}
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Rename"
                              onClick={() => {
                                if (resource.type === 'url') {
                                  setResourceToEdit(resource);
                                  setEditUrlName(resource.name);
                                  setEditUrlValue(resource.url || "");
                                  setIsEditUrlOpen(true);
                                } else {
                                  const newName = window.prompt('Enter new name', resource.name);
                                  if (newName && newName !== resource.name) {
                                    handleRenameResource(resource, newName);
                                  }
                                }
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="icon"
                              title="Delete"
                              onClick={() => { setResourceToDelete(resource); setIsDeleteResourceOpen(true); }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>

                            {/* <DropdownMenu>
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
                            </DropdownMenu> */}
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

      {/* Edit Project Sheet using NewProjectModal with initial values */}
      {project && (
        <NewProjectModal
          isOpen={isEditSheetOpen}
          onClose={() => setIsEditSheetOpen(false)}
          onSubmit={async (data) => {
            try {
              const updated: any = await api.put(`${API_ENDPOINTS.PROJECTS}/${project.id}`, {
                name: data.name,
                description: data.description,
                status: data.status,
                priority: data.priority,
                start_date: data.startDate || null,
                end_date: data.endDate || null,
                owner: data.owner,
                team_members: data.teamMembers,
              });

              // Optimistically sync local UI with server (fallback to submitted values)
              setProject((prev) => {
                if (!prev) return prev;
                return {
                  ...prev,
                  name: (updated?.name ?? data.name) || prev.name,
                  description: (updated?.description ?? data.description) || prev.description,
                  status: (updated?.status ?? data.status ?? prev.status) as any,
                  priority: (updated?.priority ?? data.priority ?? prev.priority) as any,
                  startDate: ((updated?.start_date ?? data.startDate) ?? prev.startDate) as any,
                  endDate: ((updated?.end_date ?? data.endDate) ?? prev.endDate) as any,
                };
              });
            } catch (e) {
              // no-op, errors are logged by api layer
            } finally {
              setIsEditSheetOpen(false);
            }
          }}
          orgId={searchParams.get('org_id') ?? undefined}
          mode="edit"
          initialData={{
            name: project.name,
            description: project.description,
            owner: (project as any).owner,
            teamMembers: [],
            priority: project.priority,
            status: project.status as any,
            startDate: project.startDate,
            endDate: project.endDate,
          }}
        />
      )}

      {/* Delete confirm dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              This action cannot be undone. Type the project ID
              <span className="mx-1 inline-block align-middle align-middle">
                <CopyableBadge
                  copyText={project?.id ?? ''}
                  variant="default"
                  className="text-xs font-mono bg-blue-600 text-white hover:bg-blue-600 hover:text-white"
                >
                  {project?.id}
                </CopyableBadge>
              </span>
              to confirm deletion.
            </p>
            <Label className="text-xs text-gray-500">Enter Project ID</Label>
            <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="Enter the project ID to confirm" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              className="bg-red-600 text-white"
              disabled={!project || confirmText !== project?.id}
              onClick={async () => {
                if (!project) return;
                try {
                  await api.del(`${API_ENDPOINTS.PROJECTS}/${project.id}`, {});
                  navigate(`/projects?org_id=${searchParams.get('org_id') ?? ''}`);
                } catch (e) { }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Resource Confirm Dialog */}
      <Dialog open={isDeleteResourceOpen} onOpenChange={setIsDeleteResourceOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <span className="font-medium">{resourceToDelete?.name}</span>?
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteResourceOpen(false)}>Cancel</Button>
            <Button
              className="bg-red-600 text-white"
              onClick={async () => {
                if (!resourceToDelete || !project) return;
                try {
                  await api.del(
                    `${API_ENDPOINTS.PROJECT_RESOURCES}/${resourceToDelete.id}?project_id=${project.id}`,
                    {}
                  );
                  setIsDeleteResourceOpen(false);
                  setResourceToDelete(null);
                  fetchResources();
                } catch (e) { }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit URL Modal */}
      <Dialog open={isEditUrlOpen} onOpenChange={setIsEditUrlOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit URL</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-gray-500">URL Name</Label>
              <Input
                value={editUrlName}
                onChange={(e) => setEditUrlName(e.target.value)}
                placeholder="Enter a descriptive name"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">URL</Label>
              <Input
                type="url"
                value={editUrlValue}
                onChange={(e) => setEditUrlValue(e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUrlOpen(false)}>Cancel</Button>
            <Button
              className="bg-tasksmate-gradient"
              disabled={!editUrlName || !editUrlValue}
              onClick={async () => {
                if (!resourceToEdit) return;
                await handleUpdateUrlResource(resourceToEdit, editUrlName, editUrlValue);
                setIsEditUrlOpen(false);
                setResourceToEdit(null);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProjectDetail;
