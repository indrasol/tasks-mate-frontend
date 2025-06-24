
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Upload, Camera, FileText, Clock, MessageSquare, Tag, ArrowLeft } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const BugDetail = () => {
  const { id: runId, bugId } = useParams();
  const [activeTab, setActiveTab] = useState('details');
  
  // Mock bug data
  const bug = {
    id: bugId || 'BUG-001',
    title: 'Login button not responsive on mobile',
    description: 'The login button becomes unclickable on mobile devices under 768px width. This happens consistently across different browsers including Chrome, Safari, and Firefox on iOS devices.',
    severity: 'major' as const,
    status: 'new' as const,
    tags: ['UI', 'Mobile', 'Authentication', 'Cross-browser'],
    votes: 3,
    createdAt: '2024-12-20T10:30:00Z',
    updatedAt: '2024-12-20T14:15:00Z'
  };

  const [reproSteps, setReproSteps] = useState([
    'Navigate to the login page on a mobile device',
    'Enter valid credentials in the email and password fields',
    'Attempt to tap the "Sign In" button',
    'Notice that the button does not respond to touch'
  ]);

  const [evidence, setEvidence] = useState([
    {
      id: '1',
      type: 'image',
      name: 'mobile-login-bug.png',
      url: '/placeholder.svg',
      uploadedAt: '2024-12-20T11:00:00Z'
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
                <Link to={`/tester-zone/runs/${runId}`}>Test Book {runId}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to={`/tester-zone/runs/${runId}/bugs`}>Bug Board</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage>{bug.id}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="bg-white rounded-lg border shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <Badge className={`${getSeverityColor(bug.severity)} border text-sm font-medium`}>
                  {bug.severity.toUpperCase()}
                </Badge>
                <Badge className={`${getStatusColor(bug.status)} border-0 text-sm`}>
                  {bug.status}
                </Badge>
                <span className="text-sm text-gray-500">#{bug.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 font-sora mb-2">
                {bug.title}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Created {new Date(bug.createdAt).toLocaleDateString()}
                </span>
                <span className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  {bug.votes} votes
                </span>
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to={`/tester-zone/runs/${runId}/bugs`}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Board
                </Link>
              </Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                Convert to Task
              </Button>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {bug.tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea 
                  value={bug.description}
                  className="min-h-[120px] resize-none border-0 p-0 text-base"
                  readOnly
                />
              </CardContent>
            </Card>

            {/* Reproduction Steps */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Steps to Reproduce</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reproSteps.map((step, index) => (
                    <div key={index} className="flex gap-3">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 flex-1">{step}</p>
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="mt-4">
                  <FileText className="w-4 h-4 mr-2" />
                  Edit Steps
                </Button>
              </CardContent>
            </Card>

            {/* Evidence Gallery */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Evidence & Screenshots
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white">
                    <Upload className="w-4 h-4 mr-2" />
                    Upload
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {evidence.map((item) => (
                    <div key={item.id} className="bg-gray-100 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
                      <div className="aspect-video bg-white flex items-center justify-center">
                        <img 
                          src={item.url} 
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-3">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(item.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Upload placeholder */}
                  <div className="aspect-video bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-300 transition-colors">
                    <Camera className="w-8 h-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Add Evidence</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Bug Properties */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bug Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Select defaultValue={bug.severity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="major">Major</SelectItem>
                      <SelectItem value="minor">Minor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={bug.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="fixed">Fixed</SelectItem>
                      <SelectItem value="retest">Retest</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  Save Changes
                </Button>
              </CardContent>
            </Card>

            {/* Expected vs Actual */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expected vs Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="expected">Expected Result</Label>
                  <Textarea 
                    id="expected"
                    placeholder="What should happen..."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="actual">Actual Result</Label>
                  <Textarea 
                    id="actual"
                    placeholder="What actually happens..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BugDetail;
