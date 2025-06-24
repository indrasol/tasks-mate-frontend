
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, FileText, Users, Calendar, Settings, Download, CheckCircle } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import TestCases from '@/components/tester/TestCases';
import BugBoardTab from '@/components/tester/BugBoardTab';
import EvidenceGallery from '@/components/tester/EvidenceGallery';

const TestRunDetail = () => {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('test-cases');

  // Mock data - replace with actual data fetching
  const testRun = {
    id: id || 'TR-001',
    product: 'TasksMate Web',
    version: '2.1.0',
    environment: 'Staging',
    date: '2024-12-20',
    tester: 'John Doe',
    status: 'running',
    progress: 65,
    summary: {
      pending: 5,
      solved: 3,
      high: 2,
      medium: 3,
      low: 5,
      total: 13
    }
  };

  const participants = [
    { id: 1, name: 'John Doe', avatar: 'JD' },
    { id: 2, name: 'Jane Smith', avatar: 'JS' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="ml-64 p-8">
        {/* Breadcrumb */}
        <Breadcrumb className="mb-6">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/tester-zone">Test Runs</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{testRun.product} {testRun.version}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-sora mb-2">
                {testRun.product} {testRun.version} – {testRun.environment}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {new Date(testRun.date).toLocaleDateString()}
                </span>
                <Badge variant="outline">{testRun.tester}</Badge>
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

          {/* Summary Matrix */}
          <div className="grid grid-cols-7 gap-1 mb-6 bg-gray-50 rounded-lg p-4">
            <div className="font-semibold text-sm text-gray-700 p-2">Status</div>
            <div className="font-semibold text-sm text-gray-700 p-2 text-center">Pending</div>
            <div className="font-semibold text-sm text-gray-700 p-2 text-center">Solved</div>
            <div className="font-semibold text-sm text-gray-700 p-2 text-center">High</div>
            <div className="font-semibold text-sm text-gray-700 p-2 text-center">Medium</div>
            <div className="font-semibold text-sm text-gray-700 p-2 text-center">Low</div>
            <div className="font-semibold text-sm text-gray-700 p-2 text-center">Total</div>
            
            <div className="p-2 text-sm">Bugs</div>
            <div className="p-2 text-sm text-center bg-yellow-50 text-yellow-700 font-medium">{testRun.summary.pending}</div>
            <div className="p-2 text-sm text-center bg-green-50 text-green-700 font-medium">{testRun.summary.solved}</div>
            <div className="p-2 text-sm text-center bg-red-50 text-red-700 font-medium">{testRun.summary.high}</div>
            <div className="p-2 text-sm text-center bg-orange-50 text-orange-700 font-medium">{testRun.summary.medium}</div>
            <div className="p-2 text-sm text-center bg-blue-50 text-blue-700 font-medium">{testRun.summary.low}</div>
            <div className="p-2 text-sm text-center bg-gray-100 font-medium">{testRun.summary.total}</div>
          </div>

          {/* Meta row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Participants */}
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-500" />
                <div className="flex -space-x-2">
                  {participants.map((participant) => (
                    <div
                      key={participant.id}
                      className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-xs font-medium border-2 border-white"
                      title={participant.name}
                    >
                      {participant.avatar}
                    </div>
                  ))}
                </div>
                <Button variant="ghost" size="sm" className="ml-2 text-gray-500">
                  + Invite
                </Button>
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
                <span className="text-sm text-gray-600">Cases Passed</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="test-cases">Test Cases</TabsTrigger>
            <TabsTrigger value="bug-board">Bug Board</TabsTrigger>
            <TabsTrigger value="evidence">Evidence</TabsTrigger>
          </TabsList>
          
          <TabsContent value="test-cases">
            <TestCases runId={testRun.id} />
          </TabsContent>
          
          <TabsContent value="bug-board">
            <BugBoardTab runId={testRun.id} />
          </TabsContent>
          
          <TabsContent value="evidence">
            <EvidenceGallery runId={testRun.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TestRunDetail;
