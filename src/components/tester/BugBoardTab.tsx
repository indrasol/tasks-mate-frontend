import React from 'react';
import { Bug, AlertTriangle, CheckCircle, Clock, TrendingUp, ClipboardList, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BugBoardTabProps {
  runId: string;
}

const BugBoardTab = ({ runId }: BugBoardTabProps) => {
  // Mock data - replace with actual data fetching
  const bugSummary = {
    total: 10,
    high: 2,
    medium: 3,
    low: 5,
    closed: 3, // Updated to reflect closed bugs
    totalTasks: 15,
    recentActivity: [
      { id: 'BUG-001', title: 'Login button not responsive', severity: 'medium', action: 'created', time: '2 hours ago', createdAt: '2024-12-25T10:00:00Z' },
      { id: 'BUG-002', title: 'Task deletion confirmation', severity: 'high', action: 'confirmed', time: '8 hours ago', createdAt: '2024-12-25T04:00:00Z' },
      { id: 'BUG-003', title: 'Profile image upload fails', severity: 'low', action: 'closed', time: '1 day ago', createdAt: '2024-12-24T12:00:00Z' },
      { id: 'BUG-004', title: 'Navigation menu collapse issue', severity: 'medium', action: 'created', time: '1 day ago', createdAt: '2024-12-24T14:00:00Z' },
      { id: 'BUG-005', title: 'Data export functionality broken', severity: 'high', action: 'confirmed', time: '3 days ago', createdAt: '2024-12-22T10:00:00Z' },
    ]
  };

  // Filter activity to show only past 2 days
  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  
  const filteredActivity = bugSummary.recentActivity.filter(activity => {
    const activityDate = new Date(activity.createdAt);
    return activityDate >= twoDaysAgo;
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-50 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'low': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'closed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'confirmed': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'created': return <Bug className="w-4 h-4 text-blue-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Bugs</CardTitle>
              <Bug className="w-4 h-4 text-gray-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-gray-900">{bugSummary.total}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">High</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600">{bugSummary.high}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Medium</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-600">{bugSummary.medium}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Low</CardTitle>
              <CheckCircle className="w-4 h-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-blue-600">{bugSummary.low}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Closed Bugs</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">{bugSummary.closed}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Total Tasks</CardTitle>
              <ClipboardList className="w-4 h-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-purple-600">{bugSummary.totalTasks}</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Full Width */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Recent Activity (Past 2 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredActivity.length > 0 ? (
              filteredActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  {getActionIcon(activity.action)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${activity.action === 'closed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'} text-xs font-medium`}>
                        {activity.id}
                      </Badge>
                      <Badge className={`${getSeverityColor(activity.severity)} text-xs`}>
                        {activity.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-900 truncate">{activity.title}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.action} • {activity.time}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>No activity in the past 2 days</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BugBoardTab;
