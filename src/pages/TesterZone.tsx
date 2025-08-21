
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProjects } from '@/hooks/useProjects';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { deriveDisplayFromEmail } from '@/lib/projectUtils';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Filter, Bug, Beaker, Search, Calendar, ChevronUp, ChevronDown, Check, SortDesc, SortAsc, CalendarRange, Eye, Loader2, Copy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import NewRunModal from '@/components/tester/NewRunModal';
import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/../config';
import { toast } from '@/hooks/use-toast';
import CopyableIdBadge from '@/components/ui/copyable-id-badge';

interface TestRun {
  id: string;
  name: string;
  project: string;
  creator: string;
  status: 'not_started' | 'in_progress' | 'blocked' | 'completed' | 'archived' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical' | 'none';
  totalBugs: number;
  totalTasks: number;
  date: string;
}

type SortField = 'id' | 'name' | 'project' | 'creator' | 'status' | 'priority' | 'totalBugs' | 'totalTasks' | 'date';
type SortOrder = 'asc' | 'desc';

const TesterZone = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentOrgId = useCurrentOrgId();
  const { projects, loading: loadingProjects } = useProjects();
  const { data: orgMembers, isLoading: loadingMembers } = useOrganizationMembers(currentOrgId);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const handler = (e:any)=>setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim()==='4rem');
    return ()=>window.removeEventListener('sidebar-toggle', handler);
  }, []);
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatuses, setFilterStatuses] = useState<string[]>([]);
  const [filterPriorities, setFilterPriorities] = useState<string[]>([]);
  const [filterProject, setFilterProject] = useState('all');
  const [filterCreator, setFilterCreator] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  
  // Date range picker state
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [tempDateRange, setTempDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [isCustomDateRange, setIsCustomDateRange] = useState(false);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [activeTab, setActiveTab] = useState('all-trackers');
  const [loading, setLoading] = useState(false);
  
  // State for trackers from the API
  const [testRuns, setTestRuns] = useState<TestRun[]>([]);
  
  // Function to fetch trackers from API
  const fetchTrackers = async () => {
    if (!currentOrgId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`${API_ENDPOINTS.TRACKERS}/${currentOrgId}`);
      
      // Transform API response to match TestRun interface
      const data = response as any[];
      const mappedTrackers: TestRun[] = data.map((tracker: any) => ({
        id: tracker.tracker_id,
        name: tracker.name,
        project: tracker.project_name || tracker.project_id,
        creator: tracker.creator_name,
        status: tracker.status,
        priority: tracker.priority,
        totalBugs: tracker.total_bugs || 0,
        totalTasks: tracker.total_tasks || 0,
        date: new Date(tracker.created_at).toISOString().split('T')[0]
      }));
      
      setTestRuns(mappedTrackers);
    } catch (error) {
      console.error('Error fetching trackers:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load trackers",
        variant: "destructive"
      });
      // Use empty array if API call fails
      setTestRuns([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Load trackers on initial render and when currentOrgId changes
  useEffect(() => {
    fetchTrackers();
  }, [currentOrgId]);
  
  // Listen for tracker-created event to refresh the list
  useEffect(() => {
    const handleTrackerCreated = () => {
      fetchTrackers();
    };
    
    window.addEventListener('tracker-created', handleTrackerCreated);
    return () => {
      window.removeEventListener('tracker-created', handleTrackerCreated);
    };
  }, []);

  // Status options matching Tasks catalog
  const statusOptions = [
    { value: "not_started", label: "Not Started", className: "bg-gray-100 text-gray-800" },
    { value: "in_progress", label: "In Progress", className: "bg-blue-100 text-blue-800" },
    { value: "completed", label: "Completed", className: "bg-green-100 text-green-800" },
    { value: "blocked", label: "Blocked", className: "bg-red-100 text-red-800" },
    { value: "on_hold", label: "On Hold", className: "bg-yellow-100 text-yellow-800" },
    { value: "archived", label: "Archived", className: "bg-black text-white" },
  ];
  
  // Priority options with matching color coding from Tasks catalog
  const priorityOptions = [
    { value: "critical", className: "bg-red-600 text-white" },
    { value: "high", className: "bg-red-100 text-red-800" },
    { value: "medium", className: "bg-orange-100 text-orange-800" },
    { value: "low", className: "bg-green-100 text-green-800" },
    { value: "none", className: "bg-gray-100 text-gray-800" }
  ];
  
  const getStatusColor = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.className : 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : 'Unknown';
  };
  
  const getPriorityColor = (priority: string) => {
    const option = priorityOptions.find(opt => opt.value === priority);
    return option ? option.className : 'bg-gray-100 text-gray-800';
  };

  const handleStatusChange = async (runId: string, newStatus: string) => {
    try {
      // Optimistic update
      setTestRuns(prev => prev.map(run => 
        run.id === runId 
          ? { ...run, status: newStatus as TestRun['status'] }
          : run
      ));
      
      // API call to update status
      await api.put(`${API_ENDPOINTS.TRACKERS}/${runId}`, { status: newStatus });
    } catch (error) {
      console.error('Error updating tracker status:', error);
      toast({
        title: "Error",
        description: "Failed to update tracker status",
        variant: "destructive"
      });
      
      // Revert optimistic update on failure
      fetchTrackers();
    }
  };
  
  const handlePriorityChange = async (runId: string, newPriority: string) => {
    try {
      // Optimistic update
      setTestRuns(prev => prev.map(run => 
        run.id === runId 
          ? { ...run, priority: newPriority as TestRun['priority'] }
          : run
      ));
      
      // API call to update priority
      await api.put(`${API_ENDPOINTS.TRACKERS}/${runId}`, { priority: newPriority });
    } catch (error) {
      console.error('Error updating tracker priority:', error);
      toast({
        title: "Error",
        description: "Failed to update tracker priority",
        variant: "destructive"
      });
      
      // Revert optimistic update on failure
      fetchTrackers();
    }
  };

  const handleTrackerToggle = async (runId: string) => {
    try {
      // Get current status from state
      const tracker = testRuns.find(run => run.id === runId);
      if (!tracker) return;
      
      // Determine new status
      const newStatus = tracker.status === 'completed' ? 'in_progress' : 'completed';
      
      // Optimistic update
      setTestRuns(prev => prev.map(run => 
        run.id === runId 
          ? { ...run, status: newStatus as TestRun['status'] }
          : run
      ));
      
      // API call to update status
      await api.put(`${API_ENDPOINTS.TRACKERS}/${runId}`, { status: newStatus });
    } catch (error) {
      console.error('Error toggling tracker status:', error);
      toast({
        title: "Error",
        description: "Failed to update tracker status",
        variant: "destructive"
      });
      
      // Revert optimistic update on failure
      fetchTrackers();
    }
  };

  const clearFilters = () => {
    setFilterStatuses([]);
    setFilterPriorities([]);
    setFilterProject('all');
    setFilterCreator('all');
    setDateFilter('all');
    setIsCustomDateRange(false);
    setDateRange({ from: undefined, to: undefined });
    setTempDateRange({ from: undefined, to: undefined });
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm !== '' || 
    filterStatuses.length > 0 || 
    filterPriorities.length > 0 || 
    filterProject !== 'all' || 
    filterCreator !== 'all' || 
    dateFilter !== 'all' ||
    isCustomDateRange;

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <div className="flex flex-col opacity-30">
        <ChevronUp className="w-3 h-3 -mb-1" />
        <ChevronDown className="w-3 h-3" />
      </div>;
    }
    return sortOrder === 'asc' ? 
      <ChevronUp className="w-4 h-4 text-blue-600" /> : 
      <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  // Get unique values for filters from real data
  const getUniqueProjects = () => {
    if (loadingProjects || !projects || projects.length === 0) {
      return Array.from(new Set(testRuns.map(run => run.project)));
    }
    return projects.map(project => ({
      id: project.id,
      name: project.name
    }));
  };

  const getUniqueCreators = () => {
    if (loadingMembers || !orgMembers || orgMembers.length === 0) {
      return Array.from(new Set(testRuns.map(run => run.creator)));
    }
    return orgMembers.map(member => ({
      id: member.user_id,
      email: member.email,
      displayName: deriveDisplayFromEmail(member.email).displayName
    }));
  };

  // Date filter logic with custom date range support
  const isDateInRange = (
    dateStr: string, 
    filter: string,
    customRange?: { from: Date | undefined; to: Date | undefined }
  ) => {
    const itemDate = new Date(dateStr);
    const now = new Date();
    
    // If we're in custom date range mode and have a valid range
    if (filter === 'custom' && customRange?.from) {
      // Normalize times to start of day for comparison
      const from = new Date(customRange.from);
      from.setHours(0, 0, 0, 0);

      const itemDateStart = new Date(itemDate);
      itemDateStart.setHours(0, 0, 0, 0);

      // If only "from" date is set
      if (!customRange.to) {
        return itemDateStart >= from;
      }

      // If both dates are set
      const to = new Date(customRange.to);
      to.setHours(23, 59, 59, 999);
      return itemDateStart >= from && itemDateStart <= to;
    }

    switch (filter) {
      case 'thisWeek':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'thisMonth':
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        return itemDate >= monthAgo;
      case 'overdue':
        return itemDate < now;
      default:
        return true;
    }
  };
  
  // Date range picker handlers
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
  
  const formatDateStr = (date?: Date) => {
    if (!date) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };
  
  const formatDateRange = (dateRange: { from?: Date, to?: Date }) => {
    if (!dateRange.from) return '';
    if (!dateRange.to) return `From ${formatDateStr(dateRange.from)}`;
    return `${formatDateStr(dateRange.from)} - ${formatDateStr(dateRange.to)}`;
  };

  const filteredAndSortedRuns = testRuns
    .filter(run => {
      const matchesSearch = searchTerm === '' || 
        run.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.creator.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatuses.length === 0 || filterStatuses.includes(run.status);
      
      // Priority filter
      const matchesPriority = filterPriorities.length === 0 || filterPriorities.includes(run.priority);
      
      // For projects, we need to handle both string and object formats
      const matchesProject = filterProject === 'all' || 
        // For string-based project names (fallback for mock data)
        run.project === filterProject || 
        // For project objects (real data from API)
        (projects?.find(p => p.id === filterProject)?.name === run.project);
      
      // For creators, we need to handle both string and object formats
      const matchesCreator = filterCreator === 'all' || 
        // For string-based creator names (fallback for mock data)
        run.creator === filterCreator || 
        // For creator objects (real data from API)
        (orgMembers?.find(m => m.user_id === filterCreator)?.email === run.creator);
      
      const matchesDate = dateFilter === 'all' || 
        (isCustomDateRange && dateRange?.from) ?
        isDateInRange(run.date, 'custom', dateRange) :
        isDateInRange(run.date, dateFilter);
      
      // Filter based on active tab (all trackers vs my trackers)
      const matchesTab = activeTab === 'all-trackers' || 
        (activeTab === 'my-trackers' && user && run.creator.toLowerCase() === user.email.toLowerCase());
      
      return matchesSearch && matchesStatus && matchesPriority && matchesProject && 
        matchesCreator && matchesDate && matchesTab;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortField === 'status') {
        const statusOrder = { 
          'not_started': 1, 
          'in_progress': 2, 
          'on_hold': 3,
          'blocked': 4, 
          'completed': 5, 
          'archived': 6 
        };
        aValue = statusOrder[a.status] || 0;
        bValue = statusOrder[b.status] || 0;
      } else if (sortField === 'priority') {
        const priorityOrder = { 
          'none': 0,
          'low': 1, 
          'medium': 2, 
          'high': 3, 
          'critical': 4
        };
        aValue = priorityOrder[a.priority] || 0;
        bValue = priorityOrder[b.priority] || 0;
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="transition-all duration-300 p-8" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* Header */}
        <div className="flex items-center justify-between w-full mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-sora">Bugs Tracker</h1>
            <p className="text-gray-600 mt-1">Manage and track your Issues</p>
          </div>
          
          <Button 
            onClick={() => setShowNewRunModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Tracker
          </Button>
        </div>

        {/* Tabs for Trackers / My Trackers */}
        <div className="px-6 pt-4 mb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="all-trackers">Trackers</TabsTrigger>
                <TabsTrigger value="my-trackers">My Trackers</TabsTrigger>
              </TabsList>
            </Tabs>
            {/* placeholder to keep flex spacing */}
          </div>
        </div>
        
        {/* Enhanced Controls */}
        <div className="px-6 py-4 mb-6">
          <div className="w-full">
            {/* All Controls in One Line */}
            <div className="flex items-center justify-between w-full">
              {/* Search Bar - Left side */}
              <div className="relative w-full max-w-md mr-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by Tracker ID, keywords..." 
                  className="pl-10 bg-white/80 border-gray-300 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Filters and Controls - Right side */}
              <div className="flex items-center space-x-4">
                <Filter className="w-4 h-4 text-gray-500" />
                
                {/* Status Filter Multi-Select */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Status {filterStatuses.length > 0 ? `(${filterStatuses.length})` : ''}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {statusOptions.map(opt => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={filterStatuses.includes(opt.value)}
                        onCheckedChange={(checked) => {
                          setFilterStatuses(prev => checked ? [...prev, opt.value] : prev.filter(s => s !== opt.value));
                        }}
                        className="cursor-pointer"
                      >
                        <span className={`px-2 py-1 rounded-full text-xs ${opt.className}`}>{opt.label}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Priority Filter Multi-Select */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      Priority {filterPriorities.length > 0 ? `(${filterPriorities.length})` : ''}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-40">
                    {priorityOptions.map(p => (
                      <DropdownMenuCheckboxItem
                        key={p.value}
                        checked={filterPriorities.includes(p.value)}
                        onCheckedChange={(checked) => {
                          setFilterPriorities(prev => checked ? [...prev, p.value] : prev.filter(x => x !== p.value));
                        }}
                        className="cursor-pointer"
                      >
                        <span className={`px-2 py-1 rounded-full text-xs ${p.className}`}>{p.value.toUpperCase()}</span>
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Project Filter */}
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-40">
                    {loadingProjects ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Project" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Projects</span>
                    </SelectItem>
                    {getUniqueProjects().map((project) => (
                      <SelectItem key={typeof project === 'string' ? project : project.id} 
                                 value={typeof project === 'string' ? project : project.id}>
                        <span className="px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800">
                          {typeof project === 'string' ? project : project.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Creator Filter */}
                <Select value={filterCreator} onValueChange={setFilterCreator}>
                  <SelectTrigger className="w-44">
                    {loadingMembers ? (
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                        <span className="text-sm">Loading...</span>
                      </div>
                    ) : (
                      <SelectValue placeholder="Creator" />
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Creators</span>
                    </SelectItem>
                    {getUniqueCreators().map((creator) => (
                      <SelectItem 
                        key={typeof creator === 'string' ? creator : creator.id} 
                        value={typeof creator === 'string' ? creator : creator.id}
                      >
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">
                          {typeof creator === 'string' ? creator : `${creator.displayName} (${creator.email})`}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Filter with Calendar */}
                <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant={dateFilter !== 'all' || isCustomDateRange ? "default" : "outline"}
                      className="px-3 py-2 flex items-center gap-1"
                    >
                      <Calendar className="w-4 h-4" />
                      <span className="text-xs">
                        {isCustomDateRange && dateRange.from 
                          ? formatDateRange(dateRange) 
                          : dateFilter === 'all' 
                            ? "Created" 
                            : dateFilter.charAt(0).toUpperCase() + dateFilter.slice(1)}
                      </span>
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
                        <h4 className="font-medium text-sm">Select Date Range</h4>
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
                        <Button type="button" onClick={resetDateRange} variant="outline" size="sm">
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

                      {/* Quick Date Options */}
                      <div className="border-t pt-4 mt-2">
                        <h4 className="font-medium text-sm mb-2">Quick Select</h4>
                        <div className="grid grid-cols-1 gap-2">
                          <Button 
                            variant={dateFilter === 'thisWeek' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => {
                              resetDateRange();
                              setDateFilter('thisWeek');
                              setIsDatePopoverOpen(false);
                            }}
                          >
                            This Week
                          </Button>
                          <Button 
                            variant={dateFilter === 'thisMonth' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => {
                              resetDateRange();
                              setDateFilter('thisMonth');
                              setIsDatePopoverOpen(false);
                            }}
                          >
                            This Month
                          </Button>

                          <Button 
                            variant={dateFilter === 'overdue' ? "default" : "outline"} 
                            size="sm"
                            onClick={() => {
                              resetDateRange();
                              setDateFilter('overdue');
                              setIsDatePopoverOpen(false);
                            }}
                          >
                            Overdue
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Sort Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      {sortOrder === 'asc' ? <SortAsc className="w-4 h-4 mr-2" /> : <SortDesc className="w-4 h-4 mr-2" />}
                      Sort
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleSort('id')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800 mr-2">Tracker ID</span>
                      {sortField === 'id' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('name')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-cyan-100 text-cyan-800 mr-2">Name</span>
                      {sortField === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('project')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-800 mr-2">Project</span>
                      {sortField === 'project' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('creator')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 mr-2">Creator</span>
                      {sortField === 'creator' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('status')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-rose-100 text-rose-800 mr-2">Status</span>
                      {sortField === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSort('date')}>
                      <span className="px-2 py-1 rounded-full text-xs bg-violet-100 text-violet-800 mr-2">Date</span>
                      {sortField === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Cards removed as requested */}

        {/* Results count */}
        <div className="px-6 py-2">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedRuns.length} of {testRuns.length} trackers
          </p>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <Loader2 className="w-12 h-12 text-green-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading trackers...</p>
          </div>
        ) : filteredAndSortedRuns.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Beaker className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {hasActiveFilters ? 'No trackers found with current filters' : 'No bug trackers found'}
            </h3>
            <p className="text-gray-500 mb-6">
              {hasActiveFilters 
                ? 'Try adjusting your search terms or filters, or create a new tracker.' 
                : 'Create your first bug tracker to get started.'
              }
            </p>
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                onClick={clearFilters}
                className="mb-4"
              >
                Clear Filters
              </Button>
            )}
            <Button 
              onClick={() => setShowNewRunModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Tracker
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSort('id')}
                  >
                    <div className="flex items-center gap-2">
                      Tracker ID
                      {getSortIcon('id')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {getSortIcon('name')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSort('project')}
                  >
                    <div className="flex items-center gap-2">
                      Project
                      {getSortIcon('project')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSort('creator')}
                  >
                    <div className="flex items-center gap-2">
                      Creator
                      {getSortIcon('creator')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {getSortIcon('status')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSort('priority')}
                  >
                    <div className="flex items-center gap-2">
                      Priority
                      {getSortIcon('priority')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSort('totalBugs')}
                  >
                    <div className="flex items-center gap-2">
                      Bugs
                      {getSortIcon('totalBugs')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSort('totalTasks')}
                  >
                    <div className="flex items-center gap-2">
                      Tasks
                      {getSortIcon('totalTasks')}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleSort('date')}
                  >
                    <div className="flex items-center gap-2">
                      Created Date
                      {getSortIcon('date')}
                    </div>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedRuns.map((run) => (
                  <TableRow 
                    key={run.id} 
                    className="cursor-auto hover:bg-transparent"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                            run.status === 'completed' 
                              ? 'bg-tasksmate-gradient border-transparent' 
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackerToggle(run.id);
                          }}
                        >
                          {run.status === 'completed' && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <CopyableIdBadge 
                          id={run.id} 
                          className="bg-orange-600 hover:bg-orange-700 text-white cursor-pointer" 
                          copyLabel="Tracker"
                          isCompleted={run.status === 'completed'}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{run.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-teal-100 text-teal-800 text-xs hover:bg-teal-100">
                        {run.project}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-800 text-xs hover:bg-purple-100">
                        {run.creator}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={run.status} 
                        onValueChange={(value) => handleStatusChange(run.id, value)}
                      >
                        <SelectTrigger className="w-36 border-none bg-transparent p-0 h-auto">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getStatusColor(run.status)}`}
                          >
                            {getStatusText(run.status)}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="not_started">
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                              Not Started
                            </Badge>
                          </SelectItem>
                          <SelectItem value="in_progress">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              In Progress
                            </Badge>
                          </SelectItem>
                          <SelectItem value="blocked">
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                              Blocked
                            </Badge>
                          </SelectItem>
                          <SelectItem value="on_hold">
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                              On Hold
                            </Badge>
                          </SelectItem>
                          <SelectItem value="completed">
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Completed
                            </Badge>
                          </SelectItem>
                          <SelectItem value="archived">
                            <Badge variant="secondary" className="text-xs bg-purple-100 text-purple-800">
                              Archived
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Select 
                        value={run.priority} 
                        onValueChange={(value) => handlePriorityChange(run.id, value)}
                      >
                        <SelectTrigger className="w-28 border-none bg-transparent p-0 h-auto">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs ${getPriorityColor(run.priority)}`}
                          >
                            {run.priority.charAt(0).toUpperCase() + run.priority.slice(1)}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">
                            <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                              Low
                            </Badge>
                          </SelectItem>
                          <SelectItem value="medium">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              Medium
                            </Badge>
                          </SelectItem>
                          <SelectItem value="high">
                            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                              High
                            </Badge>
                          </SelectItem>
                          <SelectItem value="critical">
                            <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                              Critical
                            </Badge>
                          </SelectItem>
                          <SelectItem value="none">
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                              None
                            </Badge>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">{run.totalBugs}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-blue-600">{run.totalTasks}</span>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(run.date).toLocaleDateString()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tester-zone/runs/${run.id}?org_id=${currentOrgId}`);
                        }}
                        className="text-xs"
                      >
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* New Run Modal */}
        <NewRunModal 
          open={showNewRunModal}
          onOpenChange={setShowNewRunModal}
        />
      </div>
    </div>
  );
};

export default TesterZone;
