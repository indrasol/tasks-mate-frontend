import MainNavigation from '@/components/navigation/MainNavigation';
import NewBugModal from '@/components/tester/NewBugModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CopyableIdBadge from '@/components/ui/copyable-id-badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { API_ENDPOINTS } from '@/config';
import { toast } from '@/hooks/use-toast';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { usePersistedParam } from '@/hooks/usePersistedParam';
import { capitalizeFirstLetter, deriveDisplayFromEmail } from '@/lib/projectUtils';
import { api } from '@/services/apiService';
import { AlertCircle, ArrowRight, Calendar, Check, Loader2, Plus, RefreshCw, Search, SortAsc, SortDesc } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TestRunDetail from './TestRunDetail';

import DateBadge from '@/components/ui/date-badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';

import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import type { BackendOrgMember } from "@/types/organization";

type Bug = {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low' | 'critical';
  status: 'open' | 'in_progress' | 'in_review' | 'resolved' | 'reopened' | 'closed' | 'won_t_fix' | 'duplicate';
  tags: string[];
  closed: boolean;
  date: string;         // created date
  closedDate?: string;  // date when bug was closed
  tracker_id?: string;
  creator?: string;
};

const BugBoard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);
  const { id } = useParams();

  const { user } = useAuth();

  const navigate = useNavigate();
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

  const userDisplayMap = useMemo(() => {
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

  const [isNewBugModalOpen, setIsNewBugModalOpen] = useState(false);
  const pageKey = 'bugs';
  const [searchTerm, setSearchTerm] = usePersistedParam<string>('q', '', { pageKey, urlKey: 'q', storage: 'local', serialize: v => v?.trim() ? v : null, deserialize: v => v });
  const [viewMode, setViewMode] = usePersistedParam<'grid' | 'list'>('view', 'list', { pageKey, urlKey: 'view', storage: 'local', serialize: v => v === 'list' ? null : v, deserialize: v => (v as 'grid' | 'list') || 'list' });
  const [filterStatus, setFilterStatus] = usePersistedParam<string>('status', 'all', { pageKey, urlKey: 'status', storage: 'local', serialize: v => v === 'all' ? null : v, deserialize: v => v || 'all' });
  const [filterPriority, setFilterPriority] = usePersistedParam<string>('severity', 'all', { pageKey, urlKey: 'severity', storage: 'local', serialize: v => v === 'all' ? null : v, deserialize: v => v || 'all' });
  const [dateFilter, setDateFilter] = usePersistedParam<string>('date', 'all', { pageKey, urlKey: 'date', storage: 'local', serialize: v => v === 'all' ? null : v, deserialize: v => v || 'all' });
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [tempDateRange, setTempDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });
  const [sortBy, setSortBy] = usePersistedParam<'title' | 'severity' | 'id' | 'date'>('sortBy', 'id', { pageKey, urlKey: 'sort', storage: 'local', serialize: v => v === 'id' ? null : v, deserialize: v => (v as any) || 'id' });
  const [sortDirection, setSortDirection] = usePersistedParam<'asc' | 'desc'>('sortDir', 'desc', { pageKey, urlKey: 'dir', storage: 'local', serialize: v => v === 'desc' ? null : v, deserialize: v => (v as any) || 'desc' });
  const [tab, setTab] = usePersistedParam<'all' | 'mine'>('tab', 'all', { pageKey, urlKey: 'tab', storage: 'local', serialize: v => v === 'all' ? null : v, deserialize: v => (v as 'all' | 'mine') || 'all' });
  const [completionFilter, setCompletionFilter] = usePersistedParam<string>('completion', 'hide', {
    pageKey, urlKey: 'completion', storage: 'local',
    serialize: v => v === 'show' ? 'show' : v, deserialize: v => v || 'hide'
  });

  const [restoreCompletion, setRestoreCompletion] = useState<string | null>(null);

  useEffect(() => {
    if (completionFilter === 'hide') {
      setRestoreCompletion(completionFilter);
    }
    if (filterStatus.includes('closed')) {
      setCompletionFilter('show');
    } else {
      if (restoreCompletion) {
        setCompletionFilter(restoreCompletion);
        setRestoreCompletion(null);
      }
    }
  }, [filterStatus]);

  useEffect(() => {
    if (completionFilter === 'hide') {
      if (filterStatus.includes('closed')) {
        setFilterStatus(filterStatus.replace('closed', ''));
      }
    }
  }, [completionFilter]);

  // Mock data - replace with actual data fetching
  // const testRun = {
  //   id: id || 'TB-001',
  //   name: 'Sprint 12 Testing',
  //   project: 'TasksMate Web'
  // };

  const [testRun, setTestRun] = useState<any>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchBugs = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError('');

    try {
      const response = await api.get(`${API_ENDPOINTS.BUGS}/search/${id}`);

      if (response) {
        // Ensure we're correctly accessing the data
        const responseData = response as any;
        const bugsData = Array.isArray(responseData.data) ? responseData.data :
          (responseData.data?.data || []);
        const formattedBugs: Bug[] = bugsData.map((bug: any) => {

          // Handle different field formats from API and ensure it's properly formatted
          let closedDate = bug.closed_at || bug.closedDate || bug.closedAt || undefined;

          // If closed_at exists and is a valid date, format it properly
          if (closedDate) {
            try {
              // Make sure it's a proper date string
              const dateObj = new Date(closedDate);
              if (!isNaN(dateObj.getTime())) {
                closedDate = dateObj.toISOString().split('T')[0];
              }
            } catch (e) {
              console.error('Error formatting closed date:', e);
            }
          }

          return {
            id: bug.id || '',
            title: bug.title || '',
            description: bug.description || '',
            severity: bug.severity || 'medium',
            status: bug.status || 'open',
            tags: bug.tags || [],
            closed: ['closed', 'won_t_fix', 'duplicate'].includes(bug.status),
            date: bug.created_at || new Date().toISOString().split('T')[0],
            closedDate: closedDate,
            tracker_id: bug.tracker_id || '',
            creator: bug.creator || bug.reporter || '',
          };
        });

        setBugs(formattedBugs.length > 0 ? formattedBugs : []);
      } else {
        setBugs([]);
      }
    } catch (error) {
      console.error('Error fetching bugs:', error);
      setError(error instanceof Error ? error.message : "Failed to load bugs");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load bugs",
        variant: "destructive"
      });
      // Don't reset bugs to empty array on error to maintain existing state
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  useEffect(() => {
    const handler = (e: any) => {
      // console.log('Bug created event received:', e.detail);
      // Always fetch bugs when the event is received, regardless of the ID
      fetchBugs();
    };
    window.addEventListener('bug-created', handler);
    return () => window.removeEventListener('bug-created', handler);
  }, [fetchBugs]);

  const [bugs, setBugs] = useState<Bug[]>([
  ]);

  const isProjectTag = (tag: string) => {
    return tag === testRun?.project;
  };

  const getTagColor = (tag: string) => {
    if (isProjectTag(tag)) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const isDateInRange = (
    taskDate: string,
    filter: string,
    customRange?: { from: Date | undefined; to: Date | undefined }
  ) => {
    if (!taskDate) return true; // Handle empty dates

    // Normalize the task date to midnight UTC
    let date: Date;
    try {
      date = new Date(taskDate);
    } catch (e) {
      console.error("Failed to parse date", e);
      return true; // Invalid date
    }
    if (isNaN(date.getTime())) return true; // Invalid date

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // If we're in custom date range mode and have a valid range
    if (filter === 'custom' && customRange?.from) {
      // Normalize times to start of day for comparison
      const from = new Date(customRange.from);
      from.setHours(0, 0, 0, 0);

      const taskDateStart = new Date(date);
      taskDateStart.setHours(0, 0, 0, 0);

      // If only "from" date is set
      if (!customRange.to) {
        return taskDateStart >= from;
      }

      // If both dates are set
      const to = new Date(customRange.to);
      to.setHours(23, 59, 59, 999);
      return taskDateStart >= from && taskDateStart <= to;
    }

    // Reset hours, minutes, seconds, and milliseconds for date comparisons
    const itemDate = new Date(date);
    itemDate.setHours(0, 0, 0, 0);

    // Yesterday
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // This week (starting from Sunday/Monday based on locale)
    const thisWeekStart = new Date(today);
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysFromWeekStart = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Assuming week starts on Monday
    thisWeekStart.setDate(thisWeekStart.getDate() - daysFromWeekStart);

    // Last week
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    const lastWeekEnd = new Date(thisWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 1);

    // This month
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // Last month
    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);

    // For comparison, set time to beginning of day
    const compareDate = new Date(itemDate);
    compareDate.setHours(0, 0, 0, 0);

    switch (filter) {
      case 'today':
        return compareDate.getTime() === today.getTime();

      case 'yesterday':
        return compareDate.getTime() === yesterday.getTime();

      case 'thisWeek':
        return compareDate >= thisWeekStart && compareDate <= today;

      case 'lastWeek':
        return compareDate >= lastWeekStart && compareDate <= lastWeekEnd;

      case 'thisMonth':
        return compareDate >= thisMonthStart && compareDate <= today;

      case 'lastMonth':
        return compareDate >= lastMonthStart && compareDate <= lastMonthEnd;

      case 'custom':
        // TODO: Implement custom date range picker
        return true;

      default:
        return true; // 'all' or any other value
    }
  };

  const sortBugs = (bugsToSort: Bug[]) => {
    return [...bugsToSort].sort((a, b) => {
      let aValue: any = a[sortBy];
      let bValue: any = b[sortBy];

      if (sortBy === 'severity') {
        const severityOrder = { high: 3, medium: 2, low: 1 };
        aValue = severityOrder[a.severity];
        bValue = severityOrder[b.severity];
      } else if (sortBy === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const toggleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  // Build possible identifiers for current user (id, username, email, displayName)
  const userIdentifiers = useMemo(() => {
    if (!user) return [] as string[];
    const ids: string[] = [];
    if (user.id) ids.push(String(user.id));
    if ((user as any).username) ids.push(String((user as any).username));
    if ((user as any)?.user_metadata?.username) ids.push(String((user as any).user_metadata.username));
    if (user.email) ids.push(String(user.email));
    if (user.email) {
      ids.push(deriveDisplayFromEmail(user.email).displayName);
    }
    return ids.map((x) => x.toLowerCase());
  }, [user]);

  const filteredBugs = useMemo(() => {
    let filtered = bugs.filter(bug => {

      // Tab filter (all vs mine)
      if (tab === 'mine') {
        const ownerString = String(bug.creator ?? '').toLowerCase();
        const ownerDisplay = deriveDisplayFromEmail(ownerString).displayName.toLowerCase();
        if (!(userIdentifiers.includes(ownerString) || userIdentifiers.includes(ownerDisplay))) {
          return false;
        }
      }

      // Search filter
      const matchesSearch = searchTerm === '' ||
        bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bug.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

      // Status filter
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'open' && bug.status === 'open') ||
        (filterStatus === 'closed' && bug.status === 'closed') ||
        (filterStatus === 'in_progress' && bug.status === 'in_progress') ||
        (filterStatus === 'in_review' && bug.status === 'in_review') ||
        (filterStatus === 'resolved' && bug.status === 'resolved') ||
        (filterStatus === 'reopened' && bug.status === 'reopened');

      // Priority filter
      const matchesPriority = filterPriority === 'all' || bug.severity === filterPriority;

      // Date filter - Check created date
      const matchesDate =
        dateFilter === 'all' ||
          (isCustomDateRange && dateRange?.from) ?
          // For custom date range, check created date
          isDateInRange(bug.date, 'custom', dateRange) :
          // For preset filters, check created date
          isDateInRange(bug.date, dateFilter);

      const matchesCompletion =
        completionFilter === 'show' ||
        (completionFilter === 'hide' ? !bug.closed : true);


      return matchesSearch && matchesStatus && matchesPriority && matchesDate && matchesCompletion;
    });

    return sortBugs(filtered);
  }, [bugs, searchTerm, filterStatus, filterPriority, dateFilter, dateRange, isCustomDateRange, sortBy, sortDirection, completionFilter, tab]);

  // Handle date range selection
  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined }) => {
    setTempDateRange(range);
  };

  const handleApplyDateRange = () => {
    setDateRange(tempDateRange);
    if (tempDateRange.from) {
      setIsCustomDateRange(true);
      setDateFilter('custom');
    }
    setIsDatePopoverOpen(false);
  };

  const resetDateRange = () => {
    setIsCustomDateRange(false);
    setDateRange({ from: undefined, to: undefined });
    setTempDateRange({ from: undefined, to: undefined });
    setDateFilter('all');
    setIsDatePopoverOpen(false);
  };

  const handleBugClick = (bugId: string) => {
    if (currentOrgId) {
      navigate(`/tester-zone/runs/${testRun?.id}/bugs/${bugId}?org_id=${currentOrgId}`);
    } else {
      navigate(`/tester-zone/runs/${testRun?.id}/bugs/${bugId}`);
    }
  };

  const handleBugToggle = async (bugId: string, checked: boolean) => {
    try {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();
      const displayDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      // First, update the UI optimistically
      setBugs(bugs.map(bug =>
        bug.id === bugId ? {
          ...bug,
          closed: checked,
          status: checked ? 'closed' : 'open',
          closedDate: checked ? displayDate : undefined
        } : bug
      ));

      // Then update the server
      const newStatus = checked ? 'closed' : 'open';

      const updateData = {
        status: newStatus
      };

      // Only include closed_at field if status is changing to closed
      if (checked) {
        updateData['closed_at'] = formattedDate;
      } else {
        updateData['closed_at'] = null; // Explicitly set to null when reopening
      }

      toast({
        title: "Updating bug status...",
        description: "Please wait...",
        variant: "default"
      })
      await api.put(`${API_ENDPOINTS.BUGS}/${bugId}`, updateData);

      // Display a success message
      toast({
        title: checked ? "Bug Closed" : "Bug Reopened",
        description: checked ? "Bug has been marked as closed." : "Bug has been reopened.",
        variant: "default"
      });

      // Refresh the bugs list to get the updated data
      fetchBugs();
    } catch (error) {
      console.error('Error updating bug status:', error);
      // Revert the UI change if there was an error
      toast({
        title: "Error",
        description: "Failed to update bug status. Please try again.",
        variant: "destructive"
      });
      // Fetch fresh data to ensure UI is in sync with server
      fetchBugs();
    }
  };

  // Grid view component
  const BugGridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filteredBugs.map((bug) => (
        <Card
          key={bug.id}
          className="cursor-pointer hover:shadow-md dark:hover:shadow-gray-900/20 transition-shadow bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          onClick={() => handleBugClick(bug.id)}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${bug.closed
                    ? 'bg-tasksmate-gradient border-transparent hover:scale-110'
                    : 'border-gray-300 hover:border-gray-400 hover:scale-110'
                    }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBugToggle(bug.id, !bug.closed);
                  }}
                >
                  {bug.closed && (
                    <Check className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex gap-2">
                  <Badge className={`${getSeverityColor(bug.severity)} text-xs font-medium`}>
                    {bug.severity?.toUpperCase()}
                  </Badge>
                  <Badge
                    className={`${bug?.status === 'closed' ? 'bg-green-100 text-green-700' :
                      bug?.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        bug?.status === 'in_review' ? 'bg-purple-100 text-purple-700' :
                          bug?.status === 'resolved' ? 'bg-cyan-100 text-cyan-700' :
                            bug?.status === 'reopened' ? 'bg-orange-100 text-orange-700' :
                              bug?.status === 'won_t_fix' ? 'bg-gray-100 text-gray-700' :
                                bug?.status === 'duplicate' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                      } text-xs`}
                  >
                    {bug?.status?.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>
              <CopyableIdBadge
                id={bug.id}
                org_id={currentOrgId}
                tracker_id={bug.tracker_id}
                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                copyLabel="Bug"
                isCompleted={bug.closed}
              />
            </div>
            <CardTitle className={`text-lg font-semibold ${bug.closed ? 'text-gray-500 dark:text-gray-400 line-through' : 'text-gray-900 dark:text-white'} line-clamp-2`}>
              {bug.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${bug.closed ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'} mb-4 line-clamp-3`}>
              {bug.description}
            </p>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-2">
              {bug.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className={`${getTagColor(tag)} text-xs`}>
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Dates */}
            <div className="flex justify-between items-center">
              <div className="text-xs text-gray-500">
                <span className="font-medium">Created:</span> {new Date(bug.date).toLocaleDateString()}
              </div>
              {bug.closedDate && (
                <div className="text-xs text-green-600">
                  <span className="font-medium">Closed:</span> {new Date(bug.closedDate).toLocaleDateString()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  // List view component
  const BugListView = () => (
    <div className="rounded-md border dark:border-gray-700 shadow-tasksmate overflow-x-auto">
      <div className="min-w-max w-full">
        <Table className="w-full">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            <TableRow>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-20 sm:w-24 md:w-28 text-center">Bug ID</TableHead>
              <TableHead className="text-center">Title</TableHead>
              <TableHead className="text-center">Severity</TableHead>
              <TableHead className="text-center">Tags</TableHead>
              <TableHead className="text-center">Created By</TableHead>
              <TableHead className="text-center">Created Date</TableHead>
              <TableHead className="text-center">Closed Date</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="w-20 sm:w-24 text-center flex-shrink-0">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBugs.map((bug) => (
              <TableRow
                key={bug?.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <TableCell>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${bug.closed
                      ? 'bg-tasksmate-gradient border-transparent hover:scale-110'
                      : 'border-gray-300 hover:border-gray-400 hover:scale-110'
                      }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBugToggle(bug?.id, !bug?.closed);
                    }}
                  >
                    {bug?.closed && (
                      <Check className="h-3 w-3 text-white" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">
                  <CopyableIdBadge
                    id={bug?.id}
                    org_id={currentOrgId}
                    tracker_id={bug?.tracker_id}
                    className="bg-red-600 hover:bg-red-700 text-white cursor-pointer"
                    copyLabel="Bug"
                    isCompleted={bug?.closed}
                  />
                </TableCell>
                <TableCell className="font-medium w-80">
                  <div className="flex items-center">
                    <div
                      className={`truncate max-w-[260px] ${bug?.closed ? 'line-through text-gray-400 cursor-pointer' : 'hover:underline cursor-pointer'}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBugClick(bug.id);
                      }}
                    >
                      {bug.title}
                    </div>

                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`${getSeverityColor(bug?.severity)} text-xs`}>
                    {bug?.severity?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {bug?.tags?.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className={`${getTagColor(tag)} text-xs`}>
                        {tag}
                      </Badge>
                    ))}
                    {bug?.tags?.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{bug?.tags?.length - 2}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center">
                    <Badge className="text-xs bg-indigo-100 text-indigo-800">
                      {userDisplayMap[bug.creator]?.displayName ?? deriveDisplayFromEmail(bug.creator).displayName}
                    </Badge>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <DateBadge date={bug.date} className="text-xs bg-blue-100 text-blue-800" />
                </TableCell>
                <TableCell className="text-center">
                  <DateBadge date={bug.closedDate} className="text-xs bg-rose-100 text-rose-800" />
                </TableCell>

                {/* <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                  {new Date(bug?.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-sm text-gray-600 dark:text-gray-300">
                  {bug?.closedDate ? (
                    <span className="text-green-600 dark:text-green-400 font-medium">
                      {new Date(bug.closedDate).toLocaleDateString()}
                    </span>
                  ) : '-'}
                </TableCell> */}
                <TableCell>
                  <Badge
                    className={`${bug?.status === 'closed' ? 'bg-green-100 text-green-700' :
                      bug?.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                        bug?.status === 'in_review' ? 'bg-purple-100 text-purple-700' :
                          bug?.status === 'resolved' ? 'bg-cyan-100 text-cyan-700' :
                            bug?.status === 'reopened' ? 'bg-orange-100 text-orange-700' :
                              bug?.status === 'won_t_fix' ? 'bg-gray-100 text-gray-700' :
                                bug?.status === 'duplicate' ? 'bg-amber-100 text-amber-700' :
                                  'bg-red-100 text-red-700'
                      } text-xs`}
                  >
                    {capitalizeFirstLetter(bug?.status?.replace(/_/g, ' '))}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      className="p-1.5 rounded-full hover:bg-blue-50 text-blue-600 hover:text-blue-700 transition-colors"
                      onClick={() => handleBugClick(bug?.id)}
                      title="View bug details"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MainNavigation />

      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>

        {/* <nav className="px-6 py-4 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50" >
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center">
              <Button
                variant="ghost"
                onClick={() => navigate(`${currentOrgId ? `/tester-zone?org_id=${currentOrgId}` : '/tester-zone'}`)}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 bg-transparent p-0 m-0"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Trackers
              </Button>
            </div>

          </div>
        </nav> */}

        {/* Breadcrumbs - Moved to top */}
        {/* <nav className="py-4">
          <div className="w-full">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link to={currentOrgId ? `/tester-zone?org_id=${currentOrgId}` : '/tester-zone'}>
                      Bug Tracker
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-4 w-4" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <BreadcrumbPage>{id}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </nav> */}

        {/* Page Header */}
        {/* <div className="px-6 py-4">
          <div className="w-full flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 dark:text-white mb-2">Bug Board</h1>
              <p className="text-gray-600 dark:text-gray-300">Track and manage all reported bugs</p>
            </div>
            <Button
              onClick={() => setIsNewBugModalOpen(true)}
              className="bg-tasksmate-gradient hover:scale-105 transition-transform flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Bug</span>
            </Button>
          </div>
        </div> */}

        {/* Tracker Details and KPIs */}
        <TestRunDetail outProjectDetails={(projectId: string, projectName: string) => {
          setTestRun({
            id: id,
            project_id: projectId,
            project: projectName
          });
        }} />

        {/* Tabs for Tasks / My Tasks with Search bar */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Tabs value={tab} onValueChange={v => setTab(v as any)}>
              <TabsList>
                <TabsTrigger value="all">Bugs</TabsTrigger>
                <TabsTrigger value="mine">My Bugs</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* placeholder to keep flex spacing */}
            {/* Completion Filter Toggle */}
            <div className="flex items-center space-x-2">
              <Label htmlFor="completionFilter" className="ml-2 text-xs font-xs text-gray-700 dark:text-gray-200">
                {completionFilter === 'hide' ? 'Show' : 'Hide'} Completed
              </Label>
              <Switch
                id="completionFilter"
                name="completionFilter"
                className="ml-1"
                checked={completionFilter === 'show'}
                onCheckedChange={v => setCompletionFilter(v ? 'show' : 'hide')}
              />
            </div>
          </div>
        </div>

        {/* Enhanced Controls */}
        <div className="px-6 py-4 bg-white/30 dark:bg-gray-800/30 border-b border-gray-200 dark:border-gray-700">
          <div className="w-full">
            {/* All Controls in One Line */}
            <div className="flex items-center justify-between">
              {/* Search Bar - Left side */}
              <div className="relative w-80 mr-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Bug ID, keywords..."
                  className="pl-10 bg-white/80 dark:bg-gray-700/80 border-gray-300 dark:border-gray-600 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end dark:text-white dark:placeholder-gray-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters and Controls - Right side */}
              <div className="flex items-center space-x-2 ml-2">
                {/* <Filter className="w-4 h-4 text-gray-500" /> */}

                {/* Status Filter Dropdown */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Status</span>
                    </SelectItem>
                    <SelectItem value="open">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Open</span>
                    </SelectItem>
                    <SelectItem value="in_progress">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">In Progress</span>
                    </SelectItem>
                    <SelectItem value="in_review">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">In Review</span>
                    </SelectItem>
                    <SelectItem value="resolved">
                      <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800">Resolved</span>
                    </SelectItem>
                    <SelectItem value="reopened">
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">Reopened</span>
                    </SelectItem>
                    <SelectItem value="closed">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Closed</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Severity Filter */}
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Severity</span>
                    </SelectItem>
                    <SelectItem value="high">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">High</span>
                    </SelectItem>
                    <SelectItem value="medium">
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">Medium</span>
                    </SelectItem>
                    <SelectItem value="low">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Low</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Created Date Filter with Calendar */}
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateFilter !== 'all' || isCustomDateRange ? "default" : "outline"}
                      className="px-3 py-2 flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">Created</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="center"
                    onInteractOutside={(e) => {
                      // Prevent closing when clicking the calendar
                      if ((e.target as HTMLElement).closest('.rdp')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Select Created Date Range</h4>
                      </div>
                      <CalendarComponent
                        mode="range"
                        defaultMonth={tempDateRange.from}
                        selected={tempDateRange}
                        onSelect={handleDateRangeSelect}
                        numberOfMonths={2}
                        className="rounded-md border"
                      />
                      <div className="flex justify-between pt-2">
                        <Button type="button" onClick={() => {
                          resetDateRange();
                          setTempDateRange({ from: undefined, to: undefined });
                        }} variant="outline" size="sm">
                          Reset
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleApplyDateRange}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Sort Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {sortDirection === 'asc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => toggleSort('id')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 mr-2">Bug ID</span>
                      {sortBy === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('title')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800 mr-2">Title</span>
                      {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('severity')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 mr-2">Severity</span>
                      {sortBy === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => toggleSort('date')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 mr-2">Date</span>
                      {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* View Toggle */}
                {/* <div className="flex items-center space-x-2 ml-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div> */}

                {/* <div className="ml-4 flex items-center gap-2">
                  <Button
                    onClick={() => setIsNewBugModalOpen(true)}
                    className="bg-tasksmate-gradient hover:scale-105 transition-transform flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Bug</span>
                  </Button>
                </div> */}
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="px-6 py-2">
          <div className="w-full">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredBugs.length} bug{filteredBugs.length !== 1 ? 's' : ''}
              {filteredBugs.length !== bugs.length && ` (filtered from ${bugs.length} total)`}
            </p>
          </div>
        </div>

        {/* Bugs Display */}
        <div className="px-6 py-6">
          <div className="w-full">
            {
              error ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                  <p className="text-red-500 dark:text-red-400">Error loading bugs <br></br> {error}</p>
                  <Button
                    className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                    onClick={fetchBugs}
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try again
                  </Button>
                </div>
              ) :

                (loading ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                    <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Loading bugs...</p>
                  </div>
                ) :

                  (filteredBugs.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                      <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">No bugs found</p>
                      <p className="text-gray-500 dark:text-gray-400 mb-6">
                        {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || dateFilter !== 'all'
                          ? 'Try adjusting your filters or search query'
                          : 'Create your first bug report to get started'
                        }
                      </p>
                      <Button
                        className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                        onClick={() => setIsNewBugModalOpen(true)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        New Bug Report
                      </Button>
                      {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || dateFilter !== 'all') && (
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchTerm('');
                            setFilterStatus('all');
                            setFilterPriority('all');
                            setDateFilter('all');
                            setIsCustomDateRange(false);
                            setDateRange({ from: undefined, to: undefined });
                            setTempDateRange({ from: undefined, to: undefined });
                          }}
                          className="mt-4"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  )
                    :
                    (viewMode === 'grid' ? BugGridView() : BugListView())
                  )
                )
            }
          </div>
        </div>

      </div>

      <NewBugModal
        open={isNewBugModalOpen}
        onOpenChange={setIsNewBugModalOpen}
        runId={testRun?.id}
        projectId={testRun?.project_id}
        projectName={testRun?.project}
      />
    </div>
  );
};

export default BugBoard;
