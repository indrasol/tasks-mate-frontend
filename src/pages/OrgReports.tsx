import MainNavigation from '@/components/navigation/MainNavigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CopyableIdBadge from '@/components/ui/copyable-id-badge';
import { API_ENDPOINTS } from '@/config';
import { fetchOrgReports, ReportsFilters } from '@/services/reportsService';
import { fetchOrgTimesheets } from '@/services/reportsService';
import { 
  getTeamTimesheetsSummary, 
  createOrUpdateDailyTimesheet,
  formatDateForAPI,
  TeamTimesheetUser,
  DailyTimesheetCreate
} from '@/services/dailyTimesheetService';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
// Removed Input/Label/Select in favor of dropdown multi-selects like TasksCatalog
import { DateRange } from 'react-day-picker';

import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { api } from '@/services/apiService';
import { AlertTriangle, CalendarRange, CheckCircle, Clock, Filter, FolderOpen, Loader2, RefreshCw, Search, Timer, Users, X, Plus, Star, Trophy, Target, TrendingUp, Calendar, Edit3, Save, MoreVertical, Play, Pause, RotateCcw, Award, Flame, ChevronRight, Eye, EyeOff, BarChart3, PieChart, ChevronDown, ChevronUp, Folder, FolderMinus, FolderPlus } from 'lucide-react';

const TASK_STATUSES = ['not_started', 'in_progress', 'blocked', 'on_hold', 'completed'];
const TASK_PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'];
const BUG_STATUSES = ['open', 'in_progress', 'in_review', 'resolved', 'reopened', 'closed', 'won_t_fix', 'duplicate'];
const BUG_PRIORITIES = ['critical', 'high', 'medium', 'low'];


import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";

import { capitalizeFirstLetter, deriveDisplayFromEmail, getPriorityColor, getStatusMeta } from '@/lib/projectUtils';
import { BackendOrgMember } from '@/types/organization';
import { Task } from '@/types/tasks';

const StatusBadge = ({ status }: { status: string }) => {
  const meta = getStatusMeta(status);
  return (
    <Badge variant="secondary" className={`text-xs ${meta.color}`}>
      {meta.label}
    </Badge>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const colorClass = getPriorityColor(priority);
  return (
    <Badge variant="secondary" className={`text-xs ${colorClass}`}>
      {capitalizeFirstLetter(priority)}
    </Badge>
  );
};

const ProjectHoverCard = ({ project, orgId, orgMembers }: {
  project: any;
  orgId: string;
  orgMembers: BackendOrgMember[];
}) => {
  const userDisplayMap = React.useMemo(() => {
    const map: Record<string, { displayName: string; initials: string; isOwner: boolean }> = {};
    orgMembers.forEach(m => {
      map[m.user_id] = {
        displayName: m.displayName,
        initials: m.initials,
        isOwner: m.role === 'owner',
      };
    });
    return map;
  }, [orgMembers]);

  const renderMemberAvatar = (memberId: string, idx: number) => {
    const info = userDisplayMap[memberId];
    return info && (
      <div key={idx} className="flex items-center gap-2">
        <Avatar className="w-6 h-6 border-2 border-white">
          <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
            {info.initials}
          </AvatarFallback>
        </Avatar>
        <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800">
          {info.displayName}
        </Badge>
      </div>
    );
  };

  return (
    <HoverCardContent className="w-80 p-4 bg-white shadow-lg border border-gray-200">
      <div className="space-y-3">
        {/* Project Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-gray-500" />
            <h4 className="font-semibold text-sm">{project?.project_name}</h4>
          </div>
          <CopyableIdBadge id={project?.project_id} org_id={orgId} copyLabel="Project" className="text-xs bg-blue-600 hover:bg-blue-700 text-white" />
        </div>

        {/* <div className="flex items-center justify-between">


          <Badge className="text-xs bg-indigo-100 text-indigo-800">
            {userDisplayMap[project?.owner]?.displayName ?? deriveDisplayFromEmail(project?.owner).displayName}
          </Badge>


          <DateBadge date={project?.start_date ? project?.start_date : project?.created_at} className="text-xs bg-blue-100 text-blue-800" />

          <DateBadge date={project?.end_date ? project?.end_date : project?.created_at} className="text-xs bg-rose-100 text-rose-800" />
        </div> */}



        {/* Project Members */}
        <div>
          <div className="text-xs font-semibold mb-2 text-gray-700 flex items-center gap-1">
            <Users className="w-3 h-3" />
            Project Members
          </div>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {project?.members?.length > 0 ? (
              project?.members.map((member: any, idx: number) => renderMemberAvatar(member.user_id, idx))
            ) : (
              <div className="text-xs text-gray-500">No members found</div>
            )}
          </div>
        </div>

      </div>
    </HoverCardContent>
  );
};

const OrgReports: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading } = useAuth();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  const navigate = useNavigate();
  const currentOrgId = useCurrentOrgId();

  // Use currentOrgId as fallback if orgId is not in URL
  const orgId = useMemo(() => {
    const urlOrgId = searchParams.get('org_id');
    return urlOrgId || currentOrgId || '';
  }, [searchParams, currentOrgId]);

  const { data: orgMembersRaw } = useOrganizationMembers(currentOrgId);

  // Handle authentication and loading
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

  // Early returns AFTER all hooks
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

  // Real organization members (without dummy data) for dropdowns and filters
  const realOrgMembers: BackendOrgMember[] = useMemo(() => {
    try {
      if (!orgMembersRaw) return [];

      return orgMembersRaw.map((m: any) => ({
        ...m,
        name: ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id,
      })).map((m: any) => ({
        ...m,
        displayName: deriveDisplayFromEmail(m.name).displayName,
        initials: deriveDisplayFromEmail(m.name).initials,
      }));
    } catch (error) {
      console.error('Error processing real orgMembers:', error);
      return [];
    }
  }, [orgMembersRaw]);

  // Use real organization members only (no dummy data needed)
  const orgMembers: BackendOrgMember[] = useMemo(() => {
    try {
      return realOrgMembers;
    } catch (error) {
      console.error('Error processing orgMembers:', error);
      return [];
    }
  }, [realOrgMembers]);

  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const fetchProjects = async () => {
    if (!currentOrgId) return;
    try {
      const res = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS}/${currentOrgId}?show_all=true`);
      const mapped = res.map((p: any) => ({ id: p.project_id, name: p.name }));
      setProjects(mapped);
    } catch (e) {
      console.error("Failed to fetch projects", e);
    }
  };
  useEffect(() => {
    fetchProjects();
  }, [currentOrgId]);

  const [isFiltersPaneOpen, setIsFiltersPaneOpen] = useState(false);

  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<string[]>([]);
  const [taskPriorities, setTaskPriorities] = useState<string[]>([]);
  const [bugStatuses, setBugStatuses] = useState<string[]>([]);
  const [bugPriorities, setBugPriorities] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [tempDateRange, setTempDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [projectSort, setProjectSort] = useState<'name_asc' | 'name_desc' | 'members_desc' | 'id_asc' | 'id_desc'>('name_asc');
  const [memberSort, setMemberSort] = useState<'name_asc' | 'name_desc'>('name_asc');
  const [activeTab, setActiveTab] = useState<'reports' | 'timesheets'>('reports');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Timesheets state
  const [timesheetSearchQuery, setTimesheetSearchQuery] = useState('');
  const [timesheetDateRange, setTimesheetDateRange] = useState<DateRange | undefined>(undefined);
  const [tempTimesheetDateRange, setTempTimesheetDateRange] = useState<DateRange | undefined>(undefined);
  const [isTimesheetDatePopoverOpen, setIsTimesheetDatePopoverOpen] = useState(false);
  const [selectedTimesheetUsers, setSelectedTimesheetUsers] = useState<string[]>([]);
  const [selectedTimesheetProjects, setSelectedTimesheetProjects] = useState<string[]>([]);
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [selectedUserForEntry, setSelectedUserForEntry] = useState<string>('');
  
  // Enhanced Timesheets UI state
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [timesheetSort, setTimesheetSort] = useState<'productivity' | 'alphabetical' | 'hours'>('productivity');
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  const [selectedTimesheetDate, setSelectedTimesheetDate] = useState<Date | undefined>(new Date());
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());

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
  }, [selectedTimesheetDate]);

  // Real timesheets data
  const timesheetsFilters: ReportsFilters = useMemo(() => {
    // Use the existing date range filter from sidebar, not the selectedTimesheetDate
    // The selectedTimesheetDate is just for display purposes to show "as of" date
    return {
    org_id: orgId,
    project_ids: selectedTimesheetProjects.length ? selectedTimesheetProjects : undefined,
    member_ids: selectedTimesheetUsers.length ? selectedTimesheetUsers : undefined,
    date_from: timesheetDateRange?.from?.toISOString(),
    date_to: timesheetDateRange?.to?.toISOString(),
    };
  }, [orgId, selectedTimesheetProjects, selectedTimesheetUsers, timesheetDateRange]);

  // Real daily timesheets data using the new API
  const { data: dailyTimesheets, isFetching: isTimesheetsFetching, isError: isTimesheetsError, error: timesheetsError, refetch: refetchTimesheets } = useQuery({
    queryKey: ['daily-timesheets', orgId, selectedTimesheetDate, selectedTimesheetProjects],
    enabled: !!orgId && !!selectedTimesheetDate,
    queryFn: () => getTeamTimesheetsSummary(
      orgId, 
      formatDateForAPI(selectedTimesheetDate!),
      selectedTimesheetProjects.length > 0 ? selectedTimesheetProjects : undefined
    ),
  });

  const now = new Date();
  const defaultFrom = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }, []);

  const filters: ReportsFilters = useMemo(() => ({
    org_id: orgId,
    project_ids: selectedProjects.length ? selectedProjects : undefined,
    member_ids: selectedMembers.length ? selectedMembers : undefined,
    date_from: dateRange?.from?.toISOString() || defaultFrom.toISOString(),
    date_to: dateRange?.to?.toISOString() || now.toISOString(),
    task_statuses: taskStatuses.length ? taskStatuses : undefined,
    task_priorities: taskPriorities.length ? taskPriorities : undefined,
    bug_statuses: bugStatuses.length ? bugStatuses : undefined,
    bug_priorities: bugPriorities.length ? bugPriorities : undefined,
  }), [orgId, selectedProjects, selectedMembers, dateRange, taskStatuses, taskPriorities, bugStatuses, bugPriorities]);

  // Persist filters in URL search params
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    const setArr = (key: string, arr: string[] | undefined) => {
      if (arr && arr.length) params.set(key, arr.join(',')); else params.delete(key);
    };
    setArr('projects', filters.project_ids);
    setArr('members', filters.member_ids);
    setArr('t_statuses', filters.task_statuses);
    setArr('t_priorities', filters.task_priorities);
    setArr('b_statuses', filters.bug_statuses);
    setArr('b_priorities', filters.bug_priorities);
    if (filters.date_from) params.set('from', filters.date_from); else params.delete('from');
    if (filters.date_to) params.set('to', filters.date_to); else params.delete('to');
    setSearchParams(params, { replace: true });
  }, [filters, setSearchParams]);

  // Initialize filters from URL once
  useEffect(() => {
    const parseCsv = (v: string | null) => (v ? v.split(',').filter(Boolean) : []);
    const p = searchParams.get('projects');
    const m = searchParams.get('members');
    const ts = searchParams.get('t_statuses');
    const tp = searchParams.get('t_priorities');
    const bs = searchParams.get('b_statuses');
    const bp = searchParams.get('b_priorities');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (p) setSelectedProjects(parseCsv(p));
    if (m) setSelectedMembers(parseCsv(m));
    if (ts) setTaskStatuses(parseCsv(ts));
    if (tp) setTaskPriorities(parseCsv(tp));
    if (bs) setBugStatuses(parseCsv(bs));
    if (bp) setBugPriorities(parseCsv(bp));
    if (from || to) {
      setDateRange({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
      setTempDateRange({ from: from ? new Date(from) : undefined, to: to ? new Date(to) : undefined });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearFilters = () => {
    setSelectedProjects([]);
    setSelectedMembers([]);
    setTaskStatuses([]);
    setTaskPriorities([]);
    setBugStatuses([]);
    setBugPriorities([]);
    setDateRange(undefined);
    setTempDateRange(undefined);
  };

  const clearTimesheetFilters = () => {
    setSelectedTimesheetUsers([]);
    setSelectedTimesheetProjects([]);
    setTimesheetDateRange(undefined);
    setTempTimesheetDateRange(undefined);
    // Keep selectedTimesheetDate as is - it's just for display
    // setTimesheetSearchQuery('');
  };

  const filteredTimesheetUsers = useMemo(() => {
    // Get users from the real API response - support both old and new format
    let users: TeamTimesheetUser[] = ((dailyTimesheets as any)?.users ?? []) as TeamTimesheetUser[];
    
    // If we have the new projects structure, we can use that too
    const projects = ((dailyTimesheets as any)?.projects ?? []) as any[];
    
    // Log the data structure for debugging
    if (dailyTimesheets) {
      console.log('Daily timesheets data:', dailyTimesheets);
      console.log('Users count:', users.length);
      console.log('Projects count:', projects.length);
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
      users = realOrgMembers.slice(0, 10).map(member => ({
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
    
    // No longer adding dummy data since we now have real API data
    
    // For today's date, clear all task data to show empty columns for daily entry
    if (isToday) {
      users = users.map(user => ({
        ...user,
        total_hours_today: 0,
        total_hours_week: 0,
        in_progress: [],
        completed: [],
        blockers: []
      }));
    }
    
    // Apply member filter first
    if (selectedTimesheetUsers.length > 0) {
      users = users.filter(user => selectedTimesheetUsers.includes(String(user.user_id)));
    }
    
    // Apply search filter
    if (timesheetSearchQuery) {
    const q = timesheetSearchQuery.toLowerCase();
      users = users.filter((u) => {
      const name = String(u.name || '').toLowerCase();
      const email = String(u.email || '').toLowerCase();
      const role = String(u.role || '').toLowerCase();
      const designation = String(u.designation || '').toLowerCase();
      return [name, email, role, designation].some(v => v.includes(q));
    });
    }
    
    return users;
  }, [dailyTimesheets, timesheetSearchQuery, selectedTimesheetUsers, selectedTimesheetDate, realOrgMembers]);

  const getTaskIcon = (status: string) => {
    switch (status) {
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'blocked': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const { data: report, isFetching, isError, error, refetch } = useQuery({
    queryKey: ['reports', filters],
    enabled: !!orgId,
    queryFn: () => fetchOrgReports({ filters }),
  });

  const onExportJSON = () => {
    const blob = new Blob([JSON.stringify(report ?? {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'org-reports.json'; a.click();
    URL.revokeObjectURL(url);
  };

  const onExportCSV = () => {
    if (!report) return;
    const rows: string[] = [];
    rows.push(['project_id', 'project_name', 'user_name', 'email', 'role', 'designation', 'category', 'key', 'count'].join(','));
    for (const proj of (report as any)?.projects || []) {
      for (const m of (proj as any)?.members || []) {
        // Get user display name from userDisplayMap or derive from email
        const userName = userDisplayMap[m.user_id]?.displayName || deriveDisplayFromEmail(m.email || m.user_id).displayName;

        const catMaps = [
          ['tasks_by_status', m.tasks_by_status],
          ['tasks_by_priority', m.tasks_by_priority],
          ['bugs_by_status', m.bugs_by_status],
          ['bugs_by_priority', m.bugs_by_priority],
        ] as const;
        for (const [cat, obj] of catMaps) {
          if (!obj) continue;
          for (const k of Object.keys(obj)) {
            rows.push([
              proj.project_id,
              JSON.stringify(proj.project_name ?? ''),
              JSON.stringify(userName),
              JSON.stringify(m.email ?? ''),
              JSON.stringify(m.role ?? ''),
              JSON.stringify(m.designation ?? ''),
              cat,
              k,
              String(obj[k] ?? 0),
            ].join(','));
          }
        }
      }
    }
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'org-reports.csv'; a.click();
    URL.revokeObjectURL(url);
  };


  const userDisplayMap = React.useMemo(() => {
    const map: Record<string, { displayName: string; initials: string; isOwner: boolean }> = {};
    orgMembers.forEach(m => {
      // const info = deriveDisplayFromEmail(m.email ?? m.user_id);
      map[m.user_id] = {
        displayName: m.displayName,
        initials: m.initials,
        isOwner: m.role === 'owner',
      };
    });
    return map;
  }, [orgMembers]);
  const renderMemberAvatar = (memberId: string, idx: number) => {
    const info = userDisplayMap[memberId];
    return info && (
      <HoverCard key={idx}>
        <HoverCardTrigger asChild>
          <Avatar className="w-8 h-8 border-2 border-white cursor-default">
            <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
              {info?.initials}
            </AvatarFallback>
          </Avatar>
        </HoverCardTrigger>
        <HoverCardContent className="text-sm p-2">
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8 border-2 border-gray-200">
              <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                {info.initials}
              </AvatarFallback>
            </Avatar>
            <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800">
              {info.displayName}
            </Badge>
          </div>
        </HoverCardContent>
      </HoverCard>
    );
  };

  // Function to check if a task is overdue
  const isTaskOverdue = (task: Task) => {
    if (!task.targetDate || task.status === 'completed') return false;

    const dueDate = new Date(task.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for comparison
    dueDate.setHours(0, 0, 0, 0); // Set to start of day for comparison

    return dueDate < today;
  };

  // Enhanced timesheet helper functions
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


  const sortedTimesheetUsers = useMemo(() => {
    const users = [...(filteredTimesheetUsers || [])];
    
    switch (timesheetSort) {
      case 'productivity':
        return users.sort((a, b) => calculateProductivityScore(b) - calculateProductivityScore(a));
      case 'alphabetical':
        return users.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'hours':
        return users.sort((a, b) => (b.total_hours_today || 0) - (a.total_hours_today || 0));
      default:
        return users;
    }
  }, [filteredTimesheetUsers, timesheetSort]);

  // Toggle project expansion
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

  // Check if selected date is today
  const isToday = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = selectedTimesheetDate ? new Date(selectedTimesheetDate) : today;
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate.getTime() === today.getTime();
  }, [selectedTimesheetDate]);

  // Organize users by their primary project
  const usersByProject = useMemo(() => {
    const projectGroups: Record<string, any[]> = {};
    
    sortedTimesheetUsers.forEach(user => {
      // Determine user's primary project based on their tasks
      let primaryProject = 'Unassigned';
      
      // Get all projects from user's tasks
      const userProjects = new Set<string>();
      [...(user.in_progress || []), ...(user.completed || []), ...(user.blockers || [])].forEach(task => {
        if (task.project) {
          userProjects.add(task.project);
        }
      });
      
      // Use the first project or assign based on user role/designation
      if (userProjects.size > 0) {
        primaryProject = Array.from(userProjects)[0];
      } else if (user.designation?.includes('Frontend')) {
        primaryProject = 'TasksMate Frontend';
      } else if (user.designation?.includes('Backend')) {
        primaryProject = 'TasksMate Backend';
      } else if (user.designation?.includes('Design')) {
        primaryProject = 'TasksMate Design';
      } else if (user.designation?.includes('Lead')) {
        primaryProject = 'TasksMate Platform';
      }
      
      if (!projectGroups[primaryProject]) {
        projectGroups[primaryProject] = [];
      }
      projectGroups[primaryProject].push(user);
    });
    
    return projectGroups;
  }, [sortedTimesheetUsers]);

  // Toggle all projects
  const toggleAllProjects = (expand: boolean) => {
    if (expand) {
      setExpandedProjects(new Set(Object.keys(usersByProject)));
    } else {
      setExpandedProjects(new Set());
    }
  };

  // Get primary project ID for a user
  const getUserPrimaryProject = (user: TeamTimesheetUser): string => {
    // Try to get project from user's tasks
    const allTasks = [...(user.in_progress || []), ...(user.completed || []), ...(user.blockers || [])];
    if (allTasks.length > 0) {
      // Find the most common project
      const projectCounts: Record<string, number> = {};
      allTasks.forEach(task => {
        if (task.project) {
          projectCounts[task.project] = (projectCounts[task.project] || 0) + 1;
        }
      });
      
      const mostCommonProject = Object.keys(projectCounts).reduce((a, b) => 
        projectCounts[a] > projectCounts[b] ? a : b
      );
      
      // Find the project ID by name
      const project = projects.find(p => p.name === mostCommonProject);
      if (project) return project.id;
    }
    
    // Fallback: use first available project or create a default one
    if (projects.length > 0) {
      return projects[0].id;
    }
    
    // Last resort: use a default project ID
    return 'default-project';
  };

  // Save timesheet data
  const saveTimesheetData = async (
    userId: string,
    field: 'in_progress' | 'completed' | 'blocked',
    value: string
  ) => {
    if (!selectedTimesheetDate || !orgId) return;

    // Find the user to get their primary project
    const user = filteredTimesheetUsers.find(u => u.user_id === userId);
    if (!user) return;

    const projectId = getUserPrimaryProject(user);

    try {
      const timesheetData: DailyTimesheetCreate = {
        org_id: orgId,
        project_id: projectId,
        user_id: userId,
        entry_date: formatDateForAPI(selectedTimesheetDate),
        [field]: value
      };

      await createOrUpdateDailyTimesheet(timesheetData);
      
      // Refetch the data to show updated information
      refetchTimesheets();
    } catch (error) {
      console.error('Failed to save timesheet data:', error);
      // Could add a toast notification here
    }
  };

  // Organize all tasks by status across users
  const organizedTasks = useMemo(() => {
    const inProgressTasks: Array<any> = [];
    const blockedTasks: Array<any> = [];
    const completedTasks: Array<any> = [];

    sortedTimesheetUsers.forEach(user => {
      // Add user info to each task
      const userInfo = {
        user_id: user.user_id,
        name: user.name || deriveDisplayFromEmail(user.email || user.user_id).displayName,
        avatar_initials: user.avatar_initials || String(user.name || user.user_id).slice(0,2).toUpperCase(),
        designation: user.designation,
        productivityScore: calculateProductivityScore(user),
        productivityLevel: getProductivityLevel(calculateProductivityScore(user))
      };

      (user.in_progress || []).forEach(task => {
        inProgressTasks.push({ ...task, user: userInfo });
      });

      (user.blockers || []).forEach(task => {
        blockedTasks.push({ ...task, user: userInfo });
      });

      if (showCompletedTasks) {
        (user.completed || []).forEach(task => {
          completedTasks.push({ ...task, user: userInfo });
        });
      }
    });

    return {
      inProgress: inProgressTasks,
      blocked: blockedTasks,
      completed: completedTasks
    };
  }, [sortedTimesheetUsers, showCompletedTasks]);


  try {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
        <style>
          {`
        .thin-scroll {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: rgba(156,163,175,0.6) transparent; /* thumb track */
        }
        .thin-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .thin-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(156,163,175,0.6); /* gray-400 */
          border-radius: 9999px;
        }
        .thin-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        `}
        </style>
        <MainNavigation />
        <div className="w-full px-6 py-8 h-full overflow-hidden flex flex-col" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pulse</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Insights into your organization's performance and team activity</p>
          </div>

          <Tabs value={activeTab} onValueChange={v => {
            setActiveTab(v as any);
            // Don't sync search queries between tabs - keep them separate
          }} className="flex flex-col flex-1 overflow-hidden">
            {/* Tabs for Reports / Timesheets */}
            <div className="px-0 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <TabsList>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                    <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
                  </TabsList>


                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                  {/* Search Bar - Always Expanded */}
                  <div className="flex items-center">
                    <div className={`relative transition-all duration-300 ease-out ${isSearchFocused ? 'w-80' : 'w-64'
                      }`}>
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder={activeTab === 'reports' ? "Search projects, members..." : "Search team members, roles, projects..."}
                        value={activeTab === 'reports' ? searchQuery : timesheetSearchQuery}
                        onChange={(e) => 
                          activeTab === 'reports' ? setSearchQuery(e.target.value) : setTimesheetSearchQuery(e.target.value)
                        }
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                        className={`w-full pl-10 pr-10 py-2 bg-white/80 dark:bg-gray-700/80 border rounded-lg text-sm transition-all duration-300 ease-out ${isSearchFocused
                          ? 'border-blue-500 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                          : 'border-gray-300 hover:border-gray-400 focus:outline-none'
                          }`}
                      />
                      {(activeTab === 'reports' ? searchQuery : timesheetSearchQuery) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => activeTab === 'reports' ? setSearchQuery('') : setTimesheetSearchQuery('')}
                          className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 rounded-full hover:bg-gray-100 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {activeTab === 'reports' && (
                    <>
                      <Button variant="outline" onClick={onExportCSV} disabled={!report || isFetching} size="sm">
                        Export CSV
                      </Button>
                      <Button variant="outline" onClick={onExportJSON} disabled={!report || isFetching} size="sm">
                        Export JSON
                      </Button>
                    </>
                  )}
                  { activeTab === 'reports' ? (
                  <Button onClick={() => refetch()} disabled={isFetching} size="sm">
                    <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  ) : (
                  <Button size="sm" onClick={() => refetchTimesheets()} disabled={isTimesheetsFetching}>
                      <RefreshCw className={`w-4 h-4 mr-2 ${isTimesheetsFetching ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  )}
                </div>
              </div>
            </div>
            <TabsContent value="reports" className={`flex flex-col md:flex-row gap-4 flex-1 overflow-hidden mt-0 h-0 ${activeTab === 'reports' ? 'min-h-full' : ''}`}>
              {/* Filters Pane */}
              <div className="flex flex-col gap-4 smooth-transition">
                {!isFiltersPaneOpen && (<Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFiltersPaneOpen(!isFiltersPaneOpen)}
                  className="w-fit"
                  title="Show Filters"
                >
                  <Filter className="w-4 h-4" />

                </Button>)}

                {isFiltersPaneOpen && (
                  <div className="md:w-72 md:flex-shrink-0 smooth-transition">
                    <Card className="p-4 sticky top-4 space-y-4 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsFiltersPaneOpen(!isFiltersPaneOpen)}
                          className="w-fit"
                          title="Hide Filters"
                        >
                          <Filter className="w-4 h-4 mr-2" />
                          Hide Filters
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearFilters}
                          title="Clear all filters"
                          className="w-fit"
                        >
                          Clear
                        </Button>
                      </div>
                      {/* Date Range */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-medium">Date Range</div>
                        <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                          <PopoverTrigger asChild>
                            <Button variant={dateRange?.from ? 'default' : 'outline'} size="sm" className="h-8">
                              <CalendarRange className="w-4 h-4 mr-1" />
                              {dateRange?.from ? 'Selected' : 'Pick'}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-3" align="start"
                            onInteractOutside={(e) => {
                              if ((e.target as HTMLElement).closest('.rdp')) e.preventDefault();
                            }}
                          >
                            <div className="space-y-3">
                              <CalendarComponent
                                mode="range"
                                defaultMonth={tempDateRange?.from}
                                selected={tempDateRange}
                                onSelect={(range) => setTempDateRange(range ?? undefined)}
                                numberOfMonths={2}
                                className="rounded-md border"
                              />
                              <div className="flex justify-between">
                                <Button size="sm" variant="outline" onClick={() => { setDateRange(undefined); setTempDateRange(undefined); setIsDatePopoverOpen(false); }}>Reset</Button>
                                <Button size="sm" onClick={() => { setDateRange(tempDateRange); setIsDatePopoverOpen(false); }}>Apply</Button>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Projects */}
                      <div>
                        <div className="text-sm font-medium mb-2 flex items-center gap-2">
                          <FolderOpen className="w-4 h-4" />
                          Projects
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              <span>{selectedProjects.length ? `${selectedProjects.length} selected` : 'All projects'}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64 max-h-72 overflow-auto">
                            {(projects || []).sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                              <DropdownMenuCheckboxItem
                                key={p.id}
                                checked={selectedProjects.includes(p.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedProjects(prev => checked ? [...prev, p.id] : prev.filter(x => x !== p.id));
                                }}
                                className="cursor-pointer"
                              >
                                {p.name}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Members */}
                      <div>
                        <div className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Members
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              <span>{selectedMembers.length ? `${selectedMembers.length} selected` : 'All members'}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64 max-h-72 overflow-auto">
                            {(realOrgMembers || []).sort((a, b) => a.displayName.localeCompare(b.displayName)).map((m) => (
                              <DropdownMenuCheckboxItem
                                key={m.user_id}
                                checked={selectedMembers.includes(String(m.user_id))}
                                onCheckedChange={(checked) => {
                                  const id = String(m.user_id);
                                  setSelectedMembers(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
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

                      {/* Task Statuses */}
                      <div>
                        <div className="text-sm font-medium mb-2">Task Statuses</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              <span>{taskStatuses.length ? `${taskStatuses.length} selected` : 'All statuses'}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64">
                            {TASK_STATUSES.map(s => (
                              <DropdownMenuCheckboxItem
                                key={s}
                                checked={taskStatuses.includes(s)}
                                onCheckedChange={(checked) => setTaskStatuses(prev => checked ? [...prev, s] : prev.filter(x => x !== s))}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={s} />
                                </div>
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Task Priorities */}
                      <div>
                        <div className="text-sm font-medium mb-2">Task Priorities</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              <span>{taskPriorities.length ? `${taskPriorities.length} selected` : 'All priorities'}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64">
                            {TASK_PRIORITIES.map(s => (
                              <DropdownMenuCheckboxItem
                                key={s}
                                checked={taskPriorities.includes(s)}
                                onCheckedChange={(checked) => setTaskPriorities(prev => checked ? [...prev, s] : prev.filter(x => x !== s))}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <PriorityBadge priority={s} />
                                </div>
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Bug Statuses */}
                      <div>
                        <div className="text-sm font-medium mb-2">Bug Statuses</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              <span>{bugStatuses.length ? `${bugStatuses.length} selected` : 'All statuses'}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64">
                            {BUG_STATUSES.map(s => (
                              <DropdownMenuCheckboxItem
                                key={s}
                                checked={bugStatuses.includes(s)}
                                onCheckedChange={(checked) => setBugStatuses(prev => checked ? [...prev, s] : prev.filter(x => x !== s))}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <StatusBadge status={s} />
                                </div>
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* Bug Priorities */}
                      <div>
                        <div className="text-sm font-medium mb-2">Bug Priorities</div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" className="w-full justify-between">
                              <span>{bugPriorities.length ? `${bugPriorities.length} selected` : 'All priorities'}</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-64">
                            {BUG_PRIORITIES.map(s => (
                              <DropdownMenuCheckboxItem
                                key={s}
                                checked={bugPriorities.includes(s)}
                                onCheckedChange={(checked) => setBugPriorities(prev => checked ? [...prev, s] : prev.filter(x => x !== s))}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2">
                                  <PriorityBadge priority={s} />
                                </div>
                              </DropdownMenuCheckboxItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </Card>
                  </div>
                )}
              </div>

              {/* Results Pane */}
              <div className="flex-1 min-w-0 overflow-hidden">
                <Card className="h-full flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  {/* <CardHeader className="pb-3">
                <CardTitle className="text-lg">Organization Reports</CardTitle>
              </CardHeader> */}
                  <CardContent className="p-0 flex-1 overflow-hidden">
                    {/* {isFetching && (
                      <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader2 className="w-5 h-5 animate-spin mr-2" />
                        Loading reports...
                      </div>
                    )} */}
                    {isError && (
                      <div className="flex flex-col items-center justify-center py-10 text-red-600">
                        <div className="mb-3">Failed to load reports</div>
                        <Button onClick={() => refetch()}>
                          <RefreshCw className="w-4 h-4 mr-2" /> Try again
                        </Button>
                        <div className="text-xs text-gray-500 mt-2">{String((error as any)?.message || '')}</div>
                      </div>
                    )}
                    {!isFetching && !isError && !((report as any)?.projects || []).length && (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-600">
                        <div>No data found</div>
                        <div className="text-xs text-gray-500">Adjust filters and run again</div>
                      </div>
                    )}

                    {/* Sorting toolbar */}
                    {/* <div className="flex items-center gap-2 p-3 border-b">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-between min-w-40">
                        Sort Projects
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
                      <DropdownMenuCheckboxItem checked={projectSort==='name_asc'} onCheckedChange={() => setProjectSort('name_asc')}>Name A→Z</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={projectSort==='name_desc'} onCheckedChange={() => setProjectSort('name_desc')}>Name Z→A</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={projectSort==='members_desc'} onCheckedChange={() => setProjectSort('members_desc')}>Members High→Low</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={projectSort==='id_asc'} onCheckedChange={() => setProjectSort('id_asc')}>Project ID A→Z</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={projectSort==='id_desc'} onCheckedChange={() => setProjectSort('id_desc')}>Project ID Z→A</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="justify-between min-w-40">
                        Sort Members
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-40">
                      <DropdownMenuCheckboxItem checked={memberSort==='name_asc'} onCheckedChange={() => setMemberSort('name_asc')}>Name A→Z</DropdownMenuCheckboxItem>
                      <DropdownMenuCheckboxItem checked={memberSort==='name_desc'} onCheckedChange={() => setMemberSort('name_desc')}>Name Z→A</DropdownMenuCheckboxItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div> */}

                    {/* Side-by-side grid layout for projects */}
                    <div className="overflow-x-auto h-full">

                      <div className="flex flex-row gap-4 p-4 pb-8 min-w-max w-full h-full">
                        {([...((report as any)?.projects ?? [])] as any[])
                          .filter((proj: any) => {
                            if (!searchQuery) return true;
                            const query = searchQuery.toLowerCase();
                            // Search in project name
                            if (String(proj.project_name || '').toLowerCase().includes(query)) return true;
                            // Search in project members
                            return proj.members?.some((m: any) => {
                              const memberName = deriveDisplayFromEmail(m.email || m.user_id).displayName.toLowerCase();
                              return memberName.includes(query) || (m.email || '').toLowerCase().includes(query);
                            });
                          })
                          .sort((a, b) => {
                            if (projectSort === 'name_asc') return String(a.project_name || '').localeCompare(String(b.project_name || ''));
                            if (projectSort === 'name_desc') return String(b.project_name || '').localeCompare(String(a.project_name || ''));
                            if (projectSort === 'members_desc') return ((b.members?.length || 0) - (a.members?.length || 0));
                            if (projectSort === 'id_asc') return String(a.project_id || '').localeCompare(String(b.project_id || ''));
                            if (projectSort === 'id_desc') return String(b.project_id || '').localeCompare(String(a.project_id || ''));
                            return 0;
                          })
                          .map((proj: any) => (
                            <Card key={proj.project_id} className="p-4 space-y-4 w-auto flex flex-col bg-gradient-to-br from-slate-50/80 to-blue-50/60 dark:from-gray-800/90 dark:to-gray-700/90 border-slate-200 dark:border-gray-600" style={{ height: 'calc(100% - 2rem)' }}>
                              <div className="flex items-center justify-between">
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <div className="flex items-center gap-2 cursor-pointer hover:underline"
                                      onClick={() => {
                                        const navUrl = `/projects/${proj.project_id}?org_id=${orgId}`;
                                        window.open(navUrl, '_blank', 'noopener noreferrer');
                                      }}
                                    >
                                      <FolderOpen className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                      <h3 className="font-semibold text-lg break-words text-gray-900 dark:text-gray-100 mr-2">{proj.project_name}</h3>
                                    </div>
                                  </HoverCardTrigger>
                                  <ProjectHoverCard project={proj} orgId={orgId} orgMembers={orgMembers} />
                                </HoverCard>
                                {/* <div className="flex items-center gap-2 cursor-pointer hover:underline">
                              <FolderOpen className="w-4 h-4 text-gray-500" />
                              <h3 className="font-semibold text-lg break-words">{proj.project_name}</h3>
                            </div> */}

                                {/* <div className="flex items-center gap-1">
                              <div className="flex -space-x-2">
                                {proj?.members?.slice(0, 3).map((m, idx) => renderMemberAvatar(m, idx))}

                                {proj?.members?.length > 3 && (
                                  <HoverCard>
                                    <HoverCardTrigger asChild>
                                      <div className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center cursor-pointer">
                                        <span className="text-xs text-gray-600">+{proj?.members?.length - 3}</span>
                                      </div>
                                    </HoverCardTrigger>
                                    <HoverCardContent className="p-2 bg-white w-fit max-w-[280px]">
                                      <div className="text-sm font-medium mb-1">Additional Team Members</div>
                                      <div className="grid grid-cols-2 gap-2">
                                        {proj?.members?.slice(3).map((memberId, idx) => {
                                          const info = userDisplayMap[memberId] ?? deriveDisplayFromEmail(memberId);
                                          return info && (
                                            <div key={idx} className="flex items-center gap-2">
                                              <Avatar className="w-8 h-8 border-2 border-gray-200">
                                                <AvatarFallback className="text-xs bg-tasksmate-gradient text-white">
                                                  {info?.initials}
                                                </AvatarFallback>
                                              </Avatar>
                                              <Badge className="text-xs bg-indigo-100 text-indigo-800 hover:bg-indigo-100 hover:text-indigo-800">
                                                {info?.displayName}
                                              </Badge>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </HoverCardContent>
                                  </HoverCard>
                                )}
                              </div>
                            </div> */}

                                <CopyableIdBadge id={proj.project_id} org_id={orgId} copyLabel="Project" className="bg-blue-600 hover:bg-blue-700 text-white" />
                              </div>

                              <div className="space-y-3 flex-1 overflow-y-auto pr-1 thin-scroll scroll-smooth">
                                {([...((proj as any)?.members ?? [])] as any[])
                                  .sort((a, b) => {
                                    const nameA = deriveDisplayFromEmail(a.email || a.user_id).displayName;
                                    const nameB = deriveDisplayFromEmail(b.email || b.user_id).displayName;
                                    return memberSort === 'name_asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                                  })
                                  .map((m: any) => (
                                    <Card key={m.user_id} className="p-3 bg-white/70 dark:bg-gray-700/50 border-slate-200/50 dark:border-gray-600/50">
                                      <div className="flex items-center gap-3 mb-3">
                                        <Avatar className="w-8 h-8">
                                          <AvatarFallback className="text-sm">
                                            {deriveDisplayFromEmail(m.email || m.user_id).initials}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                          <div className="text-sm font-semibold break-words text-gray-900 dark:text-gray-100">
                                            {deriveDisplayFromEmail(m.email || m.user_id).displayName}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {capitalizeFirstLetter(m.role)} {m.designation ? `• ${m.designation}` : ''}
                                          </div>
                                        </div>
                                      </div>

                                      {
                                        (!m.tasks_items || m.tasks_items.length === 0)
                                          &&
                                          (!m.bugs_items || m.bugs_items.length === 0)
                                          ?
                                          (

                                            <div className="grid grid-cols-2 gap-3 mb-3">
                                              <div>
                                                {/* <div className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Tasks by Status</div> */}
                                                <div className="space-y-1">
                                                  <div className="text-xs text-gray-500 dark:text-gray-400">No tasks or bugs found</div>
                                                </div>
                                              </div>
                                            </div>
                                          )

                                          : (
                                            <>

                                              <div className="grid grid-cols-2 gap-3 mb-3">
                                                <div>
                                                  <div className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Tasks by Status</div>
                                                  <div className="space-y-1">
                                                    {Object.entries(m.tasks_by_status || {}).length === 0 ? (
                                                      <div className="text-xs text-gray-500 dark:text-gray-400">None</div>
                                                    ) : (
                                                      Object.entries(m.tasks_by_status || {}).map(([k, v]) => (
                                                        <div key={k} className="flex items-center justify-between text-xs">
                                                          <StatusBadge status={k} />
                                                          <span className="font-semibold text-gray-800 dark:text-gray-200">{String(v)}</span>
                                                        </div>
                                                      ))
                                                    )}
                                                  </div>
                                                </div>
                                                <div>
                                                  <div className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Tasks by Priority</div>
                                                  <div className="space-y-1">
                                                    {Object.entries(m.tasks_by_priority || {}).length === 0 ? (
                                                      <div className="text-xs text-gray-500 dark:text-gray-400">None</div>
                                                    ) : (
                                                      Object.entries(m.tasks_by_priority || {}).map(([k, v]) => (
                                                        <div key={k} className="flex items-center justify-between text-xs">
                                                          <PriorityBadge priority={k} />
                                                          <span className="font-semibold text-gray-800 dark:text-gray-200">{String(v)}</span>
                                                        </div>
                                                      ))
                                                    )}
                                                  </div>
                                                </div>
                                                <div>
                                                  <div className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Bugs by Status</div>
                                                  <div className="space-y-1">
                                                    {Object.entries(m.bugs_by_status || {}).length === 0 ? (
                                                      <div className="text-xs text-gray-500 dark:text-gray-400">None</div>
                                                    ) : (
                                                      Object.entries(m.bugs_by_status || {}).map(([k, v]) => (
                                                        <div key={k} className="flex items-center justify-between text-xs">
                                                          <StatusBadge status={k} />
                                                          <span className="font-semibold text-gray-800 dark:text-gray-200">{String(v)}</span>
                                                        </div>
                                                      ))
                                                    )}
                                                  </div>
                                                </div>
                                                <div>
                                                  <div className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Bugs by Priority</div>
                                                  <div className="space-y-1">
                                                    {Object.entries(m.bugs_by_priority || {}).length === 0 ? (
                                                      <div className="text-xs text-gray-500 dark:text-gray-400">None</div>
                                                    ) : (
                                                      Object.entries(m.bugs_by_priority || {}).map(([k, v]) => (
                                                        <div key={k} className="flex items-center justify-between text-xs">
                                                          <PriorityBadge priority={k} />
                                                          <span className="font-semibold text-gray-800 dark:text-gray-200">{String(v)}</span>
                                                        </div>
                                                      ))
                                                    )}
                                                  </div>
                                                </div>
                                              </div>

                                              <div className="space-y-3">
                                                <div>
                                                  <div className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Recent Tasks</div>
                                                  {(!m.tasks_items || m.tasks_items.length === 0) && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">No tasks</div>
                                                  )}
                                                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1 thin-scroll scroll-smooth">
                                                    {(m.tasks_items || []).map((t: any) => (
                                                      <div key={t.id} className={`p-2 rounded border border-gray-200 dark:border-gray-500 text-xs
                                                       ${t.status === 'completed'
                                                          ? 'bg-gray-50/60 dark:bg-gray-800/60'
                                                          : isTaskOverdue(t)
                                                            ? 'bg-red-50/60 dark:bg-red-900/20 border-l-4 border-red-500'
                                                            : ''
                                                        }
                                                      `}>
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <div onClick={() => navigate(`/tasks/${t.id}?org_id=${currentOrgId}`)} className="cursor-pointer" title="Open task">
                                                            <CopyableIdBadge id={t.id} org_id={currentOrgId} isCompleted={(t.status || '') === 'completed'} />
                                                          </div>
                                                          <div className="flex gap-1">
                                                            <StatusBadge status={t.status || 'not_started'} />
                                                            <PriorityBadge priority={t.priority || 'none'} />
                                                          </div>
                                                        </div>
                                                        <div className="font-medium font-bold truncate cursor-pointer m-2 text-gray-900 dark:text-gray-100" title={t.title || t.id}
                                                          onClick={() => {
                                                            const navUrl = `/tasks/${t.id}?org_id=${currentOrgId}`;
                                                            window.open(navUrl, '_blank', 'noopener,noreferrer');
                                                          }}
                                                        >{t.title || t.id}</div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>

                                                <div>
                                                  <div className="text-xs font-semibold mb-2 text-gray-700 dark:text-gray-300">Recent Bugs</div>
                                                  {(!m.bugs_items || m.bugs_items.length === 0) && (
                                                    <div className="text-xs text-gray-500 dark:text-gray-400">No bugs</div>
                                                  )}
                                                  <div className="space-y-1 max-h-40 overflow-y-auto pr-1 thin-scroll scroll-smooth">
                                                    {(m.bugs_items || []).map((b: any) => (
                                                      <div key={b.id} className="p-2 bg-white dark:bg-gray-600 rounded border border-gray-200 dark:border-gray-500 text-xs">
                                                        <div className="flex items-center gap-2 mb-1">
                                                          <div onClick={() => navigate(`/tester-zone/bugs/${b.id}?org_id=${currentOrgId}`)} className="cursor-pointer" title="Open bug">
                                                            <CopyableIdBadge id={b.id} org_id={currentOrgId} isCompleted={b?.closed || b?.status === 'closed'}
                                                              tracker_id={b?.tracker_id || b?.run_id}
                                                              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                                                              copyLabel="Bug" />
                                                          </div>
                                                          <div className="flex gap-1">
                                                            <StatusBadge status={b.status || 'open'} />
                                                            <PriorityBadge priority={b.priority || 'low'} />
                                                          </div>
                                                        </div>
                                                        <div className="font-medium font-bold truncate m-2 cursor-pointer text-gray-900 dark:text-gray-100" title={b.title || b.id}
                                                          onClick={() => {
                                                            const navUrl = `/tester-zone/bugs/${b.id}?org_id=${currentOrgId}`;
                                                            window.open(navUrl, '_blank', 'noopener,noreferrer');
                                                          }}
                                                        >{b.title || b.id}</div>
                                                      </div>
                                                    ))}
                                                  </div>
                                                </div>
                                              </div>

                                            </>
                                          )}
                                    </Card>

                                  ))}
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="timesheets" className={`flex flex-1 overflow-hidden mt-0 h-0 ${activeTab === 'timesheets' ? 'min-h-full' : ''}`}>
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
                        <FolderOpen className="w-4 h-4 mr-2" />
                              {selectedTimesheetProjects.length ? `${selectedTimesheetProjects.length} Selected` : 'All Projects'}
                            </div>
                            <ChevronRight className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 max-h-72 overflow-auto">
                      {(projects || []).sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                        <DropdownMenuCheckboxItem
                          key={p.id}
                          checked={selectedTimesheetProjects.includes(p.id)}
                          onCheckedChange={(checked) => {
                            setSelectedTimesheetProjects(prev => checked ? [...prev, p.id] : prev.filter(x => x !== p.id));
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
                      {(realOrgMembers || []).sort((a, b) => a.displayName.localeCompare(b.displayName)).map((m) => (
                        <DropdownMenuCheckboxItem
                          key={m.user_id}
                          checked={selectedTimesheetUsers.includes(String(m.user_id))}
                          onCheckedChange={(checked) => {
                            const id = String(m.user_id);
                            setSelectedTimesheetUsers(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
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
                                        const selectedMember = realOrgMembers.find(m => String(m.user_id) === selectedTimesheetUsers[0]);
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
                                    onClick={() => setSelectedTimesheetUsers(realOrgMembers.map(m => String(m.user_id)))}
                                    className="h-7 px-2 text-xs"
                                  >
                                    Select All
                                  </Button>
                                </div>
                                
                                {/* Member List */}
                                {(realOrgMembers || []).sort((a, b) => a.displayName.localeCompare(b.displayName)).map((m) => (
                                  <DropdownMenuCheckboxItem
                                    key={m.user_id}
                                    checked={selectedTimesheetUsers.includes(String(m.user_id))}
                                    onCheckedChange={(checked) => {
                                      const id = String(m.user_id);
                                      setSelectedTimesheetUsers(prev => 
                                        checked 
                                          ? [...prev, id] 
                                          : prev.filter(x => x !== id)
                                      );
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
                  {isTimesheetsFetching && (
                    <div className="flex-1 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-lg font-medium text-gray-600">Loading team insights...</p>
                        <p className="text-sm text-gray-500">Organizing tasks by status</p>
                      </div>
                    </div>
                  )}

                  {/* Project-based Member Cards */}
                  {!isTimesheetsFetching && (
                    <div className="flex-1 overflow-hidden">
                      <div className="h-full overflow-y-auto thin-scroll">
                        <div className="p-4 pb-8 space-y-6">
                          {Object.entries(usersByProject)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([projectName, projectUsers]) => (
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
                                        {projectUsers.slice(0, 3).map((user, idx) => (
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
                                                  {projectUsers.slice(3).map((user, idx) => (
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
                                      {projectUsers
                                        .filter((user: any) => {
                                          if (!timesheetSearchQuery) return true;
                                          const query = timesheetSearchQuery.toLowerCase();
                                          const userName = String(user.name || '').toLowerCase();
                                          const email = String(user.email || '').toLowerCase();
                                          const designation = String(user.designation || '').toLowerCase();
                                          return [userName, email, designation].some(v => v.includes(query));
                                        })
                                        .map((user: any) => {
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
                                                <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-blue-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-text">
                                                  <textarea
                                                    className="w-full h-32 p-3 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                                    placeholder={isToday ? "Add today's in-progress tasks and notes..." : "Add in-progress tasks and notes..."}
                                                    defaultValue={(() => {
                                                      let content = '';
                                                      (user.in_progress || []).forEach((task: any) => {
                                                        content += `• ${task.title}${task.project ? ` (${task.project})` : ''}${task.hours_logged ? ` - ${task.hours_logged}h` : ''}\n`;
                                                      });
                                                      return content.trim();
                                                    })()}
                                                    onFocus={(e) => {
                                                      e.target.parentElement?.classList.add('ring-2', 'ring-blue-500', 'ring-opacity-50');
                                                    }}
                                                    onBlur={(e) => {
                                                      e.target.parentElement?.classList.remove('ring-2', 'ring-blue-500', 'ring-opacity-50');
                                                      // Save the data when user finishes editing
                                                      saveTimesheetData(user.user_id, 'in_progress', e.target.value);
                                                    }}
                                                  />
                                                  <div className="px-3 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-b-lg border-t border-blue-200 dark:border-blue-600">
                                                    <div className="flex items-center justify-end text-xs">
                                                      <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-blue-600 hover:bg-blue-100">
                                                        <Save className="w-3 h-3 mr-1" />
                                                        Save
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
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
                                                <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-red-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-text">
                                                  <textarea
                                                    className="w-full h-32 p-3 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                                    placeholder={isToday ? "Add today's blocked tasks and reasons..." : "Add blocked tasks and reasons..."}
                                                    defaultValue={(() => {
                                                      let content = '';
                                                      (user.blockers || []).forEach((task: any) => {
                                                        content += `• ${task.title}${task.project ? ` (${task.project})` : ''}${task.blocked_reason ? ` - ${task.blocked_reason}` : ''}\n`;
                                                      });
                                                      return content.trim();
                                                    })()}
                                                    onFocus={(e) => {
                                                      e.target.parentElement?.classList.add('ring-2', 'ring-red-500', 'ring-opacity-50');
                                                    }}
                                                    onBlur={(e) => {
                                                      e.target.parentElement?.classList.remove('ring-2', 'ring-red-500', 'ring-opacity-50');
                                                      // Save the data when user finishes editing
                                                      saveTimesheetData(user.user_id, 'blocked', e.target.value);
                                                    }}
                                                  />
                                                  <div className="px-3 py-2 bg-red-50 dark:bg-red-900/30 rounded-b-lg border-t border-red-200 dark:border-red-600">
                                                    <div className="flex items-center justify-end text-xs">
                                                      <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-red-600 hover:bg-red-100">
                                                        <Save className="w-3 h-3 mr-1" />
                                                        Save
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </div>
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
                                                  <div className="bg-white dark:bg-gray-800 rounded-lg border-l-4 border-green-500 shadow-sm hover:shadow-md transition-all duration-200 cursor-text">
                                                    <textarea
                                                      className="w-full h-32 p-3 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                                                      placeholder={isToday ? "Add today's completed tasks and notes..." : "Add completed tasks and notes..."}
                                                      defaultValue={(() => {
                                                        let content = '';
                                                        (user.completed || []).forEach((task: any) => {
                                                          content += `• ${task.title}${task.project ? ` (${task.project})` : ''}${task.hours_logged ? ` - ${task.hours_logged}h` : ''}\n`;
                                                        });
                                                        return content.trim();
                                                      })()}
                                                      onFocus={(e) => {
                                                        e.target.parentElement?.classList.add('ring-2', 'ring-green-500', 'ring-opacity-50');
                                                      }}
                                                      onBlur={(e) => {
                                                        e.target.parentElement?.classList.remove('ring-2', 'ring-green-500', 'ring-opacity-50');
                                                        // Save the data when user finishes editing
                                                        saveTimesheetData(user.user_id, 'completed', e.target.value);
                                                      }}
                                                    />
                                                    <div className="px-3 py-2 bg-green-50 dark:bg-green-900/30 rounded-b-lg border-t border-green-200 dark:border-green-600">
                                                      <div className="flex items-center justify-end text-xs">
                                                        <Button variant="ghost" size="sm" className="h-5 px-2 text-xs text-green-600 hover:bg-green-100">
                                                          <Save className="w-3 h-3 mr-1" />
                                                          Save
                                                        </Button>
                                                      </div>
                                                    </div>
                                                  </div>
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
                  ))}
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
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering OrgReports component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MainNavigation />
        <div className="w-full px-6 py-8 h-full overflow-hidden flex flex-col" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        <div className="text-center p-4 items-center justify-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
          <p className="text-gray-600 mb-4">There was an error rendering the reports page.</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
        </div>
      </div>
    );
  }
};

export default OrgReports;