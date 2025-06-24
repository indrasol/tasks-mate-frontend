
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, 
  Plus, 
  Calendar, 
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import NewMeetingModal from "@/components/meetings/NewMeetingModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Meeting {
  id: string;
  title: string;
  date: string;
  time?: string;
  product: string;
  status: 'draft' | 'published';
  lastUpdated: string;
  description?: string;
}

// Mock data - in real app this would come from an API
const initialMeetings: Meeting[] = [
  {
    id: "1",
    title: "Product Strategy Review",
    date: "2024-06-25",
    time: "10:00",
    product: "TasksMate",
    status: "published",
    lastUpdated: "2 hours ago"
  },
  {
    id: "2", 
    title: "Sprint Planning Session",
    date: "2024-06-24",
    time: "14:00",
    product: "Core Platform",
    status: "draft",
    lastUpdated: "1 day ago"
  },
  {
    id: "3",
    title: "Client Feedback Meeting",
    date: "2024-06-23",
    time: "09:00",
    product: "TasksMate",
    status: "published",
    lastUpdated: "2 days ago"
  }
];

const Meetings = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [isNewMeetingModalOpen, setIsNewMeetingModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [calendarView, setCalendarView] = useState<'month' | 'week' | 'day'>('month');
  const [newMeetingDate, setNewMeetingDate] = useState<string>('');

  const handleNewMeeting = () => {
    setIsNewMeetingModalOpen(true);
  };

  const handleCreateMeeting = (meetingData: any) => {
    const newMeeting: Meeting = {
      id: meetingData.id,
      title: meetingData.title,
      date: meetingData.date,
      time: meetingData.time,
      product: meetingData.product,
      status: 'draft',
      lastUpdated: 'just now',
      description: meetingData.description
    };
    
    setMeetings(prev => [newMeeting, ...prev]);
    console.log("Created new meeting:", newMeeting);
  };

  const handleDateClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    setNewMeetingDate(dateString);
    setIsNewMeetingModalOpen(true);
  };

  const handleMeetingClick = (meetingId: string) => {
    navigate(`/meetings/${meetingId}`);
  };

  const getMeetingsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return meetings.filter(meeting => meeting.date === dateString);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    
    if (calendarView === 'month') {
      newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (calendarView === 'week') {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
    } else {
      newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setSelectedDate(newDate);
  };

  const renderCalendarView = () => {
    if (calendarView === 'month') {
      const today = new Date();
      const currentMonth = selectedDate.getMonth();
      const currentYear = selectedDate.getFullYear();
      const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
      const startDate = new Date(firstDayOfMonth);
      startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());
      
      const days = [];
      const currentDate = new Date(startDate);
      
      for (let i = 0; i < 42; i++) {
        days.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 1);
      }

      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="bg-gray-50 px-3 py-2 text-center text-sm font-medium text-gray-700">
                {day}
              </div>
            ))}
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth;
              const isToday = day.toDateString() === today.toDateString();
              const dayMeetings = getMeetingsForDate(day);
              
              return (
                <div
                  key={index}
                  className={`bg-white min-h-[120px] p-2 relative group hover:bg-gray-50 transition-colors ${
                    !isCurrentMonth ? 'text-gray-400' : ''
                  } ${isToday ? 'bg-blue-50' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${isToday ? 'text-blue-600' : ''}`}>
                      {day.getDate()}
                    </span>
                    <button
                      onClick={() => handleDateClick(day)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-500 hover:text-white rounded-full"
                      title="Add meeting"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-1">
                    {dayMeetings.slice(0, 3).map((meeting) => (
                      <div
                        key={meeting.id}
                        className="text-xs p-1 bg-green-100 text-green-800 rounded cursor-pointer hover:bg-green-200 transition-colors truncate"
                        title={meeting.title}
                        onClick={() => handleMeetingClick(meeting.id)}
                      >
                        {meeting.time && `${meeting.time} `}{meeting.title}
                      </div>
                    ))}
                    {dayMeetings.length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{dayMeetings.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    if (calendarView === 'week') {
      const startOfWeek = new Date(selectedDate);
      startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay());
      
      const weekDays = [];
      for (let i = 0; i < 7; i++) {
        const day = new Date(startOfWeek);
        day.setDate(startOfWeek.getDate() + i);
        weekDays.push(day);
      }

      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="grid grid-cols-7 gap-4">
            {weekDays.map((day, index) => {
              const isToday = day.toDateString() === new Date().toDateString();
              const dayMeetings = getMeetingsForDate(day);
              
              return (
                <div key={index} className="space-y-2">
                  <div className={`text-center p-3 rounded-lg ${isToday ? 'bg-blue-50 text-blue-600' : 'text-gray-700'}`}>
                    <div className="text-sm font-medium">
                      {day.toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <div className={`text-2xl font-bold ${isToday ? 'text-blue-600' : ''}`}>
                      {day.getDate()}
                    </div>
                  </div>
                  <div className="space-y-2 min-h-[300px] relative group">
                    <button
                      onClick={() => handleDateClick(day)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-green-500 hover:text-white rounded-full z-10"
                      title="Add meeting"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                    {dayMeetings.map((meeting) => (
                      <div
                        key={meeting.id}
                        className="p-2 bg-green-100 text-green-800 rounded text-sm cursor-pointer hover:bg-green-200 transition-colors"
                        onClick={() => handleMeetingClick(meeting.id)}
                      >
                        <div className="font-medium">{meeting.time}</div>
                        <div className="truncate">{meeting.title}</div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Day view
    const dayMeetings = getMeetingsForDate(selectedDate);
    
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">
            {formatDate(selectedDate)}
          </h3>
          <Button
            onClick={() => handleDateClick(selectedDate)}
            className="bg-green-500 hover:bg-green-600"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Meeting
          </Button>
        </div>
        
        <div className="space-y-3">
          {dayMeetings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No meetings scheduled for this day</p>
            </div>
          ) : (
            dayMeetings.map((meeting) => (
              <div
                key={meeting.id}
                className="p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => handleMeetingClick(meeting.id)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">{meeting.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {meeting.time} • {meeting.product}
                    </p>
                    {meeting.description && (
                      <p className="text-sm text-gray-600 mt-2">{meeting.description}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation onNewMeeting={handleNewMeeting} />
      
      <main className="container mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-sora text-gray-900">Meetings</h1>
            <p className="text-gray-600 mt-1">Schedule and manage your team meetings</p>
          </div>
          
          <Button 
            onClick={handleNewMeeting}
            className="bg-green-500 hover:bg-green-600 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
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
            className="pl-10 bg-white border-gray-200 focus:border-green-500 focus:ring-green-500/20"
          />
        </div>

        {/* Calendar Controls */}
        <div className="flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('prev')}
              className="hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {calendarView === 'month' && selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              {calendarView === 'week' && `Week of ${selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
              {calendarView === 'day' && formatDate(selectedDate)}
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigateDate('next')}
              className="hover:bg-gray-100"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <Select value={calendarView} onValueChange={(value: 'month' | 'week' | 'day') => setCalendarView(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={() => setSelectedDate(new Date())}
              variant="outline"
              className="hover:bg-gray-100"
            >
              Today
            </Button>
          </div>
        </div>

        {/* Calendar Content */}
        {renderCalendarView()}
      </main>

      <NewMeetingModal
        open={isNewMeetingModalOpen}
        onOpenChange={setIsNewMeetingModalOpen}
        onCreateMeeting={handleCreateMeeting}
        defaultDate={newMeetingDate}
      />
    </div>
  );
};

export default Meetings;
