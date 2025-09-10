import MainNavigation from '@/components/navigation/MainNavigation';
import NewBugModal from '@/components/tester/NewBugModal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CopyableIdBadge from '@/components/ui/copyable-id-badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, ArrowRight, CalendarRange, Check, Filter, Loader2, Plus, RefreshCw, Search, SortAsc, SortDesc } from 'lucide-react';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import TestRunDetail from './TestRunDetail';
import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/config';
import { capitalizeFirstLetter } from '@/lib/projectUtils';

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
  const navigate = useNavigate();
  const [isNewBugModalOpen, setIsNewBugModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'severity' | 'id' | 'date'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const currentOrgId = useCurrentOrgId();
  // Mock data - replace with actual data fetching
  const testRun = {
    id: id || 'TB-001',
    name: 'Sprint 12 Testing',
    project: 'TasksMate Web'
  };

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
      console.log('Bug created event received:', e.detail);
      // Always fetch bugs when the event is received, regardless of the ID
      fetchBugs();
    };
    window.addEventListener('bug-created', handler);
    return () => window.removeEventListener('bug-created', handler);
  }, [fetchBugs]);

  const [bugs, setBugs] = useState<Bug[]>([
  ]);

  const isProjectTag = (tag: string) => {
    return tag === testRun.project;
  };

  const getTagColor = (tag: string) => {
    if (isProjectTag(tag)) {
      return 'bg-blue-100 text-blue-800 border-blue-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const isDateInRange = (date: string, filter: string) => {
    const itemDate = new Date(date);
    const now = new Date();

    // Reset hours, minutes, seconds, and milliseconds for date comparisons
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);

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

  const filteredBugs = useMemo(() => {
    let filtered = bugs.filter(bug => {
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

      // Date filter
      const matchesDate = dateFilter === 'all' || isDateInRange(bug.date, dateFilter);

      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });

    return sortBugs(filtered);
  }, [bugs, searchTerm, filterStatus, filterPriority, dateFilter, sortBy, sortDirection]);

  const handleBugClick = (bugId: string) => {
    if (currentOrgId) {
      navigate(`/tester-zone/runs/${testRun.id}/bugs/${bugId}?org_id=${currentOrgId}`);
    } else {
      navigate(`/tester-zone/runs/${testRun.id}/bugs/${bugId}`);
    }
  };

  const handleBugToggle = async (bugId: string, checked: boolean) => {
    try {
      const currentDate = new Date();
      const formattedDate = currentDate.toISOString();
      const displayDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD format

      console.log(`Toggling bug ${bugId} to ${checked ? 'closed' : 'open'}`);
      console.log(`Using closed date: ${checked ? displayDate : 'undefined'}`);

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
      console.log(`Updating bug ${bugId} status to ${newStatus}`);

      const updateData = {
        status: newStatus
      };

      // Only include closed_at field if status is changing to closed
      if (checked) {
        updateData['closed_at'] = formattedDate;
      } else {
        updateData['closed_at'] = null; // Explicitly set to null when reopening
      }

      console.log('Sending update to server:', updateData);
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
          className="cursor-pointer hover:shadow-md transition-shadow"
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
                className="bg-red-600"
                copyLabel="Bug"
                isCompleted={bug.closed}
              />
            </div>
            <CardTitle className={`text-lg font-semibold ${bug.closed ? 'text-gray-500 line-through' : 'text-gray-900'} line-clamp-2`}>
              {bug.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-sm ${bug.closed ? 'text-gray-400' : 'text-gray-600'} mb-4 line-clamp-3`}>
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
    <div className="bg-white rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12"></TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSort('id')}
            >
              <div className="flex items-center gap-2">
                Bug ID
                {sortBy === 'id' && (sortDirection === 'asc' ? '↑' : '↓')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSort('title')}
            >
              <div className="flex items-center gap-2">
                Title
                {sortBy === 'title' && (sortDirection === 'asc' ? '↑' : '↓')}
              </div>
            </TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSort('severity')}
            >
              <div className="flex items-center gap-2">
                Severity
                {sortBy === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
              </div>
            </TableHead>
            <TableHead>Tags</TableHead>
            <TableHead
              className="cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => toggleSort('date')}
            >
              <div className="flex items-center gap-2">
                Created Date
                {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </div>
            </TableHead>
            <TableHead>Closed Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-20 sm:w-24 text-center font-bold flex-shrink-0">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBugs.map((bug) => (
            <TableRow
              key={bug?.id}
              className="hover:bg-gray-50"
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
                  className="bg-red-600"
                  copyLabel="Bug"
                  isCompleted={bug?.closed}
                />
              </TableCell>
              <TableCell className={`${bug?.closed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {bug?.title}
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
              <TableCell className="text-sm text-gray-600">
                {new Date(bug?.date).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {bug?.closedDate ? (
                  <span className="text-green-600 font-medium">
                    {new Date(bug.closedDate).toLocaleDateString()}
                  </span>
                ) : '-'}
              </TableCell>
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
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />

      <TestRunDetail />

      <div className="px-6 transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>

        {/* Enhanced Controls */}
        <div className="py-2 mb-2">
          <div className="w-full">
            {/* All Controls in One Line */}
            <div className="flex items-center justify-between">
              {/* Search Bar - Left side */}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by Bug ID, keywords..."
                  className="pl-10 bg-white/80 border-gray-300 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters and Controls - Right side */}
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-500" />

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

                {/* Created Date Filter */}
                <div className="flex items-center">
                  <span className="text-sm text-gray-500 mr-2">Created:</span>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger className="w-36 bg-white">
                      <CalendarRange className="w-4 h-4 mr-2" />
                      <SelectValue placeholder="Date Filter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">
                        <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Any Time</span>
                      </SelectItem>
                      <SelectItem value="today">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">Today</span>
                      </SelectItem>
                      <SelectItem value="yesterday">
                        <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">Yesterday</span>
                      </SelectItem>
                      <SelectItem value="thisWeek">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">This Week</span>
                      </SelectItem>
                      <SelectItem value="lastWeek">
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Last Week</span>
                      </SelectItem>
                      <SelectItem value="thisMonth">
                        <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">This Month</span>
                      </SelectItem>
                      <SelectItem value="lastMonth">
                        <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800">Last Month</span>
                      </SelectItem>
                      <SelectItem value="custom">
                        <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800">Custom Range</span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

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

                <div className="ml-4 flex items-center gap-2">
                  <Button
                    onClick={() => setIsNewBugModalOpen(true)}
                    className="bg-tasksmate-gradient hover:scale-105 transition-transform flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>New Bug</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>



        {
          error ? (
            <div className="text-center py-16 bg-white rounded-lg border">
              <p className="text-red-500">Error loading bugs <br></br> {error}</p>
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
              <div className="text-center py-16 bg-white rounded-lg border">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
                <p className="text-gray-500">Loading bugs...</p>
              </div>
            ) :

              (filteredBugs.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || dateFilter !== 'all'
                      ? 'No bugs found with current filters'
                      : 'No bugs found'
                    }
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || dateFilter !== 'all'
                      ? 'Try adjusting your search terms or filters, or create a new bug.'
                      : 'Get started by creating your first bug report.'
                    }
                  </p>
                  {(searchTerm || filterStatus !== 'all' || filterPriority !== 'all' || dateFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setFilterStatus('all');
                        setFilterPriority('all');
                        setDateFilter('all');
                      }}
                      className="mb-4"
                    >
                      Clear Filters
                    </Button>
                  )}
                  <Button
                    onClick={() => setIsNewBugModalOpen(true)}
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Bug
                  </Button>
                </div>
              )
                :
                (viewMode === 'grid' ? BugGridView() : BugListView())
              )
            )
        }

      </div>

      <NewBugModal
        open={isNewBugModalOpen}
        onOpenChange={setIsNewBugModalOpen}
        runId={testRun.id}
      />
    </div>
  );
};

export default BugBoard;
