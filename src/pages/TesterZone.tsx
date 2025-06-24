
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Filter, FileText, Bug, Eye } from 'lucide-react';
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import NewRunModal from '@/components/tester/NewRunModal';

interface TestRun {
  id: string;
  product: string;
  version: string;
  environment: string;
  date: string;
  owner: string;
  status: 'running' | 'completed' | 'failed';
  bugs: {
    critical: number;
    major: number;
    minor: number;
  };
  hasEvidence: boolean;
}

const TesterZone = () => {
  const [showNewRunModal, setShowNewRunModal] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState({
    product: '',
    version: '',
    status: '',
    severity: ''
  });

  // Mock data - replace with actual data fetching
  const testRuns: TestRun[] = [
    {
      id: 'TR-001',
      product: 'TasksMate Web',
      version: '2.1.0',
      environment: 'Staging',
      date: '2024-12-20',
      owner: 'John Doe',
      status: 'running',
      bugs: { critical: 2, major: 3, minor: 5 },
      hasEvidence: true
    },
    {
      id: 'TR-002',
      product: 'TasksMate Mobile',
      version: '1.8.2',
      environment: 'Production',
      date: '2024-12-18',
      owner: 'Jane Smith',
      status: 'completed',
      bugs: { critical: 0, major: 1, minor: 2 },
      hasEvidence: true
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-blue-100 text-blue-700';
      case 'completed': return 'bg-green-100 text-green-700';
      case 'failed': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityColor = (severity: 'critical' | 'major' | 'minor') => {
    switch (severity) {
      case 'critical': return 'text-red-600 font-semibold';
      case 'major': return 'text-orange-600 font-semibold';
      case 'minor': return 'text-yellow-600 font-semibold';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MainNavigation />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-sora">Test Runs</h1>
            <p className="text-gray-600 mt-1">Manage and track your testing activities</p>
          </div>
          
          <Button 
            onClick={() => setShowNewRunModal(true)}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Run
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex gap-3 mb-6">
          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
            Product <Filter className="w-3 h-3 ml-1" />
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
            Version <Filter className="w-3 h-3 ml-1" />
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
            Status <Filter className="w-3 h-3 ml-1" />
          </Badge>
          <Badge variant="outline" className="cursor-pointer hover:bg-gray-100">
            Severity <Filter className="w-3 h-3 ml-1" />
          </Badge>
        </div>

        {/* Table */}
        {testRuns.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-lg border">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Beaker className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No test runs yet</h3>
            <p className="text-gray-500 mb-6">Create your first test run to get started</p>
            <Button 
              onClick={() => setShowNewRunModal(true)}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Run
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Environment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>🐞 Bugs</TableHead>
                  <TableHead>Evidence</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testRuns.map((run) => (
                  <TableRow key={run.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      <Link 
                        to={`/tester-zone/runs/${run.id}`}
                        className="text-green-600 hover:text-green-700 hover:underline"
                      >
                        {run.id}
                      </Link>
                    </TableCell>
                    <TableCell>{run.product}</TableCell>
                    <TableCell>{run.version}</TableCell>
                    <TableCell>{run.environment}</TableCell>
                    <TableCell>{new Date(run.date).toLocaleDateString()}</TableCell>
                    <TableCell>{run.owner}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(run.status)} border-0`}>
                        {run.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {run.bugs.critical > 0 && (
                          <span className={getSeverityColor('critical')}>
                            {run.bugs.critical}
                          </span>
                        )}
                        {run.bugs.major > 0 && (
                          <span className={getSeverityColor('major')}>
                            {run.bugs.major}
                          </span>
                        )}
                        {run.bugs.minor > 0 && (
                          <span className={getSeverityColor('minor')}>
                            {run.bugs.minor}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {run.hasEvidence && (
                        <FileText className="w-4 h-4 text-gray-500" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/tester-zone/runs/${run.id}`}>
                          <Eye className="w-4 h-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* New Run Modal */}
        <NewRunModal 
          open={showNewRunModal}
          onOpenChange={setShowNewRunModal}
        />
      </div>
    </div>
  );
};

export default TesterZone;
