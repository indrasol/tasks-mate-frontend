
import { API_ENDPOINTS } from '@/../config';
import BugBoardTab from '@/components/tester/BugBoardTab';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { BackendProjectMember } from '@/hooks/useProjectMembers';
import { api } from '@/services/apiService';
import { TestRunTrackDetail } from '@/types/tracker';
import { Calendar, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

const TestRunDetail = () => {
  const { id } = useParams();
  const currentOrgId = useCurrentOrgId();
  const [activeTab, setActiveTab] = useState('bug-board');

  // Mock data - replace with actual data fetching
  const [testRun, setTestRun] = useState<TestRunTrackDetail>();

  const { user, loading } = useAuth() || { user: null, loading: true } as const;
  const navigate = useNavigate();



  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const [loadingTestRun, setLoadingTestRun] = useState(false);

  const [allMembers, setAllMembers] = useState<BackendProjectMember[]>([]);

  useEffect(() => {
    if (!id) return;
    const fetchTestRun = async () => {
      setLoadingTestRun(true);
      try {
        const tracker = await api.get<any>(`${API_ENDPOINTS.TRACKERS}/detail/${id}`);
        // Map API response to local Project shape
        const mapped: TestRunTrackDetail = {
          id: tracker.tracker_id,
          name: tracker.name,
          project: tracker.project_name || tracker.project_id,
          creator: tracker.creator_name,
          status: tracker.status,
          priority: tracker.priority,
          totalBugs: tracker.total_bugs || 0,
          totalTasks: tracker.total_tasks || 0,
          date: new Date(tracker.created_at).toISOString().split('T')[0],
          assignedTo: [tracker?.creator_name],
          summary: {
            total: tracker.total_bugs || 0,
            high: tracker.high || 0,
            medium: tracker.medium || 0,
            low: tracker.low || 0,
            critical: tracker.critical || 0,
            blocker: tracker.blocker || 0,
            totalTasks: tracker.total_tasks || 0,
            // highTasks: tracker.high_tasks || 0,
            // mediumTasks: tracker.medium_tasks || 0,
            // lowTasks: tracker.low_tasks || 0,
            // criticalTasks: tracker.critical_tasks || 0,
            // blockerTasks: tracker.blocker_tasks || 0,
          }
        };
        setTestRun(mapped);

        // const { data: membersData } = useProjectMembers(tracker.project_id);
        // setAllMembers(membersData);
      } catch (err) {
        setTestRun(null);
      }
      setLoadingTestRun(false);
    };
    fetchTestRun();
  }, [id]);

  // Available team members that can be added
  // const allMembers = [
  //   'Alice Johnson',
  //   'Bob Smith',
  //   'Carol Davis',
  //   'David Wilson',
  //   'Emma Brown',
  //   'Frank Miller',
  //   'Grace Lee',
  //   'Henry Clark'
  // ];

  // Filter out already assigned members
  const availableMembers = allMembers?.filter(member => !testRun?.assignedTo?.includes(member.username));

  const handleAddMember = (memberName: string, memberId: string) => {
    // Add new member to assignedTo list
    setTestRun(prev => ({
      ...prev,
      assignedTo: [...prev.assignedTo, memberName]
    }));

    // Show success notification
    toast({
      title: "Member added!",
      description: `${memberName} has been added to the team`,
    });

    // Here you would typically send an API request to add the user
    console.log('Adding member:', memberName);
  };

  const handleNewBug = () => {
    navigate(`/bug-detail?run_id=${id}`);
  };

  return (
    // <div className="min-h-screen bg-gray-50">
    //   <MainNavigation />


    // </div>

    <div className="ml-64 px-8 pt-8">
      {/* Breadcrumb */}
      <Breadcrumb className="mb-6">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={currentOrgId ? `/tester-zone?org_id=${currentOrgId}` : '/tester-zone'}>
                Bug Tracker
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator>
            <ChevronRight className="h-4 w-4" />
          </BreadcrumbSeparator>
          <BreadcrumbItem>
            <BreadcrumbPage>{testRun?.id}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="relative mb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 font-sora mb-2">
                {testRun?.name}
              </h1>
            </div>

            {/* Progress Circle next to name */}
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E5E7EB"
                    strokeWidth="2"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray={`${testRun?.progress || 0}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">{testRun?.progress || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Date and Project - Right Top Corner */}
          <div className="flex items-center gap-4">
            <Badge key={testRun?.creator} className="text-xs bg-purple-100 text-purple-800">
              {testRun?.creator}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-sm">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(testRun?.date).toLocaleDateString()}
            </Badge>
            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">{testRun?.project}</Badge>
          </div>

          {/* Right actions (Duplicate only) */}
          {/* <div className="ml-4 flex items-center gap-2">
            <Button
              onClick={handleNewBug}
              className="bg-tasksmate-gradient hover:scale-105 transition-transform flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>New Bug</span>
            </Button>
          </div> */}
        </div>
      </div>

      <BugBoardTab runId={testRun?.id} bugSummary={testRun?.summary} />

      {/* Tabs */}
      {/* <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="bug-board">Bug Board</TabsTrigger>
            </TabsList>

            {activeTab === 'bug-board' && (
              <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
                <Link to={`/tester-zone/runs/${testRun?.id}/bugs`}>
                  Open Bug Board
                </Link>
              </Button>
            )}
          </div>

          <TabsContent value="bug-board">
            <BugBoardTab runId={testRun?.id} />
          </TabsContent>
        </Tabs> */}
    </div>
  );
};

export default TestRunDetail;
