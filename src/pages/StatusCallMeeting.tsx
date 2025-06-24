
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
  X
} from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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
}

const StatusCallMeeting = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [meeting, setMeeting] = useState<Meeting>({
    id: "1",
    title: "Status Call Meeting",
    date: "2024-06-25",
    time: "10:00",
    description: "Weekly team status call to discuss progress and blockers",
    attendees: ["john@company.com", "sarah@company.com", "mike@company.com"],
    status: "published",
    meetingType: "Status Call"
  });

  const [completedItems, setCompletedItems] = useState<StatusItem[]>([
    { id: "1", text: "Database migration completed", status: "completed" },
    { id: "2", text: "API endpoints updated", status: "completed" },
    { id: "3", text: "User authentication flow fixed", status: "completed" }
  ]);

  const [inProgressItems, setInProgressItems] = useState<StatusItem[]>([
    { id: "4", text: "Frontend redesign for dashboard", status: "in-progress" },
    { id: "5", text: "Performance optimization for queries", status: "in-progress" },
    { id: "6", text: "Mobile responsive design implementation", status: "in-progress" }
  ]);

  const [blockedItems, setBlockedItems] = useState<StatusItem[]>([
    { id: "7", text: "Third-party API integration pending approval", status: "blocked" },
    { id: "8", text: "Server deployment blocked by security review", status: "blocked" }
  ]);

  const [notes, setNotes] = useState<string>(
    "Team discussed the upcoming sprint goals and identified key blockers that need immediate attention. Follow-up meetings scheduled with stakeholders."
  );

  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>("");
  const [newItemText, setNewItemText] = useState<string>("");
  const [addingToSection, setAddingToSection] = useState<'completed' | 'in-progress' | 'blocked' | null>(null);

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
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'in-progress':
        return <Loader className="w-5 h-5 text-blue-500" />;
      case 'blocked':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'border-green-200 bg-green-50 hover:bg-green-100';
      case 'in-progress':
        return 'border-blue-200 bg-blue-50 hover:bg-blue-100';
      case 'blocked':
        return 'border-red-200 bg-red-50 hover:bg-red-100';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

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
      status
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
  ) => (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <span className="text-lg">{title}</span>
            <Badge variant="outline" className="ml-2">
              {items.length}
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddingToSection(status)}
            className="hover:bg-gray-100"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-3 rounded-lg border transition-colors ${getStatusColor(status)}`}
          >
            {editingItem === item.id ? (
              <div className="space-y-2">
                <Input
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleSaveEdit(item.id, status)}
                    className="h-7"
                  >
                    <Save className="w-3 h-3 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditingItem(null)}
                    className="h-7"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-sm flex-1">{item.text}</span>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditItem(item.id, item.text)}
                    className="h-7 w-7 p-0 hover:bg-white/50"
                  >
                    <Edit2 className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id, status)}
                    className="h-7 w-7 p-0 hover:bg-white/50 text-red-500 hover:text-red-700"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        
        {addingToSection === status && (
          <div className="space-y-2 p-3 border-2 border-dashed border-gray-300 rounded-lg">
            <Input
              placeholder="Enter new item..."
              value={newItemText}
              onChange={(e) => setNewItemText(e.target.value)}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleAddItem(status)}
                className="h-7"
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
                className="h-7"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

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
              <h1 className="font-semibold text-gray-900">{meeting.title}</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="space-y-6">
          {/* Meeting Header */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">{meeting.title}</h2>
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(meeting.date)} {meeting.time && `at ${meeting.time}`}
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4">
                  <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                    Status Call
                  </Badge>
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                    Published
                  </Badge>
                </div>
                {meeting.description && (
                  <p className="text-gray-700">{meeting.description}</p>
                )}
              </div>
            </div>

            {meeting.attendees && meeting.attendees.length > 0 && (
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Attendees ({meeting.attendees.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {meeting.attendees.map((attendee, index) => (
                    <Badge key={index} variant="outline" className="bg-gray-50">
                      {attendee}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
            {renderStatusSection(
              "Completed",
              completedItems,
              "completed",
              <CheckCircle className="w-5 h-5 text-green-500" />
            )}
            
            {renderStatusSection(
              "In Progress",
              inProgressItems,
              "in-progress",
              <Loader className="w-5 h-5 text-blue-500" />
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {renderStatusSection(
              "Blocked",
              blockedItems,
              "blocked",
              <XCircle className="w-5 h-5 text-red-500" />
            )}

            {/* Notes Section */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Meeting Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add meeting notes..."
                  className="min-h-[120px] resize-none"
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
