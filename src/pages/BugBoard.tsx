
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Plus, Settings, Rocket, Edit, Trash2, Eye } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface Bug {
  id: string;
  title: string;
  severity: 'critical' | 'major' | 'minor';
  status: 'new' | 'confirmed' | 'fixed' | 'retest';
  category: string;
  location: string;
  votes: number;
  thumbnail?: string;
  description: string;
}

const BugBoard = () => {
  const { id } = useParams();
  
  const [bugs, setBugs] = useState<Bug[]>([
    {
      id: 'BUG-001',
      title: 'Login button not responsive on mobile',
      severity: 'major',
      status: 'new',
      category: 'UI Bug',
      location: '/login',
      votes: 3,
      description: 'The login button becomes unclickable on mobile devices under 768px width'
    },
    {
      id: 'BUG-002',
      title: 'Task deletion confirmation missing',
      severity: 'critical',
      status: 'confirmed',
      category: 'Input Validation',
      location: '/tasks',
      votes: 5,
      description: 'Tasks can be deleted without confirmation, leading to accidental data loss'
    },
    {
      id: 'BUG-003',
      title: 'Profile image upload fails silently',
      severity: 'minor',
      status: 'fixed',
      category: 'Upload Bug',
      location: '/profile',
      votes: 1,
      description: 'Profile image upload shows success but image is not saved'
    }
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'major': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'minor': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-purple-100 text-purple-700';
      case 'fixed': return 'bg-green-100 text-green-700';
      case 'retest': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const columns = [
    { id: 'new', title: 'New', bugs: bugs.filter(b => b.status === 'new') },
    { id: 'confirmed', title: 'Confirmed', bugs: bugs.filter(b => b.status === 'confirmed') },
    { id: 'fixed', title: 'Fixed', bugs: bugs.filter(b => b.status === 'fixed') },
    { id: 'retest', title: 'Retest', bugs: bugs.filter(b => b.status === 'retest') },
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
              <BreadcrumbLink asChild>
                <Link to={`/tester-zone/runs/${id}`}>Test Run {id}</Link>
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-sora">Bug Board</h1>
            <p className="text-gray-600 mt-1">Track and manage bugs through their lifecycle</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Board Settings
            </Button>
            <Button className="bg-red-500 hover:bg-red-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Bug
            </Button>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-4 gap-6">
          {columns.map((column) => (
            <div key={column.id} className="bg-white rounded-lg border shadow-sm">
              <div className="p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{column.title}</h3>
                  <Badge variant="outline" className="bg-gray-50">
                    {column.bugs.length}
                  </Badge>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {column.bugs.map((bug) => (
                  <Card key={bug.id} className="cursor-pointer hover:shadow-md transition-shadow group">
                    <CardContent className="p-4">
                      {/* Header with severity and status */}
                      <div className="flex items-start justify-between mb-3">
                        <Badge className={`${getSeverityColor(bug.severity)} border text-xs font-medium`}>
                          {bug.severity.toUpperCase()}
                        </Badge>
                        <Badge className={`${getStatusColor(bug.status)} border-0 text-xs`}>
                          {column.title}
                        </Badge>
                      </div>
                      
                      {/* Title */}
                      <h4 className="font-medium text-gray-900 mb-2 line-clamp-2">
                        {bug.title}
                      </h4>
                      
                      {/* Category and Location */}
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                          {bug.category}
                        </Badge>
                        <a 
                          href={bug.location}
                          className="text-xs text-green-600 hover:text-green-700 hover:underline flex items-center gap-1"
                        >
                          🌐 {bug.location}
                        </a>
                      </div>
                      
                      {/* Votes */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500">Votes:</span>
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700">
                            {bug.votes}
                          </Badge>
                        </div>
                        
                        {/* Toolbar (visible on hover) */}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Rocket className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Thumbnail placeholder */}
                      {bug.thumbnail && (
                        <div className="mt-3 w-full h-16 bg-gray-100 rounded border flex items-center justify-center">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
                
                {/* Add bug button */}
                <button className="w-full p-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-500 hover:border-gray-300 hover:text-gray-600 transition-colors">
                  <Plus className="w-5 h-5 mx-auto mb-1" />
                  <span className="text-sm">Add bug</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BugBoard;
