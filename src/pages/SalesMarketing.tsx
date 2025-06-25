
import React, { useState } from 'react';
import { Plus, Phone, Mail, Users, TrendingUp, Calendar, Target, DollarSign, Eye, Search, Filter } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const SalesMarketing = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for sales activities
  const salesStats = {
    totalCalls: 245,
    emailsSent: 890,
    leads: 67,
    conversions: 23,
    revenue: 125000
  };

  const recentActivities = [
    {
      id: 'ACT-001',
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
      id: 'ACT-002',
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
      id: 'ACT-003',
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
  ];

  const leads = [
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
  ];

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
            <Button className="bg-green-500 hover:bg-green-600 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Activity
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
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
                <CardTitle className="text-sm font-medium text-gray-600">Active Leads</CardTitle>
                <Users className="w-4 h-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">{salesStats.leads}</div>
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

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">Revenue</CardTitle>
                <DollarSign className="w-4 h-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-gray-900">${salesStats.revenue.toLocaleString()}</div>
              <p className="text-xs text-green-600 mt-1">+25% from last month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="activities" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="activities">Recent Activities</TabsTrigger>
            <TabsTrigger value="leads">Lead Management</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="activities" className="space-y-6">
            {/* Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Activities List */}
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getActivityIcon(activity.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{activity.contact}</h3>
                            <Badge className={getStatusColor(activity.status)}>
                              {activity.status}
                            </Badge>
                            <Badge variant="outline">{activity.company}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {activity.date} at {activity.time}
                            </span>
                            {activity.duration && (
                              <span>Duration: {activity.duration}</span>
                            )}
                            {activity.subject && (
                              <span>Subject: {activity.subject}</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-700">{activity.notes}</p>
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
            {/* Leads Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {leads.map((lead) => (
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

export default SalesMarketing;
