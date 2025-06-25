
import React, { useState } from 'react';
import { Calendar, Users, TrendingUp, Plus, ChevronLeft, ChevronRight, Phone, Mail, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import MainNavigation from '@/components/navigation/MainNavigation';

interface DayStats {
  calls: number;
  emails: number;
  messages: number;
}

interface CalendarStats {
  [key: string]: DayStats;
}

const SalesMarketing = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [calendarView, setCalendarView] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarStats, setCalendarStats] = useState<CalendarStats>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isAddStatsOpen, setIsAddStatsOpen] = useState(false);
  const [newStats, setNewStats] = useState({ calls: 0, emails: 0, messages: 0 });

  // Sample leads data
  const leads = [
    { id: 1, name: 'Acme Corp', status: 'Hot', value: '$50,000', contact: 'John Smith' },
    { id: 2, name: 'Tech Solutions', status: 'Warm', value: '$25,000', contact: 'Sarah Johnson' },
    { id: 3, name: 'Global Industries', status: 'Cold', value: '$75,000', contact: 'Mike Davis' },
  ];

  const getDateKey = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const handleAddStats = () => {
    const dateKey = selectedDate;
    setCalendarStats(prev => ({
      ...prev,
      [dateKey]: newStats
    }));
    setNewStats({ calls: 0, emails: 0, messages: 0 });
    setIsAddStatsOpen(false);
  };

  const openAddStatsModal = (date: Date) => {
    setSelectedDate(getDateKey(date));
    setIsAddStatsOpen(true);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    if (calendarView === 'monthly') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (calendarView === 'weekly') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (calendarView === 'daily') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    
    setCurrentDate(newDate);
  };

  const renderCalendarDay = (date: Date) => {
    const dateKey = getDateKey(date);
    const stats = calendarStats[dateKey];
    const isToday = date.toDateString() === new Date().toDateString();
    const isCurrentMonth = date.getMonth() === currentDate.getMonth();

    return (
      <div
        key={dateKey}
        className={`relative p-2 min-h-[80px] border border-gray-200 ${
          isCurrentMonth ? 'bg-white' : 'bg-gray-50'
        } ${isToday ? 'bg-blue-50 border-blue-300' : ''}`}
      >
        <div className="flex justify-between items-start">
          <span className={`text-sm ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}`}>
            {date.getDate()}
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="w-6 h-6 p-0 hover:bg-gray-100"
            onClick={() => openAddStatsModal(date)}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>
        {stats && (
          <div className="mt-1 space-y-1">
            {stats.calls > 0 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                📞 {stats.calls}
              </Badge>
            )}
            {stats.emails > 0 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                📧 {stats.emails}
              </Badge>
            )}
            {stats.messages > 0 && (
              <Badge variant="secondary" className="text-xs px-1 py-0">
                💬 {stats.messages}
              </Badge>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderMonthlyCalendar = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return (
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-0">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="p-3 text-center font-medium text-gray-500 border-b">
              {day}
            </div>
          ))}
          {days.map((date) => renderCalendarDay(date))}
        </div>
      </div>
    );
  };

  const renderWeeklyCalendar = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(currentDate.getDate() - day);
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push(date);
    }

    return (
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            Week of {startOfWeek.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-0">
          {weekDays.map((date, index) => (
            <div key={index} className="border-r last:border-r-0">
              <div className="p-3 text-center font-medium text-gray-500 border-b">
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              {renderCalendarDay(date)}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDailyCalendar = () => {
    const dateKey = getDateKey(currentDate);
    const stats = calendarStats[dateKey];

    return (
      <div className="bg-white rounded-lg border">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">
            {currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </h3>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('prev')}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateDate('next')}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-lg font-medium">Daily Activities</h4>
            <Button
              onClick={() => openAddStatsModal(currentDate)}
              size="sm"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Stats
            </Button>
          </div>
          
          {stats ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Phone className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                <div className="text-2xl font-bold text-blue-900">{stats.calls}</div>
                <div className="text-sm text-blue-600">Calls</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Mail className="w-8 h-8 mx-auto mb-2 text-green-600" />
                <div className="text-2xl font-bold text-green-900">{stats.emails}</div>
                <div className="text-sm text-green-600">Emails</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                <div className="text-2xl font-bold text-purple-900">{stats.messages}</div>
                <div className="text-sm text-purple-600">Messages</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No activities recorded for this day
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Sales / Marketing Books</h1>
              <p className="text-gray-600 mt-2">Track your sales activities and manage leads</p>
            </div>
          </div>

          {/* Enhanced Stat Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-blue-700">Total Calls</CardTitle>
                <div className="p-2 bg-blue-100 rounded-full">
                  <Phone className="h-4 w-4 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-blue-900">124</div>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +12% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-green-700">Emails Sent</CardTitle>
                <div className="p-2 bg-green-100 rounded-full">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-green-900">89</div>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +8% from last month
                </p>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-purple-700">Messages</CardTitle>
                <div className="p-2 bg-purple-100 rounded-full">
                  <MessageSquare className="h-4 w-4 text-purple-600" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-2xl font-bold text-purple-900">156</div>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  +15% from last month
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
              <TabsTrigger value="updates">Important Updates</TabsTrigger>
              <TabsTrigger value="lead-management">Lead Management</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Sales Calendar</h2>
                <div className="flex space-x-2">
                  <Button
                    variant={calendarView === 'monthly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCalendarView('monthly')}
                  >
                    Monthly
                  </Button>
                  <Button
                    variant={calendarView === 'weekly' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCalendarView('weekly')}
                  >
                    Weekly
                  </Button>
                  <Button
                    variant={calendarView === 'daily' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCalendarView('daily')}
                  >
                    Daily
                  </Button>
                </div>
              </div>

              {calendarView === 'monthly' && renderMonthlyCalendar()}
              {calendarView === 'weekly' && renderWeeklyCalendar()}
              {calendarView === 'daily' && renderDailyCalendar()}
            </TabsContent>

            <TabsContent value="updates" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Updates</CardTitle>
                  <CardDescription>Latest sales and marketing activities</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">New lead added: TechCorp Solutions</p>
                        <p className="text-sm text-gray-500">2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Follow-up call scheduled with Acme Corp</p>
                        <p className="text-sm text-gray-500">4 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="font-medium">Email campaign sent to 50 prospects</p>
                        <p className="text-sm text-gray-500">1 day ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lead-management" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lead Pipeline</CardTitle>
                  <CardDescription>Manage and track your sales leads</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Users className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium">{lead.name}</h3>
                            <p className="text-sm text-gray-500">{lead.contact}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <Badge 
                            variant={lead.status === 'Hot' ? 'destructive' : lead.status === 'Warm' ? 'default' : 'secondary'}
                          >
                            {lead.status}
                          </Badge>
                          <span className="font-medium">{lead.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Dialog open={isAddStatsOpen} onOpenChange={setIsAddStatsOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Daily Stats</DialogTitle>
                <DialogDescription>
                  Add your daily activities for {selectedDate}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="calls">Calls</Label>
                  <Input
                    id="calls"
                    type="number"
                    value={newStats.calls}
                    onChange={(e) => setNewStats(prev => ({ ...prev, calls: parseInt(e.target.value) || 0 }))}
                    placeholder="Number of calls"
                  />
                </div>
                <div>
                  <Label htmlFor="emails">Emails</Label>
                  <Input
                    id="emails"
                    type="number"
                    value={newStats.emails}
                    onChange={(e) => setNewStats(prev => ({ ...prev, emails: parseInt(e.target.value) || 0 }))}
                    placeholder="Number of emails"
                  />
                </div>
                <div>
                  <Label htmlFor="messages">Messages</Label>
                  <Input
                    id="messages"
                    type="number"
                    value={newStats.messages}
                    onChange={(e) => setNewStats(prev => ({ ...prev, messages: parseInt(e.target.value) || 0 }))}
                    placeholder="Number of messages"
                  />
                </div>
                <Button onClick={handleAddStats} className="w-full">
                  Add Stats
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default SalesMarketing;
