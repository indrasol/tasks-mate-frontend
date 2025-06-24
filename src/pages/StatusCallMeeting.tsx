
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
  Briefcase
} from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

const StatusCallMeeting = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
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
    { id: "3", text: "User authentication flow redesigned and tested", status: "completed", project: "Frontend", assignedTo: "Mike" }
  ]);

  const [inProgressItems, setInProgressItems] = useState<StatusItem[]>([
    { id: "4", text: "Frontend dashboard redesign with new components", status: "in-progress", project: "Frontend", assignedTo: "Alex" },
    { id: "5", text: "Performance optimization for database queries", status: "in-progress", project: "Backend", assignedTo: "Sarah" },
    { id: "6", text: "Mobile responsive design implementation", status: "in-progress", project: "Mobile", assignedTo: "John" }
  ]);

  const [blockedItems, setBlockedItems] = useState<StatusItem[]>([
    { id: "7", text: "Third-party API integration pending security approval", status: "blocked", project: "Integration", assignedTo: "Mike" },
    { id: "8", text: "Server deployment blocked by infrastructure team review", status: "blocked", project: "DevOps", assignedTo: "Alex" }
  ]);

  const [notes, setNotes] = useState<string>(
    "Team discussed the upcoming sprint goals and identified key blockers that need immediate attention. Follow-up meetings scheduled with stakeholders for API approvals."
  );

  // Filter states
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [newItemText, setNewItemText] = useState<string>("");
  const [addingToSection, setAddingToSection] = useState<'completed' | 'in-progress' | 'blocked' | null>(null);

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
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'in-progress':
        return <Loader className="w-5 h-5 text-blue-500" />;
      case 'blocked':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusGradient = (status: string) => {
    switch (status) {
      case 'completed':
        return 'from-emerald-50 to-green-100 border-emerald-200 hover:from-emerald-100 hover:to-green-200';
      case 'in-progress':
        return 'from-blue-50 to-indigo-100 border-blue-200 hover:from-blue-100 hover:to-indigo-200';
      case 'blocked':
        return 'from-red-50 to-rose-100 border-red-200 hover:from-red-100 hover:to-rose-200';
      default:
        return 'from-gray-50 to-slate-100 border-gray-200';
    }
  };

  const filterItems = (items: StatusItem[]) => {
    return items.filter(item => {
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(item.status);
      const projectMatch = selectedProjects.length === 0 || selectedProjects.includes(item.project || '');
      const userMatch = selectedUsers.length === 0 || selectedUsers.includes(item.assignedTo || '');
      return statusMatch && projectMatch && userMatch;
    });
  };

  const toggleFilter = (value: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => 
      prev.includes(value) 
        ? prev.filter(item => item !== value)
        : [...prev, value]
    );
  };

  const clearAllFilters = () => {
    setSelectedStatuses([]);
    setSelectedProjects([]);
    setSelectedUsers([]);
  };

  const hasActiveFilters = selectedStatuses.length > 0 || selectedProjects.length > 0 || selectedUsers.length > 0;

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

  const handleAddItem = (status: 'completed' | 'in-progress' | 'blocked') => {
    if (!newItemText.trim()) return;

    const newItem: StatusItem = {
      id: Date.now().toString(),
      text: newItemText,
      status,
      project: "General",
      assignedTo: "Unassigned"
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

  const renderStatusSection = (
    title: string,
    items: StatusItem[],
    status: 'completed' | 'in-progress' | 'blocked',
    icon: React.ReactNode
  ) => {
    const filteredItems = filterItems(items);
    
    return (
      <Card className={`relative overflow-hidden bg-gradient-to-br ${getStatusGradient(status)} hover:shadow-xl transition-all duration-300 animate-fade-in border-2`}>
        <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
        <CardHeader className="pb-3 relative">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/50 backdrop-blur-sm">
                {icon}
              </div>
              <div>
                <span className="text-lg font-semibold">{title}</span>
                <Badge variant="outline" className="ml-3 bg-white/60 backdrop-blur-sm border-white/40">
                  {filteredItems.length}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAddingToSection(status)}
              className="hover:bg-white/40 backdrop-blur-sm rounded-full transition-all duration-200 hover:scale-105"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 relative">
          {filteredItems.map((item, index) => (
            <div
              key={item.id}
              className={`p-4 rounded-xl border-2 bg-white/60 backdrop-blur-sm transition-all duration-300 hover:bg-white/80 hover:scale-[1.02] hover:shadow-lg animate-fade-in`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {editingItem === item.id ? (
                <div className="space-y-3">
                  <Input
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    className="text-sm bg-white/80 backdrop-blur-sm border-white/40"
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
                  <div className="flex items-start justify-between">
                    <span className="text-sm flex-1 font-medium text-gray-800">{item.text}</span>
                    <div className="flex gap-1">
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
                  <div className="flex gap-2">
                    <Badge variant="outline" className="text-xs bg-white/60 backdrop-blur-sm border-white/40">
                      📁 {item.project}
                    </Badge>
                    <Badge variant="outline" className="text-xs bg-white/60 backdrop-blur-sm border-white/40">
                      👤 {item.assignedTo}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {addingToSection === status && (
            <div className="space-y-3 p-4 border-2 border-dashed border-white/60 rounded-xl bg-white/40 backdrop-blur-sm animate-fade-in">
              <Input
                placeholder="Enter new item..."
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                className="text-sm bg-white/80 backdrop-blur-sm border-white/40"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handleAddItem(status)}
                  className="h-8 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white border-0"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Add
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setAddingToSection(null);
                    setNewItemText("");
                  }}
                  className="h-8 bg-white/80 backdrop-blur-sm border-white/40"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
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
              
              {/* Attendees Section - Moved to Right */}
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

          {/* Filters */}
          <div className="bg-white/80 backdrop-blur-md rounded-xl border border-white/20 p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {/* Status Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 transition-all duration-200">
                      <Filter className="h-4 w-4 mr-2" />
                      Status
                      {selectedStatuses.length > 0 && (
                        <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-0">
                          {selectedStatuses.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-white/90 backdrop-blur-md border border-white/40 shadow-xl">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Filter by Status</h4>
                      <div className="space-y-2">
                        {[
                          { value: "completed", label: "Completed", color: "text-emerald-600" },
                          { value: "in-progress", label: "In Progress", color: "text-blue-600" },
                          { value: "blocked", label: "Blocked", color: "text-red-600" },
                        ].map((status) => (
                          <label key={status.value} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes(status.value)}
                              onChange={() => toggleFilter(status.value, setSelectedStatuses)}
                              className="rounded border-gray-300"
                            />
                            <span className={`text-sm font-medium ${status.color}`}>{status.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Project Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 transition-all duration-200">
                      <Briefcase className="h-4 w-4 mr-2" />
                      Projects
                      {selectedProjects.length > 0 && (
                        <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                          {selectedProjects.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-white/90 backdrop-blur-md border border-white/40 shadow-xl">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Filter by Project</h4>
                      <div className="space-y-2">
                        {allProjects.map((project) => (
                          <label key={project} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedProjects.includes(project)}
                              onChange={() => toggleFilter(project, setSelectedProjects)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{project}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>

                {/* User Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="bg-white/60 backdrop-blur-sm border-white/40 hover:bg-white/80 transition-all duration-200">
                      <User className="h-4 w-4 mr-2" />
                      Users
                      {selectedUsers.length > 0 && (
                        <Badge className="ml-2 h-5 w-5 p-0 text-xs bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
                          {selectedUsers.length}
                        </Badge>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3 bg-white/90 backdrop-blur-md border border-white/40 shadow-xl">
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Filter by User</h4>
                      <div className="space-y-2">
                        {allUsers.map((user) => (
                          <label key={user} className="flex items-center space-x-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(user)}
                              onChange={() => toggleFilter(user, setSelectedUsers)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-sm">{user}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

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

          {/* Status Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
            {renderStatusSection(
              "Completed",
              completedItems,
              "completed",
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
            
            {renderStatusSection(
              "In Progress",
              inProgressItems,
              "in-progress",
              <Loader className="w-5 h-5 text-blue-600" />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {renderStatusSection(
              "Blocked",
              blockedItems,
              "blocked",
              <XCircle className="w-5 h-5 text-red-600" />
            )}

            {/* Notes Section */}
            <Card className="relative overflow-hidden bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200 hover:shadow-xl transition-all duration-300 animate-fade-in border-2">
              <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
              <CardHeader className="relative">
                <CardTitle className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-white/50 backdrop-blur-sm">
                    <FileText className="w-5 h-5 text-purple-600" />
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
    </div>
  );
};

export default StatusCallMeeting;
