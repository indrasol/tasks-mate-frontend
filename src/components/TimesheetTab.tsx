// React and hooks
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DateRange } from 'react-day-picker';

// UI Components
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

// Icons
import { 
  AlertTriangle, 
  Calendar, 
  CheckCircle, 
  Clock, 
  Folder, 
  FolderMinus, 
  FolderPlus, 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  RotateCcw, 
  Save, 
  Timer, 
  Users, 
  X, 
  Loader2,
  TrendingUp,
  Trophy,
  Star,
  Target
} from 'lucide-react';

// Services and utilities
import { 
  getTeamTimesheetsSummary, 
  createOrUpdateDailyTimesheet,
  formatDateForAPI,
  TeamTimesheetUser,
  DailyTimesheetCreate
} from '@/services/dailyTimesheetService';
import { BackendOrgMember } from '@/types/organization';
import { deriveDisplayFromEmail } from '@/lib/projectUtils';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useProjectMembers, BackendProjectMember } from '@/hooks/useProjectMembers';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface TimesheetTabProps {
  orgId: string;
  projectsFromParent: any[];
  realOrgMembers: BackendOrgMember[];
  fetchProjects: () => void;
}

type TimesheetSortType = 'productivity' | 'alphabetical' | 'hours';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TimesheetTab: React.FC<TimesheetTabProps> = ({
  orgId,
  projectsFromParent,
  realOrgMembers,
  fetchProjects
}) => {
  // ============================================================================
  // AUTHENTICATION AND ROLE MANAGEMENT
  // ============================================================================
  
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);
  
  // Determine current user's role in the organization
  const currentUserOrgRole = useMemo(() => {
    if (!user || !realOrgMembers) return null;
    const currentUserMember = realOrgMembers?.find((m) => m.user_id === user.id);
    return currentUserMember?.role || null;
  }, [user, realOrgMembers]);


  // Role-based permission checks for timesheet editing only
  const canEditAllMemberTimesheets = useMemo(() => {
    return currentUserOrgRole === 'owner' || currentUserOrgRole === 'admin';
  }, [currentUserOrgRole]);

  const canEditOwnTimesheet = useMemo(() => {
    return currentUserOrgRole === 'member' || currentUserOrgRole === 'admin' || currentUserOrgRole === 'owner';
  }, [currentUserOrgRole]);

  // ============================================================================
  // REUSABLE ROLE AND PERMISSION COMPUTATIONS (OPTIMIZED)
  // ============================================================================

  // Pre-computed role checks to avoid repetition throughout the component
  const roleChecks = useMemo(() => {
    const isOrgOwner = currentUserOrgRole === 'owner';
    const isOrgAdmin = currentUserOrgRole === 'admin';
    const isOrgMember = currentUserOrgRole === 'member';
    const isOrgAdminOrOwner = isOrgAdmin || isOrgOwner;
    
    return {
      isOrgOwner,
      isOrgAdmin,
      isOrgMember,
      isOrgAdminOrOwner
    };
  }, [currentUserOrgRole]);

  // Project-specific role detection functions
  const getProjectRole = useCallback((projectId: string) => {
    if (!user) return null;
    
    const project = projects?.find(p => p.id === projectId);
    if (!project) return null;
    
    // Check if user is the project owner
    if (project?.owner === user.id) {
      return 'owner';
    }
    
    // Check if user is a project member
    if (project?.members?.includes(user.id)) {
      return 'member';
    }
    
    // If user is org admin/owner, they have admin access to all projects
    if (roleChecks?.isOrgAdminOrOwner) {
      return 'admin';
    }
    
    return null;
  }, [user, projects, roleChecks.isOrgAdminOrOwner]);

  const isProjectOwner = useCallback((projectId: string) => {
    return getProjectRole(projectId) === 'owner';
  }, [getProjectRole]);

  const isProjectMember = useCallback((projectId: string) => {
    const role = getProjectRole(projectId);
    return role === 'member' || role === 'owner';
  }, [getProjectRole]);

  const isProjectAdmin = useCallback((projectId: string) => {
    const role = getProjectRole(projectId);
    return role === 'admin' || role === 'owner';
  }, [getProjectRole]);

  // Helper function to get user's role in a specific project (legacy - use getProjectRole instead)
  const getUserProjectRoleForProject = useMemo(() => {
    return (projectId: string) => {
      return getProjectRole(projectId);
    };
  }, [getProjectRole]);



  // Check if user can view timesheet data for projects they're part of (PROJECT-SPECIFIC)
  const canViewProjectTimesheets = useMemo(() => {
    return (projectId: string) => {
      if (!user) return false;
      
      // Get user's effective role in this specific project
      const projectRole = getUserProjectRoleForProject(projectId);
      // Use pre-computed role check
      
      // Determine effective project role: Org Admin/Owner = Project Admin/Owner
      const effectiveProjectRole = roleChecks.isOrgAdminOrOwner ? 'admin' : projectRole;
      
      // Project Owner/Admin/Member: Can view timesheets for projects they have roles in
      if (effectiveProjectRole === 'owner' || effectiveProjectRole === 'admin' || effectiveProjectRole === 'member') {
        return true;
      }
      
      // No project role: No access to view project timesheets
      return false;
    };
  }, [user, getUserProjectRoleForProject, roleChecks.isOrgAdminOrOwner]);
  // ============================================================================
  // REUSABLE COMPONENTS
  // ============================================================================

  // Reusable Timesheet Textarea Component
  const TimesheetTextarea = ({ 
    user, 
    projectId, 
    type, 
    color, 
    tasks, 
    placeholder 
  }: {
    user: any;
    projectId: string;
    type: 'in_progress' | 'blocked' | 'completed';
    color: 'blue' | 'red' | 'green';
    tasks: any[];
    placeholder: string;
  }) => {
    const canEdit = canEditUserTimesheet(user.user_id, projectId);
    const isRestricted = isDateRestrictedForEditing && currentUserOrgRole === 'member';
    
    const getDefaultValue = () => {
      let content = '';
      tasks?.forEach((task: any) => {
        content += `• ${task.title}${task.project ? ` (${task.project})` : ''}`;
        if (type === 'blocked' && task.blocked_reason) {
          content += ` - ${task.blocked_reason}`;
        } else if ((type === 'in_progress' || type === 'completed') && task.hours_logged) {
          content += ` - ${task.hours_logged}h`;
        }
        content += '\n';
      });
      return content.trim();
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (canEdit) {
        e.target.parentElement?.classList.add('ring-2', `ring-${color}-500`, 'ring-opacity-50');
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (canEdit) {
        e.target.parentElement?.classList.remove('ring-2', `ring-${color}-500`, 'ring-opacity-50');
        saveTimesheetData(user.user_id, type, e.target.value, projectId);
      }
    };

    const getPlaceholder = () => {
      if (canEdit) {
        return placeholder;
      } else if (isRestricted) {
        return "You cannot edit future dates";
      } else {
        return "You don't have permission to edit this timesheet data";
      }
    };

    return (
      <div className={`bg-white dark:bg-gray-800 rounded-lg border-${color}-500 shadow-sm hover:shadow-md transition-all duration-200 ${canEdit ? 'cursor-text' : 'cursor-not-allowed opacity-60'}`}>
        <textarea
          className={`w-full h-32 p-3 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 ${!canEdit ? 'cursor-not-allowed' : ''}`}
          placeholder={getPlaceholder()}
          readOnly={!canEdit}
          defaultValue={getDefaultValue()}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
        <div className={`px-3 py-2 bg-${color}-50 dark:bg-${color}-900/30 rounded-b-lg border-t border-${color}-200 dark:border-${color}-600`}>
          <div className="flex items-center justify-end text-xs">
            <Button
              variant="ghost"
              size="sm"
              className={`h-5 px-2 text-xs text-${color}-600 hover:bg-${color}-100 dark:text-${color}-400 dark:hover:bg-${color}-900/50`}
              onClick={() => {/* Future enhancement */}}
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </div>
    );
  };

  // Reusable Member Filtering Logic
  const getFilteredMembers = useCallback(() => {
    if (!realOrgMembers) return [];
    
    // Check if user has any project roles
    const hasAnyProjectRole = projects?.some(project => getProjectRole(project.id) !== null);
    const isAnyProjectOwner = projects?.some(project => isProjectOwner(project.id));
    
    return realOrgMembers?.filter(member => {
      // Org Admins/Owners: Can see all members (they are project admins/owners in all projects)
      if (roleChecks.isOrgAdminOrOwner) {
        return true;
      }
      
      // Project Owners: Can see all members in their projects
      if (isAnyProjectOwner) {
        return true;
      }
      
      // Project Members: Can see all members in projects they're part of
      if (hasAnyProjectRole) {
        return true;
      }
      
      // Non-project members: Can only see themselves
      return member.user_id === user?.id;
    })?.sort((a, b) => a.displayName?.localeCompare(b.displayName));
  }, [realOrgMembers, roleChecks.isOrgAdminOrOwner, projects, getProjectRole, isProjectOwner, user?.id]);


  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Filter and Search State
  const [timesheetSearchQuery, setTimesheetSearchQuery] = useState('');
  const [selectedTimesheetUsers, setSelectedTimesheetUsers] = useState<string[]>([]);
  const [selectedTimesheetProjects, setSelectedTimesheetProjects] = useState<string[]>([]);
  const [timesheetDateRange, setTimesheetDateRange] = useState<DateRange | undefined>(undefined);
  const [tempTimesheetDateRange, setTempTimesheetDateRange] = useState<DateRange | undefined>(undefined);
  const [isTimesheetDatePopoverOpen, setIsTimesheetDatePopoverOpen] = useState(false);

  // UI State
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [timesheetSort, setTimesheetSort] = useState<TimesheetSortType>('productivity');
  const [selectedTimesheetDate, setSelectedTimesheetDate] = useState<Date | undefined>(new Date());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

  // Check if current date is restricted for editing (members can edit today and previous days, but not future dates)
  const isDateRestrictedForEditing = useMemo(() => {
    if (!selectedTimesheetDate) return false;
    
    // Members can edit today and previous days, but not future dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(selectedTimesheetDate);
    selectedDate.setHours(0, 0, 0, 0);
    
    // Restrict only future dates (dates after today)
    return selectedDate > today;
  }, [selectedTimesheetDate]);

  // Reusable Project Badge Logic
  const getProjectBadges = useCallback((projectId: string) => {
    const projectRole = getUserProjectRoleForProject(projectId);
    const effectiveProjectRole = roleChecks.isOrgAdminOrOwner ? 'admin' : projectRole;
    
    const badges = [];
    
    if (effectiveProjectRole === 'owner') {
      badges.push(
        <Badge key="owner" variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
          Project Owner
        </Badge>
      );
    } else if (effectiveProjectRole === 'admin') {
      badges.push(
        <Badge key="admin" variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          Project Admin
        </Badge>
      );
    } else if (effectiveProjectRole === 'member') {
      badges.push(
        <Badge key="member" variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
          Project Member
        </Badge>
      );
    }
    
    if (effectiveProjectRole === 'member' && isDateRestrictedForEditing) {
      badges.push(
        <Badge key="restricted" variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
          Future Dates Restricted
        </Badge>
      );
    }
    
    return badges;
  }, [getUserProjectRoleForProject, roleChecks.isOrgAdminOrOwner, isDateRestrictedForEditing]);

  // Check if user can edit a specific user's timesheet data (PROJECT-SPECIFIC PERMISSIONS)
  const canEditUserTimesheet = useMemo(() => {
    return (targetUserId: string, projectId?: string) => {
      if (!user || !projectId) return false;
      
      // Get user's effective role in this specific project
      const projectRole = getUserProjectRoleForProject(projectId);
      // Use pre-computed role check
      
      // Determine effective project role: Org Admin/Owner = Project Admin/Owner
      const effectiveProjectRole = roleChecks.isOrgAdminOrOwner ? 'admin' : projectRole;
      
      // Project Owner/Admin: Can edit all users' timesheets in this project (no date restrictions)
      if (effectiveProjectRole === 'owner' || effectiveProjectRole === 'admin') {
        return true;
      }
      
      // Project Member: Can only edit their own timesheet, but with date restrictions
      if (effectiveProjectRole === 'member' && targetUserId === user.id) {
        // Check date restrictions for members
        if (isDateRestrictedForEditing) {
          return false; // Members can't edit today's or future timesheets
        }
        return true; // Members can edit their own previous day timesheets
      }
      
      // No project role or unknown role: No access
      return false;
    };
  }, [user, getUserProjectRoleForProject, roleChecks.isOrgAdminOrOwner, isDateRestrictedForEditing]);

  // Modal State (for future use)
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [selectedUserForEntry, setSelectedUserForEntry] = useState<string>('');

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Productivity and Scoring Functions
  const calculateProductivityScore = (user: any) => {
    const completed = (user.completed || []).length;
    const inProgress = (user.in_progress || []).length;
    const blockers = (user.blockers || []).length;
    
    return Math.max(0, Math.min(100, (completed * 3 + inProgress * 1 - blockers * 2)));
  };

  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: Trophy };
    if (score >= 60) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Star };
    if (score >= 40) return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Target };
    return { level: 'Needs Focus', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle };
  };

  // ============================================================================
  // HOOKS AND DATA FETCHING
  // ============================================================================

// useEffect(() => {
//   console.log('projects', projectsFromParent, projects);
//   setProjects(projectsFromParent);
// }, [projectsFromParent,projects]);


  // Auto-update to today's date daily
  useEffect(() => {
    const updateToToday = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      
      const currentSelected = selectedTimesheetDate ? new Date(selectedTimesheetDate) : null;
      if (currentSelected) {
        currentSelected.setHours(0, 0, 0, 0);
      }
      
      // Only update if we're not already on today's date
      if (!currentSelected || currentSelected.getTime() !== today.getTime()) {
        setSelectedTimesheetDate(today);
      }
    };

    // Update immediately
    updateToToday();

    // Set up daily auto-update at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    const timeoutId = setTimeout(() => {
      updateToToday();
      
      // Set up recurring daily update
      const intervalId = setInterval(updateToToday, 24 * 60 * 60 * 1000); // 24 hours
      
      return () => clearInterval(intervalId);
    }, msUntilMidnight);

    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch daily timesheets data
  const { 
    data: dailyTimesheets, 
    isFetching: isTimesheetsFetching, 
    isError: isTimesheetsError, 
    error: timesheetsError, 
    refetch: refetchTimesheets 
  } = useQuery({
    queryKey: ['daily-timesheets', orgId, selectedTimesheetDate?.toISOString(), selectedTimesheetProjects],
    enabled: !!orgId && orgId.length > 0 && !!selectedTimesheetDate,
    queryFn: () => getTeamTimesheetsSummary(
      orgId, 
      formatDateForAPI(selectedTimesheetDate!),
      selectedTimesheetProjects.length > 0 ? selectedTimesheetProjects : undefined
    ),
  });

  // Update projects state when dailyTimesheets data changes
  useEffect(() => {
    if (dailyTimesheets?.projects && dailyTimesheets.projects.length > 0) {
      console.log('Setting projects from dailyTimesheets:', dailyTimesheets.projects);
      setProjects(dailyTimesheets.projects.map((project: any) => ({ 
        id: project.project_id, 
        name: project.name || project.project_name, 
        members: project.team_members ?? [], 
        owner: project.owner ?? "" 
      })));
      setIsProjectsLoading(false);
    } else if (projectsFromParent && projectsFromParent.length > 0) {
      // Fallback to projects from parent if no projects in timesheet data
      console.log('Setting projects from parent:', projectsFromParent);
      setProjects(projectsFromParent);
      setIsProjectsLoading(false);
    } else if (!isProjectsLoading && projects.length === 0) {
      // Only fetch if we're not already loading and have no projects
      console.log('No projects found, fetching...');
      setIsProjectsLoading(true);
      fetchProjects();
    }
  }, [dailyTimesheets?.projects, projectsFromParent, isProjectsLoading, projects.length, fetchProjects]);

  // Handle loading timeout - prevent infinite loading states
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (isProjectsLoading) {
      timeoutId = setTimeout(() => {
        console.warn('Projects loading timeout - setting loading to false');
        setIsProjectsLoading(false);
      }, 10000); // 10 second timeout
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isProjectsLoading]);

  // ============================================================================
  // COMPUTED VALUES (useMemo)
  // ============================================================================

  // Filter and process timesheet users based on role permissions
  const filteredTimesheetUsers = useMemo(() => {
    // Get users from the real API response - support both old and new format
    let users: TeamTimesheetUser[] = ((dailyTimesheets as any)?.users ?? []) as TeamTimesheetUser[];
    
    // If we have the new projects structure, we can use that too
    const projectsTimesheet = ((dailyTimesheets as any)?.projects ?? []) as any[];
    
    // Log the data structure for debugging
    if (dailyTimesheets) {
      console.log('Daily timesheets data:', dailyTimesheets);
      console.log('Users count:', users.length);
      console.log('Projects count:', projectsTimesheet.length);
    }
    
    // Check if selected date is today (for empty columns)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = selectedTimesheetDate ? new Date(selectedTimesheetDate) : today;
    selectedDate.setHours(0, 0, 0, 0);
    const isToday = selectedDate.getTime() === today.getTime();
    
    // If no real data and it's today, show some default users for the organization
    if (users.length === 0 && isToday) {
      // Get users from real org members for empty timesheet display
      let availableMembers = realOrgMembers;
      
      // Apply role-based filtering for available members
      if (currentUserOrgRole === 'member') {
        // Org Members can only see themselves
        availableMembers = realOrgMembers?.filter(member => member.user_id === user?.id);
      } else if (currentUserOrgRole === 'admin') {
        // Admins can see all members
        availableMembers = realOrgMembers;
      } else if (currentUserOrgRole === 'owner') {
        // Owners can see all members
        availableMembers = realOrgMembers;
      } else {
        // No role or unknown role - show no members
        availableMembers = [];
      }
      
      users = availableMembers.slice(0, 10)?.map(member => ({
        user_id: String(member.user_id),
        name: member.displayName,
        email: member.email || '',
        designation: member.designation,
        avatar_initials: member.initials,
        role: member.role || 'member',
        total_hours_today: 0,
        total_hours_week: 0,
        in_progress: [],
        completed: [],
        blockers: []
      }));
    }
    
    // Apply project-specific role-based filtering to existing users
    // Note: This filtering will be further refined per project in usersByProject
    // For now, we show all users and let project-specific filtering handle the details
    users = users;
    
    // Apply member filter first
    if (selectedTimesheetUsers.length > 0) {
      users = users?.filter(user => selectedTimesheetUsers?.includes(String(user.user_id)));
    }
    
    // Apply search filter
    if (timesheetSearchQuery) {
    const q = timesheetSearchQuery.toLowerCase();
      users = users?.filter((u) => {
      const name = String(u.name || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const role = String(u.role || '').toLowerCase();
      const designation = String(u.designation || '').toLowerCase();
      return [name, email, role, designation]?.some(v => v?.includes(q));
    });
    }
    
    return users;
  }, [dailyTimesheets, timesheetSearchQuery, selectedTimesheetUsers, selectedTimesheetDate?.getTime(), realOrgMembers, currentUserOrgRole, user, projects]);

  // Check if selected date is today
  const isToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = selectedTimesheetDate ? new Date(selectedTimesheetDate) : today;
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate.getTime() === today.getTime();
  }, [selectedTimesheetDate?.getTime()]);

  // Sort timesheet users based on selected criteria
  const sortedTimesheetUsers = useMemo(() => {
    const users = [...(filteredTimesheetUsers || [])];
    
    switch (timesheetSort) {
      case 'productivity':
        return users?.sort((a, b) => calculateProductivityScore(b) - calculateProductivityScore(a));
      case 'alphabetical':
        return users?.sort((a, b) => (a.name || '')?.localeCompare(b.name || ''));
      case 'hours':
        return users?.sort((a, b) => (b.total_hours_today || 0) - (a.total_hours_today || 0));
      default:
        return users;
    }
  }, [filteredTimesheetUsers, timesheetSort]);

  // Organize users by their primary project with role-based filtering
  const usersByProject = useMemo(() => {
    const projectGroups: Record<string, any[]> = {};
    
    console.log('usersByProject - projects:', projects);
    console.log('usersByProject - sortedTimesheetUsers:', sortedTimesheetUsers);
    
    // First, ensure all projects the current user has access to are included
    projects?.forEach(project => {
      console.log('Processing project:', project);
      if (canViewProjectTimesheets(project.id)) {
        // Apply project filter: if projects are selected, only show those projects
        // if (selectedTimesheetProjects.length === 0 || selectedTimesheetProjects?.includes(project.id)) {
          // Initialize project group even if no users have timesheet data yet
          if (!projectGroups[project.name]) {
            projectGroups[project.name] = [];
          }
        // }
      }
    });
    
    // Then, add users to their respective projects based on timesheet data
    sortedTimesheetUsers?.forEach(user => {
      // Get all projects from user's tasks
      const userProjects = new Set<string>();
      [...(user.in_progress || []), ...(user.completed || []), ...(user.blockers || [])]?.forEach(task => {
        if (task.project) {
          userProjects.add(task.project);
        }
      });
      
      console.log(`User ${user.name} has projects:`, Array.from(userProjects));
      
      // If user has timesheet data, add them to those projects
      if (userProjects.size > 0) {
        for (const projectName of userProjects) {
          console.log(`Adding user to project: ${projectName}`);
          if (!projectGroups[projectName]) {
            projectGroups[projectName] = [];
          }
          projectGroups[projectName].push(user);
        }
      } else {
        // If user has no timesheet data, add them to projects they have access to
        projects?.forEach(project => {
          if (canViewProjectTimesheets(project.id) && !projectGroups[project.name]?.some(u => u.user_id === user.user_id)) {
            console.log(`Adding user to accessible project: ${project.name}`);
            projectGroups[project.name].push(user);
          }
        });
      }
    });
    
    console.log('Final projectGroups:', projectGroups);
    return projectGroups;
  }, [sortedTimesheetUsers, projects, canViewProjectTimesheets, selectedTimesheetProjects]);

  

  // Project Management Functions
  const toggleProject = (projectName: string) => {
    setExpandedProjects(prev => {
      const newSet = new Set(prev);
      if (newSet.has(projectName)) {
        newSet.delete(projectName);
      } else {
        newSet.add(projectName);
      }
      return newSet;
    });
  };

  const toggleAllProjects = (expand: boolean) => {
    if (expand) {
      setExpandedProjects(new Set(Object.keys(usersByProject)));
    } else {
      setExpandedProjects(new Set());
    }
  };

  const getUserPrimaryProject = (user: TeamTimesheetUser): string => {
    // Try to get project from user's tasks
    const allTasks = [...(user.in_progress || []), ...(user.completed || []), ...(user.blockers || [])];
    if (allTasks.length > 0) {
      // Find the most common project
      const projectCounts: Record<string, number> = {};
      allTasks?.forEach(task => {
        if (task.project) {
          projectCounts[task.project] = (projectCounts[task.project] || 0) + 1;
        }
      });
      
      const mostCommonProject = Object.keys(projectCounts).reduce((a, b) => 
        projectCounts[a] > projectCounts[b] ? a : b
      );
      
      // Find the project ID by name
      const project = projects?.find(p => p.name === mostCommonProject);
      if (project) return project.id;
    }
    
    // Fallback: use first available project or create a default one
    if (projects.length > 0) {
      return projects[0].id;
    }
    
    // Last resort: use a default project ID
    return 'default-project';
  };

  // Data Management Functions
  const saveTimesheetData = async (
    userId: string,
    field: 'in_progress' | 'completed' | 'blocked',
    value: string,
    projectId?: string
  ) => {
    if (!selectedTimesheetDate || !orgId || orgId.length === 0 || !userId || userId.trim().length === 0 || !field || field.trim().length === 0 || !value || value.trim().length === 0) return;

    // If no projectId provided, find the user to get their primary project
    let actualProjectId = projectId;
    if (!actualProjectId) {
      const user = filteredTimesheetUsers?.find(u => u.user_id === userId);
      if (!user) return;
      actualProjectId = getUserPrimaryProject(user);
    }

    // Check if user has permission to edit this user's timesheet data
    if (!canEditUserTimesheet(userId, actualProjectId)) {
      // Check if it's a date restriction issue
      if (isDateRestrictedForEditing && currentUserOrgRole === 'member') {
        toast({
          title: 'Date Restricted',
          description: 'Project members cannot edit future dates',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to edit this project\'s timesheet data',
          variant: 'destructive'
        });
      }
      return;
    }

    try {
      const timesheetData: DailyTimesheetCreate = {
        org_id: orgId,
        project_id: actualProjectId,
        user_id: userId,
        entry_date: formatDateForAPI(selectedTimesheetDate),
        [field]: value
      };    

      toast({
        title: 'Saving timesheet data...',
        description: 'Please wait while we save the timesheet data',
        variant: 'default'
      });

    // Get Response and include as soft update instead of refetch
    const response = await createOrUpdateDailyTimesheet(timesheetData);
    if (response.success) {
        toast({
            title: 'Timesheet data saved successfully',
            description: 'Timesheet data saved successfully',
            variant: 'default'
        });
        //   // Refetch the data to show updated information
        refetchTimesheets();
    } else {
        toast({
            title: 'Failed to save timesheet data',
            description: 'Please try again',
            variant: 'destructive'
        });
    }
    } catch (error) {
      console.error('Failed to save timesheet data:', error);
      toast({
        title: 'Error',
        description: 'Failed to save timesheet data. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const clearTimesheetFilters = () => {
    setSelectedTimesheetUsers([]);
    setSelectedTimesheetProjects([]);
    setTimesheetDateRange(undefined);
    setTempTimesheetDateRange(undefined);
    // Keep selectedTimesheetDate as is - it's just for display
    // setTimesheetSearchQuery('');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex w-full h-full relative">
      {/* Collapsible Filter Sidebar */}
      <div className={`${isFilterSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0`}>
        <div className="p-4 space-y-4 h-full overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Filters & Settings</h3>
            <Button variant="ghost" size="sm" onClick={() => setIsFilterSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Date Range</label>
            <Popover open={isTimesheetDatePopoverOpen} onOpenChange={setIsTimesheetDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant={timesheetDateRange?.from ? 'default' : 'outline'} className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  {timesheetDateRange?.from ? 'Custom Range' : 'All Time'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-3">
                  <CalendarComponent
                    mode="range"
                    defaultMonth={tempTimesheetDateRange?.from}
                    selected={tempTimesheetDateRange}
                    onSelect={(range) => setTempTimesheetDateRange(range ?? undefined)}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                  <div className="flex justify-between">
                    <Button size="sm" variant="outline" onClick={() => { setTimesheetDateRange(undefined); setTempTimesheetDateRange(undefined); setIsTimesheetDatePopoverOpen(false); }}>Reset</Button>
                    <Button size="sm" onClick={() => { setTimesheetDateRange(tempTimesheetDateRange); setIsTimesheetDatePopoverOpen(false); }}>Apply</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Projects Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Projects</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Folder className="w-4 h-4 mr-2" />
                    {selectedTimesheetProjects.length ? `${selectedTimesheetProjects.length} Selected` : 'All Projects'}
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-72 overflow-auto">
                {/* Loading State */}
                {isProjectsLoading && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading projects...</span>
                  </div>
                )}
                
                {/* Projects List */}
                {!isProjectsLoading && (projects || [])
                 ?.filter(project => {
                    // Apply role-based filtering for timesheet visibility
                    if (currentUserOrgRole === 'owner') {
                      return true; // Owners can see all project timesheets
                    } else if (currentUserOrgRole === 'admin') {
                      return true; // Admins can see all project timesheets
                    } else if (currentUserOrgRole === 'member') {
                      // Members can see timesheets for projects they're members of
                      return project?.members?.includes(user?.id) || false;
                    }
                    return false; // No role or unknown role
                  })
                  ?.sort((a, b) => a.name?.localeCompare(b.name))
                  ?.map((p) => (
                  <DropdownMenuCheckboxItem
                    key={p.id}
                    checked={selectedTimesheetProjects?.includes(p.id)}
                    onCheckedChange={(checked) => {
                      setSelectedTimesheetProjects(checked ? [...selectedTimesheetProjects, p.id] : selectedTimesheetProjects?.filter(x => x !== p.id));
                    }}
                    className="cursor-pointer"
                  >
                    {p.name}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Members Filter */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Team Members</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {selectedTimesheetUsers.length ? `${selectedTimesheetUsers.length} Selected` : 'All Members'}
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-72 overflow-auto">
                {getFilteredMembers()
                  ?.map((m) => (
                  <DropdownMenuCheckboxItem
                    key={m.user_id}
                    checked={selectedTimesheetUsers?.includes(String(m.user_id))}
                    onCheckedChange={(checked) => {
                      const id = String(m.user_id);
                      setSelectedTimesheetUsers(checked ? [...selectedTimesheetUsers, id] : selectedTimesheetUsers?.filter(x => x !== id));
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
                      </Avatar>
                      {m.displayName}
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Sort Options */}
          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Sort Tasks By</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    {timesheetSort === 'productivity' ? 'Productivity' : timesheetSort === 'alphabetical' ? 'Alphabetical' : 'Hours'}
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuCheckboxItem checked={timesheetSort === 'productivity'} onCheckedChange={() => setTimesheetSort('productivity')}>
                  <Trophy className="w-4 h-4 mr-2" />
                  Productivity Score
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={timesheetSort === 'alphabetical'} onCheckedChange={() => setTimesheetSort('alphabetical')}>
                  <Users className="w-4 h-4 mr-2" />
                  Alphabetical
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={timesheetSort === 'hours'} onCheckedChange={() => setTimesheetSort('hours')}>
                  <Clock className="w-4 h-4 mr-2" />
                  Hours Today
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* View Options */}
          <div className="space-y-3 pt-2 border-t">
            <Button
              variant={showCompletedTasks ? 'default' : 'outline'}
              onClick={() => setShowCompletedTasks(!showCompletedTasks)}
              className="w-full justify-start"
            >
              {showCompletedTasks ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
              Show Completed Tasks
            </Button>
            
            <Button variant="outline" onClick={clearTimesheetFilters} className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Clear All Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Main Kanban Board */}
      <div className="flex-1 flex flex-col h-full">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-center gap-2">
              <span>Team Members:</span>
              <Badge variant="secondary">{sortedTimesheetUsers.length}</Badge>
            </div>
            
            {/* Role Indicator */}
            {/* {currentUserOrgRole && (
              <div className="flex items-center gap-2">
                <span>Your Role:</span>
                <Badge 
                  variant={currentUserOrgRole === 'owner' ? 'default' : currentUserOrgRole === 'admin' ? 'secondary' : 'outline'}
                  className={currentUserOrgRole === 'owner' ? 'bg-purple-600 text-white' : currentUserOrgRole === 'admin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}
                >
                  {currentUserOrgRole.charAt(0).toUpperCase() + currentUserOrgRole.slice(1)}
                </Badge>
              </div>
            )} */}
            
            {/* Projects Status & Refresh */}
            {/* <div className="flex items-center gap-3">
              {isProjectsLoading && (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">Loading projects...</span>
                </div>
              )}
              
              {!isProjectsLoading && projects.length === 0 && (
                <Button 
                  onClick={fetchProjects}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  Load Projects
                </Button>
              )}
              
              {!isProjectsLoading && projects.length > 0 && (
                <Button 
                  onClick={fetchProjects}
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <FolderPlus className="w-4 h-4" />
                  Refresh Projects
                </Button>
              )}
            </div> */}

            {/* Permission Summary */}
            {/* {currentUserOrgRole && (
              <div className="flex items-center gap-2">
                <span>Timesheet Permissions:</span>
                <div className="flex gap-1">
                  {roleChecks.isOrgAdminOrOwner && (
                    <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                      Project Admin/Owner (All Projects)
                    </Badge>
                  )}
                  {roleChecks.isOrgMember && projects?.some(project => isProjectOwner(project.id)) && (
                    <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                      Project Owner (Specific Projects)
                    </Badge>
                  )}
                  {roleChecks.isOrgMember && !projects?.some(project => isProjectOwner(project.id)) && projects?.some(project => isProjectMember(project.id)) && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      Project Member
                    </Badge>
                  )}
                  {roleChecks.isOrgMember && !projects?.some(project => isProjectOwner(project.id)) && !projects?.some(project => isProjectMember(project.id)) && (
                    <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200">
                      No Project Access
                    </Badge>
                  )}
                </div>
              </div>
            )} */}
              
            {/* Date Selector */}
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 border-indigo-200 dark:border-indigo-700 hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-800/40 dark:hover:to-purple-800/40 transition-all duration-200"
                >
                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mr-2" />
                  <span className="text-indigo-900 dark:text-indigo-100 font-medium">
                    {selectedTimesheetDate ? selectedTimesheetDate.toLocaleDateString('en-US', { 
                      weekday: 'short',
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Select Date'}
                  </span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-3">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Select Display Date
                  </div>
                  <CalendarComponent
                    mode="single"
                    selected={selectedTimesheetDate}
                    onSelect={(date) => setSelectedTimesheetDate(date ?? new Date())}
                    className="rounded-md border"
                    disabled={(date) => date > new Date()}
                  />
                  <div className="flex justify-between">
                    <Button size="sm" variant="outline" onClick={() => setSelectedTimesheetDate(new Date())}>
                      Today
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedTimesheetDate(undefined)}>
                      Clear
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            {/* Team Members Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border-emerald-200 dark:border-emerald-700 hover:from-emerald-100 hover:to-teal-100 dark:hover:from-emerald-800/40 dark:hover:to-teal-800/40 transition-all duration-200"
                >
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mr-2" />
                  <span className="text-emerald-900 dark:text-emerald-100 font-medium">
                    {selectedTimesheetUsers.length === 0 
                      ? 'All Members'
                      : selectedTimesheetUsers.length === 1 
                        ? (() => {
                            const selectedMember = realOrgMembers?.find(m => String(m.user_id) === selectedTimesheetUsers[0]);
                            return selectedMember?.displayName || 'Selected Member';
                          })()
                        : `${selectedTimesheetUsers.length} Members`
                    }
                  </span>
                  <ChevronRight className="w-3 h-3 ml-1 text-emerald-600 dark:text-emerald-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 max-h-80 overflow-auto" align="start">
                <div className="p-2">
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                    Filter Team Members
                  </div>
                  <div className="space-y-1">
                    {/* Select All / Clear All */}
                    <div className="flex gap-2 mb-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTimesheetUsers([])}
                        className="h-7 px-2 text-xs"
                      >
                        All Members
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTimesheetUsers(realOrgMembers?.map(m => String(m.user_id)))}
                        className="h-7 px-2 text-xs"
                      >
                        Select All
                      </Button>
                    </div>
                    
                    {/* Member List */}
                    {getFilteredMembers()
                      ?.map((m) => (
                      <DropdownMenuCheckboxItem
                        key={m.user_id}
                        checked={selectedTimesheetUsers?.includes(String(m.user_id))}
                        onCheckedChange={(checked) => {
                          const id = String(m.user_id);
                          setSelectedTimesheetUsers(checked ? [...selectedTimesheetUsers, id] : selectedTimesheetUsers?.filter(x => x !== id));
                        }}
                        className="cursor-pointer"
                      >
                        <div className="flex items-center gap-3 w-full">
                          <Avatar className="w-7 h-7 flex-shrink-0">
                            <AvatarFallback className="text-xs bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
                              {m.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {m.displayName}
                            </div>
                            <div className="text-xs text-gray-500 truncate">
                              {m.email}
                            </div>
                          </div>
                        </div>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            {/* Toggle All Projects */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllProjects(true)}
                className="h-8 px-2 text-xs bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 border-blue-200 dark:border-blue-700 hover:from-blue-100 hover:to-indigo-100"
              >
                <FolderPlus className="w-3 h-3 mr-1 text-blue-600 dark:text-blue-400" />
                Expand All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleAllProjects(false)}
                className="h-8 px-2 text-xs bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 border-gray-200 dark:border-gray-700 hover:from-gray-100 hover:to-slate-100"
              >
                <FolderMinus className="w-3 h-3 mr-1 text-gray-600 dark:text-gray-400" />
                Collapse All
              </Button>
            </div>

            <Button variant="outline" size="sm" onClick={() => refetchTimesheets()} disabled={isTimesheetsFetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isTimesheetsFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {/* {isTimesheetsFetching && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">Loading team insights...</p>
              <p className="text-sm text-gray-500">Organizing tasks by status</p>
            </div>
          </div>
        )} */}

        {/* Project-based Member Cards */}
        {(
          <div className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto thin-scroll">
              <div className="p-4 pb-8 space-y-6">
                {/* Loading State for Projects */}
                {isProjectsLoading && (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="text-gray-600 dark:text-gray-400">Loading projects...</span>
                    </div>
                  </div>
                )}
                
                {/* No Projects State */}
                {!isProjectsLoading && projects.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <FolderMinus className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No Projects Found</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        No projects are available for timesheet management.
                      </p>
                      <Button 
                        onClick={fetchProjects}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <FolderPlus className="w-4 h-4" />
                        Refresh Projects
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Projects List */}
                {!isProjectsLoading && projects.length > 0 && Object.entries(usersByProject)
                  ?.sort(([a], [b]) => a?.localeCompare(b))
                  ?.map(([projectName, projectUsers]) => {
                    // Get the actual project ID from the project name
                    const project = projects?.find(p => p.name === projectName);
                    const projectId = project?.id || '';
                    
                    return (
                    <div key={projectName} className="flex flex-col">
                      {/* Project Header - Sticky when expanded */}
                      <div className={`bg-gradient-to-r from-slate-100 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm ${expandedProjects.has(projectName) ? 'sticky top-0 z-10 mb-3' : 'mb-3'}`}>
                        <button
                          onClick={() => toggleProject(projectName)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {expandedProjects.has(projectName) ? (
                                <ChevronDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                              )}
                              <Folder className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div className="text-left">
                              <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">
                                {projectName}
                              </h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {projectUsers.length} team member{projectUsers.length !== 1 ? 's' : ''}
                              </p>
                              {/* Project-specific restriction badges */}
                              <div className="flex gap-1 mt-1">
                                {getProjectBadges(projectId)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            {/* Date Badge */}
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-700">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                <div className="text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                  {(selectedTimesheetDate || new Date()).toLocaleDateString('en-US', { 
                                    weekday: 'short',
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  })}
                                </div>
                              </div>
                            </div>
                            
                            {/* Team Member Avatars with Hover Details */}
                            <div className="flex -space-x-2">
                              {projectUsers.slice(0, 3)?.map((user, idx) => (
                                <HoverCard key={idx}>
                                  <HoverCardTrigger asChild>
                                    <Avatar className="w-8 h-8 border-2 border-white dark:border-gray-800 cursor-pointer hover:scale-110 transition-transform">
                                      <AvatarFallback className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                        {(user.avatar_initials || String(user.name || user.user_id).slice(0,2)).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-72 p-4 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="w-12 h-12">
                                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold">
                                          {(user.avatar_initials || String(user.name || user.user_id).slice(0,2)).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1">
                                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                                          {user.name || deriveDisplayFromEmail(user.email || user.user_id).displayName}
                                        </h4>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                          {user.designation || 'Team Member'}
                                        </p>
                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                          {user.email || user.user_id}
                                        </p>
                                      </div>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              ))}
                              {projectUsers.length > 3 && (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 border-2 border-white dark:border-gray-800 flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                                      <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                                        +{projectUsers.length - 3}
                                      </span>
                                    </div>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-72 p-3 bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div className="space-y-2">
                                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                                        Additional Team Members ({projectUsers.length - 3})
                                      </div>
                                      <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto thin-scroll">
                                        {projectUsers.slice(3)?.map((user, idx) => (
                                          <div key={idx} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                            <Avatar className="w-8 h-8 flex-shrink-0">
                                              <AvatarFallback className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                                {(user.avatar_initials || String(user.name || user.user_id).slice(0,2)).toUpperCase()}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                              <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                {user.name || deriveDisplayFromEmail(user.email || user.user_id).displayName}
                                              </div>
                                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {user.designation || 'Team Member'}
                                              </div>
                                            </div>
                                            <div className="flex items-center gap-1 text-xs">
                                              <span className="text-blue-600 font-medium">{(user.in_progress || []).length}</span>
                                              <span className="text-red-600 font-medium">{(user.blockers || []).length}</span>
                                              <span className="text-green-600 font-medium">{(user.completed || []).length}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              )}
                            </div>
                          </div>
                        </button>
                      </div>

                      {/* Project Members - Scrollable Content */}
                      {expandedProjects.has(projectName) && (
                        <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                          <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto thin-scroll pr-2">
                            {projectUsers?.map((user: any) => {
                              const productivityScore = calculateProductivityScore(user);
                              const productivityLevel = getProductivityLevel(productivityScore);
                              const ProductivityIcon = productivityLevel.icon;

                              return (
                                <Card key={user.user_id} className="p-4 bg-gradient-to-br from-slate-50/80 to-blue-50/60 dark:from-gray-800/90 dark:to-gray-700/90 border-slate-200 dark:border-gray-600 shadow-lg">
                                  {/* Member Header */}
                                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                                    <div className="flex items-center gap-4">
                                      <Avatar className="w-14 h-14 ring-2 ring-offset-2 ring-blue-500">
                                        <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-lg">
                                          {(user.avatar_initials || String(user.name || user.user_id).slice(0,2)).toUpperCase()}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <h3 className="font-semibold text-xl text-gray-900 dark:text-gray-100">
                                          {user.name || deriveDisplayFromEmail(user.email || user.user_id).displayName}
                                        </h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">{user.designation || 'Team Member'}</p>
                                      </div>
                                    </div>
                                  </div>

                                  {/* 3-Column Kanban Layout */}
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {/* In Progress Column */}
                                    <div className="bg-blue-50/70 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                      <div className="p-3 border-b border-blue-200 dark:border-blue-700">
                                        <div className="flex items-center gap-2">
                                          <Clock className="w-4 h-4 text-blue-600" />
                                          <span className="font-semibold text-sm text-blue-900 dark:text-blue-100">In Progress</span>
                                        </div>
                                      </div>
                                      <div className="p-3">
                                        <TimesheetTextarea
                                          user={user}
                                          projectId={projectId}
                                          type="in_progress"
                                          color="blue"
                                          tasks={user.in_progress || []}
                                          placeholder={isToday ? "Add today's in-progress tasks and notes..." : "Add in-progress tasks and notes..."}
                                        />
                                      </div>
                                    </div>

                                    {/* Blocked Column */}
                                    <div className="bg-red-50/70 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-700">
                                      <div className="p-3 border-b border-red-200 dark:border-red-700">
                                        <div className="flex items-center gap-2">
                                          <AlertTriangle className="w-4 h-4 text-red-600" />
                                          <span className="font-semibold text-sm text-red-900 dark:text-red-100">Blocked</span>
                                        </div>
                                      </div>
                                      <div className="p-3">
                                        <TimesheetTextarea
                                          user={user}
                                          projectId={projectId}
                                          type="blocked"
                                          color="red"
                                          tasks={user.blockers || []}
                                          placeholder={isToday ? "Add today's blocked tasks and reasons..." : "Add blocked tasks and reasons..."}
                                        />
                                      </div>
                                    </div>

                                    {/* Completed Column */}
                                    {showCompletedTasks && (
                                      <div className="bg-green-50/70 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                                        <div className="p-3 border-b border-green-200 dark:border-green-700">
                                          <div className="flex items-center gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600" />
                                            <span className="font-semibold text-sm text-green-900 dark:text-green-100">Completed</span>
                                          </div>
                                        </div>
                                        <div className="p-3">
                                          <TimesheetTextarea
                                            user={user}
                                            projectId={projectId}
                                            type="completed"
                                            color="green"
                                            tasks={user.completed || []}
                                            placeholder={isToday ? "Add today's completed tasks and notes..." : "Add completed tasks and notes..."}
                                          />
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </Card>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isTimesheetsFetching && sortedTimesheetUsers.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="mx-auto w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6">
                <Timer className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">No Tasks Found</h3>
              <p className="text-gray-500 dark:text-gray-500 mb-6">Adjust your filters or check back later</p>
              <Button onClick={clearTimesheetFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset Filters
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default TimesheetTab;
