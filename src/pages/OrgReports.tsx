import MainNavigation from '@/components/navigation/MainNavigation';
import ReportsTab from '@/components/ReportsTab';
import TimesheetTab from '@/components/TimesheetTab';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { API_ENDPOINTS } from '@/config';
import { api } from '@/services/apiService';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from "@/hooks/useAuth";
import { useCurrentOrgId } from "@/hooks/useCurrentOrgId";
import { useOrganizationMembers } from "@/hooks/useOrganizationMembers";
import { deriveDisplayFromEmail } from '@/lib/projectUtils';
import { BackendOrgMember } from '@/types/organization';


import { Button } from '@/components/ui/button';
// import { Search } from 'lucide-react';
// import { X } from 'lucide-react';
// import { RefreshCw } from 'lucide-react';


const OrgReports: React.FC = () => {

  const { user, loading } = useAuth();

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

  const navigate = useNavigate();

  // Handle authentication and loading
  useEffect(() => {
    if (!loading && !user) {
      navigate('/', {
        state: {
          redirectTo: location.pathname + location.search
        },
        replace: true
      });
    }
  }, [user, loading, navigate]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // const [searchParams, setSearchParams] = useSearchParams();
  const currentOrgId = useCurrentOrgId();

  // Use currentOrgId as fallback if orgId is not in URL
  // const orgId = useMemo(() => {
  //   const urlOrgId = searchParams.get('org_id');
  //   return urlOrgId || currentOrgId || '';
  // }, [searchParams, currentOrgId]);

  const { data: orgMembersRaw } = useOrganizationMembers(currentOrgId);

  // Real organization members (without dummy data) for dropdowns and filters
  const realOrgMembers: BackendOrgMember[] = useMemo(() => {
    try {
      if (!orgMembersRaw) return [];

      return orgMembersRaw.map((m: any) => ({
        ...m,
        name: ((m as any)?.username) || (m.email ? m.email.split("@")[0] : undefined) || m.user_id,
      })).map((m: any) => ({
        ...m,
        displayName: deriveDisplayFromEmail(m.name).displayName,
        initials: deriveDisplayFromEmail(m.name).initials,
      }));
      // return [];
    } catch (error) {
      console.error('Error processing real orgMembers:', error);
      return [];
    }
  }, [orgMembersRaw]);

  // Use real organization members only (no dummy data needed)
  // const orgMembers: BackendOrgMember[] = useMemo(() => {
  //   try {
  //     return realOrgMembers;
  //   } catch (error) {
  //     console.error('Error processing orgMembers:', error);
  //     return [];
  //   }
  // }, [realOrgMembers]);

  const [projects, setProjects] = useState<{ id: string; name: string; members: string[] }[]>([]);
  const fetchProjects = async () => {
    if (!currentOrgId) return;
    try {
      const res = await api.get<any[]>(`${API_ENDPOINTS.PROJECTS}/${currentOrgId}?show_all=true`);
      const mapped = res.map((p: any) => ({ id: p.project_id, name: p.name || p.project_name, members: p.team_members ?? [], owner: p.owner ?? "" }));
      setProjects(mapped);
      console.log('projects', mapped);
    } catch (e) {
      console.error("Failed to fetch projects", e);
    }
  };
  useEffect(() => {
    fetchProjects();
  }, [currentOrgId]);

  const [activeTab, setActiveTab] = useState<'reports' | 'timesheets'>('timesheets');

  // Memoize projects and realOrgMembers to prevent unnecessary ReportsTab re-renders
  const memoizedProjects = useMemo(() => projects, [projects]);
  const memoizedRealOrgMembers = useMemo(() => realOrgMembers, [realOrgMembers]);

  // // Reports tab state
  // const [reportsSearchQuery, setReportsSearchQuery] = useState('');
  // const [reportsSearchFocused, setReportsSearchFocused] = useState(false);

  // const [exportCSV, setExportCSV] = useState(false);
  // const [exportJSON, setExportJSON] = useState(false);
  // const [fetchReport, setFetchReport] = useState(false);
  // const [isReportFetching, setIsReportFetching] = useState(false);
  // const [isReportAvailable, setIsReportAvailable] = useState(false);

  // // Timesheets tab state
  // const [timesheetsSearchQuery, setTimesheetsSearchQuery] = useState('');
  // const [timesheetsSearchFocused, setTimesheetsSearchFocused] = useState(false);
  // const [timesheetRefreshSignal, setTimesheetRefreshSignal] = useState(0);

  try {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-900">
        <style>
          {`
        .thin-scroll {
          scrollbar-width: thin; /* Firefox */
          scrollbar-color: rgba(156,163,175,0.6) transparent; /* thumb track */
        }
        .thin-scroll::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .thin-scroll::-webkit-scrollbar-thumb {
          background-color: rgba(156,163,175,0.6); /* gray-400 */
          border-radius: 9999px;
        }
        .thin-scroll::-webkit-scrollbar-track {
          background: transparent;
        }
        `}
        </style>
        <MainNavigation />
        <div className="w-full px-6 py-8 h-full overflow-hidden flex flex-col" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pulse</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">Insights into your organization's performance and team activity</p>
          </div>

          <Tabs value={activeTab} onValueChange={v => {
            setActiveTab(v as any);
            // Don't sync search queries between tabs - keep them separate
          }} className="flex flex-col flex-1 overflow-hidden">
            {/* Tabs for Reports / Timesheets */}
            <div className="px-0 pb-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <TabsList>
                    <TabsTrigger value="timesheets">Work Summary</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>

                  </TabsList>


                </div>

                {/* Action Buttons */}

              </div>
            </div>
            <TabsContent value="reports" className={`flex flex-col md:flex-row gap-4 flex-1 overflow-hidden mt-0 h-0 ${activeTab === 'reports' ? 'min-h-full' : ''}`}>
              {React.useMemo(() => (
                <ReportsTab
                  orgId={currentOrgId}
                  projectsFromParent={memoizedProjects}
                  realOrgMembers={memoizedRealOrgMembers}
                // fetchProjects={fetchProjects}
                // searchQuery={reportsSearchQuery}
                // setSearchQuery={setReportsSearchQuery}
                // isSearchFocused={reportsSearchFocused}
                // setIsSearchFocused={setReportsSearchFocused}
                // exportCSV={exportCSV}
                // setExportCSV={setExportCSV}
                // exportJSON={exportJSON}
                // setExportJSON={setExportJSON}
                // fetchReport={fetchReport}
                // setFetchReport={setFetchReport}
                // isReportFetching={isReportFetching}
                // setIsReportFetching={setIsReportFetching}
                // isReportAvailable={isReportAvailable}
                // setIsReportAvailable={setIsReportAvailable}
                />
              ), [currentOrgId, memoizedProjects, memoizedRealOrgMembers])}
            </TabsContent>

            <TabsContent value="timesheets" className={`flex flex-1 overflow-hidden mt-0 h-0 ${activeTab === 'timesheets' ? 'min-h-full' : ''}`}>
              {React.useMemo(() => (
                <TimesheetTab
                  orgId={currentOrgId}
                  projectsFromParent={memoizedProjects}
                  realOrgMembers={memoizedRealOrgMembers}
                  fetchProjects={fetchProjects}
                // searchQuery={timesheetsSearchQuery}
                // setSearchQuery={setTimesheetsSearchQuery}
                // isSearchFocused={timesheetsSearchFocused}
                // setIsSearchFocused={setTimesheetsSearchFocused}
                // refreshSignal={timesheetRefreshSignal}
                />
              ), [currentOrgId, memoizedProjects, memoizedRealOrgMembers])}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering OrgReports component:', error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <MainNavigation />
        <div className="w-full px-6 py-8 h-full overflow-hidden flex flex-col" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
          <div className="text-center p-4 items-center justify-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">There was an error rendering the reports page.</p>
            <Button onClick={() => window.location.reload()}>Reload Page</Button>
          </div>
        </div>
      </div>
    );
  }
};

export default OrgReports;