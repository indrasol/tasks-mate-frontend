
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronRight, Upload, Camera, ArrowLeft, Plus } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

const BugDetailPage = () => {
  const { bugId } = useParams();
  
  // Mock bug data
  const bug = {
    id: bugId || 'BUG-001',
    title: 'Login button not responsive on mobile',
    description: 'The login button becomes unclickable on mobile devices under 768px width. This happens consistently across different browsers including Chrome, Safari, and Firefox on iOS devices.',
    severity: 'high' as const,
    tags: ['UI', 'Mobile', 'Authentication', 'Cross-browser'],
    createdAt: '2024-12-25T10:30:00Z'
  };

  const [reproSteps, setReproSteps] = useState([
    'Navigate to the login page on a mobile device',
    'Enter valid credentials in the email and password fields',
    'Attempt to tap the "Sign In" button',
    'Notice that the button does not respond to touch'
  ]);

  const [newStep, setNewStep] = useState('');
  const [attachments, setAttachments] = useState([
    {
      id: '1',
      name: 'mobile-login-bug.png',
      type: 'image',
      url: '/placeholder.svg',
      uploadedAt: '2024-12-25T11:00:00Z'
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

  const handleAddStep = () => {
    if (newStep.trim()) {
      setReproSteps([...reproSteps, newStep.trim()]);
      setNewStep('');
    }
  };

  const handleRemoveStep = (index: number) => {
    setReproSteps(reproSteps.filter((_, i) => i !== index));
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
                <Link to="/tester-zone/runs/TB-001/bugs">Bug Board</Link>
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
                <span className="text-sm text-gray-500">#{bug.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 font-sora mb-2">
                {bug.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-4">
                {bug.tags.map((tag, index) => (
                  <Badge key={index} variant="outline" className="bg-blue-50 text-blue-700">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-600">
                Created {new Date(bug.createdAt).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link to="/tester-zone/runs/TB-001/bugs">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Board
                </Link>
              </Button>
              <Button className="bg-green-500 hover:bg-green-600 text-white">
                Convert to Task
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
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
                <div className="space-y-3 mb-4">
                  {reproSteps.map((step, index) => (
                    <div key={index} className="flex gap-3 group">
                      <div className="flex-shrink-0 w-6 h-6 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-gray-700 flex-1">{step}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveStep(index)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
                
                {/* Add new step */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Add reproduction step..."
                    value={newStep}
                    onChange={(e) => setNewStep(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddStep()}
                  />
                  <Button onClick={handleAddStep} size="sm" disabled={!newStep.trim()}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Upload Attachments */}
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
                <div className="grid grid-cols-2 gap-4">
                  {attachments.map((item) => (
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

            {/* Expected vs Actual Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Expected vs Actual Results</CardTitle>
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
                <Button className="w-full bg-green-500 hover:bg-green-600 text-white">
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BugDetailPage;
