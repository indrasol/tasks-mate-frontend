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
  MoreVertical,
  Users,
  Calendar,
  Settings,
  Edit,
  Trash2
} from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import AddProjectModal from "@/components/meetings/AddProjectModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/hooks/use-toast';

interface MeetingItem {
  id: string;
  content: string;
  section: 'completed' | 'in-progress' | 'blocked' | 'notes';
  order: number;
  isTask?: boolean;
  userId?: string;
  date?: string;
  projectId?: string;
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  teamLead: string;
  members: TeamMember[];
}

interface Session {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  attendees: string[];
}

const MeetingNotebook = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  
  // Status tab state
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedProject, setSelectedProject] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [meetingItems, setMeetingItems] = useState<MeetingItem[]>([
    {
      id: "1",
      content: "Review Q3 roadmap priorities",
      section: "completed",
      order: 0,
      userId: "john",
      date: new Date().toISOString().split('T')[0]
    },
    {
      id: "2", 
      content: "[ ] Update user feedback integration timeline",
      section: "in-progress",
      order: 0,
      isTask: true,
      userId: "jane",
      date: new Date().toISOString().split('T')[0]
    }
  ]);

  // Projects tab state
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "1",
      name: "TasksMate",
      description: "Main task management platform",
      teamLead: "John Doe",
      members: [
        { id: "1", name: "John Doe", role: "Team Lead" },
        { id: "2", name: "Jane Smith", role: "Developer" },
        { id: "3", name: "Mike Johnson", role: "Designer" }
      ]
    }
  ]);

  // Sessions tab state
  const [sessions, setSessions] = useState<Session[]>([
    {
      id: "1",
      title: "Sprint Planning",
      date: "2024-06-25",
      time: "14:00",
      description: "Planning for next sprint activities",
      attendees: ["john@company.com", "jane@company.com"]
    }
  ]);

  const [newItemInputs, setNewItemInputs] = useState({
    completed: '',
    'in-progress': '',
    blocked: '',
    notes: ''
  });

  const [isAddProjectModalOpen, setIsAddProjectModalOpen] = useState(false);

  // Get users based on selected project
  const getProjectUsers = () => {
    const baseUsers = [{ id: 'all', name: 'All Users' }];
    
    if (selectedProject === 'all') {
      // Return all unique users from all projects
      const allUsers = projects.flatMap(project => 
        [project.teamLead, ...project.members.map(m => m.name)]
      );
      const uniqueUsers = [...new Set(allUsers)];
      return [
        ...baseUsers,
        ...uniqueUsers.map((name, index) => ({ 
          id: `user-${index}`, 
          name 
        }))
      ];
    } else {
      const project = projects.find(p => p.id === selectedProject);
      if (project) {
        return [
          ...baseUsers,
          { id: 'lead', name: project.teamLead },
          ...project.members.map(member => ({ 
            id: member.id, 
            name: member.name 
          }))
        ];
      }
    }
    
    return baseUsers;
  };

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
      order: meetingItems.filter(item => item.section === section).length,
      isTask: content.startsWith('[ ]'),
      userId: selectedUser === 'all' ? 'john' : selectedUser,
      date: selectedDate,
      projectId: selectedProject === 'all' ? undefined : selectedProject
    };

    setMeetingItems(prev => [...prev, newItem]);
    setNewItemInputs(prev => ({ ...prev, [section]: '' }));
    setSaveStatus('saving');
  };

  const getFilteredItems = (section: MeetingItem['section']) => {
    return meetingItems.filter(item => {
      const userMatch = selectedUser === 'all' || item.userId === selectedUser;
      const dateMatch = item.date === selectedDate;
      const sectionMatch = item.section === section;
      const projectMatch = selectedProject === 'all' || item.projectId === selectedProject;
      return userMatch && dateMatch && sectionMatch && projectMatch;
    });
  };

  const handleAddProject = (projectData: Project) => {
    setProjects(prev => [...prev, projectData]);
  };

  const handleEditProject = (projectId: string) => {
    toast({
      title: "Edit Project",
      description: "Edit functionality will be implemented soon.",
    });
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
    toast({
      title: "Success",
      description: "Project deleted successfully!",
    });
  };

  const addSession = () => {
    const newSession: Session = {
      id: Date.now().toString(),
      title: "New Session",
      date: new Date().toISOString().split('T')[0],
      time: "14:00",
      description: "",
      attendees: []
    };
    setSessions(prev => [...prev, newSession]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
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
              <h1 className="font-semibold text-gray-900">Product Strategy Review</h1>
            </div>

            <div className="flex items-center gap-3">
              {saveStatus === 'saved' && (
                <>
                  <Save className="w-4 h-4 text-green-600" />
                  <span className="text-green-600 text-sm">Saved</span>
                </>
              )}
              {saveStatus === 'saving' && (
                <>
                  <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-600 rounded-full animate-spin" />
                  <span className="text-amber-600 text-sm">Saving...</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="container mx-auto px-6 py-6">
        <Tabs defaultValue="status" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:grid-cols-3 bg-white border border-gray-200 rounded-lg p-1">
            <TabsTrigger 
              value="status" 
              className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 transition-all duration-200"
            >
              <CheckSquare className="w-4 h-4" />
              Status
            </TabsTrigger>
            <TabsTrigger 
              value="projects" 
              className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 transition-all duration-200"
            >
              <Users className="w-4 h-4" />
              Projects
            </TabsTrigger>
            <TabsTrigger 
              value="sessions" 
              className="flex items-center gap-2 data-[state=active]:bg-green-50 data-[state=active]:text-green-700 data-[state=active]:border-green-200 transition-all duration-200"
            >
              <Calendar className="w-4 h-4" />
              Sessions
            </TabsTrigger>
          </TabsList>

          {/* Status Tab */}
          <TabsContent value="status" className="space-y-4">
            {/* Status Controls */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Date:</label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-40"
                />
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Project:</label>
                <Select value={selectedProject} onValueChange={setSelectedProject}>
                  <SelectTrigger className="w-48 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/20">
                    <SelectValue placeholder="Select project" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map(project => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                    <SelectItem value="add-new" className="text-green-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add Project
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">User:</label>
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="w-40 bg-white border-gray-300 focus:border-green-500 focus:ring-green-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-gray-200 shadow-lg">
                    {getProjectUsers().map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status Cards Grid */}
            <div className="grid grid-cols-2 gap-4 h-[calc(100vh-300px)]">
              {sections.map((section) => {
                const items = getFilteredItems(section.key);
                const SectionIcon = section.icon;
                
                return (
                  <Card key={section.key} className={`${section.color} flex flex-col border-2 transition-all duration-200 hover:shadow-lg`}>
                    <CardHeader className={`${section.headerColor} py-3 rounded-t-lg`}>
                      <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <SectionIcon className="w-4 h-4" />
                        {section.title}
                        <Badge variant="secondary" className="ml-auto text-xs bg-white/80">
                          {items.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="flex-1 p-4 space-y-3 overflow-y-auto">
                      {items.map((item) => (
                        <div key={item.id} className="group relative">
                          <div className="bg-white p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 hover:shadow-sm">
                            <div className="flex items-start gap-2">
                              <GripVertical className="w-4 h-4 text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-900 break-words">
                                  {item.content}
                                </p>
                                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                                  <span>{getProjectUsers().find(u => u.id === item.userId)?.name}</span>
                                  <span>•</span>
                                  <span>{item.date}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Add New Item */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-3 hover:border-green-400 transition-colors">
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
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Project Teams</h2>
              <Button 
                onClick={() => setIsAddProjectModalOpen(true)} 
                className="bg-green-500 hover:bg-green-600 transition-all duration-200 hover:scale-105 shadow-lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Project
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{project.name}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
                          <DropdownMenuItem onClick={() => handleEditProject(project.id)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Plus className="w-4 h-4 mr-2" />
                            Add Member
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600 focus:text-red-600"
                            onClick={() => handleDeleteProject(project.id)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">{project.description}</p>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Team Lead</h4>
                      <Badge className="bg-blue-100 text-blue-700">{project.teamLead}</Badge>
                    </div>

                    <div>
                      <h4 className="font-medium text-sm mb-2">Team Members ({project.members.length})</h4>
                      <div className="space-y-2">
                        {project.members.map((member) => (
                          <div key={member.id} className="flex items-center justify-between text-sm">
                            <span>{member.name}</span>
                            <Badge variant="outline" className="text-xs">{member.role}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Sessions Tab */}
          <TabsContent value="sessions" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Meeting Sessions</h2>
              <Button onClick={addSession} className="bg-green-500 hover:bg-green-600 transition-all duration-200 hover:scale-105 shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Add Session
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {sessions.map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-green-200">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="text-lg">{session.title}</span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-white border border-gray-200 shadow-lg">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{new Date(session.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{session.time}</span>
                      </div>
                    </div>

                    {session.description && (
                      <p className="text-sm text-gray-600">{session.description}</p>
                    )}

                    <div>
                      <h4 className="font-medium text-sm mb-2">Attendees ({session.attendees.length})</h4>
                      <div className="flex flex-wrap gap-1">
                        {session.attendees.map((attendee, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {attendee}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AddProjectModal
        open={isAddProjectModalOpen}
        onOpenChange={setIsAddProjectModalOpen}
        onAddProject={handleAddProject}
      />
    </div>
  );
};

export default MeetingNotebook;
