import MainNavigation from '@/components/navigation/MainNavigation';
import OrganizationProfileTab from '@/components/OrganizationProfileTab';
import { useAuth } from '@/hooks/useAuth';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { deriveDisplayFromEmail } from '@/lib/projectUtils';
import { BackendOrgMember } from '@/types/organization';
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const OrganizationProfile: React.FC = () => {
  const { user, loading } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  // Sync with sidebar collapse/expand events
  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    // Initialize based on current CSS var set by MainNavigation
    setSidebarCollapsed(
      getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem'
    );
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

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

  const currentOrgId = useCurrentOrgId();
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
    } catch (error) {
      console.error('Error processing real orgMembers:', error);
      return [];
    }
  }, [orgMembersRaw]);

  const memoizedRealOrgMembers = useMemo(() => realOrgMembers, [realOrgMembers]);

  // Determine if user can edit organization profile (owners and admins only)
  const canEditProfile = useMemo(() => {
    if (!user || !memoizedRealOrgMembers) return false;
    const currentUserMember = memoizedRealOrgMembers.find((m) => m.user_id === user.id);
    return currentUserMember?.role === 'owner' || currentUserMember?.role === 'admin';
  }, [user, memoizedRealOrgMembers]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      <MainNavigation />
      <div 
        className="flex-1 transition-all duration-300 overflow-hidden" 
        style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}
      >
        <div className="px-6 py-8 h-full overflow-hidden flex flex-col">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Organization Profile</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-2">
              Define your organization's mission, vision, values, and company details
            </p>
          </div>

          {/* Organization Profile Content */}
          <div className="flex-1 overflow-hidden">
            {React.useMemo(() => (
              <OrganizationProfileTab
                orgId={currentOrgId}
                canEdit={canEditProfile || false}
              />
            ), [currentOrgId, canEditProfile])}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfile;
