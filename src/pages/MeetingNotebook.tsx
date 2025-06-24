import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Save, 
  Share, 
  FileDown, 
  Plus,
  CheckSquare,
  Clock,
  AlertTriangle,
  FileText,
  GripVertical,
  MoreVertical
} from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MeetingItem {
  id: string;
  content: string;
  section: 'completed' | 'in-progress' | 'blocked' | 'notes';
  order: number;
  isTask?: boolean;
}

interface MeetingData {
  id: string;
  title: string;
  date: string;
  product: string;
  status: 'draft' | 'published';
  items: MeetingItem[];
}

// Mock data
const mockMeetingData: MeetingData = {
  id: "1",
  title: "Product Strategy Review",
  date: "2024-06-25",
  product: "TasksMate",
  status: "draft",
  items: [
    {
      id: "1",
      content: "Review Q3 roadmap priorities",
      section: "completed",
      order: 0
    },
    {
      id: "2", 
      content: "[ ] Update user feedback integration timeline",
      section: "in-progress",
      order: 0,
      isTask: true
    },
    {
      id: "3",
      content: "Waiting for legal approval on data retention policy",
      section: "blocked", 
      order: 0
    },
    {
      id: "4",
      content: "Key insights from user research:\n- Users want better mobile experience\n- Integration requests are increasing\n- Performance is critical for enterprise clients",
      section: "notes",
      order: 0
    }
  ]
};

const MeetingNotebook = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meetingData, setMeetingData] = useState<MeetingData>(mockMeetingData);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [newItemInputs, setNewItemInputs] = useState({
    completed: '',
    'in-progress': '',
    blocked: '',
    notes: ''
  });

  const sections = [
    {
      key: 'completed' as const,
      title: 'Completed',
      icon: CheckSquare,
      color: 'bg-green-50 border-green-200',
      headerColor: 'bg-green-100 text-green-800'
    },
    {
      key: 'in-progress' as const,
      title: 'In Progress', 
      icon: Clock,
      color: 'bg-amber-50 border-amber-200',
      headerColor: 'bg-amber-100 text-amber-800'
    },
    {
      key: 'blocked' as const,
      title: 'Blocked',
      icon: AlertTriangle,
      color: 'bg-red-50 border-red-200', 
      headerColor: 'bg-red-100 text-red-800'
    },
    {
      key: 'notes' as const,
      title: 'Notes',
      icon: FileText,
      color: 'bg-gray-50 border-gray-200',
      headerColor: 'bg-gray-100 text-gray-800'
    }
  ];

  // Auto-save simulation
  useEffect(() => {
    if (saveStatus === 'saving') {
      const timer = setTimeout(() => {
        setSaveStatus('saved');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleAddItem = (section: MeetingItem['section']) => {
    const content = newItemInputs[section].trim();
    if (!content) return;

    const newItem: MeetingItem = {
      id: Date.now().toString(),
      content,
      section,
      order: meetingData.items.filter(item => item.section === section).length,
      isTask: content.startsWith('[ ]')
    };

    setMeetingData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));

    setNewItemInputs(prev => ({
      ...prev,
      [section]: ''
    }));

    setSaveStatus('saving');
  };

  const handlePublish = () => {
    console.log("Publishing meeting summary...");
    // TODO: Open publish modal
  };

  const handleExport = () => {
    console.log("Exporting to PDF...");
  };

  const getTaskItems = () => {
    return meetingData.items.filter(item => item.isTask);
  };

  const getSectionItems = (section: MeetingItem['section']) => {
    return meetingData.items.filter(item => item.section === section);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/meetings')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Meetings
              </Button>
              <span className="text-gray-400">/</span>
              <h1 className="font-semibold text-gray-900">{meetingData.title}</h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Auto-save Status */}
              <div className="flex items-center gap-2 text-sm">
                {saveStatus === 'saved' && (
                  <>
                    <Save className="w-4 h-4 text-green-600" />
                    <span className="text-green-600">Saved</span>
                  </>
                )}
                {saveStatus === 'saving' && (
                  <>
                    <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                    <span className="text-amber-600">Saving...</span>
                  </>
                )}
              </div>

              <Button variant="outline" onClick={handlePublish}>
                <Share className="w-4 h-4 mr-2" />
                Publish Summary
              </Button>
              
              <Button variant="outline" onClick={handleExport}>
                <FileDown className="w-4 h-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {/* Left Panel - Section Columns */}
          <div className="flex-1 grid grid-cols-2 gap-4 overflow-hidden">
            {sections.map((section) => {
              const items = getSectionItems(section.key);
              const SectionIcon = section.icon;
              
              return (
                <Card key={section.key} className={`${section.color} flex flex-col`}>
                  <CardHeader className={`${section.headerColor} py-3 rounded-t-lg`}>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <SectionIcon className="w-4 h-4" />
                      {section.title}
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {items.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  
                  <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto">
                    {/* Existing Items */}
                    {items.map((item) => (
                      <div key={item.id} className="group relative">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                          <div className="flex items-start gap-2">
                            <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                            <div className="flex-1 min-w-0">
                              {section.key === 'notes' ? (
                                <Textarea
                                  value={item.content}
                                  onChange={(e) => {
                                    // TODO: Update item content
                                    setSaveStatus('saving');
                                  }}
                                  className="border-none p-0 resize-none bg-transparent focus-visible:ring-0 min-h-[60px]"
                                  placeholder="Add notes..."
                                />
                              ) : (
                                <p className="text-sm text-gray-900 break-words">
                                  {item.content}
                                </p>
                              )}
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>Edit</DropdownMenuItem>
                                <DropdownMenuItem>Move to...</DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Add New Item */}
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-gray-400 transition-colors">
                      {section.key === 'notes' ? (
                        <Textarea
                          placeholder="Add notes..."
                          value={newItemInputs[section.key]}
                          onChange={(e) => setNewItemInputs(prev => ({
                            ...prev,
                            [section.key]: e.target.value
                          }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.ctrlKey) {
                              handleAddItem(section.key);
                            }
                          }}
                          className="border-none p-0 resize-none bg-transparent focus-visible:ring-0 min-h-[60px]"
                        />
                      ) : (
                        <Input
                          placeholder="+ Add item"
                          value={newItemInputs[section.key]}
                          onChange={(e) => setNewItemInputs(prev => ({
                            ...prev,
                            [section.key]: e.target.value
                          }))}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddItem(section.key);
                            }
                          }}
                          className="border-none p-0 bg-transparent focus-visible:ring-0"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Right Panel - Action Drawer */}
          <div className="w-80 space-y-4">
            {/* Metadata Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{meetingData.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(meetingData.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Product:</span>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                    {meetingData.product}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge className={meetingData.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}>
                    {meetingData.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Action Items
                  <Badge variant="secondary">{getTaskItems().length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {getTaskItems().length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No action items yet</p>
                ) : (
                  getTaskItems().map((item) => (
                    <div key={item.id} className="flex items-start gap-2 p-2 bg-gray-50 rounded border text-sm">
                      <CheckSquare className="w-4 h-4 text-tasksmate-green-end mt-0.5 flex-shrink-0" />
                      <span className="flex-1">{item.content.replace('[ ]', '').trim()}</span>
                    </div>
                  ))
                )}
                
                {getTaskItems().length > 0 && (
                  <Button className="w-full mt-3 bg-tasksmate-gradient hover:scale-105 transition-all duration-200">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Tasks
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotebook;
