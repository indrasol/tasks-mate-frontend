import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Users, ChevronRight, Target, Filter, Plus, Search, Calendar, CheckCircle, Pause, CircleDot, Archive, Eye, EyeOff, SortAsc, SortDesc } from 'lucide-react';
import { useOrgUserGoals } from '@/hooks/useOrgUserGoals';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/hooks/useAuth';
import type { BackendOrgMember } from '@/types/organization';
import type { Goal, GoalStatus } from '@/types/goal';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import GoalForm from '@/components/GoalForm';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGoal } from '@/services/goalService';

interface GoalsTabProps {
  orgId: string;
  realOrgMembers: BackendOrgMember[];
}

const statusOptions: { value: GoalStatus | 'all'; label: string; icon: any }[] = [
  { value: 'all', label: 'All', icon: CircleDot },
  { value: 'active', label: 'Active', icon: Target },
  { value: 'paused', label: 'Paused', icon: Pause },
  { value: 'done', label: 'Done', icon: CheckCircle },
  { value: 'draft', label: 'Draft', icon: Archive },
];

export default function GoalsTab({ orgId, realOrgMembers }: GoalsTabProps) {
  const { user } = useAuth();
  const { data: membersFromHook } = useOrganizationMembers(orgId);
  const queryClient = useQueryClient();

  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [status, setStatus] = useState<GoalStatus | 'all'>('all');
  const [q, setQ] = useState('');
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [dueRange, setDueRange] = useState<{ from?: Date; to?: Date }>({});
  const [tempDueRange, setTempDueRange] = useState<{ from?: Date; to?: Date }>({});
  const [page, setPage] = useState(1);

  // Client-side extras
  const [visibility, setVisibility] = useState<'all' | 'org' | 'private'>('all');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'due_asc' | 'progress_desc'>('updated_desc');

  const [isNewOpen, setIsNewOpen] = useState(false);

  const effectiveMembers = useMemo(
    () => (realOrgMembers?.length ? realOrgMembers : (membersFromHook || [])),
    [realOrgMembers, membersFromHook]
  );

  const primaryUserId = selectedUsers[0];
  const filters = useMemo(() => ({
    userId: primaryUserId,
    status,
    q,
    page,
    pageSize: 20,
    dueStart: dueRange.from ? formatDate(dueRange.from) : undefined,
    dueEnd: dueRange.to ? formatDate(dueRange.to) : undefined,
  }), [primaryUserId, status, q, page, dueRange]);

  const { data, isLoading, isFetching } = useOrgUserGoals(orgId, filters);

  const clearFilters = () => {
    setSelectedUsers([]);
    setStatus('all');
    setQ('');
    setDueRange({});
    setTempDueRange({});
    setPage(1);
  };

  const items = data?.items ?? [];
  const memberIndex = useMemo(() => {
    const all = effectiveMembers || [];
    const idx: Record<string, BackendOrgMember> = {} as any;
    for (const m of all) {
      if (m && m.user_id !== undefined && m.user_id !== null) {
        idx[String(m.user_id)] = m;
      }
    }
    return idx;
  }, [effectiveMembers]);

  const displayedItems = useMemo(() => {
    let rows = items;
    if (visibility !== 'all') {
      rows = rows.filter(g => (g.visibility || 'org') === visibility);
    }
    // Sorting client-side
    if (sortBy === 'updated_desc') {
      rows = [...rows].sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime());
    } else if (sortBy === 'due_asc') {
      rows = [...rows].sort((a, b) => {
        const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.MAX_SAFE_INTEGER;
        return ad - bd;
      });
    } else if (sortBy === 'progress_desc') {
      rows = [...rows].sort((a, b) => (b.progress ?? 0) - (a.progress ?? 0));
    }
    return rows;
  }, [items, visibility, sortBy]);
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / 20));

  const createMutation = useMutation({
    mutationFn: async (payload: any) => createGoal(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-user-goals', orgId] });
      setIsNewOpen(false);
    },
  });

  return (
    <div className="flex h-full w-full">
      <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="p-4 space-y-4 h-full overflow-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters}>Reset</Button>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Team Members</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    {selectedUsers.length ? `${selectedUsers.length} Selected` : 'All Members'}
                  </div>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 max-h-72 overflow-auto">
                {effectiveMembers?.map(m => (
                  <DropdownMenuCheckboxItem
                    key={m.user_id}
                    checked={selectedUsers.includes(String(m.user_id))}
                    onCheckedChange={(checked) => {
                      const id = String(m.user_id);
                      setSelectedUsers(checked ? [...selectedUsers, id] : selectedUsers.filter(x => x !== id));
                      setPage(1);
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

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Status</label>
            <div className="grid grid-cols-2 gap-2">
              {statusOptions.map(s => {
                const Icon = s.icon;
                const active = status === s.value;
                return (
                  <Button
                    key={s.value}
                    variant={active ? 'default' : 'outline'}
                    onClick={() => { setStatus(s.value as any); setPage(1); }}
                    className="justify-start"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {s.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant={visibility === 'all' ? 'default' : 'outline'}
                onClick={() => { setVisibility('all'); setPage(1); }}
                className="justify-start"
              >
                <Eye className="w-4 h-4 mr-2" />
                All
              </Button>
              <Button
                variant={visibility === 'org' ? 'default' : 'outline'}
                onClick={() => { setVisibility('org'); setPage(1); }}
                className="justify-start"
              >
                <Eye className="w-4 h-4 mr-2" />
                Org
              </Button>
              <Button
                variant={visibility === 'private' ? 'default' : 'outline'}
                onClick={() => { setVisibility('private'); setPage(1); }}
                className="justify-start"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Private
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Sort</label>
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant={sortBy === 'updated_desc' ? 'default' : 'outline'}
                onClick={() => setSortBy('updated_desc')}
                className="justify-start"
              >
                <SortDesc className="w-4 h-4 mr-2" /> Updated (newest)
              </Button>
              <Button
                variant={sortBy === 'due_asc' ? 'default' : 'outline'}
                onClick={() => setSortBy('due_asc')}
                className="justify-start"
              >
                <SortAsc className="w-4 h-4 mr-2" /> Due (soonest)
              </Button>
              <Button
                variant={sortBy === 'progress_desc' ? 'default' : 'outline'}
                onClick={() => setSortBy('progress_desc')}
                className="justify-start"
              >
                <SortDesc className="w-4 h-4 mr-2" /> Progress (high to low)
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Due Range</label>
            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant={dueRange.from ? 'default' : 'outline'} className="w-full justify-start">
                  <Calendar className="w-4 h-4 mr-2" />
                  {dueRange.from ? 'Custom Range' : 'All'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-3" align="start">
                <div className="space-y-3">
                  <CalendarComponent
                    mode="range"
                    defaultMonth={tempDueRange?.from}
                    selected={tempDueRange as any}
                    onSelect={(range: any) => setTempDueRange(range ?? {})}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                  <div className="flex justify-between">
                    <Button size="sm" variant="outline" onClick={() => { setDueRange({}); setTempDueRange({}); setIsDatePopoverOpen(false); setPage(1); }}>Reset</Button>
                    <Button size="sm" onClick={() => { setDueRange(tempDueRange); setIsDatePopoverOpen(false); setPage(1); }}>Apply</Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Search</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-8"
                placeholder="Search goals..."
                value={q}
                onChange={(e) => { setQ(e.target.value); setPage(1); }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-2 flex items-center justify-between">
          <Tabs value={primaryUserId || 'all'} onValueChange={() => {}} className="w-full">
            <div className="flex items-center gap-2">
              <TabsList>
                <TabsTrigger value={primaryUserId || 'all'}>
                  <Filter className="w-4 h-4 mr-2" />
                  {primaryUserId ? 'Filtered by Member' : 'All Members'}
                </TabsTrigger>
              </TabsList>
            </div>
          </Tabs>
          <Button size="sm" onClick={() => setIsNewOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            New Goal
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-3">
          {isLoading || isFetching ? (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Loading goals...
            </div>
          ) : items.length === 0 ? (
            <EmptyState />
          ) : (
            <GoalsList items={displayedItems} memberIndex={memberIndex} />
          )}
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 flex items-center justify-between">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Page {page} of {totalPages} • {total} total
          </span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              Prev
            </Button>
            <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>
              Next
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Goal</DialogTitle>
          </DialogHeader>
          <GoalForm
            orgId={orgId}
            defaultAssigneeId={primaryUserId}
            onSubmit={async (payload) => {
              await createMutation.mutateAsync(payload);
            }}
            onCancel={() => setIsNewOpen(false)}
            isSubmitting={createMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function EmptyState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center text-gray-600 dark:text-gray-300">
      <Target className="w-8 h-8 mb-2 text-gray-400" />
      <p className="font-medium">No goals match your filters</p>
      <p className="text-sm">Try adjusting filters or create a new goal.</p>
    </div>
  );
}

function GoalsList({ items, memberIndex }: { items: Goal[]; memberIndex: Record<string, BackendOrgMember> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map(g => (
        <div key={g.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-3">
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{g.title}</h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">{g.description}</p>
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                <StatusBadge status={g.status} />
                {g.progress !== undefined && <span>Progress: {g.progress}%</span>}
                {g.dueDate && <span>Due: {g.dueDate}</span>}
                {g.visibility && (
                  <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{g.visibility}</span>
                )}
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <ProgressBar value={g.progress ?? 0} />
            {Array.isArray(g.assignees) && g.assignees.length > 0 && (
              <>
                <div className="flex items-center gap-2">
                  {g.assignees.slice(0, 5).map(a => {
                    const m = memberIndex[String(a.userId)];
                    const initials = (m?.initials || String(a.userId).slice(0, 2)).toUpperCase();
                    const displayName = m?.displayName || String(a.userId);
                    return (
                      <div key={`${g.id}-${a.userId}`} title={`${displayName} • ${a.role}`}>
                        <Avatar className="w-6 h-6">
                          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
                        </Avatar>
                      </div>
                    );
                  })}
                  {g.assignees.length > 5 && (
                    <span className="text-xs text-gray-500">+{g.assignees.length - 5} more</span>
                  )}
                </div>
                <div className="text-[11px] text-gray-600 dark:text-gray-400 truncate">
                  {g.assignees.slice(0, 3).map((a, idx) => {
                    const m = memberIndex[String(a.userId)];
                    const name = m?.displayName || String(a.userId);
                    return <span key={`name-${g.id}-${a.userId}`}>{idx > 0 ? ', ' : ''}{name}</span>;
                  })}
                  {g.assignees.length > 3 && <span>, +{g.assignees.length - 3} more</span>}
                </div>
              </>
            )}
            {Array.isArray(g.assignees) && g.assignees.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {g.assignees.slice(0, 6).map(a => (
                  <span key={`role-${g.id}-${a.userId}`} className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                    {memberIndex[String(a.userId)]?.displayName || a.userId} • {a.role}
                  </span>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-gray-600 dark:text-gray-400">
              {g.startDate && <span>Start: {g.startDate}</span>}
              {g.dueDate && <span>Due: {g.dueDate}</span>}
              {g.createdAt && <span>Created: {formatDateTime(g.createdAt)}</span>}
              {g.updatedAt && <span>Updated: {formatDateTime(g.updatedAt)}</span>}
              {g.createdBy && (
                <span className="col-span-2">By: {memberIndex[String(g.createdBy)]?.displayName || g.createdBy}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function formatDateTime(value?: string | Date) {
  if (!value) return '';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function ProgressBar({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="w-full h-2 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
      <div className="h-2 bg-green-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

function StatusBadge({ status }: { status: GoalStatus }) {
  const map: Record<GoalStatus, { label: string; cls: string }> = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' },
    active: { label: 'Active', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
    paused: { label: 'Paused', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
    done: { label: 'Done', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  };
  const { label, cls } = map[status];
  return <span className={`px-2 py-0.5 rounded text-xs font-medium ${cls}`}>{label}</span>;
}
