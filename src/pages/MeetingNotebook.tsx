
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Plus,
  Users,
  Clock,
  CheckCircle,
  FileText,
  AlertCircle
} from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time?: string;
  product: string;
  description?: string;
  attendees?: string[];
  status: 'draft' | 'published';
}

const MeetingNotebook = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Sample meeting data - in real app this would be fetched based on ID
  const [meeting, setMeeting] = useState<Meeting>({
    id: "1",
    title: "Product Strategy Review",
    date: "2024-06-25",
    time: "10:00",
    product: "TasksMate",
    description: "Quarterly review meeting to discuss product strategy and roadmap",
    attendees: ["john@company.com", "sarah@company.com", "mike@company.com"],
    status: "published"
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getStatusBadge = (status: Meeting['status']) => {
    return status === 'published' ? (
      <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
        Published
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-gray-100 text-gray-600">
        Draft
      </Badge>
    );
  };

  const getProductPill = (product: string) => {
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        {product}
      </Badge>
    );
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
                  {getProductPill(meeting.product)}
                  {getStatusBadge(meeting.status)}
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

          {/* Status Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Agenda Items
                </CardTitle>
                <FileText className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">8</div>
                <p className="text-xs text-muted-foreground">
                  3 completed, 5 pending
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Action Items
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  4 completed, 8 in progress
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Decisions Made
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">6</div>
                <p className="text-xs text-muted-foreground">
                  All documented
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Follow-ups
                </CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4</div>
                <p className="text-xs text-muted-foreground">
                  2 due this week
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Meeting Content Sections */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Agenda */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  Meeting Agenda
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm">Welcome & Introductions</span>
                  <Badge className="bg-green-100 text-green-700">Completed</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm">Q3 Performance Review</span>
                  <Badge className="bg-green-100 text-green-700">Completed</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Q4 Strategy Planning</span>
                  <Badge variant="secondary">Pending</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm">Resource Allocation</span>
                  <Badge variant="secondary">Pending</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Action Items */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Action Items
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Update product roadmap</span>
                    <Badge className="bg-green-100 text-green-700">Completed</Badge>
                  </div>
                  <p className="text-xs text-gray-600">Assigned to: Sarah Johnson</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Prepare budget proposal</span>
                    <Badge className="bg-orange-100 text-orange-700">In Progress</Badge>
                  </div>
                  <p className="text-xs text-gray-600">Assigned to: Mike Chen</p>
                </div>
                <div className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Schedule client interviews</span>
                    <Badge variant="secondary">Todo</Badge>
                  </div>
                  <p className="text-xs text-gray-600">Assigned to: John Smith</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingNotebook;
