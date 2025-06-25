import React, { useState } from 'react';
import { Plus, Phone, Mail, Users, TrendingUp, Calendar, Target, Eye, Search, Filter, X, Edit, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, addWeeks, subWeeks, addDays, subDays } from 'date-fns';
import { cn } from '@/lib/utils';

const SalesMarketing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isNewUpdateOpen, setIsNewUpdateOpen] = useState(false);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [leadDateFilter, setLeadDateFilter] = useState('');
  const [editingUpdate, setEditingUpdate] = useState<any>(null);
  const [editingLead, setEditingLead] = useState<any>(null);

  // Calendar View state
  const [calendarView, setCalendarView] = useState<'monthly' | 'weekly' | 'daily'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false);
  const [dailyStats, setDailyStats] = useState<Record<string, { calls: number; emails: number; messages: number }>>({
    '2024-12-25': { calls: 5, emails: 12, messages: 3 },
    '2024-12-24': { calls: 8, emails: 15, messages: 5 },
    '2024-12-23': { calls: 3, emails: 8, messages: 2 }
  });

  // Mock data for sales activities
  const salesStats = {
    totalCalls: 245,
    emailsSent: 890,
    messagesSent: 156,
    conversions: 23
  };

  const [updates, setUpdates] = useState([
    {
      id: 'UPD-001',
      type: 'call',
      contact: 'John Smith',
      company: 'TechCorp Inc.',
      status: 'completed',
      outcome: 'interested',
      date: '2024-12-25',
      time: '10:30 AM',
      duration: '15 min',
      notes: 'Interested in enterprise package, follow up next week'
    },
    {
      id: 'UPD-002',
      type: 'email',
      contact: 'Sarah Johnson',
      company: 'Digital Solutions',
      status: 'sent',
      outcome: 'pending',
      date: '2024-12-25',
      time: '09:15 AM',
      subject: 'Product Demo Invitation',
      notes: 'Sent demo invitation, waiting for response'
    },
    {
      id: 'UPD-003',
      type: 'call',
      contact: 'Mike Wilson',
      company: 'StartupXYZ',
      status: 'missed',
      outcome: 'reschedule',
      date: '2024-12-24',
      time: '02:00 PM',
      duration: 'N/A',
      notes: 'No answer, left voicemail'
    }
  ]);

  const [leads, setLeads] = useState([
    {
      id: 'LEAD-001',
      name: 'Emily Chen',
      company: 'InnovateLab',
      email: 'emily@innovatelab.com',
      phone: '+1-555-0123',
      status: 'hot',
      source: 'Website',
      lastContact: '2024-12-23',
      lastContactTime: '14:30',
      nextAction: 'Schedule demo'
    },
    {
      id: 'LEAD-002',
      name: 'Robert Davis',
      company: 'GrowthCo',
      email: 'robert@growthco.com',
      phone: '+1-555-0456',
      status: 'warm',
      source: 'LinkedIn',
      lastContact: '2024-12-18',
      lastContactTime: '11:15',
      nextAction: 'Follow-up call'
    },
    {
      id: 'LEAD-003',
      name: 'Lisa Anderson',
      company: 'ScaleUp Ltd',
      email: 'lisa@scaleup.com',
      phone: '+1-555-0789',
      status: 'cold',
      source: 'Cold Call',
      lastContact: '2024-12-10',
      lastContactTime: '16:45',
      nextAction: 'Re-engage email'
    }
  ]);

  const handleAddUpdate = (updateData: any) => {
    if (editingUpdate) {
      setUpdates(updates.map(update => 
        update.id === editingUpdate.id 
          ? { ...editingUpdate, ...updateData }
          : update
      ));
      setEditingUpdate(null);
    } else {
      const newUpdate = {
        id: `UPD-${String(updates.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ...updateData
      };
      setUpdates([newUpdate, ...updates]);
    }
    setIsNewUpdateOpen(false);
  };

  const handleAddLead = (leadData: any) => {
    if (editingLead) {
      setLeads(leads.map(lead => 
        lead.id === editingLead.id 
          ? { ...editingLead, ...leadData }
          : lead
      ));
      setEditingLead(null);
    } else {
      const newLead = {
        id: `LEAD-${String(leads.length + 1).padStart(3, '0')}`,
        ...leadData
      };
      setLeads([newLead, ...leads]);
    }
    setIsNewLeadOpen(false);
  };

  const handleDeleteUpdate = (id: string) => {
    setUpdates(updates.filter(update => update.id !== id));
  };

  const handleDeleteLead = (id: string) => {
    setLeads(leads.filter(lead => lead.id !== id));
  };

  const handleEditUpdate = (update: any) => {
    setEditingUpdate(update);
    setIsNewUpdateOpen(true);
  };

  const handleEditLead = (lead: any) => {
    setEditingLead(lead);
    setIsNewLeadOpen(true);
  };

  // Calendar navigation functions
  const navigateCalendar = (direction: 'prev' | 'next') => {
    if (calendarView === 'monthly') {
      setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1));
    } else if (calendarView === 'weekly') {
      setCurrentDate(direction === 'next' ? addWeeks(currentDate, 1) : subWeeks(currentDate, 1));
    } else {
      setCurrentDate(direction === 'next' ? addDays(currentDate, 1) : subDays(currentDate, 1));
    }
  };

  // Get calendar days based on view
  const getCalendarDays = () => {
    if (calendarView === 'monthly') {
      const start = startOfWeek(startOfMonth(currentDate));
      const end = endOfWeek(endOfMonth(currentDate));
      return eachDayOfInterval({ start, end });
    } else if (calendarView === 'weekly') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return eachDayOfInterval({ start, end });
    } else {
      return [currentDate];
    }
  };

  // Handle adding daily stats
  const handleAddDailyStats = (statsData: { calls: number; emails: number; messages: number }) => {
    const dateKey = format(selectedDate, 'yyyy-MM-dd');
    setDailyStats(prev => ({
      ...prev,
      [dateKey]: statsData
    }));
    setIsStatsModalOpen(false);
  };

  // Get stats for a specific date
  const getStatsForDate = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return dailyStats[dateKey] || { calls: 0, emails: 0, messages: 0 };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'warm': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'missed': return 'bg-gray-100 text-gray-700 border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call': return <Phone className="w-4 h-4" />;
      case 'email': return <Mail className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const filteredUpdates = updates.filter(update => 
    update.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
    update.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
    update.notes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeads = leads.filter(lead => 
    lead.name.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
    lead.company.toLowerCase().includes(leadSearchTerm.toLowerCase()) ||
    lead.email.toLowerCase().includes(leadSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-sora mb-2">
              Sales & Marketing Books
            </h1>
            <p className="text-gray-600">Track cold calls, emails, and lead responses</p>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Total Calls</CardTitle>
                <Phone className="w-4 h-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{salesStats.totalCalls}</div>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Emails Sent</CardTitle>
                <Mail className="w-4 h-4 text-purple-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{salesStats.emailsSent}</div>
              <p className="text-xs text-green-600 mt-1">+8% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Messages Sent</CardTitle>
                <Users className="w-4 h-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{salesStats.messagesSent}</div>
              <p className="text-xs text-red-600 mt-1">-3% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Conversions</CardTitle>
                <Target className="w-4 h-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{salesStats.conversions}</div>
              <p className="text-xs text-green-600 mt-1">+18% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            <TabsTrigger value="updates">Important Updates</TabsTrigger>
            <TabsTrigger value="leads">Lead Management</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Calendar View</CardTitle>
                  <div className="flex items-center gap-2">
                    <Select value={calendarView} onValueChange={(value: 'monthly' | 'weekly' | 'daily') => setCalendarView(value)}>
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" size="sm" onClick={() => navigateCalendar('prev')}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => navigateCalendar('next')}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h3 className="text-lg font-semibold">
                    {calendarView === 'monthly' && format(currentDate, 'MMMM yyyy')}
                    {calendarView === 'weekly' && `Week of ${format(startOfWeek(currentDate), 'MMM dd, yyyy')}`}
                    {calendarView === 'daily' && format(currentDate, 'EEEE, MMMM dd, yyyy')}
                  </h3>
                </div>

                <div className={cn(
                  "grid gap-2",
                  calendarView === 'monthly' && "grid-cols-7",
                  calendarView === 'weekly' && "grid-cols-7",
                  calendarView === 'daily' && "grid-cols-1"
                )}>
                  {calendarView !== 'daily' && (
                    <>
                      <div className="p-2 text-center font-medium text-gray-500">Sun</div>
                      <div className="p-2 text-center font-medium text-gray-500">Mon</div>
                      <div className="p-2 text-center font-medium text-gray-500">Tue</div>
                      <div className="p-2 text-center font-medium text-gray-500">Wed</div>
                      <div className="p-2 text-center font-medium text-gray-500">Thu</div>
                      <div className="p-2 text-center font-medium text-gray-500">Fri</div>
                      <div className="p-2 text-center font-medium text-gray-500">Sat</div>
                    </>
                  )}

                  {getCalendarDays().map((day) => {
                    const stats = getStatsForDate(day);
                    const hasStats = stats.calls > 0 || stats.emails > 0 || stats.messages > 0;
                    
                    return (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "relative p-3 border rounded-lg min-h-20 hover:bg-gray-50 transition-colors",
                          calendarView === 'monthly' && !isSameDay(day, startOfMonth(currentDate)) && !isSameDay(day, endOfMonth(currentDate)) && "text-gray-400",
                          calendarView === 'daily' && "min-h-40"
                        )}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{format(day, 'd')}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedDate(day);
                              setIsStatsModalOpen(true);
                            }}
                            className="w-6 h-6 p-0 hover:bg-green-100"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        {hasStats && (
                          <div className="space-y-1">
                            {stats.calls > 0 && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700">
                                <Phone className="w-3 h-3 mr-1" />
                                {stats.calls}
                              </Badge>
                            )}
                            {stats.emails > 0 && (
                              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700">
                                <Mail className="w-3 h-3 mr-1" />
                                {stats.emails}
                              </Badge>
                            )}
                            {stats.messages > 0 && (
                              <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700">
                                <Users className="w-3 h-3 mr-1" />
                                {stats.messages}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Stats Modal */}
            <Dialog open={isStatsModalOpen} onOpenChange={setIsStatsModalOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Daily Stats - {format(selectedDate, 'MMMM dd, yyyy')}</DialogTitle>
                </DialogHeader>
                <DailyStatsForm 
                  onSubmit={handleAddDailyStats} 
                  initialData={getStatsForDate(selectedDate)}
                />
              </DialogContent>
            </Dialog>
          </TabsContent>

          <TabsContent value="updates" className="space-y-6">
            {/* Search Bar and Add Button */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search updates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-40"
              />
              <Dialog open={isNewUpdateOpen} onOpenChange={(open) => {
                setIsNewUpdateOpen(open);
                if (!open) setEditingUpdate(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingUpdate ? 'Edit Update' : 'Add New Update'}</DialogTitle>
                  </DialogHeader>
                  <UpdateForm onSubmit={handleAddUpdate} initialData={editingUpdate} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Updates List */}
            <div className="space-y-4">
              {filteredUpdates.map((update) => (
                <Card key={update.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getActivityIcon(update.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{update.contact}</h3>
                            <Badge className={getStatusColor(update.status)}>
                              {update.status}
                            </Badge>
                            <Badge variant="outline">{update.company}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {update.date} at {update.time}
                            </span>
                            {update.duration && (
                              <span>Duration: {update.duration}</span>
                            )}
                            {update.subject && (
                              <span>Subject: {update.subject}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{update.notes}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEditUpdate(update)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteUpdate(update.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leads" className="space-y-6">
            {/* Search Bar and Add Button */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search leads..."
                  value={leadSearchTerm}
                  onChange={(e) => setLeadSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Input
                type="date"
                value={leadDateFilter}
                onChange={(e) => setLeadDateFilter(e.target.value)}
                className="w-40"
              />
              <Dialog open={isNewLeadOpen} onOpenChange={(open) => {
                setIsNewLeadOpen(open);
                if (!open) setEditingLead(null);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{editingLead ? 'Edit Lead' : 'Add New Lead'}</DialogTitle>
                  </DialogHeader>
                  <LeadForm onSubmit={handleAddLead} initialData={editingLead} />
                </DialogContent>
              </Dialog>
            </div>

            {/* Leads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLeads.map((lead) => (
                <Card key={lead.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg font-semibold">{lead.name}</CardTitle>
                        <p className="text-sm text-gray-600">{lead.company}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge className={getStatusColor(lead.status)}>
                          {lead.status}
                        </Badge>
                        <div className="flex gap-1 ml-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleEditLead(lead)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDeleteLead(lead.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{lead.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-600">{lead.phone}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Source:</span>
                        <Badge variant="outline">{lead.source}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Last contact: {lead.lastContact} at {lead.lastContactTime}
                      </div>
                      <div className="pt-3 border-t">
                        <p className="text-sm font-medium text-blue-600">{lead.nextAction}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Update Form Component
const UpdateForm = ({ onSubmit, initialData }: { onSubmit: (data: any) => void; initialData?: any }) => {
  const [formData, setFormData] = useState({
    type: initialData?.type || '',
    contact: initialData?.contact || '',
    company: initialData?.company || '',
    status: initialData?.status || '',
    outcome: initialData?.outcome || '',
    duration: initialData?.duration || '',
    subject: initialData?.subject || '',
    notes: initialData?.notes || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    if (!initialData) {
      setFormData({
        type: '',
        contact: '',
        company: '',
        status: '',
        outcome: '',
        duration: '',
        subject: '',
        notes: ''
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="type">Type</Label>
          <Select value={formData.type} onValueChange={(value) => setFormData({...formData, type: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="call">Call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="meeting">Meeting</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="missed">Missed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="contact">Contact Name</Label>
          <Input
            id="contact"
            value={formData.contact}
            onChange={(e) => setFormData({...formData, contact: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="outcome">Outcome</Label>
          <Input
            id="outcome"
            value={formData.outcome}
            onChange={(e) => setFormData({...formData, outcome: e.target.value})}
          />
        </div>
        <div>
          <Label htmlFor="duration">Duration</Label>
          <Input
            id="duration"
            value={formData.duration}
            onChange={(e) => setFormData({...formData, duration: e.target.value})}
            placeholder="e.g., 15 min"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="subject">Subject (for emails)</Label>
        <Input
          id="subject"
          value={formData.subject}
          onChange={(e) => setFormData({...formData, subject: e.target.value})}
        />
      </div>
      <div>
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
        />
      </div>
      <Button type="submit" className="w-full">
        {initialData ? 'Update' : 'Add Update'}
      </Button>
    </form>
  );
};

// Lead Form Component
const LeadForm = ({ onSubmit, initialData }: { onSubmit: (data: any) => void; initialData?: any }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    company: initialData?.company || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    status: initialData?.status || '',
    source: initialData?.source || '',
    lastContact: initialData?.lastContact || '',
    lastContactTime: initialData?.lastContactTime || '',
    nextAction: initialData?.nextAction || ''
  });

  const [lastContactDate, setLastContactDate] = useState<Date | undefined>(
    initialData?.lastContact ? new Date(initialData.lastContact) : undefined
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitData = {
      ...formData,
      lastContact: lastContactDate ? format(lastContactDate, 'yyyy-MM-dd') : ''
    };
    onSubmit(submitData);
    if (!initialData) {
      setFormData({
        name: '',
        company: '',
        email: '',
        phone: '',
        status: '',
        source: '',
        lastContact: '',
        lastContactTime: '',
        nextAction: ''
      });
      setLastContactDate(undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            value={formData.company}
            onChange={(e) => setFormData({...formData, company: e.target.value})}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hot">Hot</SelectItem>
              <SelectItem value="warm">Warm</SelectItem>
              <SelectItem value="cold">Cold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="source">Source</Label>
          <Input
            id="source"
            value={formData.source}
            onChange={(e) => setFormData({...formData, source: e.target.value})}
            placeholder="e.g., Website, LinkedIn"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Last Contact Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !lastContactDate && "text-muted-foreground"
                )}
              >
                <Calendar className="mr-2 h-4 w-4" />
                {lastContactDate ? format(lastContactDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <CalendarComponent
                mode="single"
                selected={lastContactDate}
                onSelect={setLastContactDate}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
        <div>
          <Label htmlFor="lastContactTime">Time</Label>
          <Input
            id="lastContactTime"
            type="time"
            value={formData.lastContactTime}
            onChange={(e) => setFormData({...formData, lastContactTime: e.target.value})}
          />
        </div>
      </div>
      <div>
        <Label htmlFor="nextAction">Next Action</Label>
        <Input
          id="nextAction"
          value={formData.nextAction}
          onChange={(e) => setFormData({...formData, nextAction: e.target.value})}
          placeholder="e.g., Schedule demo"
        />
      </div>
      <Button type="submit" className="w-full">
        {initialData ? 'Update Lead' : 'Add Lead'}
      </Button>
    </form>
  );
};

// Daily Stats Form Component
const DailyStatsForm = ({ onSubmit, initialData }: { onSubmit: (data: { calls: number; emails: number; messages: number }) => void; initialData?: { calls: number; emails: number; messages: number } }) => {
  const [formData, setFormData] = useState({
    calls: initialData?.calls || 0,
    emails: initialData?.emails || 0,
    messages: initialData?.messages || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="calls">Number of Calls</Label>
        <Input
          id="calls"
          type="number"
          value={formData.calls}
          onChange={(e) => setFormData({...formData, calls: parseInt(e.target.value) || 0})}
          min="0"
        />
      </div>
      <div>
        <Label htmlFor="emails">Number of Emails</Label>
        <Input
          id="emails"
          type="number"
          value={formData.emails}
          onChange={(e) => setFormData({...formData, emails: parseInt(e.target.value) || 0})}
          min="0"
        />
      </div>
      <div>
        <Label htmlFor="messages">Number of Messages</Label>
        <Input
          id="messages"
          type="number"
          value={formData.messages}
          onChange={(e) => setFormData({...formData, messages: parseInt(e.target.value) || 0})}
          min="0"
        />
      </div>
      <Button type="submit" className="w-full">
        Save Daily Stats
      </Button>
    </form>
  );
};

export default SalesMarketing;
