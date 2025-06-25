
import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Plus, Search } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import NewBugModal from '@/components/tester/NewBugModal';

const BugBoard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isNewBugModalOpen, setIsNewBugModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data - replace with actual data fetching
  const testRun = {
    id: id || 'TB-001',
    name: 'Sprint 12 Testing',
    project: 'TasksMate Web'
  };

  const [bugs, setBugs] = useState([
    {
      id: 'BUG-001',
      title: 'Login button not responsive on mobile',
      description: 'The login button becomes unclickable on mobile devices under 768px width. This happens consistently across different browsers.',
      severity: 'high' as const,
      tags: ['UI', 'Mobile', 'Authentication'],
      closed: false
    },
    {
      id: 'BUG-002',
      title: 'Task deletion confirmation dialog missing',
      description: 'When users try to delete a task, no confirmation dialog appears which can lead to accidental deletions.',
      severity: 'medium' as const,
      tags: ['UX', 'Tasks', 'Confirmation'],
      closed: false
    },
    {
      id: 'BUG-003',
      title: 'Profile image upload fails silently',
      description: 'Profile image upload appears to work but fails without any error message to the user.',
      severity: 'low' as const,
      tags: ['Profile', 'Upload', 'Error Handling'],
      closed: true
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredBugs = bugs.filter(bug =>
    bug.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bug.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bug.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bug.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleBugClick = (bugId: string) => {
    navigate(`/tester-zone/runs/${testRun.id}/bugs/${bugId}`);
  };

  const handleBugToggle = (bugId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    setBugs(bugs.map(bug => 
      bug.id === bugId ? { ...bug, closed: !bug.closed } : bug
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="ml-64 p-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/tester-zone">Test Books</Link>
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
            <Badge variant="outline">{testRun.project}</Badge>
          </div>
          
          <Button 
            onClick={() => setIsNewBugModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Bug
          </Button>
        </div>

        {/* Search Bar */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by Bug ID, keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Bug Cards Grid */}
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
                    <input
                      type="checkbox"
                      checked={bug.closed}
                      onChange={(e) => handleBugToggle(bug.id, e)}
                      className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500"
                    />
                    <Badge className={`${getSeverityColor(bug.severity)} text-xs font-medium`}>
                      {bug.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <Badge className={`${bug.closed ? 'bg-gray-100 text-gray-700' : 'bg-red-100 text-red-700'} border-red-200 text-xs font-medium`}>
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
                <div className="flex flex-wrap gap-1">
                  {bug.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredBugs.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No bugs found</h3>
            <p className="text-gray-500">Try adjusting your search terms or create a new bug.</p>
          </div>
        )}
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
