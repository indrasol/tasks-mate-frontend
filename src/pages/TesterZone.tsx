
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Bug, Beaker, Search, Calendar, ChevronUp, ChevronDown, Check, SortDesc, SortAsc, CalendarRange } from 'lucide-react';
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

interface TestRun {
  id: string;
  name: string;
  project: string;
  creator: string;
  status: 'not-started' | 'in-progress' | 'completed';
  totalBugs: number;
  totalTasks: number;
  date: string;
}

type SortField = 'id' | 'name' | 'project' | 'creator' | 'status' | 'totalBugs' | 'totalTasks' | 'date';
type SortOrder = 'asc' | 'desc';

const TesterZone = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useEffect(() => {
    const handler = (e:any)=>setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim()==='4rem');
    return ()=>window.removeEventListener('sidebar-toggle', handler);
  }, []);
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterCreator, setFilterCreator] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Mock data - replace with actual data fetching
  const [testRuns, setTestRuns] = useState<TestRun[]>([
    {
      id: 'TR-001',
      name: 'Sprint 12 Testing',
      project: 'TasksMate Web',
      creator: 'John Doe',
      status: 'in-progress',
      totalBugs: 10,
      totalTasks: 25,
      date: '2024-12-20'
    },
    {
      id: 'TR-002',
      name: 'Mobile App Beta',
      project: 'TasksMate Mobile',
      creator: 'Jane Smith',
      status: 'not-started',
      totalBugs: 3,
      totalTasks: 18,
      date: '2024-12-18'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'not-started': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'not-started': return 'Not Started';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  };

  const handleStatusChange = (runId: string, newStatus: string) => {
    setTestRuns(prev => prev.map(run => 
      run.id === runId 
        ? { ...run, status: newStatus as 'not-started' | 'in-progress' | 'completed' }
        : run
    ));
  };

  const handleTrackerToggle = (runId: string) => {
    setTestRuns(prev => prev.map(run => 
      run.id === runId 
        ? { ...run, status: run.status === 'completed' ? 'in-progress' : 'completed' }
        : run
    ));
  };

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterProject('all');
    setFilterCreator('all');
    setDateFilter('all');
    setSearchTerm('');
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'all' || filterProject !== 'all' || filterCreator !== 'all' || dateFilter !== 'all';

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

  // Get unique values for filters
  const getUniqueProjects = () => {
    return Array.from(new Set(testRuns.map(run => run.project)));
  };

  const getUniqueCreators = () => {
    return Array.from(new Set(testRuns.map(run => run.creator)));
  };

  // Date filter logic
  const isDateInRange = (date: string, filter: string) => {
    const itemDate = new Date(date);
    const now = new Date();

    switch (filter) {
      case 'thisWeek':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return itemDate >= weekAgo;
      case 'thisMonth':
        const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);
        return itemDate >= monthAgo;
      case 'nextMonth':
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return itemDate <= nextMonth;
      case 'overdue':
        return itemDate < now;
      default:
        return true;
    }
  };

  const filteredAndSortedRuns = testRuns
    .filter(run => {
      const matchesSearch = searchTerm === '' || 
        run.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.creator.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || run.status === filterStatus;
      const matchesProject = filterProject === 'all' || run.project === filterProject;
      const matchesCreator = filterCreator === 'all' || run.creator === filterCreator;
      const matchesDate = dateFilter === 'all' || isDateInRange(run.date, dateFilter);
      
      return matchesSearch && matchesStatus && matchesProject && matchesCreator && matchesDate;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else if (sortField === 'status') {
        const statusOrder = { 'not-started': 1, 'in-progress': 2, 'completed': 3 };
        aValue = statusOrder[a.status];
        bValue = statusOrder[b.status];
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
                
                {/* Status Filter Dropdown */}
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Status</span>
                    </SelectItem>
                    <SelectItem value="not-started">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">Not Started</span>
                    </SelectItem>
                    <SelectItem value="in-progress">
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">In Progress</span>
                    </SelectItem>
                    <SelectItem value="completed">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">Completed</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Project Filter */}
                <Select value={filterProject} onValueChange={setFilterProject}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Projects</span>
                    </SelectItem>
                    {getUniqueProjects().map((project) => (
                      <SelectItem key={project} value={project}>
                        <span className="px-2 py-1 rounded-full text-xs bg-teal-100 text-teal-800">{project}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Creator Filter */}
                <Select value={filterCreator} onValueChange={setFilterCreator}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Creator" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Creators</span>
                    </SelectItem>
                    {getUniqueCreators().map((creator) => (
                      <SelectItem key={creator} value={creator}>
                        <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">{creator}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-36">
                    <CalendarRange className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Date Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Dates</span>
                    </SelectItem>
                    <SelectItem value="thisWeek">
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">This Week</span>
                    </SelectItem>
                    <SelectItem value="thisMonth">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">This Month</span>
                    </SelectItem>
                    <SelectItem value="nextMonth">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-800">Next Month</span>
                    </SelectItem>
                    <SelectItem value="overdue">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Overdue</span>
                    </SelectItem>
                  </SelectContent>
                </Select>

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

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-sm text-gray-600">Total Trackers</p>
                <p className="text-2xl font-bold text-gray-900">{filteredAndSortedRuns.length}</p>
                <p className="text-xs text-gray-500 mt-1">Active bug trackers</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Bug className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-sm text-gray-600">Total Bugs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedRuns.reduce((sum, run) => sum + run.totalBugs, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Reported issues</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Bug className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border shadow-sm p-6">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-sm text-gray-600">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedRuns.reduce((sum, run) => sum + run.totalTasks, 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Testing tasks</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Filter className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Results count */}
        <div className="px-6 py-2">
          <p className="text-sm text-gray-600">
            Showing {filteredAndSortedRuns.length} of {testRuns.length} trackers
          </p>
        </div>

        {/* Table */}
        {filteredAndSortedRuns.length === 0 ? (
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
                      Date
                      {getSortIcon('date')}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedRuns.map((run) => (
                  <TableRow key={run.id} className="hover:bg-gray-50">
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
                        <Link 
                          to={`/tester-zone/runs/${run.id}`}
                          className="hover:underline"
                        >
                          <Badge className="text-xs font-mono bg-orange-600 text-white">
                            {run.id}
                          </Badge>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{run.name}</TableCell>
                    <TableCell>
                      <Badge className="bg-teal-100 text-teal-800 text-xs">
                        {run.project}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-purple-100 text-purple-800 text-xs">
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
                          <SelectItem value="not-started">
                            <Badge variant="secondary" className="text-xs bg-gray-100 text-gray-800">
                              Not Started
                            </Badge>
                          </SelectItem>
                          <SelectItem value="in-progress">
                            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                              In Progress
                            </Badge>
                          </SelectItem>
                          <SelectItem value="completed">
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              Completed
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
