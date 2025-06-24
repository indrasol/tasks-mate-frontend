
import React, { useState } from 'react';
import { Upload, Image, Camera, CheckSquare, Square, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface TestCasesProps {
  runId: string;
}

interface TestCase {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  evidence: string[];
}

const TestCases = ({ runId }: TestCasesProps) => {
  const [testCases, setTestCases] = useState<TestCase[]>([
    {
      id: 'TC-001',
      title: 'User Login Flow',
      description: '1. Navigate to login page\n2. Enter valid credentials\n3. Click login button\n4. Verify dashboard loads',
      completed: true,
      evidence: []
    },
    {
      id: 'TC-002',
      title: 'Task Creation',
      description: '1. Click "New Task" button\n2. Fill required fields\n3. Save task\n4. Verify task appears in list',
      completed: false,
      evidence: []
    },
    {
      id: 'TC-003',
      title: 'Project Management',
      description: '1. Create new project\n2. Add team members\n3. Assign tasks\n4. Update project status',
      completed: false,
      evidence: []
    }
  ]);

  const [selectedText, setSelectedText] = useState('');

  const toggleTestCase = (id: string) => {
    setTestCases(cases => 
      cases.map(tc => 
        tc.id === id ? { ...tc, completed: !tc.completed } : tc
      )
    );
  };

  const handleCreateBugFromSelection = () => {
    if (selectedText) {
      console.log('Creating bug from selection:', selectedText);
      // This would open a bug creation modal with pre-filled content
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString().trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Evidence Upload
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex gap-4">
                <Button variant="outline" size="sm">
                  <Image className="w-4 h-4 mr-2" />
                  Upload Screenshots
                </Button>
                <Button variant="outline" size="sm">
                  <Camera className="w-4 h-4 mr-2" />
                  Paste Image
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Drag and drop files here, or click to select
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test Cases Checklist */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Test Cases Checklist</CardTitle>
            {selectedText && (
              <Button 
                size="sm" 
                onClick={handleCreateBugFromSelection}
                className="bg-red-500 hover:bg-red-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Bug from Selection
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {testCases.map((testCase) => (
            <div 
              key={testCase.id} 
              className="flex gap-4 p-4 border rounded-lg hover:bg-gray-50"
              onMouseUp={handleTextSelection}
            >
              <button
                onClick={() => toggleTestCase(testCase.id)}
                className="mt-1 text-green-600 hover:text-green-700"
              >
                {testCase.completed ? (
                  <CheckSquare className="w-5 h-5" />
                ) : (
                  <Square className="w-5 h-5" />
                )}
              </button>
              
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className={`font-medium ${testCase.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                    {testCase.title}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {testCase.id}
                  </Badge>
                  {testCase.completed && (
                    <Badge className="bg-green-100 text-green-700 text-xs">
                      Passed
                    </Badge>
                  )}
                </div>
                
                <div className={`text-sm whitespace-pre-line ${testCase.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {testCase.description}
                </div>
                
                {testCase.evidence.length > 0 && (
                  <div className="flex gap-2 mt-3">
                    {testCase.evidence.map((evidence, index) => (
                      <div key={index} className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center">
                        <Image className="w-6 h-6 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default TestCases;
