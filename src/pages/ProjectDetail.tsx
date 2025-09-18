import MainNavigation from "@/components/navigation/MainNavigation";
import NewProjectModal from '@/components/projects/NewProjectModal';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CopyableBadge from "@/components/ui/copyable-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import {
  AlertCircle,
  ArrowLeft,
  Bug,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Edit,
  ExternalLink,
  File,
  FileText,
  Link,
  Pencil,
  Plus,
  Save,
  Target,
  Trash2,
  Upload,
  Users,
  X,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// Dropdown removed for priority badge in header
import { API_ENDPOINTS } from "@/config";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from '@/hooks/use-toast';
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { BackendProjectResource, useProjectResources } from "@/hooks/useProjectResources";
import { useProjectStats } from "@/hooks/useProjectStats";
import { capitalizeFirstLetter, deriveDisplayFromEmail, getPriorityColor, getStatusMeta, type ProjectStatus } from "@/lib/projectUtils";
import { api } from "@/services/apiService";
import { taskService } from '@/services/taskService';
import imageCompression from "browser-image-compression";
import { BackendOrgMember } from "@/types/organization";

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
  email?: string;
  user_id?: string;
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
  // Create our own state tracker for days left to avoid the TypeScript error with mutate
  const [daysLeft, setDaysLeft] = useState<number | undefined>(undefined);
  const { data: membersData, refetch: refetchMembers } = useProjectMembers(id);
  const currentOrgId = useCurrentOrgId();
  const { data: orgMembersRaw = [] } = useOrganizationMembers(currentOrgId);
  const orgMembers: BackendOrgMember[] = useMemo(() => (orgMembersRaw?.map((m: any) => ({
    ...m,
    name: ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id,
  })).map((m: any) => ({
    ...m,
    displayName: deriveDisplayFromEmail(m.name).displayName,
    initials: deriveDisplayFromEmail(m.name).initials,
  })) ?? []) as BackendOrgMember[], [orgMembersRaw]);

  const orgRole = useMemo(() => orgMembers.find((m) => m.user_id === user?.id)?.role, [orgMembers, user]);

  const { data: resourcesData } = useProjectResources(id);
  const [project, setProject] = useState<Project | null>(null);
  const [teamMembers, setTeamMembers] = useState<Member[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoadingResources, setIsLoadingResources] = useState(false);
  const [errorLoadingResources, setErrorLoadingResources] = useState<string | null>(null);

  const [newUrl, setNewUrl] = useState('');
  const [newUrlName, setNewUrlName] = useState('');
  const [isEditUrlOpen, setIsEditUrlOpen] = useState(false);
  const [editUrlValue, setEditUrlValue] = useState('');
  const [editUrlName, setEditUrlName] = useState('');
  const [resourceToEdit, setResourceToEdit] = useState<Resource | null>(null);
  const [isDeleteResourceOpen, setIsDeleteResourceOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; preview: string }[]>([]);

  // Handle file selection
  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).map(file => ({
      file,
      preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : ''
    }));

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  // Handle file removal
  const handleRemoveFile = (index: number) => {
    const newFiles = [...selectedFiles];
    // Revoke the object URL to avoid memory leaks
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview);
    }
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
  };
  const [uploadProgress, setUploadProgress] = useState(0);

  // Edit modal state
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('active');
  const [editPriority, setEditPriority] = useState<string>('medium');
  // Inline title & description editing
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [isDescriptionEditing, setIsDescriptionEditing] = useState(false);
  const [descriptionInput, setDescriptionInput] = useState('');

  // Keep local inputs in sync when project changes
  useEffect(() => {
    if (project) {
      setTitleInput(project.name);
      setDescriptionInput(project.description);
    }
  }, [project]);


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
      toast({
        title: "Updating project",
        description: "Please wait...",
      });
      await api.put(`${API_ENDPOINTS.PROJECTS}/${project.id}`, payload);
      toast({
        title: "Success",
        description: "Project updated successfully",
        variant: "default"
      });
    } catch (err) {
      console.error("Failed to update project", err);
      toast({
        title: "Failed to update project",
        description: err.message,
        variant: "destructive"
      });
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

  const [projectDuration, setProjectDuration] = useState('0 days');

  useEffect(() => {
    if (project?.startDate && project?.endDate) {
      const startDate = new Date(project.startDate);
      const endDate = new Date(project.endDate);
      const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setProjectDuration(`${diffDays} days`);
    }
  }, [project?.startDate, project?.endDate]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [isEditSheetOpen, setIsEditSheetOpen] = useState(false);

  const handleDelete = async () => {
    if (!project) return;
    setConfirmOpen(true);
  };

  const [userRole, setUserRole] = useState<string | null>(null);


  const isOwner = useMemo(() => {
    return (userRole === "owner" || orgRole === "owner")
  }, [userRole, orgRole]);

  const isAdmin = useMemo(() => {
    return ((userRole === "admin" || userRole === "owner")
      || (orgRole === "owner" || orgRole === "admin"))
  }, [userRole, orgRole]);

  // When react-query returns data, normalise into Member shape
  useEffect(() => {
    if (!membersData) return;
    setTeamMembers(
      membersData.map((m) => {
        const identifier = m.username || m.email || m.user_id;
        const display = deriveDisplayFromEmail(identifier).displayName;
        const initials = display ? display.charAt(0).toUpperCase() : "?";
        return {
          initials,
          name: m.user_id, // keep id for API ops
          email: m.email,
          displayName: display,
          role: m.role || "member",
          designation: m.designation || "",
        } as Member;
      })
    );
    // setUserRole(membersData.find((member) => (member.username ?? member.email ?? member.user_id) === user?.user_metadata?.username)?.role);
    setUserRole(membersData.find((member) => (member.user_id) === user?.id)?.role);

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

  // Update days left whenever project changes
  useEffect(() => {
    if (project?.endDate) {
      const daysLeftVal = Math.max(0, Math.ceil(
        (new Date(project.endDate.split('T')[0] + 'T12:00:00').getTime() - new Date().setHours(12, 0, 0, 0)) /
        (1000 * 60 * 60 * 24)
      ));
      setDaysLeft(daysLeftVal);
    } else if (stats?.days_left !== undefined) {
      setDaysLeft(stats.days_left);
    }
  }, [project?.endDate, stats?.days_left]);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', {
                      state: {
                          redirectTo: location.pathname + location.search
                      },
                      replace: true
                  });
    }
  }, [user, loading, navigate]);

  const [loadingProject, setLoadingProject] = useState(false);

  const fetchProject = async () => {
    if (!id) return;
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
      toast({
        title: "Failed to fetch project",
        description: err.message,
        variant: "destructive"
      });
      setProject(null);
    }
    setLoadingProject(false);
  };

  useEffect(() => {
    if (!id) return;

    fetchProject();
  }, [id]);

  // Fetch resources separately
  const fetchResources = useCallback(async () => {
    if (!project) return;

    setIsLoadingResources(true);
    setErrorLoadingResources(null);
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
      setErrorLoadingResources(error.message);
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

  // Ensure membersData is refreshed when the component loads or when id changes
  useEffect(() => {
    if (id) {
      refetchMembers();
    }
  }, [id, refetchMembers]);

  // Add new URL resource
  const handleAddUrl = async () => {
    if (!newUrl || !newUrlName || !project) return;
    try {
      toast({
        title: "Adding resource",
        description: "Please wait...",
      });
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
      toast({
        title: "Success",
        description: "Resource added successfully",
        variant: "default"
      });
      fetchResources();
    } catch (err) {
      // handle error
      toast({
        title: "Failed to add resource",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Attachment upload
  const handleFileUpload = async () => {
    if (!project?.id || selectedFiles.length === 0) return;

    setUploading(true);
    toast({
      title: "Uploading files",
      description: "Please wait...",
    });
    try {
      for (const { file } of selectedFiles) {
        if (file.type.startsWith("image/")) {
          try {
            // compress images
            const compressed = await imageCompression(file, {
              maxSizeMB: 1,
              maxWidthOrHeight: 1920,
              useWebWorker: true,
              alwaysKeepResolution: true,
              maxIteration: 2,
            });
            await taskService.uploadProjectResourceForm(project.id, project.name, compressed, file.name);
          } catch (err: any) {
            toast({
              title: "Failed to compress image, uploading original file",
              description: err.message,
              variant: "destructive"
            });
            // other files - add as is
            await taskService.uploadProjectResourceForm(project.id, project.name, file, file.name);
          }
        } else {
          // other files - add as is
          await taskService.uploadProjectResourceForm(project.id, project.name, file, file.name);
        }

        // await taskService.uploadProjectResourceForm(project.id, project.name, file, file.name);


        // // 1. Upload to Supabase Storage
        // const { url, path, resourceId } = await taskService.uploadProjectResourceToStorage({
        //   projectId: project.id,
        //   file,
        // });
        // // 2. Save metadata to backend
        // await api.post<any>(`${API_ENDPOINTS.PROJECT_RESOURCES}?project_id=${project.id}`, {
        //   project_id: project.id,
        //   project_name: project.name,
        //   resource_type: 'file',
        //   resource_name: file.name,
        //   resource_url: url,
        //   created_by: user?.user_metadata?.username,
        //   id: resourceId,
        // });
      }
      // Reset and refresh
      setSelectedFiles([]);
      fetchResources();
      toast({
        title: "Success",
        description: "Files uploaded successfully!",
        variant: "default"
      });
    } catch (err: any) {
      toast({
        title: "Failed to upload files",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  // Remove member (DELETE with user_id and project_id)
  const handleRemoveMember = async (member: Member) => {
    if (!project) return;
    try {
      // Optimistic UI update - remove the member immediately
      setTeamMembers(prev => prev.filter(m => m.name !== member.name));

      toast({
        title: "Removing project member",
        description: "Please wait...",
      });
      // Then make the API call
      await api.del(
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`, {}
      );

      toast({
        title: "Success",
        description: "Member removed successfully",
        variant: "default"
      });

      // No need to call fetchTeamMembers() since we've already updated the UI
      // and the optimistic update preserves the existing member data for remaining members
    } catch (err) {
      // If there's an error, refresh the whole list to get back to a consistent state
      console.error('Error removing member:', err);
      fetchTeamMembers();
      toast({
        title: "Failed to remove team member",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Change role (PUT with user_id and project_id)
  const handleChangeRole = async (member: Member, newRole: string) => {
    if (!project) return;
    try {
      toast({
        title: "Updating project member role",
        description: "Please wait...",
      });
      await api.put(
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`,
        {
          role: newRole,
          // Ensure designation is preserved when changing role
          designation: member.designation || ""
        }
      );
      toast({
        title: "Success",
        description: "Member role updated successfully",
        variant: "default"
      });
      await refetchMembers();
    } catch (err) {
      // handle error
      toast({
        title: "Failed to change team member role",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Change designation (PUT with user_id and project_id)
  const handleChangeDesignation = async (member: Member, newDesignation: string) => {
    if (!project) return;
    try {
      toast({
        title: "Updating project member designation",
        description: "Please wait...",
      });
      await api.put(
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`,
        { designation: newDesignation }
      );
      toast({
        title: "Success",
        description: "Member designation updated successfully",
        variant: "default"
      });
      await refetchMembers();
    } catch (err) {
      // handle error
      toast({
        title: "Failed to change team member designation",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Remove resource (DELETE with resource_id and project_id)
  const handleDeleteResource = async (resource: Resource) => {
    if (!project) return;
    try {
      toast({
        title: "Deleting resource",
        description: "Please wait...",
      });
      await api.del(
        `${API_ENDPOINTS.PROJECT_RESOURCES}/${resource.id}?project_id=${project.id}`, {}
      );
      toast({
        title: "Success",
        description: "Resource deleted successfully",
        variant: "default"
      });
      await fetchResources();
    } catch (err) {
      // handle error
      toast({
        title: "Failed to delete resource",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // Update resource (PUT with resource_id and project_id)
  const handleRenameResource = async (resource: Resource, newName: string) => {
    if (!project) return;
    try {
      toast({
        title: "Renaming resource",
        description: "Please wait...",
      });
      await api.put(
        `${API_ENDPOINTS.PROJECT_RESOURCES}/${resource.id}?project_id=${project.id}`,
        { name: newName }
      );
      toast({
        title: "Success",
        description: "Resource renamed successfully",
        variant: "default"
      });
      await fetchResources();
    } catch (err) {
      // handle error
      toast({
        title: "Failed to rename resource",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleUpdateUrlResource = async (resource: Resource, name: string, urlStr: string) => {
    if (!project) return;
    try {
      toast({
        title: "Updating resource",
        description: "Please wait...",
      });
      await api.put(
        `${API_ENDPOINTS.PROJECT_RESOURCES}/${resource.id}?project_id=${project.id}`,
        { name, url: urlStr }
      );
      toast({
        title: "Success",
        description: "Resource updated successfully",
        variant: "default"
      });
      await fetchResources();
    } catch (err) {
      // handle error
      toast({
        title: "Failed to update resource",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  // const handleDownload = async (resource: Resource) => {
  //   if (!project) return;
  //   try {
  //     await api.get(
  //       `${API_ENDPOINTS.PROJECT_RESOURCES}/${resource.id}?project_id=${project.id}`
  //     );
  //     fetchResources();
  //   } catch (err) {
  //     // handle error
  //   }
  // };

  const handleDownload = async (resource: Resource) => {
    if (!resource.url) return;

    try {
      // Extract the file name from the URL
      const fileName = resource.url.split('/').pop() || 'download';

      // Fetch the file
      const response = await fetch(resource.url);
      if (!response.ok) throw new Error('Failed to download file');

      // Get the blob data
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: "Download started",
        variant: "default"
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Failed to download file",
        description: error.message,
        variant: "destructive"
      });
    }
  };


  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [selectedOrgMemberIds, setSelectedOrgMemberIds] = useState<string[]>([]);

  const [isBannerVisible, setIsBannerVisible] = useState(true);

  const handleHideBanner = useCallback(() => {
    setIsBannerVisible(false);
    // Optional: Store preference in localStorage to persist across page reloads
    // localStorage.setItem('hidePermissionBanner', 'true');
  }, []);

  const openAddMemberModal = () => {
    setSelectedOrgMemberIds([]);
    setAddMemberOpen(true);
  };

  const closeAddMemberModal = () => {
    setAddMemberOpen(false);
  };

  const handleAddMember = async (member: Member) => {
    if (!project) return;
    try {
      toast({
        title: "Adding project member",
        description: "Please wait...",
      });
      await api.post(
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`,
        {
          role: member.role,
          // Include designation when adding a single member
          designation: member.designation || ""
        }
      );
      toast({
        title: "Success",
        description: "Member added successfully",
        variant: "default"
      });

      // Refresh data from the server to ensure designation is loaded
      await refetchMembers();
    } catch (err) {
      // handle error
      toast({
        title: "Failed to add team member",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  const handleAddOrgMemberToProject = async () => {
    if (!project || selectedOrgMemberIds.length === 0) return;
    const toAdd = [...new Set(selectedOrgMemberIds)];

    // Filter out any members who are already in the project
    const existingMemberIds = new Set(teamMembers.map(m => m.name));
    const filteredToAdd = toAdd.filter(uid => !existingMemberIds.has(uid));

    if (filteredToAdd.length === 0) {
      toast({
        title: "Info",
        description: "Selected members are already part of the project",
        variant: "default"
      });
      setAddMemberOpen(false);
      setSelectedOrgMemberIds([]);
      return;
    }

    try {
      toast({
        title: "Adding project members",
        description: "Please wait...",
      });
      await Promise.allSettled(
        filteredToAdd.map((uid) => {
          const foundMember = orgMembers.find(m => m.user_id === uid);

          return api.post(
            `${API_ENDPOINTS.PROJECT_MEMBERS}`,
            {
              project_id: project.id,
              user_id: uid,
              role: "member",
              designation: foundMember?.designation || ""
            }
          );
        })
      );
      toast({
        title: "Success",
        description: "Members added successfully",
        variant: "default"
      });
      // Refresh the data from the server to get accurate designation information
      await refetchMembers();

      // Also update the local state for immediate UI feedback
      setTeamMembers(prev => {
        const existing = new Set(prev.map(p => p.name));
        const additions: Member[] = [];
        filteredToAdd.forEach(uid => {
          if (existing.has(uid)) return;
          const found = orgMembers.find(m => m.user_id === uid);
          const email = found?.email ?? uid;
          const display = deriveDisplayFromEmail(email).displayName;
          additions.push({
            initials: display.charAt(0).toUpperCase(),
            name: uid,
            role: "member",
            designation: found?.designation || "",
            displayName: display,
            email
          });
        });
        return [...prev, ...additions];
      });
    } catch (err) {
      console.error("Failed to add members", err);
      toast({
        title: "Failed to add team member",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setAddMemberOpen(false);
      setSelectedOrgMemberIds([]);
    }
  };

  // Modal for adding existing org members to project
  const AddMemberDialog = () => {
    // Create a filtered list of available org members
    const availableMembers = orgMembers.filter(m => {
      // Filter out members already in the project using both membersData and teamMembers
      const isInMembersData = membersData?.some(pm => pm.user_id === m.user_id);
      const isInTeamMembers = teamMembers.some(tm => tm.name === m.user_id);
      return !isInMembersData && !isInTeamMembers;
    });

    return (
      <Dialog open={addMemberOpen} onOpenChange={setAddMemberOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Project Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Label>Select organization members</Label>
            <div className="border rounded-md p-3 max-h-64 overflow-y-auto space-y-2">
              {availableMembers.length > 0 ? (
                availableMembers.map((m) => {
                  const email = m.email ?? m.user_id;
                  const name = email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                  const checked = selectedOrgMemberIds.includes(m.user_id);
                  return (
                    <label key={m.user_id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedOrgMemberIds(prev => e.target.checked ? [...prev, m.user_id] : prev.filter(id => id !== m.user_id));
                        }}
                      />
                      <span className="text-sm">
                        {name} ({email})
                        {m.designation && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0 ml-2">
                            {capitalizeFirstLetter(m.designation)}
                          </Badge>
                        )}
                      </span>
                    </label>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <Users className="w-12 h-12 text-gray-300 mb-2" />
                  <p className="text-gray-500 font-medium">All organization members are already added to this project</p>
                  <p className="text-gray-400 text-sm mt-1">There are no available members to add</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAddMemberOpen(false)}>Close</Button>
              {availableMembers.length > 0 && (
                <Button
                  onClick={handleAddOrgMemberToProject}
                  disabled={selectedOrgMemberIds.length === 0}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Add {selectedOrgMemberIds.length > 0 ? `(${selectedOrgMemberIds.length})` : ""}
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const handleDeleteMember = async (member: Member) => {
    if (!project) return;
    try {
      // Optimistic UI update - remove the member immediately
      setTeamMembers(prev => prev.filter(m => m.name !== member.name));

      toast({
        title: "Removing project member",
        description: "Please wait...",
      });
      // Then make the API call
      await api.del(
        `${API_ENDPOINTS.PROJECT_MEMBERS}/${member.name}/${project.id}`,
        { role: member.role }
      );
      toast({
        title: "Success",
        description: "Member removed successfully",
        variant: "default"
      });

      // Refresh the data to ensure our UI is in sync with the backend
      await refetchMembers();
    } catch (err) {
      // If there's an error, refresh the whole list to get back to a consistent state
      console.error('Error removing member:', err);
      await refetchMembers();
      toast({
        title: "Failed to remove team member",
        description: err.message,
        variant: "destructive"
      });
    }
  };

  if (loadingProject) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MainNavigation />
        <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          <div className="min-h-screen px-6 py-10 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-300">Loading Project...</p>
            </div>
          </div>
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

  // Graceful fallback when project failed to load or does not exist
  if (!loadingProject && !project) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <MainNavigation />
        <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          <div className="px-6 py-10">
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle>Project not found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 mb-4">We couldn't load this project. It may have been deleted or you may not have access.</p>
                <Button onClick={() => navigate(`/projects?org_id=${searchParams.get('org_id') ?? ''}`)} className="bg-green-500 hover:bg-green-600">
                  Back to Projects
                </Button>
                <Button
                  className="bg-green-500 hover:bg-green-600 ml-2"
                  onClick={fetchProject}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
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

  const handleNavigation = (tab: string) => {
    if (currentOrgId) {
      navigate(`/${tab}/${project?.id}?org_id=${currentOrgId}`);
    } else {
      navigate(`/${tab}/${project?.id}`);
    }
  };



  // // Check localStorage for banner visibility preference on component mount
  // useEffect(() => {
  //   const isBannerHidden = localStorage.getItem('hidePermissionBanner') === 'true';
  //   if (isBannerHidden) {
  //     setIsBannerVisible(false);
  //   }
  // }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      <MainNavigation />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* <nav className="px-6 py-4 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50" >
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(`/projects?org_id=${searchParams.get('org_id') ?? ''}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent p-0 m-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </Button>
            </div>
          </div>
        </nav> */}

        {/* Permission Banner */}
        {
          !isAdmin
          && isBannerVisible && (
            <div className="w-full bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 px-6 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    You are viewing this project as a member. Some actions like editing or deleting the project are restricted to members.
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-800/30"
                  onClick={handleHideBanner}
                  aria-label="Dismiss message"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}



        {/* Header */}
        <header className="px-6 py-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
          <div className="w-full">
            {/* <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate(`/projects?org_id=${searchParams.get('org_id') ?? ''}`)}
                className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Projects
              </Button>
            </div> */}

            <div className="flex items-start justify-between">
              <div className="flex flex-col items-center">
                <div
                  onClick={toggleComplete}
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${(project?.status === 'completed')
                    ? 'bg-tasksmate-gradient border-transparent'
                    : 'border-gray-300 hover:border-gray-400'
                    }`}
                >
                  {project?.status === 'completed' && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="w-1 h-10 rounded-full bg-blue-500 mt-2"></div>
              </div>
              <div className="flex-1 min-w-0 ml-3 space-y-2">
                {/* Top row: ID + status + priority + actions */}
                <div className="flex items-center gap-3">
                  <CopyableBadge copyText={project?.id ?? ''} org_id={currentOrgId ?? ''} variant="default" className="text-sm font-mono bg-blue-600 text-white hover:bg-blue-600 hover:text-white">
                    {project?.id}
                  </CopyableBadge>
                  {isAdmin ? (
                    <>
                      {/* Status selector */}
                      <Select
                        value={project?.status ?? 'not_started'}
                        onValueChange={(v) => updateProject({ status: v })}
                      >
                        <SelectTrigger className="h-6 px-2 bg-transparent border border-gray-200 rounded-full text-xs w-auto min-w-[6rem]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {[
                            'planning',
                            'in_progress',
                            'active',
                            'on_hold',
                            'completed',
                            'archived',
                            'not_started',
                          ].map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusMeta(s as any).color}`}>
                                {getStatusMeta(s as any).label}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Priority selector */}
                      <Select
                        value={project?.priority ?? 'none'}
                        onValueChange={(v) => handlePriorityChange(v)}
                      >
                        <SelectTrigger className="h-6 px-2 bg-transparent border border-gray-200 rounded-full text-xs w-auto min-w-[6rem]">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {priorityOptions.map((p) => (
                            <SelectItem key={p} value={p}>
                              <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(p)}`}>{p.toUpperCase()}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </>
                  ) : (
                    <>
                      <Badge variant="secondary" className={`text-xs ${getStatusMeta(project?.status ?? 'not_started').color}`}>
                        {getStatusMeta(project?.status ?? 'not_started').label}
                      </Badge>
                      <Badge className={`text-xs ${getPriorityColor(project?.priority ?? 'none')} hover:bg-inherit hover:text-inherit`}>
                        {(project?.priority ?? 'none').toUpperCase()}
                      </Badge>
                    </>
                  )}
                  {/* Edit icon removed as requested */}

                  {isAdmin
                    ? (
                      <div className="cursor-pointer hover:scale-110 hover:text-red-600 transition" title="Delete project">
                        <Trash2
                          className="w-4 h-4"
                          onClick={handleDelete}
                        />
                      </div>
                    ) : (
                      <div className="relative group">
                        <div className="cursor-not-allowed">
                          <Trash2
                            className="w-4 h-4 text-gray-400"
                          />
                        </div>
                        <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 w-48 text-center">
                          Only project owners can delete projects
                        </div>
                      </div>
                    )}
                </div>
                {/* Title with inline edit */}
                <div className="mt-2 flex items-start gap-2">
                  {isTitleEditing ? (
                    <div className="flex items-center gap-2 w-full">
                      <Input
                        value={titleInput}
                        onChange={(e) => setTitleInput(e.target.value)}
                        className="text-3xl font-sora font-bold border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={async () => {
                          await updateProject({ name: titleInput });
                          setIsTitleEditing(false);
                        }}
                        title="Save title"
                      >
                        <Save className="h-4 w-4 text-green-600" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-2"
                        onClick={() => setIsTitleEditing(false)}
                        title="Cancel"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <h1 className="font-sora font-bold text-3xl text-gray-900 dark:text-white">{project?.name ?? ''}</h1>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => setIsTitleEditing(true)}
                          title="Edit title"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
                {/* Description moved to card in Overview tab */}
              </div>
              {/* Right actions (Duplicate only) */}
              <div className="ml-4 flex items-center gap-2">
                {/* <Button variant="outline">
                  <Link to={`/projects?org_id=${searchParams.get('org_id') ?? ''}`} className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Projects
                  </Link>
                </Button> */}
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/projects?org_id=${searchParams.get('org_id') ?? ''}`)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Projects
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Description above Stats */}
        <div className="px-6 py-4">
          <div className="w-full">
            <Card className="glass border-0 shadow-tasksmate mb-6 bg-white/80 dark:bg-gray-800/80">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CardTitle className="font-sora text-gray-900 dark:text-white">Description</CardTitle>
                  {isDescriptionEditing ? (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={async () => {
                          await updateProject({ description: descriptionInput });
                          setIsDescriptionEditing(false);
                        }}
                        title="Save description"
                      >
                        <Save className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={async () => {
                          setIsDescriptionEditing(false);
                        }}
                        title="Cancel"
                      >
                        <X className="h-4 w-4 text-red-600" />
                      </Button>
                    </>
                  ) : (
                    isAdmin
                    && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setIsDescriptionEditing(true)}
                        title="Edit description"
                      >
                        <Pencil className="h-4 w-4 text-gray-500" />
                      </Button>
                    )
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isDescriptionEditing ? (
                  <RichTextEditor
                    content={descriptionInput}
                    onChange={setDescriptionInput}
                    className="min-h-[200px]"
                  />
                ) : (
                  <div
                    className="prose max-w-none text-gray-700 dark:text-gray-300 dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: project?.description || '' }}
                  />
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="px-6 py-2">
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Progress</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.progress_percent ?? project?.progress ?? 0}%</p>
                    </div>
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Target className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                  <Progress value={stats?.progress_percent ?? project?.progress ?? 0} className="mt-3" />
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80 cursor-pointer hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors" onClick={() => handleNavigation('tasks_catalog')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.tasks_completed ?? project?.completedTasks ?? 0}/{stats?.tasks_total ?? project?.tasksCount ?? 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle2 className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Bugs Reported stats card */}
              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80 cursor-pointer hover:bg-white/90 dark:hover:bg-gray-700/90 transition-colors" onClick={() => handleNavigation('tester-zone')}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Bugs Reported</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats?.bugs_total ?? 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <Bug className="w-6 h-6 text-red-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Days Left</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {daysLeft !== undefined ? daysLeft :
                          (project?.endDate ?
                            Math.max(0, Math.ceil((new Date(project.endDate.split('T')[0] + 'T12:00:00').getTime() - new Date().setHours(12, 0, 0, 0)) / (1000 * 60 * 60 * 24))) :
                            (stats?.days_left ?? 0))}
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
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Project Timeline */}
                  <Card className="lg:col-span-6 glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                        <Calendar className="w-5 h-5" />
                        Project Timeline
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 mr-1" />
                            Start Date
                          </span>
                          {isAdmin ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-blue-100 text-blue-800 cursor-pointer hover:bg-blue-200 transition-colors px-3 py-1.5"
                                >
                                  {project?.startDate ?
                                    (project.startDate.includes('T') ?
                                      new Date(project.startDate.split('T')[0] + 'T12:00:00').toLocaleDateString() :
                                      new Date(project.startDate + 'T12:00:00').toLocaleDateString()) :
                                    'Set start date'}
                                  <Pencil className="w-3 h-3 inline ml-1" />
                                </Badge>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                  <DialogTitle>Update Start Date</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <Input
                                    type="date"
                                    value={project?.startDate ? project.startDate.split('T')[0] : ''}
                                    onChange={(e) => {
                                      const newStartDate = e.target.value;
                                      // Optimistic update
                                      setProject(prev => prev ? {
                                        ...prev,
                                        startDate: newStartDate
                                      } : null);
                                    }}
                                  />
                                </div>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button
                                      type="submit"
                                      onClick={async () => {
                                        try {
                                          await updateProject({ start_date: project?.startDate });
                                          toast({
                                            title: "Success",
                                            description: "Start date updated successfully",
                                            variant: "default"
                                          });

                                          // If end date exists, update days left calculation
                                          if (project?.endDate) {
                                            const daysLeftVal = Math.max(0, Math.ceil(
                                              (new Date(project.endDate.split('T')[0] + 'T12:00:00').getTime() - new Date().setHours(12, 0, 0, 0)) /
                                              (1000 * 60 * 60 * 24)
                                            ));
                                            setDaysLeft(daysLeftVal);
                                          }
                                        } catch (err) {
                                          toast({
                                            title: "Failed to update start date",
                                            description: err.message,
                                            variant: "destructive"
                                          });
                                        }
                                      }}
                                    >
                                      Save
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          ) : (
                            <div className="relative group">
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                                {project?.startDate ?
                                  (project.startDate.includes('T') ?
                                    new Date(project.startDate.split('T')[0] + 'T12:00:00').toLocaleDateString() :
                                    new Date(project.startDate + 'T12:00:00').toLocaleDateString()) :
                                  'Not set'}
                              </Badge>
                              <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 w-48 text-center">
                                Only owners and admins can modify dates
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400 flex items-center">
                            <Calendar className="w-4 h-4 text-red-600 dark:text-red-400 mr-1" />
                            End Date
                          </span>
                          {
                            isAdmin
                              ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-red-100 text-red-800 cursor-pointer hover:bg-red-200 transition-colors px-3 py-1.5"
                                    >
                                      {project?.endDate ?
                                        (project.endDate.includes('T') ?
                                          new Date(project.endDate.split('T')[0] + 'T12:00:00').toLocaleDateString() :
                                          new Date(project.endDate + 'T12:00:00').toLocaleDateString()) :
                                        'Set end date'}
                                      <Pencil className="w-3 h-3 inline ml-1" />
                                    </Badge>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-[425px]">
                                    <DialogHeader>
                                      <DialogTitle>Update End Date</DialogTitle>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                      <Input
                                        type="date"
                                        value={project?.endDate ? project.endDate.split('T')[0] : ''}
                                        min={project?.startDate ? project.startDate.split('T')[0] : ''}
                                        onChange={(e) => {
                                          const newEndDate = e.target.value;
                                          // Optimistic update
                                          setProject(prev => prev ? {
                                            ...prev,
                                            endDate: newEndDate
                                          } : null);
                                        }}
                                      />
                                      {project?.startDate && (
                                        <p className="text-xs text-gray-500">
                                          Must be on or after the start date ({new Date(project.startDate).toLocaleDateString()})
                                        </p>
                                      )}
                                    </div>
                                    <DialogFooter>
                                      <DialogClose asChild>
                                        <Button
                                          type="submit"
                                          onClick={async () => {
                                            try {
                                              await updateProject({ end_date: project?.endDate });
                                              toast({
                                                title: "Success",
                                                description: "End date updated successfully",
                                                variant: "default"
                                              });

                                              // Manually update days left to reflect new end date
                                              if (project?.endDate) {
                                                const daysLeftVal = Math.max(0, Math.ceil(
                                                  (new Date(project.endDate.split('T')[0] + 'T12:00:00').getTime() - new Date().setHours(12, 0, 0, 0)) /
                                                  (1000 * 60 * 60 * 24)
                                                ));
                                                setDaysLeft(daysLeftVal);
                                              }
                                            } catch (err) {
                                              toast({
                                                title: "Failed to update end date",
                                                description: err.message,
                                                variant: "destructive"
                                              });
                                            }
                                          }}
                                        >
                                          Save
                                        </Button>
                                      </DialogClose>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <div className="relative group">
                                  <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                                    {project?.endDate ?
                                      (project.endDate.includes('T') ?
                                        new Date(project.endDate.split('T')[0] + 'T12:00:00').toLocaleDateString() :
                                        new Date(project.endDate + 'T12:00:00').toLocaleDateString()) :
                                      'Not set'}
                                  </Badge>
                                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 w-48 text-center">
                                    Only owners and admins can modify dates
                                  </div>
                                </div>
                              )}
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {projectDuration}
                            {/* {project?.endDate && project?.startDate ?
                              Math.ceil((new Date(project.endDate.split('T')[0] + 'T12:00:00').getTime() -
                                new Date(project.startDate.split('T')[0] + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24)) : 0} days */}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Team Members */}
                  <Card className="lg:col-span-6 glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between gap-2 text-gray-900 dark:text-white">
                        <span className="flex items-center gap-2">
                          <Users className="w-5 h-5" />
                          Team Members ({teamMembers.length})
                        </span>
                        {isAdmin && (
                            <Button size="icon" variant="ghost" onClick={openAddMemberModal}>
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
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium truncate text-gray-900 dark:text-white">
                                  {member.displayName ?? deriveDisplayFromEmail(member.name ?? member.email ?? "").displayName}
                                </p>
                                {member.designation && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 px-1.5 py-0">
                                    {capitalizeFirstLetter(member.designation)}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{capitalizeFirstLetter(member.role)}</p>
                            </div>

                            {isAdmin && (
                                <div className="flex items-center gap-2">
                                  {isOwner && (
                                    <Dialog>
                                      <DialogTrigger asChild>
                                        <Button title="Change role" variant="ghost" className="h-8 w-8 p-0">
                                          <Edit className="w-4 h-4 text-blue-500" />
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="sm:max-w-[425px]">
                                        <DialogHeader>
                                          <DialogTitle>Change Member Role</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                          <div className="grid grid-cols-4 items-center gap-4">
                                            <Label htmlFor="role" className="text-right">
                                              Role
                                            </Label>
                                            <Select
                                              defaultValue={member.role}
                                              onValueChange={(value) => handleChangeRole(member, value)}
                                            >
                                              <SelectTrigger className="col-span-3">
                                                <SelectValue placeholder="Select role" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                <SelectItem value="owner">Owner</SelectItem>
                                                <SelectItem value="member">Member</SelectItem>
                                              </SelectContent>
                                            </Select>
                                          </div>
                                        </div>
                                        <DialogFooter>
                                          <DialogClose asChild>
                                            <Button type="button">
                                              Close
                                            </Button>
                                          </DialogClose>
                                        </DialogFooter>
                                      </DialogContent>
                                    </Dialog>
                                  )}
                                  {member.role !== "owner" && (
                                    <Button title="Remove member" variant="ghost" onClick={() => handleDeleteMember(member)} className="h-8 w-8 p-0">
                                      <Trash2 className="w-4 h-4 text-red-500" />
                                    </Button>
                                  )}
                                </div>
                              )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>



              <TabsContent value="resources" className="space-y-6">

                {isAdmin && (

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Upload File Section */}
                      <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <Upload className="w-5 h-5" />
                            Upload File
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {/* File preview section */}
                            {selectedFiles.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-900 dark:text-white">Selected Files ({selectedFiles.length})</h4>
                                <div className="space-y-2 max-h-40 overflow-y-auto p-2 border border-gray-200 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700">
                                  {selectedFiles.map((file, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 bg-white dark:bg-gray-600 rounded">
                                      <div className="flex items-center space-x-2">
                                        {file.preview ? (
                                          <img
                                            src={file.preview}
                                            alt={file.file.name}
                                            className="w-8 h-8 object-cover rounded"
                                          />
                                        ) : (
                                          <File className="w-5 h-5 text-gray-400" />
                                        )}
                                        <span className="text-sm truncate max-w-xs text-gray-900 dark:text-white">{file.file.name}</span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => handleRemoveFile(index)}
                                      >
                                        <X className="h-4 w-4 text-gray-500" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selectedFiles.length > 0 && (
                              <div className="flex items-center justify-center gap-3">
                                <Button
                                  type="button"
                                  onClick={handleFileUpload}
                                  disabled={uploading}
                                  className="w-full bg-tasksmate-gradient"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}`}
                                </Button>
                              </div>
                            )}

                            {/* File input area */}
                            <div className={`border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-500 transition-colors bg-gray-50/50 dark:bg-gray-700/50 ${selectedFiles.length > 0 ? 'mt-4' : ''}`}>
                              <Upload className="w-10 h-10 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">Drag and drop files here, or click to browse</p>
                              <input
                                type="file"
                                multiple
                                className="hidden"
                                id="file-upload"
                                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
                                accept="*/*"
                                disabled={uploading}
                              />
                              <div className="flex items-center justify-center gap-3">
                                <label
                                  htmlFor="file-upload"
                                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 cursor-pointer"
                                >
                                  Select Files
                                </label>
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Support for PDF, DOC, XLS, PNG, JPG files (Max 10MB)</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Add URL Section */}
                      <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                            <Link className="w-5 h-5" />
                            Add URL
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL Name</label>
                              <Input
                                type="text"
                                value={newUrlName}
                                onChange={(e) => setNewUrlName(e.target.value)}
                                placeholder="e.g., Design Mockups, API Documentation"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">URL</label>
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

                  )}

                {/* Resources List */}
                <Card className="glass border-0 shadow-tasksmate bg-white/80 dark:bg-gray-800/80">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
                      <FileText className="w-5 h-5" />
                      Project Resources
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">

                      {
                        errorLoadingResources ? (
                          <div className="text-center py-16 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                            {/* <AlertCircle className="w-12 h-12 text-green-600 mx-auto mb-4" /> */}
                            <p className="text-gray-500 dark:text-gray-400">Failed to load resources <br></br> {errorLoadingResources}</p>
                            <Button
                              className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                              onClick={fetchResources}
                            >
                              <RefreshCw className="w-4 h-4 mr-2" />
                              Try again
                            </Button>
                          </div>
                        ) :
                          (isLoadingResources ? (
                            <div className="text-center py-16 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                              <p className="text-gray-500 dark:text-gray-400">Loading resources...</p>
                            </div>
                            // <p className="text-gray-500">Loading resources...</p>
                          ) : resources.length == 0 ? (
                            <div className="text-center py-16 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                              <FileText className="w-12 h-12 text-green-600 mx-auto mb-4" />
                              <p className="text-gray-500 dark:text-gray-400">No resources found.</p>
                            </div>
                          ) :
                            resources.map((resource) => (
                              <div key={resource.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors bg-white/50 dark:bg-gray-800/50">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center overflow-hidden">
                                    {resource.type === 'file' ? (
                                      resource.url?.match(/\.(jpg|jpeg|png|gif|webp|ico)$/i) ? (
                                        <img
                                          src={resource.url}
                                          alt={resource.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            // Fallback to file icon if image fails to load
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = '';
                                            target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center"><File class="w-5 h-5 text-blue-600" /></div>';
                                          }}
                                        />
                                      ) : (
                                        <File className="w-5 h-5 text-blue-600" />
                                      )
                                    ) : (
                                      <ExternalLink className="w-5 h-5 text-blue-600" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{resource.name}</p>
                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
                                      onClick={(e) => {
                                        e.preventDefault();
                                        if (resource.url) {
                                          // Ensure the URL has a protocol
                                          let urlToOpen = resource.url;
                                          if (!/^https?:\/\//i.test(urlToOpen)) {
                                            urlToOpen = 'https://' + urlToOpen;
                                          }
                                          // Create a temporary anchor and trigger click
                                          const a = document.createElement('a');
                                          a.href = urlToOpen;
                                          a.target = '_blank';
                                          a.rel = 'noopener noreferrer';
                                          document.body.appendChild(a);
                                          a.click();
                                          document.body.removeChild(a);
                                        }
                                      }}
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
                                      <Download className="w-4 h-4" />
                                    </Button>
                                  )}



                                  {isAdmin && (
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
                                    )}

                                  {isAdmin && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        title="Delete"
                                        onClick={() => {
                                          setResourceToDelete(resource);
                                          setIsDeleteResourceOpen(true);
                                        }}
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    )}

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
                            ))
                          )}
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
              toast({
                title: "Updating project",
                description: "Please wait...",
              });
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
              setIsEditSheetOpen(false);
              toast({
                title: "Success",
                description: "Project has been successfully updated.",
                variant: "default"
              });
            } catch (e) {
              // no-op, errors are logged by api layer
              toast({
                title: "Failed to update project.",
                description: e.message,
                variant: "destructive"
              });
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
                  org_id={currentOrgId ?? ''}
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
                  toast({
                    title: "Deleting project",
                    description: "Please wait...",
                  });
                  await api.del(`${API_ENDPOINTS.PROJECTS}/${project.id}`, {});
                  toast({
                    title: "Success",
                    description: "Project deleted successfully",
                    variant: "default"
                  });
                  navigate(`/projects?org_id=${searchParams.get('org_id') ?? ''}`);
                } catch (e) {
                  toast({
                    title: "Failed to delete project",
                    description: e.message,
                    variant: "destructive"
                  });
                }
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
                  toast({
                    title: "Deleting resource",
                    description: "Please wait...",
                  });
                  await api.del(
                    `${API_ENDPOINTS.PROJECT_RESOURCES}/${resourceToDelete.id}?project_id=${project.id}`,
                    {}
                  );
                  toast({
                    title: "Success",
                    description: "Resource deleted successfully",
                    variant: "default"
                  });
                  setIsDeleteResourceOpen(false);
                  setResourceToDelete(null);
                  fetchResources();
                } catch (e) {
                  toast({
                    title: "Failed to delete resource",
                    description: e.message,
                    variant: "destructive"
                  });
                }
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

      {/* Add Member Modal */}
      <AddMemberDialog />
    </div>
  );
};

export default ProjectDetail;
