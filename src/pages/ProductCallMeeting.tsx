
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Clock, Users } from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ProductCallMeeting = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const meeting = {
    title: "Product Call Meeting",
    date: "2024-06-25",
    time: "10:00",
    description: "Product strategy discussion and roadmap review",
    attendees: ["john@company.com", "sarah@company.com", "mike@company.com"],
    meetingType: "Product Call"
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
        <div className="container mx-auto px-6 py-4">
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

      <div className="container mx-auto px-6 py-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{meeting.title}</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {formatDate(meeting.date)} {meeting.time && `at ${meeting.time}`}
            </div>
          </div>
          <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100 mb-4">
            {meeting.meetingType}
          </Badge>
          {meeting.description && (
            <p className="text-gray-700 mb-4">{meeting.description}</p>
          )}
          
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

          <div className="mt-8 text-center text-gray-500">
            <p>Product call meeting interface coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCallMeeting;
