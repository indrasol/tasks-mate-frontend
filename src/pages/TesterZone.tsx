
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, Bug, Beaker, Search, Calendar, ChevronUp, ChevronDown } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
  testedBy: string;
  assignedTo: string[];
  totalBugs: number;
  totalTasks: number;
  date: string;
}

type SortField = 'id' | 'name' | 'project' | 'testedBy' | 'totalBugs' | 'totalTasks' | 'date';
type SortOrder = 'asc' | 'desc';

const TesterZone = () => {
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Mock data - replace with actual data fetching
  const testRuns: TestRun[] = [
    {
      id: 'TB-001',
      name: 'Sprint 12 Testing',
      project: 'TasksMate Web',
      testedBy: 'John Doe',
      assignedTo: ['Jane Smith', 'Mike Johnson'],
      totalBugs: 10,
      totalTasks: 25,
      date: '2024-12-20'
    },
    {
      id: 'TB-002',
      name: 'Mobile App Beta',
      project: 'TasksMate Mobile',
      testedBy: 'Jane Smith',
      assignedTo: ['Sarah Wilson'],
      totalBugs: 3,
      totalTasks: 18,
      date: '2024-12-18'
    }
  ];

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

  const filteredAndSortedRuns = testRuns
    .filter(run => {
      const matchesSearch = searchTerm === '' || 
        run.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        run.testedBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDate = dateFilter === '' || run.date.includes(dateFilter);
      
      return matchesSearch && matchesDate;
    })
    .sort((a, b) => {
      let aValue: any = a[sortField];
      let bValue: any = b[sortField];
      
      if (sortField === 'date') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
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
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-sora">Test Books</h1>
            <p className="text-gray-600 mt-1">Manage and track your testing activities</p>
          </div>
          
          <Button 
            onClick={() => setShowNewRunModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Book
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 transition-all duration-200" />
            <Input
              placeholder="Search by Book ID, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
            />
          </div>
          
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="pl-10 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 hover:shadow-md"
            />
          </div>
        </div>

        {/* Table */}
        {filteredAndSortedRuns.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Beaker className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No test books found</h3>
            <p className="text-gray-500 mb-6">Try adjusting your search or create a new test book</p>
            <Button 
              onClick={() => setShowNewRunModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Book
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
                      Book ID
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
                    onClick={() => handleSort('testedBy')}
                  >
                    <div className="flex items-center gap-2">
                      Tested By
                      {getSortIcon('testedBy')}
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
                  <TableHead>Assigned To</TableHead>
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
                      <Link 
                        to={`/tester-zone/runs/${run.id}`}
                        className="text-green-600 hover:text-green-700 hover:underline"
                      >
                        {run.id}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{run.name}</TableCell>
                    <TableCell>{run.project}</TableCell>
                    <TableCell>{run.testedBy}</TableCell>
                    <TableCell>
                      <span className="font-semibold text-red-600">{run.totalBugs}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-blue-600">{run.totalTasks}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {run.assignedTo.map((member) => (
                          <Badge key={member} variant="secondary" className="text-xs">
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(run.date).toLocaleDateString()}</TableCell>
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
