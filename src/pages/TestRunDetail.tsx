
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Users, Calendar, Plus, UserPlus } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import BugBoardTab from '@/components/tester/BugBoardTab';
import { useToast } from '@/hooks/use-toast';

const TestRunDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('bug-board');

  // Mock data - replace with actual data fetching
  const [testRun, setTestRun] = useState({
    id: id || 'TR-001',
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
  });

  // Available team members that can be added
  const allMembers = [
    'Alice Johnson',
    'Bob Smith',
    'Carol Davis',
    'David Wilson',
    'Emma Brown',
    'Frank Miller',
    'Grace Lee',
    'Henry Clark'
  ];

  // Filter out already assigned members
  const availableMembers = allMembers.filter(member => !testRun.assignedTo.includes(member));

  const handleAddMember = (memberName: string) => {
    // Add new member to assignedTo list
    setTestRun(prev => ({
      ...prev,
      assignedTo: [...prev.assignedTo, memberName]
    }));

    // Show success notification
    toast({
      title: "Member added!",
      description: `${memberName} has been added to the team`,
    });

    // Here you would typically send an API request to add the user
    console.log('Adding member:', memberName);
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
                <Link to="/tester-zone">Bug Tracker</Link>
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
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6 relative">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-sora mb-2">
                  {testRun.name}
                </h1>
              </div>
              
              {/* Progress Circle next to name */}
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

            {/* Date and Project - Right Top Corner */}
            <div className="flex items-center gap-4">
              <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-sm">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(testRun.date).toLocaleDateString()}
              </Badge>
              <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">{testRun.project}</Badge>
            </div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Participants */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div className="flex items-center gap-2">
                  {/* Assigned to members as purple tags */}
                  <div className="flex flex-wrap gap-1">
                    {testRun.assignedTo.map((member) => (
                      <Badge key={member} className="text-xs bg-purple-100 text-purple-800">
                        {member}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Add Member Dropdown - Bottom Right Corner */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="absolute bottom-4 right-4 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                disabled={availableMembers.length === 0}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Add Team Member</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableMembers.length > 0 ? (
                availableMembers.map((member) => (
                  <DropdownMenuItem 
                    key={member}
                    onClick={() => handleAddMember(member)}
                    className="cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {member}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>
                  All members already added
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
