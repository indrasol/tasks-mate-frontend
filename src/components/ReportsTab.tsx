// React and hooks
import { useQuery } from '@tanstack/react-query';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DateRange } from 'react-day-picker';
import { useSearchParams } from 'react-router-dom';

// UI Components
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent } from '@/components/ui/card';
import CopyableIdBadge from '@/components/ui/copyable-id-badge';
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
  CalendarRange,
  Filter,
  FolderOpen,
  RefreshCw,
  Search,
  Users,
  X
} from 'lucide-react';

// Services and utilities
// import { API_ENDPOINTS } from '@/config';
import { fetchOrgReports, ReportsFilters } from '@/services/reportsService';
// import { api } from '@/services/apiService';
import { capitalizeFirstLetter, deriveDisplayFromEmail, getPriorityColor, getStatusMeta } from '@/lib/projectUtils';
import { BackendOrgMember } from '@/types/organization';
import { Task } from '@/types/tasks';

// Constants
const TASK_STATUSES = ['not_started', 'in_progress', 'blocked', 'on_hold', 'completed'];
const TASK_PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'];
const BUG_STATUSES = ['open', 'in_progress', 'in_review', 'resolved', 'reopened', 'closed', 'won_t_fix', 'duplicate'];
const BUG_PRIORITIES = ['critical', 'high', 'medium', 'low'];

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface ReportsTabProps {
  orgId: string;
  projectsFromParent: any[];
  realOrgMembers: BackendOrgMember[];
  // fetchProjects: () => void;
  // searchQuery: string;
  // setSearchQuery: (query: string) => void;
  // isSearchFocused: boolean;
  // setIsSearchFocused: (focused: boolean) => void;

  // exportCSV: boolean;
  // setExportCSV: (exportCSV: boolean) => void;
  // exportJSON: boolean;
  // setExportJSON: (exportJSON: boolean) => void;
  // fetchReport:boolean;
  // setFetchReport: (fetchReport: boolean) => void;
  // isReportFetching: boolean;
  // setIsReportFetching: (isReportFetching: boolean) => void;

  // isReportAvailable: boolean;
  // setIsReportAvailable: (isReportAvailable: boolean) => void;
}

type ProjectSortType = 'name_asc' | 'name_desc' | 'members_desc' | 'id_asc' | 'id_desc';
type MemberSortType = 'name_asc' | 'name_desc';

// ============================================================================
// UTILITY COMPONENTS
// ============================================================================

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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const ReportsTab: React.FC<ReportsTabProps> = ({
  orgId,
  projectsFromParent,
  realOrgMembers,
  // fetchProjects,
  // searchQuery,
  // setSearchQuery,
  // isSearchFocused,
  // setIsSearchFocused,
  // exportCSV,
  // setExportCSV,
  // exportJSON,
  // setExportJSON,
  // fetchReport,
  // setFetchReport,
  // isReportFetching,
  // setIsReportFetching,
  // isReportAvailable,
  // setIsReportAvailable,
}) => {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [projects, setProjects] = useState<{ id: string; name: string; members: string[] }[]>(projectsFromParent);
  const [isFiltersPaneOpen, setIsFiltersPaneOpen] = useState(false);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [taskStatuses, setTaskStatuses] = useState<string[]>([]);
  const [taskPriorities, setTaskPriorities] = useState<string[]>([]);
  const [bugStatuses, setBugStatuses] = useState<string[]>([]);
  const [bugPriorities, setBugPriorities] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [projectSort, setProjectSort] = useState<ProjectSortType>('name_asc');
  const [memberSort, setMemberSort] = useState<MemberSortType>('name_asc');
  const [searchParams, setSearchParams] = useSearchParams();

  // ============================================================================
  // DATA FETCHING
  // ============================================================================

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
    }

    const now = new Date();
    const defaultFrom = new Date();
    defaultFrom.setDate(defaultFrom.getDate() - 30);

    if (!from && !to) {
      setDateRange({ from: defaultFrom, to: now });
    } else if (!from) {
      const fromDate = new Date(to);
      fromDate.setDate(fromDate.getDate() - 30);
      setDateRange({ from: fromDate, to: new Date(to) });
    } else if (!to) {
      const toDate = new Date(from);
      toDate.setDate(toDate.getDate() + 30);
      setDateRange({ from: new Date(from), to: toDate });
    }
  }, []);



  // Memoize filter arrays to prevent unstable references
  const memoizedSelectedProjects = useMemo(() => selectedProjects, [selectedProjects]);
  const memoizedSelectedMembers = useMemo(() => selectedMembers, [selectedMembers]);
  const memoizedTaskStatuses = useMemo(() => taskStatuses, [taskStatuses]);
  const memoizedTaskPriorities = useMemo(() => taskPriorities, [taskPriorities]);
  const memoizedBugStatuses = useMemo(() => bugStatuses, [bugStatuses]);
  const memoizedBugPriorities = useMemo(() => bugPriorities, [bugPriorities]);

  const filters: ReportsFilters = useMemo(() => ({
    org_id: orgId,
    project_ids: memoizedSelectedProjects.length ? memoizedSelectedProjects : undefined,
    member_ids: memoizedSelectedMembers.length ? memoizedSelectedMembers : undefined,
    date_from: dateRange?.from?.toISOString(),
    date_to: dateRange?.to?.toISOString(),
    task_statuses: memoizedTaskStatuses.length ? memoizedTaskStatuses : undefined,
    task_priorities: memoizedTaskPriorities.length ? memoizedTaskPriorities : undefined,
    bug_statuses: memoizedBugStatuses.length ? memoizedBugStatuses : undefined,
    bug_priorities: memoizedBugPriorities.length ? memoizedBugPriorities : undefined,
  }), [orgId, memoizedSelectedProjects, memoizedSelectedMembers, dateRange, memoizedTaskStatuses, memoizedTaskPriorities, memoizedBugStatuses, memoizedBugPriorities]);

  // Create a stable query key using individual values
  const queryKey = useMemo(() => [
    'reports',
    orgId,
    memoizedSelectedProjects.join(','),
    memoizedSelectedMembers.join(','),
    dateRange?.from?.toISOString(),
    dateRange?.to?.toISOString(),
    memoizedTaskStatuses.join(','),
    memoizedTaskPriorities.join(','),
    memoizedBugStatuses.join(','),
    memoizedBugPriorities.join(',')
  ], [orgId, memoizedSelectedProjects, memoizedSelectedMembers, dateRange, memoizedTaskStatuses, memoizedTaskPriorities, memoizedBugStatuses, memoizedBugPriorities]);

  const { data: report, isFetching, isError, error, refetch } = useQuery({
    queryKey,
    enabled: !!orgId && orgId.length > 0,
    queryFn: () => fetchOrgReports({ filters }),
  });

  // useEffect(() => {
  //   if (report && (report as any)?.projects?.length > 0) {
  //     setIsReportAvailable(true);
  //   } else {
  //     setIsReportAvailable(false);
  //   }
  // }, [report]);

  // useEffect(() => {
  //   if (fetchReport) {
  //     refetch();
  //     setFetchReport(false);
  //   }
  // }, [fetchReport, refetch]); 

  // useEffect(() => {
  //   setIsReportFetching(isFetching);
  // }, [isFetching]);
  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const resetFilters = () => {
    setSelectedProjects([]);
    setSelectedMembers([]);
    setTaskStatuses([]);
    setTaskPriorities([]);
    setBugStatuses([]);
    setBugPriorities([]);
    setDateRange(undefined);
  };

  // const getTaskIcon = (status: string) => {
  //   switch (status) {
  //     case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
  //     case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
  //     case 'blocked': return <AlertTriangle className="w-4 h-4 text-red-500" />;
  //     default: return <Clock className="w-4 h-4 text-gray-500" />;
  //   }
  // };

  const onExportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(report ?? {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'org-reports.json'; a.click();
    URL.revokeObjectURL(url);
    // setExportJSON(false); // Reset export state after export
  }, [report]);

  const onExportCSV = useCallback(() => {
    if (!report) return;
    const rows: string[] = [];
    rows.push(['project_id', 'project_name', 'user_name', 'email', 'role', 'designation', 'category', 'key', 'count'].join(','));
    for (const proj of (report as any)?.projects || []) {
      for (const m of (proj as any)?.members || []) {
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
    // setExportCSV(false); // Reset export state after export
  }, [report]);

  // useEffect(() => {
  //   if (exportCSV) {
  //     onExportCSV();
  //   }
  // }, [exportCSV, onExportCSV]);

  // useEffect(() => {
  //   if (exportJSON) {
  //     onExportJSON();
  //   }
  // }, [exportJSON, onExportJSON]);

  const isTaskOverdue = useCallback((task: Task) => {
    if (!task.targetDate || task.status === 'completed') return false;

    const dueDate = new Date(task.targetDate);
    const today = new Date();
    // Set both dates to midnight for accurate comparison
    dueDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    return dueDate < today;
  }, []);

  // ============================================================================
  // MEMOIZED VALUES
  // ============================================================================

  const userDisplayMap = React.useMemo(() => {
    const map: Record<string, { displayName: string; initials: string; isOwner: boolean }> = {};
    (realOrgMembers || []).forEach(m => {
      map[m.user_id] = {
        displayName: m.displayName,
        initials: m.initials,
        isOwner: m.role === 'owner',
      };
    });
    return map;
  }, [realOrgMembers]);

  // Memoize sorted arrays for dropdowns
  const sortedProjects = useMemo(() =>
    (projects || []).sort((a, b) => a.name.localeCompare(b.name)),
    [projects]
  );

  const sortedMembers = useMemo(() =>
    (realOrgMembers || []).sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [realOrgMembers]
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  // Memoize filtered and sorted report data
  const filteredAndSortedProjects = useMemo(() => {
    if (!report || !(report as any)?.projects) return [];

    return (report as any).projects
      .filter((proj: any) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        if (String(proj.project_name || '').toLowerCase().includes(query)) return true;
        return proj.members?.some((m: any) => {
          const memberName = userDisplayMap[m.user_id]?.displayName || deriveDisplayFromEmail(m.email || m.user_id).displayName;
          return memberName.toLowerCase().includes(query) || (m.email || '').toLowerCase().includes(query);
        });
      })
      .sort((a: any, b: any) => {
        if (projectSort === 'name_asc') return String(a.project_name || '').localeCompare(String(b.project_name || ''));
        if (projectSort === 'name_desc') return String(b.project_name || '').localeCompare(String(a.project_name || ''));
        if (projectSort === 'members_desc') return ((b.members?.length || 0) - (a.members?.length || 0));
        if (projectSort === 'id_asc') return String(a.project_id || '').localeCompare(String(b.project_id || ''));
        if (projectSort === 'id_desc') return String(b.project_id || '').localeCompare(String(a.project_id || ''));
        return 0;
      });
  }, [report, searchQuery, projectSort, userDisplayMap]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // useEffect(() => {
  //   setProjects(projectsFromParent);
  // }, [projectsFromParent]);

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
  }, [filters, searchParams, setSearchParams]);



  // useEffect(() => {
  //   console.log('=== ReportsTab State Changes ===');
  //   console.log('projects:', projects);
  //   console.log('filters:', filters);
  //   console.log('dateRange:', dateRange);
  //   console.log('isFetching:', isFetching);
  //   console.log('report:', report);
  //   console.log('================================');
  // }, [projects, filters, dateRange, isFetching, report]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex flex-col flex-1 overflow-hidden h-full">
      {/* Action Buttons */}
      <div className="flex items-center gap-2 mb-4 justify-between">
        {/* Search Bar */}
        <div className="flex items-center">
          <div className={`relative transition-all duration-300 ease-out ${isSearchFocused ? 'w-80' : 'w-64'}`}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects, members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className={`w-full pl-10 pr-10 py-2 bg-white/80 dark:bg-gray-700/80 border rounded-lg text-sm transition-all duration-300 ease-out ${isSearchFocused
                ? 'border-blue-500 shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/20'
                : 'border-gray-300 hover:border-gray-400 focus:outline-none'
                }`}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 w-8 h-8 p-0 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onExportCSV} disabled={!report || isFetching} size="sm">
            Export CSV
          </Button>
          <Button variant="outline" onClick={onExportJSON} disabled={!report || isFetching} size="sm">
            Export JSON
          </Button>
          <Button onClick={() => refetch()} disabled={isFetching} size="sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 overflow-hidden">
        {/* Filters Pane */}
        <div className="flex flex-col gap-4 smooth-transition">
          {!isFiltersPaneOpen && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFiltersPaneOpen(!isFiltersPaneOpen)}
              className="w-fit"
              title="Show Filters"
            >
              <Filter className="w-4 h-4" />
            </Button>
          )}

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
                    onClick={resetFilters}
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
                          defaultMonth={dateRange?.from}
                          selected={dateRange}
                          onSelect={(range) => setDateRange(range ?? undefined)}
                          numberOfMonths={2}
                          className="rounded-md border"
                        />
                        <div className="flex justify-between">
                          <Button size="sm" variant="outline" onClick={() => { setDateRange(undefined); setIsDatePopoverOpen(false); }}>Reset</Button>
                          <Button size="sm" onClick={() => { setIsDatePopoverOpen(false); }}>Apply</Button>
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
                      {(sortedProjects || []).map((p) => (
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
                      {(sortedMembers || []).map((m) => (
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
            <CardContent className="p-0 flex-1 overflow-hidden">
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

              {/* Side-by-side grid layout for projects */}
              <div className="overflow-x-auto h-full">
                <div className="flex flex-row gap-4 p-4 pb-8 min-w-max w-full h-full">
                  {(filteredAndSortedProjects || []).map((proj: any) => (
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
                          <ProjectHoverCard project={proj} orgId={orgId} orgMembers={realOrgMembers} />
                        </HoverCard>

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

                              {(!m.tasks_items || m.tasks_items.length === 0) && (!m.bugs_items || m.bugs_items.length === 0) ? (
                                <div className="grid grid-cols-2 gap-3 mb-3">
                                  <div>
                                    <div className="space-y-1">
                                      <div className="text-xs text-gray-500 dark:text-gray-400">No tasks or bugs found</div>
                                    </div>
                                  </div>
                                </div>
                              ) : (
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
                                              <div onClick={() => {
                                                const navUrl = `/tasks/${t.id}?org_id=${orgId}`;
                                                window.open(navUrl, '_blank', 'noopener,noreferrer');
                                              }} className="cursor-pointer" title="Open task">
                                                <CopyableIdBadge id={t.id} org_id={orgId} isCompleted={(t.status || '') === 'completed'} />
                                              </div>
                                              <div className="flex gap-1">
                                                <StatusBadge status={t.status || 'not_started'} />
                                                <PriorityBadge priority={t.priority || 'none'} />
                                              </div>
                                            </div>
                                            <div className="font-medium font-bold truncate cursor-pointer m-2 text-gray-900 dark:text-gray-100" title={t.title || t.id}
                                              onClick={() => {
                                                const navUrl = `/tasks/${t.id}?org_id=${orgId}`;
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
                                              <div onClick={() => {
                                                const navUrl = `/tester-zone/bugs/${b.id}?org_id=${orgId}`;
                                                window.open(navUrl, '_blank', 'noopener,noreferrer');
                                              }} className="cursor-pointer" title="Open bug">
                                                <CopyableIdBadge id={b.id} org_id={orgId} isCompleted={b?.closed || b?.status === 'closed'}
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
                                                const navUrl = `/tester-zone/bugs/${b.id}?org_id=${orgId}`;
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
      </div>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default ReportsTab;
