import React, { useState } from 'react';
import { Calendar, Users, TrendingUp, Plus, ChevronLeft, ChevronRight, Phone, Mail, MessageSquare, Edit, Trash2, Tag, Building, User, Clock, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import MainNavigation from '@/components/navigation/MainNavigation';

interface DayStats {
  calls: number;
  emails: number;
  messages: number;
}

interface CalendarStats {
  [key: string]: DayStats;
}

interface Update {
  id: number;
  title: string;
  description: string;
  contactName: string;
  contactCompany: string;
  lastContacted: Date | null;
  timestamp: string;
}

interface Lead {
  id: number;
  name: string;
  status: 'Hot' | 'Warm' | 'Cold';
  source: string;
  contact: string;
  email: string;
  phone: string;
  notes: string;
}

const SalesMarketing = () => {
  const [activeTab, setActiveTab] = useState('calendar');
  const [calendarView, setCalendarView] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarStats, setCalendarStats] = useState<CalendarStats>({});
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isAddStatsOpen, setIsAddStatsOpen] = useState(false);
  const [newStats, setNewStats] = useState({ calls: 0, emails: 0, messages: 0 });

  // Updates state
  const [updates, setUpdates] = useState<Update[]>([
    { 
      id: 1, 
      title: 'New lead added: TechCorp Solutions', 
      description: 'Potential client from tech industry', 
      contactName: 'John Smith',
      contactCompany: 'TechCorp Solutions',
      lastContacted: new Date('2024-01-15'),
      timestamp: '2 hours ago' 
    },
    { 
      id: 2, 
      title: 'Follow-up call scheduled with Acme Corp', 
      description: 'Meeting scheduled for next week', 
      contactName: 'Sarah Johnson',
      contactCompany: 'Acme Corp',
      lastContacted: new Date('2024-01-14'),
      timestamp: '4 hours ago' 
    },
  ]);
  const [isAddUpdateOpen, setIsAddUpdateOpen] = useState(false);
  const [isEditUpdateOpen, setIsEditUpdateOpen] = useState(false);
  const [editingUpdate, setEditingUpdate] = useState<Update | null>(null);
  const [newUpdate, setNewUpdate] = useState({ 
    title: '', 
    description: '', 
    contactName: '', 
    contactCompany: '', 
    lastContacted: null as Date | null 
  });

  // Leads state
  const [leads, setLeads] = useState<Lead[]>([
    { id: 1, name: 'Acme Corp', status: 'Hot', source: 'LinkedIn', contact: 'John Smith', email: 'john@acme.com', phone: '+1-555-0123', notes: 'Very interested in our services' },
    { id: 2, name: 'Tech Solutions', status: 'Warm', source: 'Referral', contact: 'Sarah Johnson', email: 'sarah@tech.com', phone: '+1-555-0456', notes: 'Needs more information' },
    { id: 3, name: 'Global Industries', status: 'Cold', source: 'Cold Email', contact: 'Mike Davis', email: 'mike@global.com', phone: '+1-555-0789', notes: 'Initial contact made' },
  ]);
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false);
  const [isEditLeadOpen, setIsEditLeadOpen] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [newLead, setNewLead] = useState<{
    name: string;
    status: 'Hot' | 'Warm' | 'Cold';
    source: string;
    contact: string;
    email: string;
    phone: string;
    notes: string;
  }>({
    name: '',
    status: 'Warm',
    source: '',
    contact: '',
    email: '',
    phone: '',
    notes: ''
  });

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

  const handleAddUpdate = () => {
    const update: Update = {
      id: Date.now(),
      title: newUpdate.title,
      description: newUpdate.description,
      contactName: newUpdate.contactName,
      contactCompany: newUpdate.contactCompany,
      lastContacted: newUpdate.lastContacted,
      timestamp: 'Just now'
    };
    setUpdates(prev => [update, ...prev]);
    setNewUpdate({ title: '', description: '', contactName: '', contactCompany: '', lastContacted: null });
    setIsAddUpdateOpen(false);
  };

  const handleEditUpdate = (update: Update) => {
    setEditingUpdate(update);
    setNewUpdate({
      title: update.title,
      description: update.description,
      contactName: update.contactName,
      contactCompany: update.contactCompany,
      lastContacted: update.lastContacted
    });
    setIsEditUpdateOpen(true);
  };

  const handleUpdateEdit = () => {
    if (!editingUpdate) return;
    
    const updatedUpdate: Update = {
      ...editingUpdate,
      title: newUpdate.title,
      description: newUpdate.description,
      contactName: newUpdate.contactName,
      contactCompany: newUpdate.contactCompany,
      lastContacted: newUpdate.lastContacted,
    };
    
    setUpdates(prev => prev.map(update => 
      update.id === editingUpdate.id ? updatedUpdate : update
    ));
    setNewUpdate({ title: '', description: '', contactName: '', contactCompany: '', lastContacted: null });
    setIsEditUpdateOpen(false);
    setEditingUpdate(null);
  };

  const handleDeleteUpdate = (id: number) => {
    setUpdates(prev => prev.filter(update => update.id !== id));
  };

  const handleAddLead = () => {
    const lead: Lead = {
      id: Date.now(),
      ...newLead
    };
    setLeads(prev => [lead, ...prev]);
    setNewLead({
      name: '',
      status: 'Warm',
      source: '',
      contact: '',
      email: '',
      phone: '',
      notes: ''
    });
    setIsAddLeadOpen(false);
  };

  const handleEditLead = (lead: Lead) => {
    setEditingLead(lead);
    setNewLead({
      name: lead.name,
      status: lead.status,
      source: lead.source,
      contact: lead.contact,
      email: lead.email,
      phone: lead.phone,
      notes: lead.notes
    });
    setIsEditLeadOpen(true);
  };

  const handleLeadEdit = () => {
    if (!editingLead) return;
    
    const updatedLead: Lead = {
      ...editingLead,
      ...newLead
    };
    
    setLeads(prev => prev.map(lead => 
      lead.id === editingLead.id ? updatedLead : lead
    ));
    setNewLead({
      name: '',
      status: 'Warm',
      source: '',
      contact: '',
      email: '',
      phone: '',
      notes: ''
    });
    setIsEditLeadOpen(false);
    setEditingLead(null);
  };

  const handleDeleteLead = (id: number) => {
    setLeads(prev => prev.filter(lead => lead.id !== id));
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-blue-600 opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-blue-700">Total Calls</CardTitle>
                <div className="p-3 bg-blue-500 rounded-full shadow-md">
                  <Phone className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-blue-900 mb-1">124</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">+12% </span>
                  <span className="text-blue-600 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-emerald-700">Emails Sent</CardTitle>
                <div className="p-3 bg-emerald-500 rounded-full shadow-md">
                  <Mail className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-emerald-900 mb-1">89</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">+8% </span>
                  <span className="text-emerald-600 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-50 to-violet-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-violet-400 to-violet-600 opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-violet-700">Messages</CardTitle>
                <div className="p-3 bg-violet-500 rounded-full shadow-md">
                  <MessageSquare className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-violet-900 mb-1">156</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">+15% </span>
                  <span className="text-violet-600 ml-1">from last month</span>
                </div>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 opacity-10 rounded-full -translate-y-8 translate-x-8"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
                <CardTitle className="text-sm font-medium text-orange-700">Conversions</CardTitle>
                <div className="p-3 bg-orange-500 rounded-full shadow-md">
                  <Target className="h-5 w-5 text-white" />
                </div>
              </CardHeader>
              <CardContent className="relative z-10">
                <div className="text-3xl font-bold text-orange-900 mb-1">43</div>
                <div className="flex items-center text-sm">
                  <TrendingUp className="w-4 h-4 mr-1 text-emerald-600" />
                  <span className="text-emerald-600 font-medium">+22% </span>
                  <span className="text-orange-600 ml-1">from last month</span>
                </div>
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
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Important Updates</CardTitle>
                      <CardDescription>Latest sales and marketing activities</CardDescription>
                    </div>
                    <Dialog open={isAddUpdateOpen} onOpenChange={setIsAddUpdateOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white shadow-lg">
                          <Plus className="w-4 h-4 mr-2 text-white" />
                          Add Update
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Update</DialogTitle>
                          <DialogDescription>
                            Create a new update for your sales and marketing activities
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="col-span-2">
                            <Label htmlFor="update-title">Title</Label>
                            <Input
                              id="update-title"
                              value={newUpdate.title}
                              onChange={(e) => setNewUpdate(prev => ({ ...prev, title: e.target.value }))}
                              placeholder="Update title"
                            />
                          </div>
                          <div>
                            <Label htmlFor="contact-name">Contact Name</Label>
                            <Input
                              id="contact-name"
                              value={newUpdate.contactName}
                              onChange={(e) => setNewUpdate(prev => ({ ...prev, contactName: e.target.value }))}
                              placeholder="Contact person name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="contact-company">Contact Company</Label>
                            <Input
                              id="contact-company"
                              value={newUpdate.contactCompany}
                              onChange={(e) => setNewUpdate(prev => ({ ...prev, contactCompany: e.target.value }))}
                              placeholder="Company name"
                            />
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor="last-contacted">Last Contacted</Label>
                            <div className="flex space-x-2">
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button
                                    variant="outline"
                                    className="flex-1 justify-start text-left font-normal"
                                  >
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {newUpdate.lastContacted ? format(newUpdate.lastContacted, 'PPP') : 'Select date'}
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <CalendarComponent
                                    mode="single"
                                    selected={newUpdate.lastContacted || undefined}
                                    onSelect={(date) => {
                                      if (date) {
                                        // Preserve time if already set
                                        if (newUpdate.lastContacted) {
                                          date.setHours(newUpdate.lastContacted.getHours());
                                          date.setMinutes(newUpdate.lastContacted.getMinutes());
                                        }
                                        setNewUpdate(prev => ({ ...prev, lastContacted: date }));
                                      } else {
                                        setNewUpdate(prev => ({ ...prev, lastContacted: null }));
                                      }
                                    }}
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <Input
                                type="time"
                                className="w-32"
                                value={newUpdate.lastContacted ? format(newUpdate.lastContacted, 'HH:mm') : ''}
                                onChange={(e) => {
                                  if (e.target.value && newUpdate.lastContacted) {
                                    const [hours, minutes] = e.target.value.split(':');
                                    const newDate = new Date(newUpdate.lastContacted);
                                    newDate.setHours(parseInt(hours));
                                    newDate.setMinutes(parseInt(minutes));
                                    setNewUpdate(prev => ({ ...prev, lastContacted: newDate }));
                                  }
                                }}
                              />
                            </div>
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor="update-description">Description</Label>
                            <Textarea
                              id="update-description"
                              value={newUpdate.description}
                              onChange={(e) => setNewUpdate(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="Update description"
                              rows={3}
                            />
                          </div>
                        </div>
                        <Button onClick={handleAddUpdate} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                          Add Update
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {updates.map((update) => (
                      <Card key={update.id} className="border border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{update.title}</h3>
                                <p className="text-sm text-gray-600 mt-1">{update.description}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditUpdate(update)}
                                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteUpdate(update.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4 mt-4">
                            <div className="flex items-center space-x-2">
                              <User className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{update.contactName}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Building className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">{update.contactCompany}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-500" />
                              <span className="text-sm text-gray-600">
                                {update.lastContacted ? format(update.lastContacted, 'MMM dd, yyyy HH:mm') : 'Not set'}
                              </span>
                            </div>
                          </div>
                          <div className="mt-4 text-xs text-gray-500">{update.timestamp}</div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="lead-management" className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">Lead Pipeline</CardTitle>
                      <CardDescription>Manage and track your sales leads</CardDescription>
                    </div>
                    <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg">
                          <Plus className="w-4 h-4 mr-2 text-white" />
                          Add Lead
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Add New Lead</DialogTitle>
                          <DialogDescription>
                            Add a new lead to your sales pipeline
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="lead-name">Company Name</Label>
                            <Input
                              id="lead-name"
                              value={newLead.name}
                              onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                              placeholder="Company name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lead-contact">Contact Person</Label>
                            <Input
                              id="lead-contact"
                              value={newLead.contact}
                              onChange={(e) => setNewLead(prev => ({ ...prev, contact: e.target.value }))}
                              placeholder="Contact person"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lead-email">Email</Label>
                            <Input
                              id="lead-email"
                              type="email"
                              value={newLead.email}
                              onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="Email address"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lead-phone">Phone</Label>
                            <Input
                              id="lead-phone"
                              value={newLead.phone}
                              onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="Phone number"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lead-source">Source</Label>
                            <Input
                              id="lead-source"
                              value={newLead.source}
                              onChange={(e) => setNewLead(prev => ({ ...prev, source: e.target.value }))}
                              placeholder="e.g., LinkedIn, Referral, Cold Email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="lead-status">Status</Label>
                            <Select value={newLead.status} onValueChange={(value: 'Hot' | 'Warm' | 'Cold') => setNewLead(prev => ({ ...prev, status: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Hot">Hot</SelectItem>
                                <SelectItem value="Warm">Warm</SelectItem>
                                <SelectItem value="Cold">Cold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2">
                            <Label htmlFor="lead-notes">Notes</Label>
                            <Textarea
                              id="lead-notes"
                              value={newLead.notes}
                              onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="Additional notes about this lead"
                              rows={3}
                            />
                          </div>
                        </div>
                        <Button onClick={handleAddLead} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                          Add Lead
                        </Button>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {leads.map((lead) => (
                      <Card key={lead.id} className="border border-gray-200 bg-gradient-to-r from-white to-gray-50 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center">
                                <Users className="w-6 h-6 text-white" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">{lead.name}</h3>
                                <p className="text-sm text-gray-500">{lead.contact}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <Badge 
                                variant={lead.status === 'Hot' ? 'destructive' : lead.status === 'Warm' ? 'default' : 'secondary'}
                                className="text-xs px-3 py-1"
                              >
                                {lead.status}
                              </Badge>
                              <Badge variant="outline" className="text-xs px-3 py-1">
                                <Tag className="w-3 h-3 mr-1" />
                                {lead.source}
                              </Badge>
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditLead(lead)}
                                  className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteLead(lead.id)}
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <Mail className="w-4 h-4" />
                              <span className="text-sm text-gray-600">{lead.email}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Phone className="w-4 h-4" />
                              <span className="text-sm text-gray-600">{lead.phone}</span>
                            </div>
                            <div className="col-span-2 flex items-start space-x-2">
                              <MessageSquare className="w-4 h-4 mt-0.5" />
                              <span className="text-sm text-gray-600">{lead.notes}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Edit Update Dialog */}
          <Dialog open={isEditUpdateOpen} onOpenChange={setIsEditUpdateOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Update</DialogTitle>
                <DialogDescription>
                  Update the sales and marketing activity information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="edit-update-title">Title</Label>
                  <Input
                    id="edit-update-title"
                    value={newUpdate.title}
                    onChange={(e) => setNewUpdate(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Update title"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contact-name">Contact Name</Label>
                  <Input
                    id="edit-contact-name"
                    value={newUpdate.contactName}
                    onChange={(e) => setNewUpdate(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Contact person name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-contact-company">Contact Company</Label>
                  <Input
                    id="edit-contact-company"
                    value={newUpdate.contactCompany}
                    onChange={(e) => setNewUpdate(prev => ({ ...prev, contactCompany: e.target.value }))}
                    placeholder="Company name"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-last-contacted">Last Contacted</Label>
                  <div className="flex space-x-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 justify-start text-left font-normal"
                        >
                          <Calendar className="mr-2 h-4 w-4" />
                          {newUpdate.lastContacted ? format(newUpdate.lastContacted, 'PPP') : 'Select date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={newUpdate.lastContacted || undefined}
                          onSelect={(date) => {
                            if (date) {
                              // Preserve time if already set
                              if (newUpdate.lastContacted) {
                                date.setHours(newUpdate.lastContacted.getHours());
                                date.setMinutes(newUpdate.lastContacted.getMinutes());
                              }
                              setNewUpdate(prev => ({ ...prev, lastContacted: date }));
                            } else {
                              setNewUpdate(prev => ({ ...prev, lastContacted: null }));
                            }
                          }}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <Input
                      type="time"
                      className="w-32"
                      value={newUpdate.lastContacted ? format(newUpdate.lastContacted, 'HH:mm') : ''}
                      onChange={(e) => {
                        if (e.target.value && newUpdate.lastContacted) {
                          const [hours, minutes] = e.target.value.split(':');
                          const newDate = new Date(newUpdate.lastContacted);
                          newDate.setHours(parseInt(hours));
                          newDate.setMinutes(parseInt(minutes));
                          setNewUpdate(prev => ({ ...prev, lastContacted: newDate }));
                        }
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-update-description">Description</Label>
                  <Textarea
                    id="edit-update-description"
                    value={newUpdate.description}
                    onChange={(e) => setNewUpdate(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Update description"
                    rows={3}
                  />
                </div>
              </div>
              <Button onClick={handleUpdateEdit} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700">
                Update
              </Button>
            </DialogContent>
          </Dialog>

          {/* Edit Lead Dialog */}
          <Dialog open={isEditLeadOpen} onOpenChange={setIsEditLeadOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Edit Lead</DialogTitle>
                <DialogDescription>
                  Update the lead information in your sales pipeline
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-lead-name">Company Name</Label>
                  <Input
                    id="edit-lead-name"
                    value={newLead.name}
                    onChange={(e) => setNewLead(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Company name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lead-contact">Contact Person</Label>
                  <Input
                    id="edit-lead-contact"
                    value={newLead.contact}
                    onChange={(e) => setNewLead(prev => ({ ...prev, contact: e.target.value }))}
                    placeholder="Contact person"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lead-email">Email</Label>
                  <Input
                    id="edit-lead-email"
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Email address"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lead-phone">Phone</Label>
                  <Input
                    id="edit-lead-phone"
                    value={newLead.phone}
                    onChange={(e) => setNewLead(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="Phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lead-source">Source</Label>
                  <Input
                    id="edit-lead-source"
                    value={newLead.source}
                    onChange={(e) => setNewLead(prev => ({ ...prev, source: e.target.value }))}
                    placeholder="e.g., LinkedIn, Referral, Cold Email"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-lead-status">Status</Label>
                  <Select value={newLead.status} onValueChange={(value: 'Hot' | 'Warm' | 'Cold') => setNewLead(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Hot">Hot</SelectItem>
                      <SelectItem value="Warm">Warm</SelectItem>
                      <SelectItem value="Cold">Cold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="edit-lead-notes">Notes</Label>
                  <Textarea
                    id="edit-lead-notes"
                    value={newLead.notes}
                    onChange={(e) => setNewLead(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Additional notes about this lead"
                    rows={3}
                  />
                </div>
              </div>
              <Button onClick={handleLeadEdit} className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700">
                Update Lead
              </Button>
            </DialogContent>
          </Dialog>

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
