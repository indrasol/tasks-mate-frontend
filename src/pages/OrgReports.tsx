import MainNavigation from '@/components/navigation/MainNavigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import CopyableIdBadge from '@/components/ui/copyable-id-badge';
import { API_ENDPOINTS } from '@/config';
import { fetchOrgReports, ReportsFilters } from '@/services/reportsService';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { api } from '@/services/apiService';
import { CalendarRange, Filter, FolderOpen, Loader2, RefreshCw, Users } from 'lucide-react';

const TASK_STATUSES = ['not_started', 'in_progress', 'blocked', 'on_hold', 'completed'];
const TASK_PRIORITIES = ['critical', 'high', 'medium', 'low', 'none'];
const BUG_STATUSES = ['open', 'in_progress', 'in_review', 'resolved', 'reopened', 'closed', 'won_t_fix', 'duplicate'];
const BUG_PRIORITIES = ['critical', 'high', 'medium', 'low'];


import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";

import { capitalizeFirstLetter, deriveDisplayFromEmail, getPriorityColor, getStatusMeta } from '@/lib/projectUtils';
import { BackendOrgMember } from '@/types/organization';
import DateBadge from '@/components/ui/date-badge';

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
          <CopyableIdBadge id={project?.project_id} org_id={orgId} copyLabel="Project" className="text-xs" />
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
  const orgId = useMemo(() => searchParams.get('org_id') || '', [searchParams]);

  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Handle authentication and loading BEFORE any other hooks
  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  // Early returns AFTER useEffect but BEFORE other hooks
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

  const currentOrgId = useCurrentOrgId();
  const { data: orgMembersRaw } = useOrganizationMembers(currentOrgId);
  const orgMembers: BackendOrgMember[] = useMemo(() => (orgMembersRaw?.map((m: any) => ({
    ...m,
    name: ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id,
  })).map((m: any) => ({
    ...m,
    displayName: deriveDisplayFromEmail(m.name).displayName,
    initials: deriveDisplayFromEmail(m.name).initials,
  })) ?? []) as BackendOrgMember[], [orgMembersRaw]);

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
    rows.push(['project_id', 'project_name', 'user_id', 'email', 'role', 'designation', 'category', 'key', 'count'].join(','));
    for (const proj of (report as any)?.projects || []) {
      for (const m of (proj as any)?.members || []) {
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
              m.user_id,
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

  return (
    <div className="flex h-screen overflow-hidden">
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
      <div className="ml-[var(--sidebar-width,16rem)] w-full p-4 h-full overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Reports</h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onExportCSV} disabled={!report || isFetching}>Export CSV</Button>
            <Button variant="outline" onClick={onExportJSON} disabled={!report || isFetching}>Export JSON</Button>
            <Button variant="outline" onClick={clearFilters} title="Clear all filters">Clear</Button>
            <Button onClick={() => refetch()} disabled={isFetching}>Run</Button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 h-full overflow-hidden">
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
                <Card className="p-4 sticky top-4 space-y-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsFiltersPaneOpen(!isFiltersPaneOpen)}
                    className="w-fit"
                    title="Hide Filters"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    {isFiltersPaneOpen ? 'Hide Filters' : 'Show Filters'}
                  </Button>
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
                        {(orgMembers || []).sort((a, b) => a.displayName.localeCompare(b.displayName)).map((m) => (
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
            <Card className="h-full">
              {/* <CardHeader className="pb-3">
                <CardTitle className="text-lg">Organization Reports</CardTitle>
              </CardHeader> */}
              <CardContent className="p-0 h-full overflow-y-auto">
                {isFetching && (
                  <div className="flex items-center justify-center py-10 text-gray-500">
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Loading reports...
                  </div>
                )}
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
                <div className="overflow-x-auto">

                  <div className="flex flex-row gap-4 p-4 min-w-max w-full">
                    {([...((report as any)?.projects ?? [])] as any[])
                      .sort((a, b) => {
                        if (projectSort === 'name_asc') return String(a.project_name || '').localeCompare(String(b.project_name || ''));
                        if (projectSort === 'name_desc') return String(b.project_name || '').localeCompare(String(a.project_name || ''));
                        if (projectSort === 'members_desc') return ((b.members?.length || 0) - (a.members?.length || 0));
                        if (projectSort === 'id_asc') return String(a.project_id || '').localeCompare(String(b.project_id || ''));
                        if (projectSort === 'id_desc') return String(b.project_id || '').localeCompare(String(a.project_id || ''));
                        return 0;
                      })
                      .map((proj: any) => (
                        <Card key={proj.project_id} className="p-4 space-y-4 w-auto">
                          <div className="flex items-center justify-between">
                            <HoverCard>
                              <HoverCardTrigger asChild>
                                <div className="flex items-center gap-2 cursor-pointer hover:underline"
                                  onClick={() => {
                                    const navUrl = `/projects/${proj.project_id}?org_id=${orgId}`;
                                    window.open(navUrl, '_blank', 'noopener noreferrer');
                                  }}
                                >
                                  <FolderOpen className="w-4 h-4 text-gray-500" />
                                  <h3 className="font-semibold text-lg break-words">{proj.project_name}</h3>
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

                            <CopyableIdBadge id={proj.project_id} org_id={orgId} copyLabel="Project" />
                          </div>

                          <div className="space-y-3 max-h-[28rem] overflow-y-auto pr-1 thin-scroll scroll-smooth">
                            {([...((proj as any)?.members ?? [])] as any[])
                              .sort((a, b) => {
                                const nameA = deriveDisplayFromEmail(a.email || a.user_id).displayName;
                                const nameB = deriveDisplayFromEmail(b.email || b.user_id).displayName;
                                return memberSort === 'name_asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
                              })
                              .map((m: any) => (
                                <Card key={m.user_id} className="p-3 bg-gray-50">
                                  <div className="flex items-center gap-3 mb-3">
                                    <Avatar className="w-8 h-8">
                                      <AvatarFallback className="text-sm">
                                        {deriveDisplayFromEmail(m.email || m.user_id).initials}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-semibold break-words">
                                        {deriveDisplayFromEmail(m.email || m.user_id).displayName}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {capitalizeFirstLetter(m.role)} {m.designation ? `• ${m.designation}` : ''}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-3 mb-3">
                                    <div>
                                      <div className="text-xs font-semibold mb-2 text-gray-700">Tasks by Status</div>
                                      <div className="space-y-1">
                                        {Object.entries(m.tasks_by_status || {}).length === 0 ? (
                                          <div className="text-xs text-gray-500">None</div>
                                        ) : (
                                          Object.entries(m.tasks_by_status || {}).map(([k, v]) => (
                                            <div key={k} className="flex items-center justify-between text-xs">
                                              <StatusBadge status={k} />
                                              <span className="font-semibold">{String(v)}</span>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold mb-2 text-gray-700">Tasks by Priority</div>
                                      <div className="space-y-1">
                                        {Object.entries(m.tasks_by_priority || {}).length === 0 ? (
                                          <div className="text-xs text-gray-500">None</div>
                                        ) : (
                                          Object.entries(m.tasks_by_priority || {}).map(([k, v]) => (
                                            <div key={k} className="flex items-center justify-between text-xs">
                                              <PriorityBadge priority={k} />
                                              <span className="font-semibold">{String(v)}</span>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold mb-2 text-gray-700">Bugs by Status</div>
                                      <div className="space-y-1">
                                        {Object.entries(m.bugs_by_status || {}).length === 0 ? (
                                          <div className="text-xs text-gray-500">None</div>
                                        ) : (
                                          Object.entries(m.bugs_by_status || {}).map(([k, v]) => (
                                            <div key={k} className="flex items-center justify-between text-xs">
                                              <StatusBadge status={k} />
                                              <span className="font-semibold">{String(v)}</span>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs font-semibold mb-2 text-gray-700">Bugs by Priority</div>
                                      <div className="space-y-1">
                                        {Object.entries(m.bugs_by_priority || {}).length === 0 ? (
                                          <div className="text-xs text-gray-500">None</div>
                                        ) : (
                                          Object.entries(m.bugs_by_priority || {}).map(([k, v]) => (
                                            <div key={k} className="flex items-center justify-between text-xs">
                                              <PriorityBadge priority={k} />
                                              <span className="font-semibold">{String(v)}</span>
                                            </div>
                                          ))
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-3">
                                    <div>
                                      <div className="text-xs font-semibold mb-2 text-gray-700">Recent Tasks</div>
                                      {(!m.tasks_items || m.tasks_items.length === 0) && (
                                        <div className="text-xs text-gray-500">No tasks</div>
                                      )}
                                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1 thin-scroll scroll-smooth">
                                        {(m.tasks_items || []).map((t: any) => (
                                          <div key={t.id} className="p-2 bg-white rounded border text-xs">
                                            <div className="flex items-center gap-2 mb-1">
                                              <div onClick={() => navigate(`/tasks/${t.id}?org_id=${currentOrgId}`)} className="cursor-pointer" title="Open task">
                                                <CopyableIdBadge id={t.id} org_id={currentOrgId} isCompleted={(t.status || '') === 'completed'} />
                                              </div>
                                              <div className="flex gap-1">
                                                <StatusBadge status={t.status || 'not_started'} />
                                                <PriorityBadge priority={t.priority || 'none'} />
                                              </div>
                                            </div>
                                            <div className="font-medium truncate cursor-pointer mt-1" title={t.title || t.id}
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
                                      <div className="text-xs font-semibold mb-2 text-gray-700">Recent Bugs</div>
                                      {(!m.bugs_items || m.bugs_items.length === 0) && (
                                        <div className="text-xs text-gray-500">No bugs</div>
                                      )}
                                      <div className="space-y-1 max-h-40 overflow-y-auto pr-1 thin-scroll scroll-smooth">
                                        {(m.bugs_items || []).map((b: any) => (
                                          <div key={b.id} className="p-2 bg-white rounded border text-xs">
                                            <div className="flex items-center gap-2 mb-1">
                                              <div onClick={() => navigate(`/tester-zone/bugs/${b.id}?org_id=${currentOrgId}`)} className="cursor-pointer" title="Open bug">
                                                <CopyableIdBadge id={b.id} org_id={currentOrgId} copyLabel="Bug" />
                                              </div>
                                              <div className="flex gap-1">
                                                <StatusBadge status={b.status || 'open'} />
                                                <PriorityBadge priority={b.priority || 'low'} />
                                              </div>
                                            </div>
                                            <div className="font-medium truncate mt-1 cursor-pointer" title={b.title || b.id}
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
    </div>
  );
};

export default OrgReports;