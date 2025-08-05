import React, { useState, useMemo, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Search, Grid3X3, List, Filter, SortDesc, SortAsc, CalendarRange, Check } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import NewBugModal from '@/components/tester/NewBugModal';

type Bug = {
  id: string;
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  tags: string[];
  closed: boolean;
  date: string;
};

const BugBoard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handler = (e:any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNewBugModalOpen, setIsNewBugModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'title' | 'severity' | 'id' | 'date'>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Mock data - replace with actual data fetching
  const testRun = {
    id: id || 'TB-001',
    name: 'Sprint 12 Testing',
    project: 'TasksMate Web'
  };

  const [bugs, setBugs] = useState<Bug[]>([
    {
      id: 'BUG-001',
      title: 'Login button not responsive on mobile',
      description: 'The login button becomes unclickable on mobile devices under 768px width. This happens consistently across different browsers.',
      severity: 'high' as const,
      tags: [testRun.project, 'UI', 'Mobile', 'Authentication'],
      closed: false,
      date: '2024-12-25'
    },
    {
      id: 'BUG-002',
      title: 'Task deletion confirmation dialog missing',
      description: 'When users try to delete a task, no confirmation dialog appears which can lead to accidental deletions.',
      severity: 'medium' as const,
      tags: [testRun.project, 'UX', 'Tasks', 'Confirmation'],
      closed: false,
      date: '2024-12-24'
    },
    {
      id: 'BUG-003',
      title: 'Profile image upload fails silently',
      description: 'Profile image upload appears to work but fails without any error message to the user.',
      severity: 'low' as const,
      tags: [testRun.project, 'Profile', 'Upload', 'Error Handling'],
      closed: true,
      date: '2024-12-20'
    }
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
        (filterStatus === 'open' && !bug.closed) ||
        (filterStatus === 'closed' && bug.closed);

      // Priority filter
      const matchesPriority = filterPriority === 'all' || bug.severity === filterPriority;

      // Date filter
      const matchesDate = dateFilter === 'all' || isDateInRange(bug.date, dateFilter);

      return matchesSearch && matchesStatus && matchesPriority && matchesDate;
    });

    return sortBugs(filtered);
  }, [bugs, searchTerm, filterStatus, filterPriority, dateFilter, sortBy, sortDirection]);

  const handleBugClick = (bugId: string) => {
    navigate(`/tester-zone/runs/${testRun.id}/bugs/${bugId}`);
  };

  const handleBugToggle = (bugId: string, checked: boolean) => {
    setBugs(bugs.map(bug => 
      bug.id === bugId ? { ...bug, closed: checked } : bug
    ));
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
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    bug.closed
                      ? 'bg-tasksmate-gradient border-transparent'
                      : 'border-gray-300 hover:border-gray-400'
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
                <Badge className={`${getSeverityColor(bug.severity)} text-xs font-medium`}>
                  {bug.severity.toUpperCase()}
                </Badge>
              </div>
              <Badge className="text-xs font-mono bg-red-600 text-white">
                {bug.id}
              </Badge>
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

            {/* Date */}
            <p className="text-xs text-gray-500">
              {new Date(bug.date).toLocaleDateString()}
            </p>
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
                Date
                {sortBy === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
              </div>
            </TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredBugs.map((bug) => (
            <TableRow 
              key={bug.id} 
              className="hover:bg-gray-50 cursor-pointer"
              onClick={() => handleBugClick(bug.id)}
            >
              <TableCell>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                    bug.closed
                      ? 'bg-tasksmate-gradient border-transparent'
                      : 'border-gray-300 hover:border-gray-400'
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
              </TableCell>
              <TableCell className="font-medium">
                <Badge className="text-xs font-mono bg-red-600 text-white">
                  {bug.id}
                </Badge>
              </TableCell>
              <TableCell className={`${bug.closed ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                {bug.title}
              </TableCell>
              <TableCell>
                <Badge className={`${getSeverityColor(bug.severity)} text-xs`}>
                  {bug.severity.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {bug.tags.slice(0, 2).map((tag, index) => (
                    <Badge key={index} variant="outline" className={`${getTagColor(tag)} text-xs`}>
                      {tag}
                    </Badge>
                  ))}
                  {bug.tags.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{bug.tags.length - 2}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-600">
                {new Date(bug.date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge className={`${bug.closed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-xs`}>
                  {bug.closed ? 'Closed' : 'Open'}
                </Badge>
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
      
      <div className="transition-all duration-300 p-8" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/tester-zone">Bug Tracker</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/tester-zone/runs/${testRun.id}`}>{testRun.name}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>Bug Board</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 font-sora mb-2">
              Bug Board - {testRun.name}
            </h1>
            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">{testRun.project}</Badge>
          </div>
          
          <Button 
            onClick={() => setIsNewBugModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Bug
          </Button>
        </div>

        {/* Enhanced Controls */}
        <div className="px-6 py-4 mb-6">
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
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-800">All Status</span>
                    </SelectItem>
                    <SelectItem value="open">
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">Open</span>
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
                <div className="flex items-center space-x-2 ml-2">
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
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bug Cards Grid */}
        {viewMode === 'grid' ? BugGridView() : BugListView()}

        {filteredBugs.length === 0 && (
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
        )}
      </div>

      <NewBugModal 
        open={isNewBugModalOpen} 
        onOpenChange={setIsNewBugModalOpen}
        runId={testRun.id}
        projectName={testRun.project}
      />
    </div>
  );
};

export default BugBoard;
