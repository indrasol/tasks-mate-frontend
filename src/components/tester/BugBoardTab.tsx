
import React from 'react';
import { Bug, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface BugBoardTabProps {
  runId: string;
}

const BugBoardTab = ({ runId }: BugBoardTabProps) => {
  // Mock data - replace with actual data fetching
  const bugSummary = {
    total: 10,
    critical: 2,
    major: 3,
    minor: 5,
    new: 4,
    confirmed: 3,
    fixed: 2,
    retest: 1,
    recentActivity: [
      { id: 'BUG-001', title: 'Login button not responsive', severity: 'major', action: 'created', time: '2 hours ago' },
      { id: 'BUG-002', title: 'Task deletion confirmation', severity: 'critical', action: 'confirmed', time: '4 hours ago' },
      { id: 'BUG-003', title: 'Profile image upload fails', severity: 'minor', action: 'fixed', time: '1 day ago' }
    ]
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-50 text-red-700 border-red-200';
      case 'major': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'minor': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700';
      case 'confirmed': return 'bg-purple-100 text-purple-700';
      case 'fixed': return 'bg-green-100 text-green-700';
      case 'retest': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
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
              <CardTitle className="text-sm font-medium text-gray-600">Critical</CardTitle>
              <AlertTriangle className="w-4 h-4 text-red-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-red-600">{bugSummary.critical}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Major</CardTitle>
              <TrendingUp className="w-4 h-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-orange-600">{bugSummary.major}</div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">Fixed</CardTitle>
              <CheckCircle className="w-4 h-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold text-green-600">{bugSummary.fixed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Bug Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor('new')}>New</Badge>
                </div>
                <span className="font-medium">{bugSummary.new}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor('confirmed')}>Confirmed</Badge>
                </div>
                <span className="font-medium">{bugSummary.confirmed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor('fixed')}>Fixed</Badge>
                </div>
                <span className="font-medium">{bugSummary.fixed}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor('retest')}>Retest</Badge>
                </div>
                <span className="font-medium">{bugSummary.retest}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bugSummary.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-green-600">{activity.id}</span>
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Severity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Severity Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-2xl font-bold text-red-600 mb-1">{bugSummary.critical}</div>
              <div className="text-sm text-red-700">Critical</div>
              <div className="text-xs text-red-600 mt-1">Immediate attention required</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="text-2xl font-bold text-orange-600 mb-1">{bugSummary.major}</div>
              <div className="text-sm text-orange-700">Major</div>
              <div className="text-xs text-orange-600 mt-1">High priority fixes</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-2xl font-bold text-yellow-600 mb-1">{bugSummary.minor}</div>
              <div className="text-sm text-yellow-700">Minor</div>
              <div className="text-xs text-yellow-600 mt-1">Low priority improvements</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BugBoardTab;
