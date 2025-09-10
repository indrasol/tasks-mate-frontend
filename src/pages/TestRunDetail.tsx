
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
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import CopyableIdBadge from '@/components/ui/copyable-id-badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { API_ENDPOINTS } from '@/config';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { getPriorityColor, getStatusMeta } from '@/lib/projectUtils';
import { api } from '@/services/apiService';
import { TestRunTrackDetail } from '@/types/tracker';
import { Calendar, ChevronRight, Loader2, Pencil, RefreshCw, Save, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';


const TestRunDetail = () => {

  const { user, loading } = useAuth() || { user: null, loading: true } as const;
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Sync with sidebar collapse/expand events
  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    // Initialise based on current CSS var set by MainNavigation
    setSidebarCollapsed(
      getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem'
    );
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  const { id } = useParams();
  const currentOrgId = useCurrentOrgId();
  const { data: orgMembers = [] } = useOrganizationMembers(currentOrgId || '');  // Use empty string if undefined

  // Utility helpers -------------------------------------------------
  const priorityOptions = ["critical", "high", "medium", "low", "none"] as const;
  const statusOptions = [
    "in_progress",
    "completed",
    "archived",
    "not_started",
    "blocked",
    "on_hold",
  ] as const;

  // Mock data - replace with actual data fetching
  const [testRun, setTestRun] = useState<TestRunTrackDetail>();
  const [loadingTestRun, setLoadingTestRun] = useState(false);
  const [errorTestRun, setErrorTestRun] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [assignee, setAssignee] = useState('');

  const [trackerName, setTrackerName] = useState('');
  // Editing toggles
  const [isTitleEditing, setIsTitleEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchTestRun = async (isRefresh?: boolean) => {
    if (!id) return;
    if (!isRefresh) {
      setLoadingTestRun(true);
      setErrorTestRun('');
    }
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
        totalBugs: tracker?.total_bugs || 0,
        totalTasks: tracker?.total_tasks || 0,
        progress: tracker?.progress_percent || 0,
        date: new Date(tracker.created_at).toISOString().split('T')[0],
        assignedTo: [tracker?.creator_name],
        is_editable: true,
        summary: {
          total: tracker?.total_bugs || 0,
          high: tracker?.high_priority_bugs || 0,
          medium: tracker?.medium_priority_bugs || 0,
          low: tracker?.low_priority_bugs || 0,
          // critical: tracker.critical_priority_bugs || 0,
          // blocker: tracker.blocker_priority_bugs || 0,
          totalTasks: tracker?.total_tasks || 0,
          // highTasks: tracker.high_tasks || 0,
          // mediumTasks: tracker.medium_tasks || 0,
          // lowTasks: tracker.low_tasks || 0,
          // criticalTasks: tracker.critical_tasks || 0,
          // blockerTasks: tracker.blocker_tasks || 0,
        }
      };
      setTestRun(mapped);
      setTrackerName(tracker.name);
      setStatus(tracker.status);
      setPriority(tracker.priority);
      setAssignee(tracker.assignee);
      // setProjectId(tracker.project_id);
      // setStartDate(tracker.start_date);
      // setTargetDate(tracker.due_date);

    } catch (err) {
      if (!isRefresh) {
        setErrorTestRun(err instanceof Error ? err.message : "Failed to load tracker details");
        toast({
          title: "Error",
          description: err instanceof Error ? err.message : "Failed to load tracker details",
          variant: "destructive"
        });
        setTestRun(null);
      }
    }
    if (!isRefresh) setLoadingTestRun(false);
  };

  useEffect(() => {
    fetchTestRun();
  }, [id]);

  useEffect(() => {
    const handler = (e: any) => {
      fetchTestRun(false);
    };
    window.addEventListener('bug-created', handler);
    return () => window.removeEventListener('bug-created', handler);
  }, [fetchTestRun]);


  const handleSaveChanges = async (isPriorityChange?: string, isStatusChange?: string, isAssigneeChange?: string, isProjectChange?: string, isStartDateChange?: string, isTargetDateChange?: string, isTagsChange?: string[]) => {
    if (!id) return;
    try {
      const payload: any = {
        name: trackerName,
        status: isStatusChange ?? status,
        priority: isPriorityChange ?? priority,
        assignee: isAssigneeChange ?? assignee,
      };
      // if (isProjectChange || task?.project_id) payload.project_id = isProjectChange ?? task?.project_id;
      // if (isStartDateChange || task?.startDate) payload.start_date = toYMDLocal(fromYMDLocal(isStartDateChange ?? task.startDate) || new Date());
      // if (isTargetDateChange || task?.targetDate) payload.due_date = toYMDLocal(fromYMDLocal(isTargetDateChange ?? task.targetDate) || new Date());
      // if (isTagsChange || Array.isArray(task?.tags)) payload.tags = isTagsChange ?? task?.tags;
      toast({
        title: "Saving changes...",
        description: "Please wait while we save your changes.",
        variant: "default"
      });
      await api.put<any>(`${API_ENDPOINTS.TRACKERS}/${id}`, payload);
      toast({
        title: "Success",
        description: "Tracker changes saved successfully!",
        variant: "default"
      });
      setIsTitleEditing(false);
    } catch (err: any) {
      const msg = err?.message || (err?.detail ? String(err.detail) : 'Failed to save changes');
      toast({
        title: "Failed to save changes",
        description: msg,
        variant: "destructive"
      });
      fetchTestRun();
    }
  };


  const handleStatusChange = async (v: string) => {
    setStatus(v);
    setTestRun((prev: any) => ({ ...prev, status: v }));
    handleSaveChanges(null, v);
  };

  const handlePriorityChange = async (v: string) => {
    setPriority(v);
    setTestRun((prev: any) => ({ ...prev, priority: v }));
    handleSaveChanges(v, null);
  };

  // const handleAssigneeChange = async (v: string) => {
  //   setAssignee(v);
  //   setTask((prev: any) => ({ ...prev, assignee: v }));
  //   handleSaveChanges(null, null, v);
  // };

  // const handleProjectChange = async (v: string) => {
  //   setProjectId(v);
  //   setTask((prev: any) => ({ ...prev, project_id: v }));
  //   handleSaveChanges(null, null, null, v);
  // };

  // const handleStartDateChange = async (v: string) => {
  //   setStartDate(v);
  //   setTask((prev: any) => ({ ...prev, startDate: v }));
  //   handleSaveChanges(null, null, null, null, v);
  // };

  // const handleTargetDateChange = async (v: string) => {
  //   setTargetDate(v);
  //   setTask((prev: any) => ({ ...prev, targetDate: v }));
  //   handleSaveChanges(null, null, null, null, null, v);
  // };




  return (
    <div>
      {/* Header */}
      <header className="py-6 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="w-full">
          {
            errorTestRun ? (
              <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
                <p className="text-red-500 dark:text-red-400">Error loading Tracker <br></br> {errorTestRun}</p>
                <Button
                  className="bg-tasksmate-gradient hover:scale-105 transition-transform"
                  onClick={() => fetchTestRun(false)}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try again
                </Button>
              </div>
            ) :
              (loadingTestRun ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <p className="ml-2 text-gray-500">Loading tracker details...</p>
                </div>
              ) : (
                <div className="flex items-start justify-between space-x-3">
                  {/* Column with toggle + green bar */}
                  {/* {testRun?.is_editable && (
                  <div className="flex flex-col items-center">

                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all duration-200 ${status === 'completed'
                    ? 'bg-tasksmate-gradient border-transparent' : 'border-gray-300 hover:border-gray-400'}`}
                  onClick={handleStatusToggle}
                >
                  {status === 'completed' && <Check className="h-3 w-3 text-white" />}
                </div>
                <div className="w-1 h-10 rounded-full bg-green-500 mt-2"></div>
              </div>
            )} */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">

                      <CopyableIdBadge id={testRun?.id} org_id={currentOrgId} isCompleted={status === 'completed'} className="bg-orange-600 hover:bg-orange-700 text-white" copyLabel="Tracker" />

                      {/* <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-800">
                    {(() => {
                      const { displayName } = deriveDisplayFromEmail((testRun?.owner ?? '') as string);
                      return `👤 ${displayName}`;
                    })()}
                  </Badge> */}

                      <Badge key={testRun?.creator} className="text-xs bg-purple-100 text-purple-800">
                        {testRun?.creator}
                      </Badge>
                      <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-sm">
                        <Calendar className="w-4 h-4 mr-1" />
                        {new Date(testRun?.date).toLocaleDateString()}
                      </Badge>
                      <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">{testRun?.project}</Badge>

                      {/* <Select value={assignee} disabled={!testRun?.is_editable} onValueChange={handleAssigneeChange}>
                  <SelectTrigger className="h-6 px-2 bg-transparent border border-gray-200 rounded-full text-xs w-auto min-w-[6rem]">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {orgMembers?.map((m) => {
                      const username = ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id;
                      const { displayName } = deriveDisplayFromEmail(username);
                      return (
                        <SelectItem key={m.user_id} value={String(username)}>
                          {displayName} {m.designation ? `(${capitalizeFirstLetter(m.designation)})` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select> */}
                      {/* Status selector (moved from Details card) */}
                      <Select value={status} disabled={!testRun?.is_editable} onValueChange={handleStatusChange}>
                        <SelectTrigger className="h-6 px-2 bg-transparent border border-gray-200 rounded-full text-xs w-auto min-w-[6rem]">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {statusOptions.map((s) => (
                            <SelectItem key={s} value={s}>
                              <span className={`px-2 py-1 rounded-full text-xs ${getStatusMeta(s as any).color}`}>{getStatusMeta(s as any).label}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Priority selector (moved from Details card) */}
                      <Select value={priority} disabled={!testRun?.is_editable} onValueChange={handlePriorityChange}>
                        <SelectTrigger className="h-6 px-2 bg-transparent border border-gray-200 rounded-full text-xs w-auto min-w-[6rem]">
                          <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent align="start">
                          {priorityOptions.map((p) => (
                            <SelectItem key={p} value={p}>
                              <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(p)}`}>{p.toUpperCase()}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {/* Add delete button for tracker creators */}
                      {testRun?.is_editable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    title="Delete Tracker"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                    </div>
                    {/* Title */}
                    <div className="mt-2 flex items-start gap-2">
                      {isTitleEditing ? (
                        <div className="flex items-center gap-2 w-full">
                          <Input
                            value={trackerName}
                            onChange={(e) => setTrackerName(e.target.value)}
                            className={`text-2xl font-sora font-bold border-0 p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 ${status === 'completed' ? 'line-through text-gray-400' : ''}`}
                          />
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 ml-2"
                              onClick={async () => {
                                await handleSaveChanges();
                                setIsTitleEditing(false);
                              }}
                              title="Save title"
                            >
                              <Save className="h-4 w-4 text-green-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={async () => {
                                setIsTitleEditing(false);
                              }}
                              title="Cancel"
                            >
                              <X className="h-4 w-4 text-red-600" />
                            </Button>
                          </>
                        </div>
                      ) : (
                        <>
                          <span className={`text-2xl font-sora font-bold ${status === 'completed' ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>{trackerName}</span>
                          {/* <div className="flex items-center gap-3">
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
                    </div> */}
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setIsTitleEditing(true)} disabled={!testRun?.is_editable}>
                            <Pencil className="h-4 w-4 text-gray-500" />
                          </Button>
                        </>
                      )}
                    </div>


                  </div>

                </div>
              )

              )
          }

        </div>
      </header>

      <main className="py-2">
        <div className="w-full">
          <BugBoardTab runId={testRun?.id} bugSummary={testRun?.summary} />
        </div>
      </main>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this tracker?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the tracker and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={async () => {
              try {
                toast({
                  title: "Deleting tracker...",
                  description: "Please wait while we delete the tracker.",
                  variant: "default"
                });
                
                await api.del(`${API_ENDPOINTS.TRACKERS}/${id}`);
                
                toast({
                  title: "Success",
                  description: "Tracker deleted successfully!",
                  variant: "default"
                });
                
                // Navigate back to the trackers list
                // Refresh the tracker list
                const event = new CustomEvent('tracker-created');
                window.dispatchEvent(event);
                navigate(currentOrgId ? `/tester-zone?org_id=${currentOrgId}` : '/tester-zone');
              } catch (err: any) {
                const msg = err?.message || (err?.detail ? String(err.detail) : 'Failed to delete tracker');
                toast({
                  title: "Failed to delete tracker",
                  description: msg,
                  variant: "destructive"
                });
              }
            }}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TestRunDetail;
