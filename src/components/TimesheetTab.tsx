// React and hooks
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DateRange } from 'react-day-picker';

// UI Components
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card } from '@/components/ui/card';
import CopyableBadge from '@/components/ui/copyable-badge';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Icons
import {
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  EyeOff,
  Folder,
  FolderMinus,
  FolderPlus,
  Loader2,
  Plus,
  RefreshCw,
  RotateCcw,
  Save,
  Star,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  X
} from 'lucide-react';

// Services and utilities
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { deriveDisplayFromEmail } from '@/lib/projectUtils';
import {
  createOrUpdateDailyTimesheet,
  DailyTimesheetCreate,
  formatDateForAPI,
  getTeamTimesheetsSummary,
  TeamTimesheetUser
} from '@/services/dailyTimesheetService';
import { BackendOrgMember } from '@/types/organization';
// import { useProjectMembers, BackendProjectMember } from '@/hooks/useProjectMembers';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface TimesheetTabProps {
  orgId: string;
  projectsFromParent: any[];
  realOrgMembers: BackendOrgMember[];
  fetchProjects: () => void;
  // Props similar to ReportsTab for unified header controls
  // searchQuery: string;
  // setSearchQuery: (query: string) => void;
  // isSearchFocused: boolean;
  // setIsSearchFocused: (focused: boolean) => void;
  // // Signal from parent to refresh timesheets
  // refreshSignal: number;
}

type TimesheetSortType = 'productivity' | 'alphabetical' | 'hours';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TimesheetTab: React.FC<TimesheetTabProps> = ({
  orgId,
  projectsFromParent,
  realOrgMembers,
  fetchProjects,
  // unified header controls from parent (not directly used here yet)
  // searchQuery: _searchQuery,
  // setSearchQuery: _setSearchQuery,
  // isSearchFocused: _isSearchFocused,
  // setIsSearchFocused: _setIsSearchFocused,
  // refreshSignal
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

    const project = projects?.find(p => p.id === projectId || p.project_id === projectId);
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

  // User-specific role checking functions (for checking other users' roles)
  const getUserProjectRole = useCallback((userId: string, projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    if (!project) return null;

    // Check if user is the project owner
    if (project?.owner === userId) {
      return 'owner';
    }

    // Check if user is a project member
    if (project?.members?.includes(userId)) {
      return 'member';
    }

    // Note: We don't check org admin/owner for other users here
    // as that would require additional context about their org role
    return null;
  }, [projects]);

  const isUserProjectMember = useCallback((userId: string, projectId: string) => {
    const role = getUserProjectRole(userId, projectId);
    return role === 'member' || role === 'owner';
  }, [getUserProjectRole]);

  const isUserProjectAdmin = useCallback((userId: string, projectId: string) => {
    // For other users, we only check direct project roles
    // Since getUserProjectRole doesn't return 'admin' for other users,
    // we only check for 'owner' (owners have admin-like permissions)
    const role = getUserProjectRole(userId, projectId);
    return role === 'owner';
  }, [getUserProjectRole]);

  const isUserProjectOwner = useCallback((userId: string, projectId: string) => {
    return getUserProjectRole(userId, projectId) === 'owner';
  }, [getUserProjectRole]);

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
    placeholder,
    selectedDate
  }: {
    user: any;
    projectId: string;
    type: 'in_progress' | 'blocked' | 'completed';
    color: 'blue' | 'red' | 'green';
    tasks: any[];
    placeholder: string;
    selectedDate: Date | undefined;
  }) => {
    const canEdit = canEditUserTimesheet(user.user_id, projectId);
    const isRestricted = isDateRestrictedForEditing && currentUserOrgRole === 'member';
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    // Get initial value from saved timesheet data (clean user content)
    const getInitialValue = () => {
      // Look for saved timesheet content in the user's data
      // Handle different possible field names for the content types
      let savedContent = '';
      
      if (type === 'in_progress') {
        savedContent = user.in_progress || user.inProgress || '';
      } else if (type === 'blocked') {
        savedContent = user.blocked || user.blockers || '';
      } else if (type === 'completed') {
        savedContent = user.completed || '';
      }
      
      // If it's an array (task objects format), extract the content
      if (Array.isArray(savedContent)) {
        // For arrays, we'll extract just the raw text without formatting
        return savedContent.map(item => {
          if (typeof item === 'string') return item;
          if (typeof item === 'object') {
            // Try different possible content fields
            return item.title || item.content || item.description || item.text || '';
          }
          return '';
        }).filter(Boolean).join('\n');
      }
      
      // If it's a string (direct content format), return as is
      if (typeof savedContent === 'string') {
        return savedContent;
      }
      
      // If it's an object with a single field, try to extract content
      if (typeof savedContent === 'object' && savedContent !== null) {
        const contentObj = savedContent as any;
        return contentObj.content || contentObj.text || contentObj.description || '';
      }
      
      // Default to empty string for new entries
      return '';
    };

    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (canEdit) {
        e.target.parentElement?.classList.add('ring-2', `ring-${color}-500`, 'ring-opacity-50');
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      if (canEdit) {
        e.target.parentElement?.classList.remove('ring-2', `ring-${color}-500`, 'ring-opacity-50');
      }
    };

    const handleSave = async () => {
      if (!canEdit) {
        // Check if it's a date restriction issue
        if (isRestricted) {
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

      const value = textareaRef.current?.value || '';
      
      // Allow saving empty content to clear fields
      if (!value || value.trim().length === 0) {
        // Save empty content and check if all fields are empty
        await saveTimesheetData(user.user_id, type, '', projectId);
        return;
      }

      await saveTimesheetData(user.user_id, type, value, projectId);
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
      <div className="h-full flex flex-col">
        <div className={`flex-1 bg-white dark:bg-gray-800 rounded-lg border border-${color}-200 dark:border-${color}-600 shadow-sm hover:shadow-md transition-all duration-200 ${canEdit ? 'cursor-text' : 'cursor-not-allowed opacity-60'} mb-2`}>
        <textarea
          key={`${user.user_id}-${projectId}-${type}-${selectedDate?.toISOString()}-${JSON.stringify(
            type === 'in_progress' ? (user.in_progress || user.inProgress) :
            type === 'blocked' ? (user.blocked || user.blockers) :
            type === 'completed' ? user.completed : ''
          )}`}
          ref={textareaRef}
            className={`w-full h-full p-3 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg ${!canEdit ? 'cursor-not-allowed' : ''}`}
          placeholder={getPlaceholder()}
          readOnly={!canEdit}
          defaultValue={getInitialValue()}
          onFocus={handleFocus}
          onBlur={handleBlur}
            style={{ minHeight: '150px' }}
        />
        </div>
        <div className="flex justify-center">
            <Button
            variant="outline"
              size="sm"
            className={`text-xs text-${color}-700 border-${color}-200 hover:bg-${color}-50 dark:text-${color}-400 dark:border-${color}-600 dark:hover:bg-${color}-900/20 ${!canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={handleSave}
              disabled={!canEdit}
            >
              <Save className="w-3 h-3 mr-1" />
              Save
            </Button>
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
  const [activeEmployeeTab, setActiveEmployeeTab] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'detail'>('calendar');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);

  // Local state to track timesheet status for calendar dates
  const [timesheetStatus, setTimesheetStatus] = useState<Record<string, { hasData: boolean; userId: string }>>({});

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
      badges?.push(
        <Badge key="owner" variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
          Project Owner
        </Badge>
      );
    } else if (effectiveProjectRole === 'admin') {
      badges?.push(
        <Badge key="admin" variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          Project Admin
        </Badge>
      );
    } else if (effectiveProjectRole === 'member') {
      badges?.push(
        <Badge key="member" variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
          Project Member
        </Badge>
      );
    }

    if (effectiveProjectRole === 'member' && isDateRestrictedForEditing) {
      badges?.push(
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

  // Memoize date string and project array to prevent unstable queryKey references
  const memoizedSelectedTimesheetDate = useMemo(() => {
    return selectedTimesheetDate?.toISOString() || '';
  }, [selectedTimesheetDate]);

  const memoizedSelectedTimesheetProjects = useMemo(() => {
    return selectedTimesheetProjects;
  }, [selectedTimesheetProjects]);

  // Fetch daily timesheets data
  const {
    data: dailyTimesheets,
    isFetching: isTimesheetsFetching,
    isError: isTimesheetsError,
    error: timesheetsError,
    refetch: refetchTimesheets
  } = useQuery({
    queryKey: ['daily-timesheets', orgId, memoizedSelectedTimesheetDate, memoizedSelectedTimesheetProjects],
    enabled: !!orgId && orgId.length > 0 && !!selectedTimesheetDate,
    queryFn: () => getTeamTimesheetsSummary(
      orgId,
      formatDateForAPI(selectedTimesheetDate!),
      memoizedSelectedTimesheetProjects.length > 0 ? memoizedSelectedTimesheetProjects : undefined
    ),
  });

  // Trigger refetch when parent signals a refresh
  // useEffect(() => {
  //   if (refreshSignal > 0) {
  //     refetchTimesheets();
  //   }
  // }, [refreshSignal]);

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
  }, [dailyTimesheets, timesheetSearchQuery, selectedTimesheetUsers, selectedTimesheetDate, realOrgMembers, currentUserOrgRole, user, projects, memoizedSelectedTimesheetProjects]);

  // Initialize timesheet status from loaded data
  useEffect(() => {
    if (dailyTimesheets && selectedTimesheetDate) {
      const dateKey = formatDateForAPI(selectedTimesheetDate);
      const newStatus: Record<string, { hasData: boolean; userId: string }> = {};
      
      // Check each user's data for the selected date
      filteredTimesheetUsers?.forEach(user => {
        const userDateKey = `${dateKey}-${user.user_id}`;
        
        // Check if user has any data in any field
        const inProgressData = user.in_progress || [];
        const blockedData = user.blockers || [];
        const completedData = user.completed || [];
        
        const hasInProgress = Array.isArray(inProgressData) ? inProgressData.length > 0 : 
                             (typeof inProgressData === 'string' && (inProgressData as string).trim().length > 0);
        const hasBlocked = Array.isArray(blockedData) ? blockedData.length > 0 : 
                          (typeof blockedData === 'string' && (blockedData as string).trim().length > 0);
        const hasCompleted = Array.isArray(completedData) ? completedData.length > 0 : 
                            (typeof completedData === 'string' && (completedData as string).trim().length > 0);
        
        const hasData = hasInProgress || hasBlocked || hasCompleted;
        
        newStatus[userDateKey] = { hasData, userId: user.user_id };
      });
      
      // Update status only if there are changes
      setTimesheetStatus(prev => {
        const hasChanges = Object.keys(newStatus).some(key => 
          !prev[key] || prev[key].hasData !== newStatus[key].hasData
        );
        return hasChanges ? { ...prev, ...newStatus } : prev;
      });
    }
  }, [dailyTimesheets, selectedTimesheetDate, filteredTimesheetUsers]);

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

  // Set active employee tab to first user if not set
  useEffect(() => {
    if (sortedTimesheetUsers.length > 0 && !activeEmployeeTab) {
      setActiveEmployeeTab(sortedTimesheetUsers[0].user_id);
    }
  }, [sortedTimesheetUsers, activeEmployeeTab]);

  // Get active employee data
  const activeEmployee = useMemo(() => {
    return sortedTimesheetUsers?.find(user => user.user_id === activeEmployeeTab);
  }, [sortedTimesheetUsers, activeEmployeeTab]);

  // Get employee's project involvement
  const getEmployeeProjects = useCallback((employee: TeamTimesheetUser) => {
    const employeeProjects = new Set<string>();
    [...(employee.in_progress || []), ...(employee.completed || []), ...(employee.blockers || [])]?.forEach(task => {
      if (task.project) {
        employeeProjects.add(task.project);
      }
    });

    // Also check projects where user is a member based on role
    projects?.forEach(project => {
      if (isUserProjectMember(employee.user_id, project.id)) {
        employeeProjects.add(project.name);
      }
    });

    return Array.from(employeeProjects);
  }, [projects, isUserProjectMember]);

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

          // check for duplicate users
          if (!projectGroups[projectName]?.some(u => u.user_id === user.user_id)) {
            projectGroups[projectName]?.push(user);
          }
        }
      } else {
        // If user has no timesheet data, add them to projects they have role-based access to
        projects?.forEach(project => {
          // Check if this specific user has access to this project (using user-specific functions)
          // Note: isUserProjectAdmin and isUserProjectOwner both check for 'owner' role,
          // so we only need one of them. isUserProjectMember checks for 'member' or 'owner'.
          const userHasProjectAccess = isUserProjectMember(user.user_id, project.id);
          
          if (userHasProjectAccess && !projectGroups[project.name]?.some(u => u.user_id === user.user_id)) {
            console.log(`Adding user ${user.name} to project they have access to: ${project.name}`);
            // check for duplicate users
            if (!projectGroups[project.name]?.some(u => u.user_id === user.user_id)) {
              projectGroups[project.name]?.push(user);
            }
          }
        });
      }
    });

    console.log('Final projectGroups:', projectGroups);
    return projectGroups;
  }, [sortedTimesheetUsers, projects, canViewProjectTimesheets, selectedTimesheetProjects, isUserProjectMember]);



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

  // Date Navigation Functions
  const navigateToPreviousDay = () => {
    const currentDate = selectedTimesheetDate || new Date();
    const previousDay = new Date(currentDate);
    previousDay.setDate(previousDay.getDate() - 1);
    setSelectedTimesheetDate(previousDay);
    setSelectedCalendarDate(previousDay);
  };

  const navigateToNextDay = () => {
    const currentDate = selectedTimesheetDate || new Date();
    const nextDay = new Date(currentDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedTimesheetDate(nextDay);
    setSelectedCalendarDate(nextDay);
  };

  // Calendar View Functions
  const handleDateClick = (date: Date) => {
    setSelectedTimesheetDate(date);
    setSelectedCalendarDate(date);
    setViewMode('detail');
  };

  const backToCalendar = () => {
    setViewMode('calendar');
  };

  // Generate calendar grid with weeks
  const getCurrentMonthCalendar = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    // Get first day of month and last day of month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the first Sunday of the calendar view
    const startDate = new Date(firstDay);
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    startDate.setDate(firstDay.getDate() - startDayOfWeek);
    
    // Get the last Saturday of the calendar view
    const endDate = new Date(lastDay);
    const endDayOfWeek = lastDay.getDay();
    endDate.setDate(lastDay.getDate() + (6 - endDayOfWeek));
    
    // Generate all dates for the calendar grid
    const weeks = [];
    let currentWeek = [];
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      currentWeek.push(new Date(date));
      
      // If it's Saturday (day 6), complete the week
      if (date.getDay() === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    
    // Add any remaining days to the last week
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return { weeks, currentMonth: month };
  };

  // Get timesheet summary for date tabs
  const getDateSummary = (date: Date, user: any) => {
    const dateKey = `${date.toISOString().split('T')[0]}-${user?.user_id}`;
    
    // Check local timesheet status first
    if (timesheetStatus[dateKey]) {
      return {
        hasData: timesheetStatus[dateKey].hasData,
        inProgressCount: timesheetStatus[dateKey].hasData ? 1 : 0,
        blockedCount: 0,
        completedCount: 0
      };
    }
    
    // Check if this is the currently selected date with loaded data
    const isCurrentDate = selectedTimesheetDate && 
      date.toDateString() === selectedTimesheetDate.toDateString();
    
    if (isCurrentDate && user) {
      // Check for string content (saved data) or array content (task data)
      const inProgressData = user.in_progress || user.inProgress || [];
      const blockedData = user.blocked || user.blockers || [];
      const completedData = user.completed || [];
      
      // Check if data exists - either as non-empty strings or non-empty arrays
      const hasInProgress = Array.isArray(inProgressData) ? inProgressData.length > 0 : 
                           (typeof inProgressData === 'string' && inProgressData.trim().length > 0);
      const hasBlocked = Array.isArray(blockedData) ? blockedData.length > 0 : 
                        (typeof blockedData === 'string' && blockedData.trim().length > 0);
      const hasCompleted = Array.isArray(completedData) ? completedData.length > 0 : 
                          (typeof completedData === 'string' && completedData.trim().length > 0);
      
      const hasData = hasInProgress || hasBlocked || hasCompleted;
      
      return {
        hasData,
        inProgressCount: hasInProgress ? 1 : 0,
        blockedCount: hasBlocked ? 1 : 0,
        completedCount: hasCompleted ? 1 : 0
      };
    }
    
    return { hasData: false, inProgressCount: 0, blockedCount: 0, completedCount: 0 };
  };

  // Get status icon for calendar date
  const getDateStatusIcon = (date: Date, user: any) => {
    const summary = getDateSummary(date, user);
    
    if (!summary.hasData) {
      // No data filled yet - show "Not Started" icon
      return (
        <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
      );
    } else {
      // Has data - show "Completed" icon
      return (
        <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></div>
      );
    }
  };

  // Data Management Functions
  // Helper function to check if all timesheet fields are empty for a user
  const checkAllFieldsEmpty = async (userId: string, currentField: 'in_progress' | 'completed' | 'blocked', currentValue: string) => {
    // Get current user data
    const currentUser = filteredTimesheetUsers?.find(u => u.user_id === userId);
    if (!currentUser) return true;

    // Check the values of all three fields, using the current value for the field being saved
    const inProgressValue = currentField === 'in_progress' ? currentValue : 
                           (typeof currentUser.in_progress === 'string' ? currentUser.in_progress : 
                            Array.isArray(currentUser.in_progress) ? currentUser.in_progress.join('') : '');
    
    const blockedValue = currentField === 'blocked' ? currentValue : 
                        (typeof currentUser.blockers === 'string' ? currentUser.blockers :
                         Array.isArray(currentUser.blockers) ? currentUser.blockers.join('') : '');
    
    const completedValue = currentField === 'completed' ? currentValue : 
                          (typeof currentUser.completed === 'string' ? currentUser.completed : 
                           Array.isArray(currentUser.completed) ? currentUser.completed.join('') : '');

    // Check if all fields are empty or whitespace-only
    const allEmpty = (!inProgressValue || inProgressValue.trim().length === 0) &&
                    (!blockedValue || blockedValue.trim().length === 0) &&
                    (!completedValue || completedValue.trim().length === 0);

    return allEmpty;
  };

  const saveTimesheetData = async (
    userId: string,
    field: 'in_progress' | 'completed' | 'blocked',
    value: string,
    projectId?: string
  ) => {
    if (!selectedTimesheetDate || !orgId || orgId.length === 0 || !userId || userId.trim().length === 0 || !field || field.trim().length === 0) return;

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
          title: 'Daily Status updated successfully',
          description: 'Daily Status updated successfully',
          variant: 'default'
        });
        
        // Check if all fields are empty after this save to determine status
        const allFieldsEmpty = await checkAllFieldsEmpty(userId, field, value);
        
        // Update local timesheet status for calendar view
        const dateKey = `${formatDateForAPI(selectedTimesheetDate)}-${userId}`;
        setTimesheetStatus(prev => ({
          ...prev,
          [dateKey]: { hasData: !allFieldsEmpty, userId }
        }));
        
        // Note: With uncontrolled components, we don't need to clear state
        // The textarea will be refreshed when the data is refetched
        
        // Refetch the data to show updated information
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
    <div className="flex w-full h-full relative overflow-hidden">
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

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-h-0">
        {/* Employee Tabs Header */}
        {!isTimesheetsFetching && sortedTimesheetUsers.length > 0 && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 sm:px-6 py-2 sm:py-3 flex-shrink-0">
            <Tabs value={activeEmployeeTab} onValueChange={setActiveEmployeeTab} className="h-full flex flex-col">
              <TabsList className="h-auto p-0 bg-transparent gap-1 justify-start w-full max-w-none overflow-x-auto scrollbar-hide">
                <div className="flex gap-1 min-w-max">
                  {sortedTimesheetUsers?.map((user) => {
                    const productivityScore = calculateProductivityScore(user);
                    const productivityLevel = getProductivityLevel(productivityScore);
                    const employeeProjects = getEmployeeProjects(user);
                    
                    return (
                      <TabsTrigger
                        key={user.user_id}
                        value={user.user_id}
                        className="flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg data-[state=active]:bg-blue-50 data-[state=active]:text-blue-900 data-[state=active]:border-blue-200 data-[state=active]:shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 whitespace-nowrap"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <Avatar className="w-6 h-6 sm:w-8 sm:h-8 ring-2 ring-offset-1 ring-blue-500">
                            <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs">
                              {(user.avatar_initials || String(user.name || user.user_id).slice(0, 2)).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-left min-w-0">
                            <div className="font-medium text-xs sm:text-sm truncate whitespace-nowrap">
                              {user.name || deriveDisplayFromEmail(user.email || user.user_id).displayName}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate whitespace-nowrap">
                              {employeeProjects.length > 0 ? `${employeeProjects.length} project${employeeProjects.length !== 1 ? 's' : ''}` : 'No projects'}
                            </div>
                          </div>
                        </div>
                      </TabsTrigger>
                    );
                  })}
                </div>
              </TabsList>
            </Tabs>
                </div>
              )}
              
        {/* Loading State */}
        {isTimesheetsFetching && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">Loading updates...</p>
            </div>
          </div>
        )}

        {/* Employee Content Area */}
        {!isTimesheetsFetching && sortedTimesheetUsers.length > 0 && (
          <div className="flex-1 overflow-hidden min-h-0">
            <Tabs value={activeEmployeeTab} onValueChange={setActiveEmployeeTab} className="h-full flex flex-col">

              {/* Active Employee Content */}
              <div className="flex-1 overflow-hidden min-h-0">
                {sortedTimesheetUsers?.map((user) => (
                  <TabsContent
                    key={user.user_id}
                    value={user.user_id}
                    className="h-full overflow-y-auto thin-scroll m-0 p-0"
                  >
                    <div className="p-2 sm:p-4 space-y-2 sm:space-y-4 h-full flex flex-col">
                      {/* Employee Header Strip */}
                      <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/60 dark:from-gray-800/90 dark:to-gray-700/90 border border-slate-200 dark:border-gray-600 rounded-lg p-2 sm:p-3 shadow-sm flex-shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                          <div className="flex items-center gap-3 sm:gap-4">
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-offset-1 ring-blue-500">
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs sm:text-sm">
                                {(user.avatar_initials || String(user.name || user.user_id).slice(0, 2)).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h2 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                                {user.name || deriveDisplayFromEmail(user.email || user.user_id).displayName}
                              </h2>
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                                  {user.designation || 'Team Member'} • {user.email || user.user_id}
                                  {getEmployeeProjects(user).length > 0 && (
                                    <span> • Projects:</span>
                                  )}
                                </p>
                                {getEmployeeProjects(user).length > 0 && (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {getEmployeeProjects(user).slice(0, 3)?.map((projectName, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                        <Folder className="w-3 h-3 mr-1" />
                                        {projectName}
                                      </Badge>
                                    ))}
                                    {getEmployeeProjects(user).length > 3 && (
                                      <HoverCard>
                                        <HoverCardTrigger asChild>
                                          <Badge variant="outline" className="text-xs bg-gray-50 text-gray-700 border-gray-200 cursor-pointer">
                                            +{getEmployeeProjects(user).length - 3} more
                                          </Badge>
                                        </HoverCardTrigger>
                                        <HoverCardContent className="w-80">
                                          <div className="space-y-2">
                                            <h4 className="text-sm font-semibold">All Projects</h4>
                                            <div className="flex flex-wrap gap-1">
                                              {getEmployeeProjects(user)?.map((projectName, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                  <Folder className="w-3 h-3 mr-1" />
                                                  {projectName}
                                                </Badge>
                                              ))}
                                            </div>
                                          </div>
                                        </HoverCardContent>
                                      </HoverCard>
                                    )}
                                  </div>
                  )}
                </div>
              </div>
                  </div>

                          {/* View Mode Indicator */}
                          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                            {viewMode === 'detail' && (
                <Button
                  variant="outline"
                  size="sm"
                                onClick={backToCalendar}
                                className="flex items-center gap-2"
                              >
                                <ArrowLeft className="w-4 h-4" />
                                <span className="hidden sm:inline">Back to Calendar</span>
                                <span className="sm:hidden">Back</span>
                </Button>
                            )}
                            {viewMode === 'calendar' && (
                              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 px-2 sm:px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-700">
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                                  <div className="text-xs sm:text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                    <div className="flex items-center gap-2 sm:gap-4">
                                      <span className="hidden sm:inline">Status:</span>
                                      <div className="flex items-center gap-2 sm:gap-3">
                                        <div className="flex items-center gap-1 sm:gap-2">
                                          <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                          <span className="text-xs">Not Started</span>
                  </div>
                                        <div className="flex items-center gap-1 sm:gap-2">
                                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                          <span className="text-xs">Completed</span>
                    </div>
                              </div>
                              </div>
                            </div>
                          </div>
                  </div>
                            )}
                </div>
          </div>
            </div>

                      {/* Calendar View */}
                      {viewMode === 'calendar' && (
                        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm flex-1 min-h-0 flex flex-col overflow-auto">
                          {/* Month Navigation Header */}
                          <div className="flex items-center justify-between p-2 sm:p-3 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                            <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            
                            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                              {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                            </h2>
                            
                            <button className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                    </div>
                          
                          {/* Calendar Grid */}
                          <div className="p-2 sm:p-3 flex-1 flex flex-col min-h-0 overflow-auto">
                            {/* Week Headers */}
                            <div className="grid grid-cols-7 mb-1 flex-shrink-0">
                              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                                <div key={day} className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 py-1">
                                  {day}
                    </div>
                              ))}
                  </div>
                            
                            {/* Calendar Weeks */}
                            <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden mb-4 min-h-0" style={{gridTemplateRows: `repeat(${getCurrentMonthCalendar().weeks.length}, minmax(60px, 1fr))`}}>
                              {getCurrentMonthCalendar().weeks.map((week, weekIndex) => (
                                week.map((date, dayIndex) => {
                                  const isToday = date.toDateString() === new Date().toDateString();
                                  const isSelected = selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
                                  const isCurrentMonth = date.getMonth() === getCurrentMonthCalendar().currentMonth;
                                  const isFutureDate = date > new Date();
                                  const summary = getDateSummary(date, user);
                                  const dayNumber = date.getDate();

                    return (
                          <button
                                      key={`${weekIndex}-${dayIndex}`}
                                      onClick={() => isCurrentMonth && !isFutureDate && handleDateClick(date)}
                                      className={`
                                        relative w-full h-full min-h-[60px] border-r border-b border-gray-200 dark:border-gray-600 
                                        flex items-center justify-center transition-all duration-200
                                        ${(dayIndex === 6) ? 'border-r-0' : ''}
                                        ${(weekIndex === getCurrentMonthCalendar().weeks.length - 1 || 
                                           (weekIndex === getCurrentMonthCalendar().weeks.length - 2 && dayIndex >= week.length - (7 - week.length))) ? 'border-b-0' : ''}
                                        ${isSelected 
                                          ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm' 
                                          : isToday && isCurrentMonth
                                            ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400' 
                                            : isCurrentMonth && !isFutureDate
                                              ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                                              : isCurrentMonth && isFutureDate
                                                ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                                                : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-default'
                                        }
                                      `}
                                      disabled={!isCurrentMonth || isFutureDate}
                                    >
                                      {/* Day Number */}
                                      <span className={`text-xs font-medium ${
                                        isSelected 
                                          ? 'text-green-800 font-semibold' 
                                          : isToday && isCurrentMonth
                                            ? 'text-green-600 dark:text-green-400 font-semibold' 
                                            : isCurrentMonth && !isFutureDate
                                              ? 'text-gray-900 dark:text-gray-100'
                                              : 'text-gray-400 dark:text-gray-500'
                                      }`}>
                                        {dayNumber}
                                      </span>
                                      
                                      {/* Status Indicator - Show for all valid dates (current month, non-future) */}
                                      {isCurrentMonth && !isFutureDate && (
                                        <div className="absolute bottom-1 right-1">
                                          {getDateStatusIcon(date, user)}
                                        </div>
                                      )}
                                    </button>
                                  );
                                })
                              ))}
                              </div>
                                </div>
                                </div>
                      )}

                      {/* Detail View */}
                      {viewMode === 'detail' && (
                        <>
                          {/* Spreadsheet-Style Columnar Layout */}
                          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                            {/* Table Header */}
                            <div className="grid grid-cols-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                              <div className="p-4 font-semibold text-sm text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-600 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Date
                              </div>
                              <div className="p-4 font-semibold text-sm text-blue-700 dark:text-blue-300 border-r border-gray-200 dark:border-gray-600 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                In Progress
                              </div>
                              <div className="p-4 font-semibold text-sm text-red-700 dark:text-red-300 border-r border-gray-200 dark:border-gray-600 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Blocked
                              </div>
                              {showCompletedTasks && (
                                <div className="p-4 font-semibold text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Completed
                                </div>
                              )}
                            </div>

                            {/* Table Row */}
                            <div className="grid grid-cols-4 min-h-[250px]">
                              {/* Date Column */}
                              <div className="p-4 border-r border-gray-200 dark:border-gray-600 flex flex-col items-center justify-center">
                                <div className="text-center">
                                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                                    {(selectedTimesheetDate || new Date()).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric',
                                      year: 'numeric'
                                    })}
                              </div>

                                  {/* Additional date info */}
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {isToday ? 'Today' : 'Historical'}
                                        </div>
                                      </div>
                        </div>

                                      {/* In Progress Column */}
                              <div className="p-4 border-r border-gray-200 dark:border-gray-600 bg-blue-50/30 dark:bg-blue-900/10 flex flex-col">
                                          <TimesheetTextarea
                                            user={user}
                                  projectId={getUserPrimaryProject(user)}
                                            type="in_progress"
                                            color="blue"
                                            tasks={user.in_progress || []}
                                  placeholder={isToday ? "What are you working on today?" : "What were you working on?"}
                                            selectedDate={selectedTimesheetDate}
                                          />
                                      </div>

                                      {/* Blocked Column */}
                              <div className="p-4 border-r border-gray-200 dark:border-gray-600 bg-red-50/30 dark:bg-red-900/10 flex flex-col">
                                          <TimesheetTextarea
                                            user={user}
                                  projectId={getUserPrimaryProject(user)}
                                            type="blocked"
                                            color="red"
                                            tasks={user.blockers || []}
                                  placeholder={isToday ? "Any blockers or issues today?" : "Were there any blockers?"}
                                            selectedDate={selectedTimesheetDate}
                                          />
                                      </div>

                                      {/* Completed Column */}
                                      {showCompletedTasks && (
                                <div className="p-4 bg-green-50/30 dark:bg-green-900/10 flex flex-col">
                                            <TimesheetTextarea
                                              user={user}
                                    projectId={getUserPrimaryProject(user)}
                                              type="completed"
                                              color="green"
                                              tasks={user.completed || []}
                                    placeholder={isToday ? "What did you complete today?" : "What did you complete?"}
                                              selectedDate={selectedTimesheetDate}
                                            />
                                        </div>
                                      )}
                                    </div>
                            </div>
                        </>
                        )}
                      </div>
                  </TabsContent>
                ))}
              </div>
            </Tabs>
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
