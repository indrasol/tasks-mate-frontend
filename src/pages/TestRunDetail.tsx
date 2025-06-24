
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Users, Calendar, Download } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import BugBoardTab from '@/components/tester/BugBoardTab';

const TestRunDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('bug-board');

  // Mock data - replace with actual data fetching
  const testRun = {
    id: id || 'TB-001',
    name: 'Sprint 12 Testing',
    project: 'TasksMate Web',
    date: '2024-12-20',
    testedBy: 'John Doe',
    assignedTo: ['Jane Smith', 'Mike Johnson'],
    status: 'running',
    progress: 65,
    summary: {
      high: 2,
      medium: 3,
      low: 5,
      total: 10
    }
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
                <Link to="/tester-zone">Testing Books</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{testRun.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-sora mb-2">
                {testRun.name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(testRun.date).toLocaleDateString()}
                </span>
                <Badge variant="outline">{testRun.project}</Badge>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Generate PDF
              </Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                End Run
              </Button>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Participants */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div className="flex items-center gap-2">
                  {/* Assigned to members as tags */}
                  <div className="flex flex-wrap gap-1">
                    {testRun.assignedTo.map((member) => (
                      <Badge key={member} variant="secondary" className="text-xs">
                        {member}
                      </Badge>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="ml-2 text-gray-500">
                    + Invite
                  </Button>
                </div>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="relative w-12 h-12">
                  <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="2"
                    />
                    <path
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray={`${testRun.progress}, 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-medium text-gray-700">{testRun.progress}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="bug-board">Bug Board</TabsTrigger>
            </TabsList>
            
            {activeTab === 'bug-board' && (
              <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
                <Link to={`/tester-zone/runs/${testRun.id}/bugs`}>
                  Open Bug Board
                </Link>
              </Button>
            )}
          </div>
          
          <TabsContent value="bug-board">
            <BugBoardTab runId={testRun.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TestRunDetail;
