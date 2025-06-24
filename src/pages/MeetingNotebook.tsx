
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  CheckSquare,
  Clock,
  AlertTriangle,
  FileText,
  GripVertical
} from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusViewToggle from "@/components/meetings/StatusViewToggle";

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
}

interface Project {
  id: string;
  name: string;
  description: string;
  teamLead: string;
  members: TeamMember[];
}

const MeetingNotebook = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
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
      date: new Date().toISOString().split('T')[0],
      projectId: "1"
    },
    {
      id: "2", 
      content: "[ ] Update user feedback integration timeline",
      section: "in-progress",
      order: 0,
      isTask: true,
      userId: "jane",
      date: new Date().toISOString().split('T')[0],
      projectId: "1"
    },
    {
      id: "3",
      content: "Database optimization completed",
      section: "completed",
      order: 1,
      userId: "mike",
      date: new Date().toISOString().split('T')[0],
      projectId: "2"
    },
    {
      id: "4",
      content: "[ ] API endpoint testing",
      section: "in-progress",
      order: 1,
      isTask: true,
      userId: "sarah",
      date: new Date().toISOString().split('T')[0],
      projectId: "2"
    },
    {
      id: "5",
      content: "Server deployment issue - need DevOps support",
      section: "blocked",
      order: 0,
      userId: "john",
      date: new Date().toISOString().split('T')[0],
      projectId: "1"
    },
    {
      id: "6",
      content: "Meeting notes: Discussed new feature requirements",
      section: "notes",
      order: 0,
      userId: "jane",
      date: new Date().toISOString().split('T')[0],
      projectId: "1"
    }
  ]);

  // Projects state with expanded dummy data
  const [projects] = useState<Project[]>([
    {
      id: "1",
      name: "TasksMate",
      description: "Main task management platform",
      teamLead: "John Doe",
      members: [
        { id: "john", name: "John Doe", role: "Team Lead" },
        { id: "jane", name: "Jane Smith", role: "Developer" },
        { id: "alex", name: "Alex Johnson", role: "Designer" }
      ]
    },
    {
      id: "2",
      name: "Mobile App",
      description: "Cross-platform mobile application",
      teamLead: "Mike Wilson",
      members: [
        { id: "mike", name: "Mike Wilson", role: "Team Lead" },
        { id: "sarah", name: "Sarah Davis", role: "Developer" },
        { id: "tom", name: "Tom Brown", role: "QA Engineer" }
      ]
    },
    {
      id: "3",
      name: "Analytics Dashboard",
      description: "Real-time analytics and reporting dashboard",
      teamLead: "Emily Chen",
      members: [
        { id: "emily", name: "Emily Chen", role: "Team Lead" },
        { id: "david", name: "David Lee", role: "Data Scientist" },
        { id: "lisa", name: "Lisa Wang", role: "Frontend Developer" }
      ]
    }
  ]);

  const [newItemInputs, setNewItemInputs] = useState({
    completed: '',
    'in-progress': '',
    blocked: '',
    notes: ''
  });

  // Get users based on selected project
  const getProjectUsers = () => {
    const baseUsers = [{ id: 'all', name: 'All Users' }];
    
    if (selectedProject === 'all') {
      // Return all unique users from all projects
      const allUsers = projects.flatMap(project => {
        const teamLeadUser = { id: project.teamLead.toLowerCase().replace(' ', ''), name: project.teamLead };
        return [teamLeadUser, ...project.members];
      });
      const uniqueUsers = allUsers.filter((user, index, self) => 
        index === self.findIndex(u => u.id === user.id)
      );
      return [...baseUsers, ...uniqueUsers];
    } else {
      const project = projects.find(p => p.id === selectedProject);
      if (project) {
        const teamLeadUser = { id: project.teamLead.toLowerCase().replace(' ', ''), name: project.teamLead };
        return [
          ...baseUsers,
          teamLeadUser,
          ...project.members
        ];
      }
    }
    
    return baseUsers;
  };

  const [statusView, setStatusView] = useState<'grid' | 'list'>('grid');

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

  const handleAddItem = (section: MeetingItem['section'], projectId?: string, userId?: string) => {
    const content = newItemInputs[section].trim();
    if (!content) return;

    const newItem: MeetingItem = {
      id: Date.now().toString(),
      content,
      section,
      order: meetingItems.filter(item => item.section === section).length,
      isTask: content.startsWith('[ ]'),
      userId: userId || (selectedUser === 'all' ? 'john' : selectedUser),
      date: selectedDate,
      projectId: projectId || (selectedProject === 'all' ? undefined : selectedProject)
    };

    setMeetingItems(prev => [...prev, newItem]);
    setNewItemInputs(prev => ({ ...prev, [section]: '' }));
  };

  const getFilteredItems = (section: MeetingItem['section'], projectId?: string, userId?: string) => {
    return meetingItems.filter(item => {
      const userMatch = userId ? item.userId === userId : (selectedUser === 'all' || item.userId === selectedUser);
      const dateMatch = item.date === selectedDate;
      const sectionMatch = item.section === section;
      const projectMatch = projectId ? item.projectId === projectId : (selectedProject === 'all' || item.projectId === selectedProject);
      return userMatch && dateMatch && sectionMatch && projectMatch;
    });
  };

  const renderStatusCards = (projectId?: string, userId?: string, showAddItems = true) => {
    return statusView === 'grid' ? (
      <div className="grid grid-cols-2 gap-4 h-[calc(100vh-400px)]">
        {sections.map((section) => {
          const items = getFilteredItems(section.key, projectId, userId);
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
                            <span>{projects.find(p => p.id === item.projectId)?.name || 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add New Item */}
                {showAddItems && (
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
                          handleAddItem(section.key, projectId, userId);
                        }
                      }}
                      className="border-none p-0 bg-transparent focus-visible:ring-0"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    ) : (
      <div className="space-y-4">
        {sections.map((section) => {
          const items = getFilteredItems(section.key, projectId, userId);
          const SectionIcon = section.icon;
          
          return (
            <Card key={section.key} className="border border-gray-200">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <SectionIcon className="w-4 h-4" />
                  {section.title}
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {items.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded border hover:bg-gray-100 transition-colors">
                      <p className="text-sm text-gray-900">{item.content}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                        <span>{getProjectUsers().find(u => u.id === item.userId)?.name}</span>
                        <span>•</span>
                        <span>{projects.find(p => p.id === item.projectId)?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  ))}
                  {showAddItems && (
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
                            handleAddItem(section.key, projectId, userId);
                          }
                        }}
                        className="border-none p-0 bg-transparent focus-visible:ring-0"
                      />
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const renderConsolidatedView = () => {
    if (selectedProject === 'all' && selectedUser !== 'all') {
      // All Projects + Specific User: Group by project
      const projectsWithItems = projects.filter(project => {
        const hasItems = meetingItems.some(item => 
          item.projectId === project.id && 
          item.userId === selectedUser && 
          item.date === selectedDate
        );
        return hasItems;
      });

      return (
        <div className="space-y-8">
          {projectsWithItems.map((project) => (
            <div key={project.id} className="space-y-4">
              <div className="flex items-center gap-3 border-b border-gray-200 pb-3">
                <h3 className="text-xl font-semibold text-gray-900">{project.name}</h3>
                <Badge variant="outline" className="text-sm">
                  {getProjectUsers().find(u => u.id === selectedUser)?.name}
                </Badge>
              </div>
              {renderStatusCards(project.id, selectedUser, true)}
            </div>
          ))}
        </div>
      );
    } else if (selectedProject === 'all' && selectedUser === 'all') {
      // All Projects + All Users: Group by project, then by user
      const projectsWithItems = projects.filter(project => {
        const hasItems = meetingItems.some(item => 
          item.projectId === project.id && 
          item.date === selectedDate
        );
        return hasItems;
      });

      return (
        <div className="space-y-8">
          {projectsWithItems.map((project) => {
            const teamLeadUser = { id: project.teamLead.toLowerCase().replace(' ', ''), name: project.teamLead, role: 'Team Lead' };
            const usersWithItems = [
              teamLeadUser,
              ...project.members
            ].filter(user => {
              const hasItems = meetingItems.some(item => 
                item.projectId === project.id && 
                item.userId === user.id && 
                item.date === selectedDate
              );
              return hasItems;
            });

            return (
              <div key={project.id} className="space-y-6">
                <h3 className="text-xl font-semibold text-gray-900 border-b border-gray-200 pb-3">
                  {project.name}
                </h3>
                <div className="space-y-6">
                  {usersWithItems.map((user) => (
                    <div key={user.id} className="space-y-4">
                      <div className="flex items-center gap-3">
                        <h4 className="text-lg font-medium text-gray-800">{user.name}</h4>
                        <Badge variant="outline" className="text-sm">{user.role}</Badge>
                      </div>
                      {renderStatusCards(project.id, user.id, true)}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // Specific project + specific user: Regular view
    return renderStatusCards();
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
                Meet books
              </Button>
              <span className="text-gray-400">/</span>
              <h1 className="font-semibold text-gray-900">Product Strategy Review</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Status Controls */}
          <div className="flex gap-4 items-center bg-white p-4 rounded-lg border border-gray-200 flex-wrap">
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

            <div className="flex items-center gap-2 ml-auto">
              <label className="text-sm font-medium">View:</label>
              <StatusViewToggle view={statusView} onViewChange={setStatusView} />
            </div>
          </div>

          {/* Status Content */}
          {renderConsolidatedView()}
        </div>
      </div>
    </div>
  );
};

export default MeetingNotebook;
