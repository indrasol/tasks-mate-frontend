
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Calendar, MoreVertical, Edit, Eye, Trash2 } from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Meeting {
  id: string;
  title: string;
  date: string;
  product: string;
  status: 'draft' | 'published';
  lastUpdated: string;
}

// Mock data - in real app this would come from an API
const mockMeetings: Meeting[] = [
  {
    id: "1",
    title: "Product Strategy Review",
    date: "2024-06-25",
    product: "TasksMate",
    status: "published",
    lastUpdated: "2 hours ago"
  },
  {
    id: "2", 
    title: "Sprint Planning Session",
    date: "2024-06-24",
    product: "Core Platform",
    status: "draft",
    lastUpdated: "1 day ago"
  },
  {
    id: "3",
    title: "Client Feedback Meeting",
    date: "2024-06-23",
    product: "TasksMate",
    status: "published",
    lastUpdated: "2 days ago"
  }
];

const Meetings = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [meetings] = useState<Meeting[]>(mockMeetings);

  const filteredMeetings = meetings.filter(meeting =>
    meeting.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    meeting.product.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewMeeting = () => {
    // TODO: Open Meeting Wizard modal
    console.log("Opening Meeting Wizard...");
  };

  const handleMeetingClick = (meetingId: string) => {
    navigate(`/meetings/${meetingId}`);
  };

  const handleEdit = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Edit meeting:", meetingId);
  };

  const handlePublish = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Publish meeting:", meetingId);
  };

  const handleDelete = (meetingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Delete meeting:", meetingId);
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

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-32 h-32 mb-6 bg-tasksmate-gradient-soft rounded-full flex items-center justify-center">
        <Calendar className="w-16 h-16 text-tasksmate-green-end" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">No meetings yet</h3>
      <p className="text-gray-600 text-center mb-6 max-w-md">
        Create your first meeting to start organizing your team discussions and track action items.
      </p>
      <Button onClick={handleNewMeeting} className="bg-tasksmate-gradient hover:scale-105 transition-all duration-200">
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Meeting
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation onNewMeeting={handleNewMeeting} />
      
      <main className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-sora text-gray-900">Meetings</h1>
            <p className="text-gray-600 mt-1">Organize and track your team meetings</p>
          </div>
          
          <Button 
            onClick={handleNewMeeting}
            className="bg-tasksmate-gradient hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Meeting
          </Button>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search meetings by title or product..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-white border-gray-200 focus:border-tasksmate-green-end focus:ring-tasksmate-green-end/20"
          />
        </div>

        {/* Meetings Grid */}
        {filteredMeetings.length === 0 ? (
          searchQuery ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No meetings found</h3>
              <p className="text-gray-600">Try adjusting your search terms</p>
            </div>
          ) : (
            <EmptyState />
          )
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredMeetings.map((meeting) => (
              <Card 
                key={meeting.id} 
                className="hover:shadow-tasksmate-hover transition-all duration-200 cursor-pointer border-gray-200 hover:border-tasksmate-green-end/30 group"
                onClick={() => handleMeetingClick(meeting.id)}
              >
                <CardContent className="p-6">
                  {/* Date Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 font-mono text-xs">
                      {new Date(meeting.date).toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </Badge>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={(e) => handleEdit(meeting.id, e)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => handlePublish(meeting.id, e)}>
                          <Eye className="w-4 h-4 mr-2" />
                          {meeting.status === 'published' ? 'View Published' : 'Publish'}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => handleDelete(meeting.id, e)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-3 line-clamp-2 group-hover:text-tasksmate-green-end transition-colors">
                    {meeting.title}
                  </h3>

                  {/* Product and Status */}
                  <div className="flex items-center gap-2 mb-4">
                    {getProductPill(meeting.product)}
                    {getStatusBadge(meeting.status)}
                  </div>

                  {/* Last Updated */}
                  <p className="text-sm text-gray-500">
                    Updated {meeting.lastUpdated}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Meetings;
