import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus,
  Users,
  Clock,
  CheckCircle,
  Loader,
  XCircle,
  FileText,
  Edit2,
  Save,
  X,
  Filter,
  User,
  Briefcase,
  ChevronDown
} from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StatusViewToggle from "@/components/meetings/StatusViewToggle";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time?: string;
  description?: string;
  attendees?: string[];
  status: 'draft' | 'published';
  meetingType: string;
}

interface StatusItem {
  id: string;
  text: string;
  status: 'completed' | 'in-progress' | 'blocked';
  project?: string;
  assignedTo?: string;
}

interface ProjectGroup {
  project: string;
  users: {
    user: string;
    items: {
      completed: StatusItem[];
      inProgress: StatusItem[];
      blocked: StatusItem[];
    };
  }[];
}

interface UserNotes {
  [key: string]: string; // key format: "project-user"
}

const StatusCallMeeting = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [view, setView] = useState<"grid" | "list">("grid");
  
  const [meeting, setMeeting] = useState<Meeting>({
    id: "1",
    title: "Weekly Sprint Status Review",
    date: "2024-06-25",
    time: "10:00",
    description: "Weekly team status call to discuss progress and blockers",
    attendees: ["john@company.com", "sarah@company.com", "mike@company.com", "alex@company.com"],
    status: "published",
    meetingType: "Status Call"
  });

  const [completedItems, setCompletedItems] = useState<StatusItem[]>([
    { id: "1", text: "Database migration completed successfully", status: "completed", project: "Backend", assignedTo: "John" },
    { id: "2", text: "API endpoints updated with new authentication", status: "completed", project: "Backend", assignedTo: "Sarah" },
    { id: "3", text: "User authentication flow redesigned and tested", status: "completed", project: "Frontend", assignedTo: "Mike" },
    { id: "9", text: "Mobile app login screen completed", status: "completed", project: "Mobile", assignedTo: "Alex" },
    { id: "10", text: "Integration testing completed", status: "completed", project: "Integration", assignedTo: "John" }
  ]);

  const [inProgressItems, setInProgressItems] = useState<StatusItem[]>([
    { id: "4", text: "Frontend dashboard redesign with new components", status: "in-progress", project: "Frontend", assignedTo: "Alex" },
    { id: "5", text: "Performance optimization for database queries", status: "in-progress", project: "Backend", assignedTo: "Sarah" },
    { id: "6", text: "Mobile responsive design implementation", status: "in-progress", project: "Mobile", assignedTo: "John" },
    { id: "11", text: "DevOps pipeline optimization", status: "in-progress", project: "DevOps", assignedTo: "Mike" }
  ]);

  const [blockedItems, setBlockedItems] = useState<StatusItem[]>([
    { id: "7", text: "Third-party API integration pending security approval", status: "blocked", project: "Integration", assignedTo: "Mike" },
    { id: "8", text: "Server deployment blocked by infrastructure team review", status: "blocked", project: "DevOps", assignedTo: "Alex" },
    { id: "12", text: "Frontend library update blocked by dependencies", status: "blocked", project: "Frontend", assignedTo: "Sarah" }
  ]);

  const [userNotes, setUserNotes] = useState<UserNotes>({
    "Backend-John": "Working on database optimization next sprint",
    "Frontend-Mike": "Need to coordinate with design team for new components",
    "DevOps-Alex": "Infrastructure review scheduled for next week"
  });

  const [notes, setNotes] = useState<string>(
    "Team discussed the upcoming sprint goals and identified key blockers that need immediate attention. Follow-up meetings scheduled with stakeholders for API approvals."
  );

  // Filter states
  const [selectedProject, setSelectedProject] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [newItemText, setNewItemText] = useState<string>("");
  const [addingToSection, setAddingToSection] = useState<{section: 'completed' | 'in-progress' | 'blocked', project: string, user: string} | null>(null);

  const allProjects = ["Frontend", "Backend", "Mobile", "Integration", "DevOps"];
  const allUsers = ["John", "Sarah", "Mike", "Alex"];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'in-progress':
        return <Loader className="w-5 h-5 text-blue-600" />;
      case 'blocked':
        return <XCircle className="w-5 h-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getConsolidatedData = (): ProjectGroup[] => {
    const allItems = [...completedItems, ...inProgressItems, ...blockedItems];
    
    if (selectedProject === "all" && selectedUser === "all") {
      // All Projects + All users - consolidated by Projects and users inside each project
      return allProjects.map(project => ({
        project,
        users: allUsers.map(user => ({
          user,
          items: {
            completed: completedItems.filter(item => item.project === project && item.assignedTo === user),
            inProgress: inProgressItems.filter(item => item.project === project && item.assignedTo === user),
            blocked: blockedItems.filter(item => item.project === project && item.assignedTo === user)
          }
        })).filter(userGroup => 
          userGroup.items.completed.length > 0 || 
          userGroup.items.inProgress.length > 0 || 
          userGroup.items.blocked.length > 0
        )
      })).filter(projectGroup => projectGroup.users.length > 0);
    }
    
    if (selectedProject === "all" && selectedUser !== "all") {
      // All Projects + Specific user - consolidated by Projects and specific user inside each project
      return allProjects.map(project => ({
        project,
        users: [{
          user: selectedUser,
          items: {
            completed: completedItems.filter(item => item.project === project && item.assignedTo === selectedUser),
            inProgress: inProgressItems.filter(item => item.project === project && item.assignedTo === selectedUser),
            blocked: blockedItems.filter(item => item.project === project && item.assignedTo === selectedUser)
          }
        }]
      })).filter(projectGroup => 
        projectGroup.users[0].items.completed.length > 0 || 
        projectGroup.users[0].items.inProgress.length > 0 || 
        projectGroup.users[0].items.blocked.length > 0
      );
    }
    
    if (selectedProject !== "all" && selectedUser === "all") {
      // Specific Project + All users - consolidated by users in project
      return [{
        project: selectedProject,
        users: allUsers.map(user => ({
          user,
          items: {
            completed: completedItems.filter(item => item.project === selectedProject && item.assignedTo === user),
            inProgress: inProgressItems.filter(item => item.project === selectedProject && item.assignedTo === user),
            blocked: blockedItems.filter(item => item.project === selectedProject && item.assignedTo === user)
          }
        })).filter(userGroup => 
          userGroup.items.completed.length > 0 || 
          userGroup.items.inProgress.length > 0 || 
          userGroup.items.blocked.length > 0
        )
      }].filter(projectGroup => projectGroup.users.length > 0);
    }
    
    // Specific Project + Specific user - show user with status cards
    return [{
      project: selectedProject,
      users: [{
        user: selectedUser,
        items: {
          completed: completedItems.filter(item => item.project === selectedProject && item.assignedTo === selectedUser),
          inProgress: inProgressItems.filter(item => item.project === selectedProject && item.assignedTo === selectedUser),
          blocked: blockedItems.filter(item => item.project === selectedProject && item.assignedTo === selectedUser)
        }
      }]
    }].filter(projectGroup => 
      projectGroup.users[0].items.completed.length > 0 || 
      projectGroup.users[0].items.inProgress.length > 0 || 
      projectGroup.users[0].items.blocked.length > 0
    );
  };

  const clearAllFilters = () => {
    setSelectedProject("all");
    setSelectedUser("all");
  };

  const hasActiveFilters = selectedProject !== "all" || selectedUser !== "all";

  const handleEditItem = (itemId: string, currentText: string) => {
    setEditingItem(itemId);
    setEditingText(currentText);
  };

  const handleSaveEdit = (itemId: string, status: 'completed' | 'in-progress' | 'blocked') => {
    const updateItems = (items: StatusItem[]) =>
      items.map(item => item.id === itemId ? { ...item, text: editingText } : item);

    if (status === 'completed') {
      setCompletedItems(updateItems);
    } else if (status === 'in-progress') {
      setInProgressItems(updateItems);
    } else {
      setBlockedItems(updateItems);
    }

    setEditingItem(null);
    setEditingText("");
  };

  const handleAddItem = (status: 'completed' | 'in-progress' | 'blocked', project: string, user: string) => {
    if (!newItemText.trim()) return;

    const newItem: StatusItem = {
      id: Date.now().toString(),
      text: newItemText,
      status,
      project: project,
      assignedTo: user
    };

    if (status === 'completed') {
      setCompletedItems(prev => [...prev, newItem]);
    } else if (status === 'in-progress') {
      setInProgressItems(prev => [...prev, newItem]);
    } else {
      setBlockedItems(prev => [...prev, newItem]);
    }

    setNewItemText("");
    setAddingToSection(null);
  };

  const handleDeleteItem = (itemId: string, status: 'completed' | 'in-progress' | 'blocked') => {
    const filterItems = (items: StatusItem[]) => items.filter(item => item.id !== itemId);

    if (status === 'completed') {
      setCompletedItems(filterItems);
    } else if (status === 'in-progress') {
      setInProgressItems(filterItems);
    } else {
      setBlockedItems(filterItems);
    }
  };

  const handleNotesChange = (project: string, user: string, value: string) => {
    const key = `${project}-${user}`;
    setUserNotes(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const renderStatusItems = (items: StatusItem[], status: 'completed' | 'in-progress' | 'blocked', project: string, user: string) => {
    return (
      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`p-4 rounded-xl border-2 bg-white/60 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:scale-[1.02] hover:shadow-lg animate-fade-in`}
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {editingItem === item.id ? (
              <div className="space-y-3">
                <Textarea
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="text-sm bg-white/80 backdrop-blur-sm border-white/40 min-h-[60px] resize-none"
                  placeholder="Edit item..."
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(item.id, status)}
                    className="h-8 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingItem(null)}
                    className="h-8 bg-white/80 backdrop-blur-sm border-white/40"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-start gap-3">
                  <span className="text-sm flex-1 font-medium text-gray-800 leading-relaxed break-words whitespace-pre-wrap overflow-wrap-anywhere min-w-0">{item.text}</span>
                  <div className="flex flex-col gap-1 flex-shrink-0 self-start">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditItem(item.id, item.text)}
                      className="h-8 w-8 p-0 hover:bg-white/60 rounded-full transition-all duration-200 hover:scale-110"
                    >
                      <Edit2 className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteItem(item.id, status)}
                      className="h-8 w-8 p-0 hover:bg-red-100 text-red-500 hover:text-red-700 rounded-full transition-all duration-200 hover:scale-110"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Add new item section */}
        {addingToSection?.section === status && addingToSection?.project === project && addingToSection?.user === user ? (
          <div className="p-4 rounded-xl border-2 border-dashed border-gray-300 bg-white/40 backdrop-blur-sm">
            <div className="space-y-3">
              <Textarea
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder="Enter new item..."
                className="text-sm bg-white/80 backdrop-blur-sm border-white/40 min-h-[60px] resize-none"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddItem(status, project, user)}
                  className="h-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAddingToSection(null)}
                  className="h-8 bg-white/80 backdrop-blur-sm border-white/40"
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddingToSection({section: status, project, user})}
            className="w-full h-10 border-2 border-dashed border-gray-300 bg-white/20 hover:bg-white/40 text-gray-600 hover:text-gray-800 rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        )}
      </div>
    );
  };

  const renderStatusCard = (
    title: string, 
    icon: React.ReactNode, 
    items: StatusItem[], 
    status: 'completed' | 'in-progress' | 'blocked',
    project: string,
    user: string,
    gradientClasses: string
  ) => (
    <Card className={`relative overflow-hidden ${gradientClasses} hover:shadow-xl transition-all duration-300 animate-fade-in border-2`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
      <CardHeader className="pb-3 relative">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-gradient-to-r from-white/50 backdrop-blur-sm">
            {icon}
          </div>
          <div>
            <span className="text-lg font-semibold">{title}</span>
            <Badge variant="outline" className="ml-3 bg-white/60 backdrop-blur-sm border-white/40">
              {items.length}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 relative">
        {renderStatusItems(items, status, project, user)}
      </CardContent>
    </Card>
  );

  const renderUserCards = (userGroup: any, project: string) => {
    const notesKey = `${project}-${userGroup.user}`;
    const userNoteValue = userNotes[notesKey] || "";

    if (view === "list") {
      return (
        <div className="space-y-4 ml-12">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
              <User className="w-4 h-4 text-white" />
            </div>
            <h4 className="text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
              {userGroup.user}
            </h4>
          </div>
          
          <div className="space-y-4 ml-8">
            {/* Completed Items */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-50/80 to-emerald-100/80 border border-green-200/60">
              <h5 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Completed ({userGroup.items.completed.length})
              </h5>
              {renderStatusItems(userGroup.items.completed, 'completed', project, userGroup.user)}
            </div>

            {/* In Progress Items */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/80 to-blue-100/80 border border-blue-200/60">
              <h5 className="font-semibold text-blue-700 mb-3 flex items-center gap-2">
                <Loader className="w-4 h-4" />
                In Progress ({userGroup.items.inProgress.length})
              </h5>
              {renderStatusItems(userGroup.items.inProgress, 'in-progress', project, userGroup.user)}
            </div>

            {/* Blocked Items */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50/80 to-yellow-100/80 border border-orange-200/60">
              <h5 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Blocked ({userGroup.items.blocked.length})
              </h5>
              {renderStatusItems(userGroup.items.blocked, 'blocked', project, userGroup.user)}
            </div>

            {/* Notes Section */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-gray-50/80 to-slate-100/80 border border-gray-200/60">
              <h5 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Notes
              </h5>
              <Textarea
                value={userNoteValue}
                onChange={(e) => handleNotesChange(project, userGroup.user, e.target.value)}
                placeholder="Add notes for this user..."
                className="min-h-[80px] resize-none bg-white/60 backdrop-blur-sm border-white/40 transition-all duration-200 focus:bg-white/80"
              />
            </div>
          </div>
        </div>
      );
    }

    // Grid view - changed from 4 columns to 2 columns
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 ml-8">
          <div className="p-1 rounded-lg bg-gradient-to-r from-green-500 to-emerald-500">
            <User className="w-4 h-4 text-white" />
          </div>
          <h4 className="text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent">
            {userGroup.user}
          </h4>
        </div>
        
        <div className="grid gap-6 lg:grid-cols-2 ml-12">
          {renderStatusCard(
            "Completed",
            <CheckCircle className="w-5 h-5 text-green-600" />,
            userGroup.items.completed,
            'completed',
            project,
            userGroup.user,
            "bg-gradient-to-br from-green-50/80 to-emerald-100/80 border-green-200/60"
          )}
          
          {renderStatusCard(
            "In Progress",
            <Loader className="w-5 h-5 text-blue-600" />,
            userGroup.items.inProgress,
            'in-progress',
            project,
            userGroup.user,
            "bg-gradient-to-br from-blue-50/80 to-blue-100/80 border-blue-200/60"
          )}
          
          {renderStatusCard(
            "Blocked",
            <XCircle className="w-5 h-5 text-orange-600" />,
            userGroup.items.blocked,
            'blocked',
            project,
            userGroup.user,
            "bg-gradient-to-br from-orange-50/80 to-yellow-100/80 border-orange-200/60"
          )}

          {/* Notes Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-gray-50/80 to-slate-100/80 border-gray-200/60 hover:shadow-xl transition-all duration-300 animate-fade-in border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/50 backdrop-blur-sm">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-lg font-semibold">Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <Textarea
                value={userNoteValue}
                onChange={(e) => handleNotesChange(project, userGroup.user, e.target.value)}
                placeholder="Add notes for this user..."
                className="min-h-[120px] resize-none bg-white/60 backdrop-blur-sm border-white/40 transition-all duration-200 focus:bg-white/80"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderConsolidatedView = () => {
    const consolidatedData = getConsolidatedData();

    return (
      <div className="space-y-8">
        {consolidatedData.map((projectGroup, projectIndex) => (
          <div key={projectGroup.project} className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500">
                <Briefcase className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
                {projectGroup.project}
              </h3>
            </div>
            
            {projectGroup.users.map((userGroup, userIndex) => (
              <div key={userGroup.user}>
                {renderUserCards(userGroup, projectGroup.project)}
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <MainNavigation />
      
      {/* Top Bar */}
      <div className="bg-white/80 backdrop-blur-md border-b border-white/20 sticky top-16 z-40 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/meetings')}
                className="text-gray-600 hover:text-gray-900 hover:bg-white/60 rounded-full transition-all duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Meetings
              </Button>
              <span className="text-gray-400">/</span>
              <h1 className="font-semibold text-gray-900">{meeting.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Meeting Header */}
          <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 p-6 shadow-lg hover:shadow-xl transition-all duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-3">
                  {meeting.title}
                </h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-3 py-1 rounded-full">
                    <Clock className="w-4 h-4" />
                    {formatDate(meeting.date)} {meeting.time && `at ${meeting.time}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 border-0">
                    Status Call
                  </Badge>
                  <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 border-0">
                    Published
                  </Badge>
                </div>
                {meeting.description && (
                  <p className="text-gray-700 leading-relaxed">{meeting.description}</p>
                )}
              </div>
              
              {/* Attendees Section - Right Side */}
              {meeting.attendees && meeting.attendees.length > 0 && (
                <div className="ml-8 bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-white/40">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Attendees ({meeting.attendees.length})
                  </h3>
                  <div className="space-y-2">
                    {meeting.attendees.map((attendee, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {attendee.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs text-gray-700">{attendee}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Enhanced Filters and View Toggle */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                {/* Project Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Projects:</span>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger className="w-48 bg-gradient-to-r from-blue-50/80 to-indigo-100/80 border-blue-200/60 hover:from-blue-100/80 hover:to-indigo-200/80 transition-all duration-200 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-blue-600" />
                        <SelectValue placeholder="Select Project" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-md border border-blue-200 shadow-xl">
                      <SelectItem value="all" className="hover:bg-blue-50">All Projects</SelectItem>
                      {allProjects.map((project) => (
                        <SelectItem key={project} value={project} className="hover:bg-blue-50">
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* User Filter */}
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-700">Users:</span>
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="w-48 bg-gradient-to-r from-green-50/80 to-emerald-100/80 border-green-200/60 hover:from-green-100/80 hover:to-emerald-200/80 transition-all duration-200 backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-green-600" />
                        <SelectValue placeholder="Select User" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-white/95 backdrop-blur-md border border-green-200 shadow-xl">
                      <SelectItem value="all" className="hover:bg-green-50">All Users</SelectItem>
                      {allUsers.map((user) => (
                        <SelectItem key={user} value={user} className="hover:bg-green-50">
                          {user}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* View Toggle */}
                <StatusViewToggle view={view} onViewChange={setView} />

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={clearAllFilters} 
                    className="text-gray-500 hover:text-gray-700 hover:bg-white/60 rounded-full transition-all duration-200"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Consolidated View */}
          {renderConsolidatedView()}

          {/* Global Notes Section */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-gray-50/80 to-slate-100/80 border-gray-200/60 hover:shadow-xl transition-all duration-300 animate-fade-in border-2">
            <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-white/50 backdrop-blur-sm">
                  <FileText className="w-5 h-5 text-gray-600" />
                </div>
                <span className="text-lg font-semibold">Meeting Notes</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add meeting notes..."
                className="min-h-[140px] resize-none bg-white/60 backdrop-blur-sm border-white/40 transition-all duration-200 focus:bg-white/80"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StatusCallMeeting;
