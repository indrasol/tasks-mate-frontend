
import React, { useState } from 'react';
import { Plus, Phone, Mail, Users, TrendingUp, Calendar, Target, Eye, Search, Filter, X } from 'lucide-react';
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

const SalesMarketing = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [isNewUpdateOpen, setIsNewUpdateOpen] = useState(false);
  const [isNewLeadOpen, setIsNewLeadOpen] = useState(false);
  const [leadSearchTerm, setLeadSearchTerm] = useState('');
  const [leadDateFilter, setLeadDateFilter] = useState('');

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
      value: '$15,000',
      lastContact: '2 days ago',
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
      value: '$8,500',
      lastContact: '1 week ago',
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
      value: '$25,000',
      lastContact: '2 weeks ago',
      nextAction: 'Re-engage email'
    }
  ]);

  const handleAddUpdate = (updateData: any) => {
    const newUpdate = {
      id: `UPD-${String(updates.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      ...updateData
    };
    setUpdates([newUpdate, ...updates]);
    setIsNewUpdateOpen(false);
  };

  const handleAddLead = (leadData: any) => {
    const newLead = {
      id: `LEAD-${String(leads.length + 1).padStart(3, '0')}`,
      lastContact: 'Just now',
      ...leadData
    };
    setLeads([newLead, ...leads]);
    setIsNewLeadOpen(false);
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
        <Tabs defaultValue="updates" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="updates">Important Updates</TabsTrigger>
            <TabsTrigger value="leads">Lead Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

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
              <Dialog open={isNewUpdateOpen} onOpenChange={setIsNewUpdateOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Update
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Update</DialogTitle>
                  </DialogHeader>
                  <UpdateForm onSubmit={handleAddUpdate} />
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
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
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
              <Dialog open={isNewLeadOpen} onOpenChange={setIsNewLeadOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Lead
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                  </DialogHeader>
                  <LeadForm onSubmit={handleAddLead} />
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
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
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
                        <span className="text-gray-600">Value:</span>
                        <span className="font-semibold text-green-600">{lead.value}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Source:</span>
                        <Badge variant="outline">{lead.source}</Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Last contact: {lead.lastContact}
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

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Analytics Coming Soon</h3>
                  <p className="text-gray-500">Detailed analytics and reporting features will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Update Form Component
const UpdateForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    type: '',
    contact: '',
    company: '',
    status: '',
    outcome: '',
    duration: '',
    subject: '',
    notes: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
      <Button type="submit" className="w-full">Add Update</Button>
    </form>
  );
};

// Lead Form Component
const LeadForm = ({ onSubmit }: { onSubmit: (data: any) => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    status: '',
    source: '',
    value: '',
    nextAction: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      status: '',
      source: '',
      value: '',
      nextAction: ''
    });
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
          <Label htmlFor="value">Potential Value</Label>
          <Input
            id="value"
            value={formData.value}
            onChange={(e) => setFormData({...formData, value: e.target.value})}
            placeholder="e.g., $10,000"
          />
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
      </div>
      <Button type="submit" className="w-full">Add Lead</Button>
    </form>
  );
};

export default SalesMarketing;
