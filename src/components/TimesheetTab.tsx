// React and hooks
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DateRange } from 'react-day-picker';

// UI Components
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Icons
import {
  AlertTriangle,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Eye,
  Folder,
  Loader2,
  Maximize2,
  Plus,
  Save,
  Users,
  X
} from 'lucide-react';

// Services and utilities
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { deriveDisplayFromEmail } from '@/lib/projectUtils';
import {
  convertEntriesToText,
  formatDateForAPI,
  getTeamTimesheets,
  TeamTimesheetUser,
  updateTimesheetField,
  UserTimesheetFieldUpdate
} from '@/services/userTimesheetService';
import { BackendOrgMember } from '@/types/organization';
// import { useProjectMembers, BackendProjectMember } from '@/hooks/useProjectMembers';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

interface TimesheetTabProps {
  orgId: string;
  projectsFromParent: any[];
  realOrgMembers: BackendOrgMember[];
  fetchProjects: () => void;
  // Props similar to ReportsTab for unified header controls
  // searchQuery: string;
  // setSearchQuery: (query: string) => void;
  // isSearchFocused: boolean;
  // setIsSearchFocused: (focused: boolean) => void;
  // // Signal from parent to refresh timesheets
  // refreshSignal: number;
}

// type TimesheetSortType = 'productivity' | 'alphabetical' | 'hours' | 'name';

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const TimesheetTab: React.FC<TimesheetTabProps> = ({
  orgId,
  projectsFromParent,
  realOrgMembers,
  fetchProjects,
  // unified header controls from parent (not directly used here yet)
  // searchQuery: _searchQuery,
  // setSearchQuery: _setSearchQuery,
  // isSearchFocused: _isSearchFocused,
  // setIsSearchFocused: _setIsSearchFocused,
  // refreshSignal
}) => {
  // ============================================================================
  // AUTHENTICATION AND ROLE MANAGEMENT
  // ============================================================================

  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Cache for date-specific timesheet data - moved up to avoid hoisting issues
  const [dateSpecificData, setDateSpecificData] = useState<Record<string, any>>({});

  // Existing state...
  const [projects, setProjects] = useState<any[]>([]);
  const [isProjectsLoading, setIsProjectsLoading] = useState<boolean>(false);

  // Editing state management like Goals table
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editedData, setEditedData] = useState<Record<string, any>>({});

  // Add function to get timesheet content for a user and date
  const getTimesheetContent = useCallback((user: TeamTimesheetUser, date: Date, type: 'in_progress' | 'blocked' | 'completed') => {
    // First, try to get data from dateSpecificData cache
    const dateKey = `${formatDateForAPI(date)}-${user.user_id}`;
    const cachedData = dateSpecificData[dateKey];

    if (cachedData?.users?.length > 0) {
      const userData = cachedData.users[0];
      const content = userData[type] || [];

      if (Array.isArray(content) && content.length > 0) {
        return convertEntriesToText(content);
      }
    }

    // Fallback to user object data (if available)
    const content = user[type] || [];
    if (Array.isArray(content) && content.length > 0) {
      return convertEntriesToText(content);
    }

    return '';
  }, [dateSpecificData]);

  // Add function to handle save with backend integration
  const handleSaveRow = useCallback(async (rowId: string, user: TeamTimesheetUser, date: Date) => {
    if (!editedData[rowId]) return;



    try {
      const userId = user.user_id;
      const dateStr = formatDateForAPI(date);

      toast({ title: 'Saving timesheet entry...', description: 'User: ' + user.avatar_initials + ' - Date: ' + dateStr });

      // Save each field sequentially to avoid race conditions
      let fieldsToSave = [];

      // Check for existing data and remove redundant saving if content is not changed
      if (editedData[rowId].in_progress) {
        fieldsToSave.push({ type: 'in_progress' as const, content: editedData[rowId].in_progress });
      }
      if (editedData[rowId].blocked) {
        fieldsToSave.push({ type: 'blocked' as const, content: editedData[rowId].blocked });
      }
      if (editedData[rowId].completed) {
        fieldsToSave.push({ type: 'completed' as const, content: editedData[rowId].completed });
      }

      for (const field of fieldsToSave) {
        if (field.content !== undefined) {
          await updateTimesheetField({
            org_id: orgId,
            user_id: userId,
            entry_date: dateStr,
            field_type: field.type,
            field_content: field.content || ''
          });

          // Small delay to prevent race conditions
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Update the cached data with the new values
      const dateKey = `${dateStr}-${userId}`;
      setDateSpecificData(prev => {
        const existing = prev[dateKey] || { users: [{ user_id: userId }] };
        const userData = existing.users[0] || { user_id: userId };

        // Update the user data with new values
        const updatedUserData = {
          ...userData,
          in_progress: editedData[rowId].in_progress ? [{ id: 'temp-id', title: editedData[rowId].in_progress }] : [],
          blocked: editedData[rowId].blocked ? [{ id: 'temp-id', title: editedData[rowId].blocked }] : [],
          completed: editedData[rowId].completed ? [{ id: 'temp-id', title: editedData[rowId].completed }] : []
        };

        return {
          ...prev,
          [dateKey]: {
            ...existing,
            users: [updatedUserData]
          }
        };
      });

      // Remove from editing state
      const newEditingRows = new Set(editingRows);
      newEditingRows.delete(rowId);
      setEditingRows(newEditingRows);

      // Clear edited data
      const newEditedData = { ...editedData };
      delete newEditedData[rowId];
      setEditedData(newEditedData);

      toast({ title: 'Status updated successfully' });

      // Force refresh the data for this user and date
      fetchedDataRef.current.delete(dateKey);

      // Refetch the data to get the latest from backend
      try {
        const refreshedData = await getTeamTimesheets(
          orgId,
          dateStr,
          [userId]
        );
        setDateSpecificData(prev => ({ ...prev, [dateKey]: refreshedData }));
      } catch (error) {
        console.error('Error refreshing data after save:', error);
      }

    } catch (error) {
      console.error('Error saving timesheet:', error);
      toast({
        title: 'Failed to save status',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive'
      });
    }
  }, [editedData, editingRows, orgId, toast, dateSpecificData]);

  // Expand dialog states
  const [expandedContent, setExpandedContent] = useState<{ type: 'in_progress' | 'blocked' | 'completed'; content: string; rowId: string } | null>(null);

  // Determine current user's role in the organization
  const currentUserOrgRole = useMemo(() => {
    if (!user || !realOrgMembers) return null;
    const currentUserMember = realOrgMembers?.find((m) => m.user_id === user.id);
    return currentUserMember?.role || null;
  }, [user, realOrgMembers]);


  // // Role-based permission checks for timesheet editing only
  // const canEditAllMemberTimesheets = useMemo(() => {
  //   return currentUserOrgRole === 'owner' || currentUserOrgRole === 'admin';
  // }, [currentUserOrgRole]);

  // const canEditOwnTimesheet = useMemo(() => {
  //   return currentUserOrgRole === 'member' || currentUserOrgRole === 'admin' || currentUserOrgRole === 'owner';
  // }, [currentUserOrgRole]);

  // ============================================================================
  // REUSABLE ROLE AND PERMISSION COMPUTATIONS (OPTIMIZED)
  // ============================================================================

  // Pre-computed role checks to avoid repetition throughout the component
  const roleChecks = useMemo(() => {
    const isOrgOwner = currentUserOrgRole === 'owner';
    const isOrgAdmin = currentUserOrgRole === 'admin';
    const isOrgMember = currentUserOrgRole === 'member';
    const isOrgAdminOrOwner = isOrgAdmin || isOrgOwner;

    return {
      isOrgOwner,
      isOrgAdmin,
      isOrgMember,
      isOrgAdminOrOwner
    };
  }, [currentUserOrgRole]);

  // // Project-specific role detection functions
  // const getProjectRole = useCallback((projectId: string) => {
  //   if (!user) return null;

  //   const project = projects?.find(p => p.id === projectId || p.project_id === projectId);
  //   if (!project) return null;

  //   // Check if user is the project owner
  //   if (project?.owner === user.id) {
  //     return 'owner';
  //   }

  //   // Check if user is a project member
  //   if (project?.members?.includes(user.id)) {
  //     return 'member';
  //   }

  //   // If user is org admin/owner, they have admin access to all projects
  //   if (roleChecks?.isOrgAdminOrOwner) {
  //     return 'admin';
  //   }

  //   return null;
  // }, [user, projects, roleChecks.isOrgAdminOrOwner]);

  // const isProjectOwner = useCallback((projectId: string) => {
  //   return getProjectRole(projectId) === 'owner';
  // }, [getProjectRole]);

  // const isProjectMember = useCallback((projectId: string) => {
  //   const role = getProjectRole(projectId);
  //   return role === 'member' || role === 'owner';
  // }, [getProjectRole]);

  // const isProjectAdmin = useCallback((projectId: string) => {
  //   const role = getProjectRole(projectId);
  //   return role === 'admin' || role === 'owner';
  // }, [getProjectRole]);

  // User-specific role checking functions (for checking other users' roles)
  const getUserProjectRole = useCallback((userId: string, projectId: string) => {
    const project = projects?.find(p => p.id === projectId);
    if (!project) return null;

    // Check if user is the project owner
    if (project?.owner === userId) {
      return 'owner';
    }

    // Check if user is a project member
    if (project?.members?.includes(userId)) {
      return 'member';
    }

    // Note: We don't check org admin/owner for other users here
    // as that would require additional context about their org role
    return null;
  }, [projects]);

  const isUserProjectMember = useCallback((userId: string, projectId: string) => {
    const role = getUserProjectRole(userId, projectId);
    return role === 'member' || role === 'owner';
  }, [getUserProjectRole]);

  // const isUserProjectAdmin = useCallback((userId: string, projectId: string) => {
  //   // For other users, we only check direct project roles
  //   // Since getUserProjectRole doesn't return 'admin' for other users,
  //   // we only check for 'owner' (owners have admin-like permissions)
  //   const role = getUserProjectRole(userId, projectId);
  //   return role === 'owner';
  // }, [getUserProjectRole]);

  // const isUserProjectOwner = useCallback((userId: string, projectId: string) => {
  //   return getUserProjectRole(userId, projectId) === 'owner';
  // }, [getUserProjectRole]);

  // // Helper function to get user's role in a specific project (legacy - use getProjectRole instead)
  // const getUserProjectRoleForProject = useMemo(() => {
  //   return (projectId: string) => {
  //     return getProjectRole(projectId);
  //   };
  // }, [getProjectRole]);



  // // Check if user can view timesheet data for projects they're part of (PROJECT-SPECIFIC)
  // const canViewProjectTimesheets = useMemo(() => {
  //   return (projectId: string) => {
  //     if (!user) return false;

  //     // Get user's effective role in this specific project
  //     const projectRole = getUserProjectRoleForProject(projectId);
  //     // Use pre-computed role check

  //     // Determine effective project role: Org Admin/Owner = Project Admin/Owner
  //     const effectiveProjectRole = roleChecks.isOrgAdminOrOwner ? 'admin' : projectRole;

  //     // Project Owner/Admin/Member: Can view timesheets for projects they have roles in
  //     if (effectiveProjectRole === 'owner' || effectiveProjectRole === 'admin' || effectiveProjectRole === 'member') {
  //       return true;
  //     }

  //     // No project role: No access to view project timesheets
  //     return false;
  //   };
  // }, [user, getUserProjectRoleForProject, roleChecks.isOrgAdminOrOwner]);
  // ============================================================================
  // REUSABLE COMPONENTS
  // ============================================================================

  // Memoized Calendar Grid Component
  // const CalendarGrid = memo(({
  //   user,
  //   currentMonth,
  //   weeks,
  //   selectedCalendarDate,
  //   onDateClick,
  //   getDateSummary,
  //   getDateStatusIcon,
  //   isLoading
  // }: {
  //   user: any;
  //   currentMonth: number;
  //   weeks: Date[][];
  //   selectedCalendarDate: Date | undefined;
  //   onDateClick: (date: Date) => void;
  //   getDateSummary: (date: Date, user: any) => any;
  //   getDateStatusIcon: (date: Date, user: any) => JSX.Element;
  //   isLoading?: boolean;
  // }) => (
  //   <div className="relative grid grid-cols-7 border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden" style={{
  //     gridTemplateRows: `repeat(${weeks.length}, 1fr)`,
  //     height: `${weeks.length * 60}px`,
  //     minHeight: `${weeks.length * 60}px`
  //   }}>
  //     {weeks.map((week, weekIndex) => (
  //       week.map((date, dayIndex) => {
  //         const isToday = date.toDateString() === new Date().toDateString();
  //         const isSelected = selectedCalendarDate && date.toDateString() === selectedCalendarDate.toDateString();
  //         const isCurrentMonth = date.getMonth() === currentMonth;
  //         const isFutureDate = date > new Date();
  //         const dayNumber = date.getDate();
  //         const isLastColumn = dayIndex === 6;
  //         const isLastRow = weekIndex === weeks.length - 1;

  //         return (
  //           <button
  //             key={`${weekIndex}-${dayIndex}`}
  //             onClick={() => isCurrentMonth && !isFutureDate && onDateClick(date)}
  //             className={`
  //               relative w-full h-full min-h-[60px] 
  //               flex items-center justify-center transition-all duration-200
  //               ${!isLastColumn ? 'border-r border-gray-200 dark:border-gray-600' : ''}
  //               ${!isLastRow ? 'border-b border-gray-200 dark:border-gray-600' : ''}
  //               ${isSelected
  //                 ? 'bg-green-100 text-green-800 border-2 border-green-300 shadow-sm'
  //                 : isToday && isCurrentMonth
  //                   ? 'bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400'
  //                   : isCurrentMonth && !isFutureDate
  //                     ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
  //                     : isCurrentMonth && isFutureDate
  //                       ? 'bg-gray-100 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
  //                       : 'bg-gray-50 dark:bg-gray-900 text-gray-400 dark:text-gray-500 cursor-default'
  //               }
  //             `}
  //             disabled={!isCurrentMonth || isFutureDate}
  //           >
  //             {/* Day Number */}
  //             <span className={`text-xs font-medium ${isSelected
  //               ? 'text-green-800 font-semibold'
  //               : isToday && isCurrentMonth
  //                 ? 'text-green-600 dark:text-green-400 font-semibold'
  //                 : isCurrentMonth && !isFutureDate
  //                   ? 'text-gray-900 dark:text-gray-100'
  //                   : 'text-gray-400 dark:text-gray-500'
  //               }`}>
  //               {dayNumber}
  //             </span>

  //             {/* Status Indicator - Show for all valid dates (current month, non-future) */}
  //             {isCurrentMonth && !isFutureDate && (
  //               <div className="absolute bottom-1 right-1">
  //                 {getDateStatusIcon(date, user)}
  //               </div>
  //             )}

  //             {/* Loading indicator on selected cell while fetching */}
  //             {isSelected && isLoading && (
  //               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
  //                 <div className="bg-white/60 dark:bg-gray-900/40 rounded-full p-1">
  //                   <Loader2 className="w-4 h-4 animate-spin text-green-700 dark:text-green-300" />
  //                 </div>
  //               </div>
  //             )}
  //           </button>
  //         );
  //       })
  //     ))}

  //     {/* Small header spinner on the grid while fetching */}
  //     {isLoading && (
  //       <div className="absolute top-1 right-1">
  //         <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-300" />
  //       </div>
  //     )}
  //   </div>
  // ));

  // Memoized Reusable Timesheet Textarea Component
  // const TimesheetTextarea = memo(({
  //   user: timesheetUser,
  //   type,
  //   color,
  //   placeholder,
  //   selectedDate
  // }: {
  //   user: any;
  //   type: 'in_progress' | 'blocked' | 'completed';
  //   color: 'blue' | 'red' | 'green';
  //   placeholder: string;
  //   selectedDate: Date | undefined;
  // }) => {
  //   // Permission checks - simplified for user-centric approach  
  //   const canEdit = timesheetUser.user_id === user?.id || ['admin', 'owner'].includes(currentUserOrgRole || '');
  //   // const isRestricted = isDateRestrictedForEditing && currentUserOrgRole === 'member';
  //   const isRestricted = (currentUserOrgRole === 'member');

  //   const textareaRef = useRef<HTMLTextAreaElement>(null);

  //   // Build field keys for new API
  //   const savingKey = `${timesheetUser.user_id}-${type}`;
  //   const draftDatePart = selectedDate ? formatDateForAPI(selectedDate) : 'unknown-date';
  //   const fieldKey = `${timesheetUser.user_id}-${type}-${draftDatePart}`;
  //   const isSaving = savingFields.has(savingKey);

  //   // Get initial value from user data (new structure)
  //   const getInitialValue = () => {
  //     // If we have a draft for this field/date, use it
  //     if (Object.prototype.hasOwnProperty.call(fieldDrafts, fieldKey)) {
  //       return fieldDrafts[fieldKey] ?? '';
  //     }

  //     // Check if we have saved content for this specific field/date combination
  //     if (savedContentByField[fieldKey]) {
  //       return savedContentByField[fieldKey];
  //     }

  //     // For dates other than the currently selected date, check if we have cached data
  //     // if (selectedDate && selectedTimesheetDate) {
  //     //   const selectedDateStr = formatDateForAPI(selectedDate);
  //     //   const currentDateStr = formatDateForAPI(selectedTimesheetDate);

  //     //   // If this is not the current date, try to get data from cache or return empty
  //     //   if (selectedDateStr !== currentDateStr) {
  //     //     // Check if we have cached data for this specific date
  //     //     const cachedKey = `${timesheetUser.user_id}-${type}-${selectedDateStr}`;
  //     //     return savedContentByField[cachedKey] || '';
  //     //   }
  //     // }

  //     // Get data from user timesheet entries (only for the current selected date)
  //     let entries = [];
  //     if (type === 'in_progress') {
  //       entries = timesheetUser.in_progress || [];
  //     } else if (type === 'blocked') {
  //       entries = timesheetUser.blocked || [];
  //     } else if (type === 'completed') {
  //       entries = timesheetUser.completed || [];
  //     }

  //     // Convert entries to text format
  //     return convertEntriesToText(entries);
  //   };

  //   // When the field identity changes or a draft reset is requested, restore the DOM value
  //   useEffect(() => {
  //     if (textareaRef.current) {
  //       const nextVal = fieldDrafts[fieldKey] ?? getInitialValue();
  //       textareaRef.current.value = nextVal;
  //     }
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [fieldKey, draftResetCounter]);

  //   // Controlled content to prevent clearing on save
  //   const [content, setContent] = useState<string>(() => fieldDrafts[fieldKey] ?? getInitialValue());

  //   // Reset content only when the identity of the field changes
  //   useEffect(() => {
  //     setContent(fieldDrafts[fieldKey] ?? getInitialValue());
  //     // eslint-disable-next-line react-hooks/exhaustive-deps
  //   }, [timesheetUser.user_id, type, selectedDate?.toDateString()]);

  //   const handleSave = async () => {
  //     if (!canEdit) {
  //       toast({
  //         title: 'Access Denied',
  //         description: isRestricted ? 'You cannot edit future dates' : 'You do not have permission to edit this timesheet',
  //         variant: 'destructive'
  //       });
  //       return;
  //     }

  //     const value = textareaRef.current?.value || '';

  //     // Save the timesheet data using new API with the specific date
  //     await saveTimesheetData(timesheetUser.user_id, type, value, selectedDate);

  //     // Update local draft for this specific field and date
  //     setFieldDrafts(prev => ({ ...prev, [fieldKey]: value }));

  //     // Update saved content cache for this specific field and date
  //     setSavedContentByField(prev => ({ ...prev, [fieldKey]: value }));

  //     setContent(value);
  //   };

  //   // Auto-resize textarea based on content
  //   const autoResize = useCallback(() => {
  //     if (textareaRef.current) {
  //       textareaRef.current.style.height = 'auto';
  //       textareaRef.current.style.height = `${Math.max(80, textareaRef.current.scrollHeight)}px`;
  //     }
  //   }, []);

  //   // Auto-resize when content changes
  //   useEffect(() => {
  //     autoResize();
  //   }, [content, autoResize]);

  //   // Handle input changes with auto-resize
  //   const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
  //     setContent(e.target.value);
  //     autoResize();
  //   };

  //   return (
  //     <div className="h-full flex flex-col space-y-2" key={`${fieldKey}-${draftResetCounter}`}>
  //       <div className={`relative flex-1 bg-white dark:bg-gray-800 rounded-lg border border-${color}-200 dark:border-${color}-600 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden`}>
  //         <textarea
  //           ref={textareaRef}
  //           className={`w-full h-full p-3 bg-transparent border-none outline-none resize-none text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg transition-all duration-200 ${isSaving ? 'cursor-not-allowed opacity-60' : 'cursor-text caret-gray-800 dark:caret-gray-100 hover:bg-gray-50/50 dark:hover:bg-gray-700/30'}`}
  //           placeholder={canEdit ? placeholder : `View-only: ${timesheetUser.name || 'User'}'s timesheet data`}
  //           readOnly={!canEdit}
  //           disabled={isSaving}
  //           aria-busy={isSaving}
  //           defaultValue={getInitialValue()}
  //           style={{ minHeight: '80px', maxHeight: '150px' }}
  //           rows={2}
  //           onChange={handleInputChange}
  //           onKeyDown={(e) => {
  //             // Auto-save on Ctrl/Cmd + Enter
  //             if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && canEdit && !isSaving) {
  //               e.preventDefault();
  //               handleSave();
  //             }
  //           }}
  //         />
  //         {isSaving && (
  //           <div className="absolute inset-0 bg-white/70 dark:bg-gray-900/60 backdrop-blur-sm rounded-lg flex items-center justify-center">
  //             <div className="flex items-center text-gray-700 dark:text-gray-200 text-xs font-medium">
  //               <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  //               Saving...
  //             </div>
  //           </div>
  //         )}
  //         {/* Character counter for better UX */}
  //         {canEdit && !isSaving && (
  //           <div className="absolute bottom-1 right-1 text-xs text-gray-400 dark:text-gray-500 pointer-events-none">
  //             {content.length}/1000
  //           </div>
  //         )}
  //       </div>
  //       <div className="flex justify-end">
  //         <Button
  //           variant="outline"
  //           size="sm"
  //           className={`text-xs h-8 px-3 transition-all duration-200 ${!canEdit || isSaving 
  //             ? 'opacity-50 cursor-not-allowed bg-gray-100 dark:bg-gray-700' 
  //             : `hover:bg-${color}-50 dark:hover:bg-${color}-900/20 active:scale-95`}`}
  //           onClick={handleSave}
  //           disabled={!canEdit || isSaving}
  //           title={!canEdit ? (isRestricted ? 'You cannot edit future dates' : 'You do not have permission to edit this timesheet') : 'Save changes (Ctrl/Cmd + Enter)'}
  //         >
  //           {isSaving ? (
  //             <>
  //               <Loader2 className="w-3 h-3 mr-1 animate-spin" />
  //               Saving...
  //             </>
  //           ) : !canEdit ? (
  //             <>
  //               <Eye className="w-3 h-3 mr-1" />
  //               View Only
  //             </>
  //           ) : (
  //             <>
  //               <Save className="w-3 h-3 mr-1" />
  //               Save
  //             </>
  //           )}
  //         </Button>
  //       </div>
  //     </div>
  //   );
  // });

  // Reusable Member Filtering Logic
  const getFilteredMembers = useCallback(() => {
    if (!realOrgMembers) return [];

    return realOrgMembers?.filter(member => {
      // Org Admins/Owners: Can see all members
      if (roleChecks.isOrgAdminOrOwner) {
        return true;
      }

      // Regular Members: Can see all organization members for timesheet purposes
      // This promotes transparency and collaboration while editing permissions are still controlled
      if (currentUserOrgRole === 'member') {
        return true;
      }

      // Unknown role or no role: Show only themselves as fallback
      return member.user_id === user?.id;
    })?.sort((a, b) => a.displayName?.localeCompare(b.displayName));
  }, [realOrgMembers, roleChecks.isOrgAdminOrOwner, currentUserOrgRole, user?.id]);


  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  // Filter and Search State
  // const [timesheetSearchQuery, setTimesheetSearchQuery] = useState('');
  // const [selectedTimesheetUsers, setSelectedTimesheetUsers] = useState<string[]>([]);
  const [selectedTimesheetProjects, setSelectedTimesheetProjects] = useState<string[]>([]);
  // const [timesheetDateRange, setTimesheetDateRange] = useState<DateRange | undefined>(undefined);
  // const [tempTimesheetDateRange, setTempTimesheetDateRange] = useState<DateRange | undefined>(undefined);
  // const [isTimesheetDatePopoverOpen, setIsTimesheetDatePopoverOpen] = useState(false);

  // Detail view date range state
  const [detailDateRange, setDetailDateRange] = useState<DateRange | undefined>(() => {
    const today = new Date();
    // const weekAgo = new Date(today);
    // weekAgo.setDate(today.getDate() - 7);
    return { from: today, to: today };
  });
  const [tempDetailDateRange, setTempDetailDateRange] = useState<DateRange | undefined>(detailDateRange);
  const [isDetailDatePopoverOpen, setIsDetailDatePopoverOpen] = useState(false);

  // Scroll state for modern scroll indicators
  const [showScrollIndicator, setShowScrollIndicator] = useState(false);
  const [isNearBottom, setIsNearBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Collapsible member cards state
  const [collapsedMembers, setCollapsedMembers] = useState<Set<string>>(new Set());

  // Member filter state - 'all' means show all members, specific userId means show only that member
  const [selectedMemberFilter, setSelectedMemberFilter] = useState<string>('all');

  // UI State
  // const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);
  // const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  // const [timesheetSort, setTimesheetSort] = useState<TimesheetSortType>('name');
  // const [selectedTimesheetDate, setSelectedTimesheetDate] = useState<Date | undefined>(new Date());
  // const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set());
  const [activeEmployeeTab, setActiveEmployeeTab] = useState<string>('');
  // const [viewMode, setViewMode] = useState<'calendar' | 'detail'>('detail');
  // const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | undefined>(undefined);

  // Remove old scrolling state - no longer needed with dropdown filters

  // // Local state to track timesheet status for calendar dates
  // const [timesheetStatus, setTimesheetStatus] = useState<Record<string, { hasData: boolean; userId: string }>>({});

  // // Calendar status from month API
  // const [calendarStatus, setCalendarStatus] = useState<Record<string, { hasData: boolean; userCount: number }>>({});

  // Loading state for individual save actions
  const [savingFields, setSavingFields] = useState<Set<string>>(new Set());

  // Persist drafts per field to avoid clearing on re-mounts
  const [fieldDrafts, setFieldDrafts] = useState<Record<string, string>>({});
  // Counter to force textareas to reset to last saved when drafts are discarded
  const [draftResetCounter, setDraftResetCounter] = useState(0);
  // Persist last saved content per field/date to restore on draft discard
  const [savedContentByField, setSavedContentByField] = useState<Record<string, string>>({});

  // Use ref to track fetched data without causing re-renders
  const fetchedDataRef = useRef<Set<string>>(new Set());

  // // Function to fetch data for a specific date
  // const fetchDataForDate = useCallback(async (date: Date, userId: string) => {
  //   const dateKey = `${formatDateForAPI(date)}-${userId}`;

  //   // If we already have data for this date/user, don't fetch again
  //   if (fetchedDataRef.current.has(dateKey)) {
  //     return dateSpecificData[dateKey];
  //   }

  //   try {
  //     // Fetch data for the specific date
  //     const data = await getTeamTimesheets(
  //       orgId,
  //       formatDateForAPI(date),
  //       [userId]
  //     );

  //     // Cache the data
  //     setDateSpecificData(prev => ({ ...prev, [dateKey]: data }));

  //     // Mark as fetched in ref
  //     fetchedDataRef.current.add(dateKey);

  //     // Update savedContentByField with the fetched data
  //     if (data?.users?.length > 0) {
  //       const userData = data.users[0];
  //       const dateStr = formatDateForAPI(date);

  //       const newSavedContent: Record<string, string> = {};

  //       // Store in_progress data
  //       if (userData.in_progress) {
  //         const inProgKey = `${userId}-in_progress-${dateStr}`;
  //         newSavedContent[inProgKey] = convertEntriesToText(userData.in_progress);
  //       }

  //       // Store blocked data
  //       if (userData.blocked) {
  //         const blockedKey = `${userId}-blocked-${dateStr}`;
  //         newSavedContent[blockedKey] = convertEntriesToText(userData.blocked);
  //       }

  //       // Store completed data
  //       if (userData.completed) {
  //         const completedKey = `${userId}-completed-${dateStr}`;
  //         newSavedContent[completedKey] = convertEntriesToText(userData.completed);
  //       }

  //       setSavedContentByField(prev => ({ ...prev, ...newSavedContent }));
  //     }

  //     return data;
  //   } catch (error) {
  //     console.error('Failed to fetch data for date:', date, error);
  //     return null;
  //   }
  // }, [orgId]);

  // // Discard drafts for a given date (rely on last saved values via getInitialValue)
  // const discardDraftsForDate = useCallback((date: Date | undefined) => {
  //   if (!date) return;
  //   const dateStr = formatDateForAPI(date);
  //   setFieldDrafts(prev => {
  //     const next = { ...prev } as Record<string, string>;
  //     for (const key of Object.keys(next)) {
  //       if (key.endsWith(`-${dateStr}`)) {
  //         delete next[key];
  //       }
  //     }
  //     return next;
  //   });
  //   // Force textareas to reset their DOM value to last saved
  //   setDraftResetCounter(c => c + 1);
  // }, []);

  // Check if current date is restricted for editing (members can edit today and previous days, but not future dates)
  // const isDateRestrictedForEditing = useMemo(() => {
  //   if (!selectedTimesheetDate) return false;

  //   // Members can edit today and previous days, but not future dates
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const selectedDate = new Date(selectedTimesheetDate);
  //   selectedDate.setHours(0, 0, 0, 0);

  //   // Restrict only future dates (dates after today)
  //   return selectedDate > today;
  // }, [selectedTimesheetDate]);

  // // Reusable Project Badge Logic
  // const getProjectBadges = useCallback((projectId: string) => {
  //   const projectRole = getUserProjectRoleForProject(projectId);
  //   const effectiveProjectRole = roleChecks.isOrgAdminOrOwner ? 'admin' : projectRole;

  //   const badges = [];

  //   if (effectiveProjectRole === 'owner') {
  //     badges?.push(
  //       <Badge key="owner" variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
  //         Project Owner
  //       </Badge>
  //     );
  //   } else if (effectiveProjectRole === 'admin') {
  //     badges?.push(
  //       <Badge key="admin" variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
  //         Project Admin
  //       </Badge>
  //     );
  //   } else if (effectiveProjectRole === 'member') {
  //     badges?.push(
  //       <Badge key="member" variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
  //         Project Member
  //       </Badge>
  //     );
  //   }

  //   if (effectiveProjectRole === 'member' && isDateRestrictedForEditing) {
  //     badges?.push(
  //       <Badge key="restricted" variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
  //         Future Dates Restricted
  //       </Badge>
  //     );
  //   }

  //   return badges;
  // }, [getUserProjectRoleForProject, roleChecks.isOrgAdminOrOwner, isDateRestrictedForEditing]);

  // // Check if user can edit a specific user's timesheet data (PROJECT-SPECIFIC PERMISSIONS)
  // const canEditUserTimesheet = useMemo(() => {
  //   return (targetUserId: string, projectId?: string) => {
  //     if (!user || !projectId) return false;

  //     // Get user's effective role in this specific project
  //     const projectRole = getUserProjectRoleForProject(projectId);
  //     // Use pre-computed role check

  //     // Determine effective project role: Org Admin/Owner = Project Admin/Owner
  //     const effectiveProjectRole = roleChecks.isOrgAdminOrOwner ? 'admin' : projectRole;

  //     // Project Owner/Admin: Can edit all users' timesheets in this project (no date restrictions)
  //     if (effectiveProjectRole === 'owner' || effectiveProjectRole === 'admin') {
  //       return true;
  //     }

  //     // Project Member: Can only edit their own timesheet, but with date restrictions
  //     if (effectiveProjectRole === 'member' && targetUserId === user.id) {
  //       // Check date restrictions for members
  //       if (isDateRestrictedForEditing) {
  //         return false; // Members can't edit today's or future timesheets
  //       }
  //       return true; // Members can edit their own previous day timesheets
  //     }

  //     // No project role or unknown role: No access
  //     return false;
  //   };
  // }, [user, getUserProjectRoleForProject, roleChecks.isOrgAdminOrOwner, isDateRestrictedForEditing]);

  // Modal State (for future use)
  // const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  // const [selectedUserForEntry, setSelectedUserForEntry] = useState<string>('');

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  // Productivity and Scoring Functions
  // const calculateProductivityScore = (user: any) => {
  //   const completed = (user.completed || []).length;
  //   const inProgress = (user.in_progress || []).length;
  //   const blocked = (user.blocked || []).length;

  //   return Math.max(0, Math.min(100, (completed * 3 + inProgress * 1 - blocked * 2)));
  // };

  // const getProductivityLevel = (score: number) => {
  //   if (score >= 80) return { level: 'Excellent', color: 'text-green-600', bgColor: 'bg-green-100', icon: Trophy };
  //   if (score >= 60) return { level: 'Good', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: Star };
  //   if (score >= 40) return { level: 'Average', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: Target };
  //   return { level: 'Needs Focus', color: 'text-red-600', bgColor: 'bg-red-100', icon: AlertTriangle };
  // };

  // ============================================================================
  // HOOKS AND DATA FETCHING
  // ============================================================================

  // useEffect(() => {
  //   console.log('projects', projectsFromParent, projects);
  //   setProjects(projectsFromParent);
  // }, [projectsFromParent,projects]);


  // Auto-update to today's date daily
  // useEffect(() => {
  //   const updateToToday = () => {
  //     const today = new Date();
  //     today.setHours(0, 0, 0, 0); // Reset time to start of day

  //     const currentSelected = selectedTimesheetDate ? new Date(selectedTimesheetDate) : null;
  //     if (currentSelected) {
  //       currentSelected.setHours(0, 0, 0, 0);
  //     }

  //     // Only update if we're not already on today's date
  //     if (!currentSelected || currentSelected.getTime() !== today.getTime()) {
  //       setSelectedTimesheetDate(today);
  //     }
  //   };

  //   // Update immediately
  //   updateToToday();

  //   // Set up daily auto-update at midnight
  //   const now = new Date();
  //   const tomorrow = new Date(now);
  //   tomorrow.setDate(tomorrow.getDate() + 1);
  //   tomorrow.setHours(0, 0, 0, 0);

  //   const msUntilMidnight = tomorrow.getTime() - now.getTime();

  //   const timeoutId = setTimeout(() => {
  //     updateToToday();

  //     // Set up recurring daily update
  //     const intervalId = setInterval(updateToToday, 24 * 60 * 60 * 1000); // 24 hours

  //     return () => clearInterval(intervalId);
  //   }, msUntilMidnight);

  //   return () => clearTimeout(timeoutId);
  // }, []);

  // Memoize date string and project array to prevent unstable queryKey references
  // const memoizedSelectedTimesheetDate = useMemo(() => {
  //   return selectedTimesheetDate?.toISOString() || '';
  // }, [selectedTimesheetDate]);

  // const memoizedSelectedTimesheetProjects = useMemo(() => {
  //   return selectedTimesheetProjects;
  // }, [selectedTimesheetProjects]);

  // const memoizedSelectedTimesheetUsers = useMemo(() => {
  //   return selectedTimesheetUsers;
  // }, [selectedTimesheetUsers]);

  // Calendar state (needed for queries)
  // const [isCalendarLoading, setIsCalendarLoading] = useState(false);
  // const [calendarRefDate, setCalendarRefDate] = useState(new Date());

  // Fetch team timesheets data using new API
  const {
    data: dailyTimesheets,
    isFetching: isTimesheetsFetching,
    isError: isTimesheetsError,
    error: timesheetsError,
    refetch: refetchTimesheets
  } = useQuery({
    queryKey: ['team-timesheets', orgId, activeEmployeeTab],
    enabled: !!orgId && orgId.length > 0,
    queryFn: () => getTeamTimesheets(
      orgId,
      // formatDateForAPI(selectedTimesheetDate!)
    ),
    staleTime: 1000 * 60 * 2, // Reduced stale time for more frequent updates
    refetchOnWindowFocus: false,
    gcTime: 1000 * 60 * 10,
  });

  // Fetch calendar month status for indicators - user-specific
  // const {
  //   data: monthStatus,
  //   isFetching: isMonthStatusFetching
  // } = useQuery({
  //   queryKey: ['calendar-month-status', orgId, calendarRefDate.getFullYear(), calendarRefDate.getMonth() + 1, activeEmployeeTab],
  //   enabled: !!orgId && !!activeEmployeeTab,
  //   queryFn: () => getCalendarMonthStatus(
  //     orgId,
  //     calendarRefDate.getFullYear(),
  //     calendarRefDate.getMonth() + 1,
  //     [activeEmployeeTab] // Pass current active user ID for user-specific indicators
  //   ),
  //   staleTime: 1000 * 60 * 10,
  //   refetchOnWindowFocus: false,
  // });

  // Trigger refetch when parent signals a refresh
  // useEffect(() => {
  //   if (refreshSignal > 0) {
  //     refetchTimesheets();
  //   }
  // }, [refreshSignal]);

  // // Update calendar status when month data loads
  // useEffect(() => {
  //   if (monthStatus?.calendar_status) {
  //     setCalendarStatus(monthStatus.calendar_status);
  //   }
  // }, [monthStatus]);

  // Update projects state - use projects from parent or fallback
  useEffect(() => {
    if (projectsFromParent && projectsFromParent.length > 0) {
      setProjects(projectsFromParent);
      setIsProjectsLoading(false);
    } else if (!isProjectsLoading && projects.length === 0) {
      // Only fetch if we're not already loading and have no projects
      setIsProjectsLoading(true);
      fetchProjects();
    }
  }, [projectsFromParent, isProjectsLoading, projects.length, fetchProjects]);

  // This useEffect will be moved after sortedTimesheetUsers is defined

  // Hydrate last-saved content map from fetched data so reverting shows server-saved values
  // useEffect(() => {
  //   if (!dailyTimesheets) return;
  //   const dateStr = formatDateForAPI(selectedTimesheetDate);

  //   // Read directly from API payload to avoid temporal dependencies
  //   const apiUsers = ((dailyTimesheets as any)?.users ?? []) as Array<{
  //     user_id: string;
  //     in_progress?: any;
  //     inProgress?: any;
  //     blockers?: any;
  //     blocked?: any;
  //     completed?: any;
  //     default_project_id?: string;
  //   }>;

  //   const apiProjects = ((dailyTimesheets as any)?.projects ?? []) as Array<{
  //     project_id: string;
  //     team_members?: string[];
  //   }>;

  //   const resolveProjectId = (u: any): string => {
  //     if (u?.default_project_id) return u.default_project_id;
  //     const p = apiProjects.find(p => (p.team_members || []).includes(u.user_id));
  //     return p ? p.project_id : 'default-project';
  //   };

  //   const normalizeToText = (val: any): string => {
  //     if (!val) return '';
  //     if (typeof val === 'string') return val;
  //     if (Array.isArray(val)) {
  //       return val.map((item: any) => {
  //         if (typeof item === 'string') return item;
  //         if (item && typeof item === 'object') {
  //           return item.title || item.content || item.description || item.text || '';
  //         }
  //         return '';
  //       }).filter(Boolean).join('\n');
  //     }
  //     if (typeof val === 'object') {
  //       return val.content || val.text || val.description || '';
  //     }
  //     return '';
  //   };

  //   const newSaved: Record<string, string> = {};
  //   (apiUsers || []).forEach((u) => {
  //     const projectId = resolveProjectId(u);
  //     const base = `${u.user_id}-${projectId}`;
  //     const inProgKey = `${base}-in_progress-${dateStr}`;
  //     const blockedKey = `${base}-blocked-${dateStr}`;
  //     const completedKey = `${base}-completed-${dateStr}`;

  //     const inProgVal = normalizeToText(u.in_progress ?? u.inProgress ?? []);
  //     const blockedVal = normalizeToText(u.blockers ?? u.blocked ?? []);
  //     const completedVal = normalizeToText(u.completed ?? []);

  //     if (!fieldDrafts[inProgKey]) newSaved[inProgKey] = inProgVal;
  //     if (!fieldDrafts[blockedKey]) newSaved[blockedKey] = blockedVal;
  //     if (!fieldDrafts[completedKey]) newSaved[completedKey] = completedVal;
  //   });

  //   if (Object.keys(newSaved).length > 0) {
  //     setSavedContentByField(prev => ({ ...newSaved, ...prev }));
  //   }
  //   // Force refresh of textarea DOM values now that we have server data (even if newSaved is empty)
  //   setDraftResetCounter(c => c + 1);
  // }, [dailyTimesheets, selectedTimesheetDate, fieldDrafts]);

  // Handle loading timeout - prevent infinite loading states
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isProjectsLoading) {
      timeoutId = setTimeout(() => {
        console.warn('Projects loading timeout - setting loading to false');
        setIsProjectsLoading(false);
      }, 10000); // 10 second timeout
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isProjectsLoading]);


  // ============================================================================
  // COMPUTED VALUES (useMemo)
  // ============================================================================

  // Filter and process timesheet users based on role permissions
  const filteredTimesheetUsers = useMemo(() => {
    // Get users from the new API response format
    let users: TeamTimesheetUser[] = ((dailyTimesheets as any)?.users ?? []) as TeamTimesheetUser[];

    // If no real timesheet data exists, show organization members for empty timesheet display
    if (users.length === 0) {
      // Get available members based on role-based filtering
      let availableMembers = getFilteredMembers();

      // Convert org members to timesheet user format for display
      users = availableMembers?.map(member => ({
        user_id: String(member.user_id),
        name: member.displayName,
        email: member.email || '',
        designation: member.designation || 'Team Member',
        avatar_initials: member.initials,
        role: member.role || 'member',
        in_progress: [],
        completed: [],
        blocked: []
      })) || [];
    }

    // Apply member filter first
    // if (selectedTimesheetUsers.length > 0) {
    //   users = users?.filter(user => selectedTimesheetUsers?.includes(String(user.user_id)));
    // }

    // Apply project filter - filter users based on their project membership
    if (selectedTimesheetProjects.length > 0) {
      console.log('Applying project filter:', selectedTimesheetProjects);
      console.log('Users before filter:', users?.length);

      users = users?.filter(user => {
        // Check if user is a member of any of the selected projects
        const isMember = selectedTimesheetProjects.some(projectId => {
          const memberStatus = isUserProjectMember(user.user_id, projectId);
          console.log(`User ${user.user_id} project ${projectId} member:`, memberStatus);
          return memberStatus;
        });
        return isMember;
      });

      console.log('Users after filter:', users?.length);
    }

    // Apply search filter
    // if (timesheetSearchQuery) {
    //   const q = timesheetSearchQuery.toLowerCase();
    //   users = users?.filter((u) => {
    //     const name = String(u.name || '').toLowerCase();
    //     const email = String(u.email || '').toLowerCase();
    //     const role = String(u.role || '').toLowerCase();
    //     const designation = String(u.designation || '').toLowerCase();
    //     return [name, email, role, designation]?.some(v => v?.includes(q));
    //   });
    // }

    return users;
  }, [dailyTimesheets, selectedTimesheetProjects, getFilteredMembers, isUserProjectMember]);

  // // Initialize timesheet status from loaded data
  // useEffect(() => {
  //   if (dailyTimesheets && selectedTimesheetDate) {
  //     const dateKey = formatDateForAPI(selectedTimesheetDate);
  //     const newStatus: Record<string, { hasData: boolean; userId: string }> = {};

  //     // Check each user's data for the selected date
  //     filteredTimesheetUsers?.forEach(user => {
  //       const userDateKey = `${dateKey}-${user.user_id}`;

  //       // Check if user has any data in any field
  //       const inProgressData = user.in_progress || [];
  //       const blockedData = user.blocked || [];
  //       const completedData = user.completed || [];

  //       const hasInProgress = Array.isArray(inProgressData) ? inProgressData.length > 0 :
  //         (typeof inProgressData === 'string' && (inProgressData as string).trim().length > 0);
  //       const hasBlocked = Array.isArray(blockedData) ? blockedData.length > 0 :
  //         (typeof blockedData === 'string' && (blockedData as string).trim().length > 0);
  //       const hasCompleted = Array.isArray(completedData) ? completedData.length > 0 :
  //         (typeof completedData === 'string' && (completedData as string).trim().length > 0);

  //       const hasData = hasInProgress || hasBlocked || hasCompleted;

  //       newStatus[userDateKey] = { hasData, userId: user.user_id };
  //     });

  //     // Update status only if there are changes
  //     setTimesheetStatus(prev => {
  //       const hasChanges = Object.keys(newStatus).some(key =>
  //         !prev[key] || prev[key].hasData !== newStatus[key].hasData
  //       );
  //       return hasChanges ? { ...prev, ...newStatus } : prev;
  //     });
  //   }
  // }, [dailyTimesheets, selectedTimesheetDate, filteredTimesheetUsers]);

  // Check if selected date is today
  // const isToday = useMemo(() => {
  //   const today = new Date();
  //   today.setHours(0, 0, 0, 0);
  //   const selectedDate = selectedTimesheetDate ? new Date(selectedTimesheetDate) : today;
  //   selectedDate.setHours(0, 0, 0, 0);
  //   return selectedDate.getTime() === today.getTime();
  // }, [selectedTimesheetDate?.getTime()]);

  // Sort timesheet users based on selected criteria
  const sortedTimesheetUsers = useMemo(() => {
    const users = [...(filteredTimesheetUsers || [])];

    // switch (timesheetSort) {
    //   case 'productivity':
    //     return users?.sort((a, b) => calculateProductivityScore(b) - calculateProductivityScore(a));
    //   case 'alphabetical':
    //     return users?.sort((a, b) => (a.name || '')?.localeCompare(b.name || ''));
    //   case 'hours':
    //     // Since we don't track hours in the new system, sort by total task count instead
    //     return users?.sort((a, b) => {
    //       const aTaskCount = (a.in_progress?.length || 0) + (a.completed?.length || 0) + (a.blocked?.length || 0);
    //       const bTaskCount = (b.in_progress?.length || 0) + (b.completed?.length || 0) + (b.blocked?.length || 0);
    //       return bTaskCount - aTaskCount;
    //     });
    //   case 'name':
    //     return users?.sort((a, b) => (a.name || a.email || a.user_id)?.localeCompare(b.name || b.email || b.user_id));
    //   default:
    //     return users;
    // }
    return users?.sort((a, b) => (a.name || a.email || a.user_id)?.localeCompare(b.name || b.email || b.user_id));
  }, [filteredTimesheetUsers]);

  // Expand/collapse states for employee sections
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [allExpanded, setAllExpanded] = useState<boolean>(false);

  // Toggle individual employee expansion
  const toggleEmployeeExpansion = useCallback((userId: string) => {
    setExpandedEmployees(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      // Update allExpanded state based on whether all employees are now expanded
      const allUserIds = sortedTimesheetUsers.map(user => user.user_id);
      setAllExpanded(newSet.size === allUserIds.length && allUserIds.length > 0);
      return newSet;
    });
  }, [sortedTimesheetUsers]);

  // Expand all employees
  const expandAllEmployees = useCallback(() => {
    const allUserIds = sortedTimesheetUsers.map(user => user.user_id);
    setExpandedEmployees(new Set(allUserIds));
    setAllExpanded(true);
  }, [sortedTimesheetUsers]);

  // Collapse all employees
  const collapseAllEmployees = useCallback(() => {
    setExpandedEmployees(new Set());
    setAllExpanded(false);
  }, []);

  // Toggle expand all/collapse all
  const toggleExpandCollapseAll = useCallback(() => {
    if (allExpanded) {
      collapseAllEmployees();
    } else {
      expandAllEmployees();
    }
  }, [allExpanded, expandAllEmployees, collapseAllEmployees]);

  const fetchAllDatesData = async () => {
    const dates = [];
    const currentDate = new Date(detailDateRange.from!);
    const endDate = new Date(detailDateRange.to!);

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Fetch data for each date and user combination
    for (const date of dates) {
      for (const user of sortedTimesheetUsers) {
        const dateKey = `${formatDateForAPI(date)}-${user.user_id}`;

        // If we already have data for this date/user, don't fetch again
        if (fetchedDataRef.current.has(dateKey)) {
          continue;
        }

        try {
          // Fetch data for the specific date
          const data = await getTeamTimesheets(
            orgId,
            formatDateForAPI(date),
            [user.user_id]
          );

          // Cache the data
          setDateSpecificData(prev => ({ ...prev, [dateKey]: data }));

          // Mark as fetched in ref
          fetchedDataRef.current.add(dateKey);

          // Update savedContentByField with the fetched data
          if (data?.users?.length > 0) {
            const userData = data.users[0];
            const dateStr = formatDateForAPI(date);

            const newSavedContent: Record<string, string> = {};

            // Store in_progress data
            if (userData.in_progress) {
              const inProgKey = `${user.user_id}-in_progress-${dateStr}`;
              newSavedContent[inProgKey] = convertEntriesToText(userData.in_progress);
            }

            // Store blocked data
            if (userData.blocked) {
              const blockedKey = `${user.user_id}-blocked-${dateStr}`;
              newSavedContent[blockedKey] = convertEntriesToText(userData.blocked);
            }

            // Store completed data
            if (userData.completed) {
              const completedKey = `${user.user_id}-completed-${dateStr}`;
              newSavedContent[completedKey] = convertEntriesToText(userData.completed);
            }

            setSavedContentByField(prev => ({ ...prev, ...newSavedContent }));
          }
        } catch (error) {
          console.error('Failed to fetch data for date:', date, error);
        }
      }
    }
  };

  // Fetch data for all dates in the detail range
  useEffect(() => {
    if (!detailDateRange?.from || !detailDateRange?.to || !sortedTimesheetUsers.length) return;

    // Clear the fetched data ref when date range changes to force refresh
    fetchedDataRef.current.clear();

    fetchAllDatesData();
  }, [detailDateRange?.from, detailDateRange?.to, sortedTimesheetUsers, orgId]);

  // Set active employee tab to first user if not set
  useEffect(() => {
    if (sortedTimesheetUsers.length > 0 && !activeEmployeeTab) {
      const currentUserSheet = sortedTimesheetUsers.find(sheetUser => sheetUser.user_id === user?.id);
      if (currentUserSheet) {
        setActiveEmployeeTab(currentUserSheet.user_id);
      } else {
        setActiveEmployeeTab(sortedTimesheetUsers[0].user_id);
      }
    }
  }, [sortedTimesheetUsers, activeEmployeeTab, user]);

  // Scroll detection for modern scroll indicators
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollPercentage = (scrollTop / (scrollHeight - clientHeight)) * 100;

      // Show scroll indicator if there's content to scroll
      setShowScrollIndicator(scrollHeight > clientHeight);

      // Check if near bottom (within 50px)
      setIsNearBottom(scrollTop + clientHeight >= scrollHeight - 50);
    };

    // Initial check
    handleScroll();

    // Add scroll listener
    scrollContainer.addEventListener('scroll', handleScroll);

    // Add resize listener to recheck on window resize
    const handleResize = () => handleScroll();
    window.addEventListener('resize', handleResize);

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [detailDateRange]);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  // Enhanced keyboard navigation for member selection
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!sortedTimesheetUsers.length || !activeEmployeeTab) return;

      const currentIndex = sortedTimesheetUsers.findIndex(user => user.user_id === activeEmployeeTab);
      let newIndex = currentIndex;

      // Ctrl + Arrow keys for member navigation
      if (event.key === 'ArrowLeft' && event.ctrlKey) {
        event.preventDefault();
        newIndex = Math.max(0, currentIndex - 1);
      } else if (event.key === 'ArrowRight' && event.ctrlKey) {
        event.preventDefault();
        newIndex = Math.min(sortedTimesheetUsers.length - 1, currentIndex + 1);
      }
      // Ctrl + M to focus member dropdown (for accessibility)
      else if (event.key === 'm' && event.ctrlKey) {
        event.preventDefault();
        // Focus will be handled by the dropdown component
        return;
      }

      if (newIndex !== currentIndex) {
        setActiveEmployeeTab(sortedTimesheetUsers[newIndex].user_id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [sortedTimesheetUsers, activeEmployeeTab]);

  // Get active employee data
  // const activeEmployee = useMemo(() => {
  //   return sortedTimesheetUsers?.find(user => user.user_id === activeEmployeeTab);
  // }, [sortedTimesheetUsers, activeEmployeeTab]);

  // Get employee's project involvement - simplified for user-centric approach
  const getEmployeeProjects = useCallback((employee: TeamTimesheetUser) => {
    const employeeProjects = new Set<string>();

    // Check projects where user is a member based on role
    projects?.forEach(project => {
      if (isUserProjectMember(employee.user_id, project.id)) {
        employeeProjects.add(project.name);
      }
    });

    return Array.from(employeeProjects);
  }, [projects, isUserProjectMember]);

  // Organize users by their primary project with role-based filtering
  // const usersByProject = useMemo(() => {
  //   const projectGroups: Record<string, any[]> = {};

  //   // First, ensure all projects the current user has access to are included
  //   projects?.forEach(project => {
  //     if (canViewProjectTimesheets(project.id)) {
  //       // Initialize project group even if no users have timesheet data yet
  //       if (!projectGroups[project.name]) {
  //         projectGroups[project.name] = [];
  //       }
  //     }
  //   });

  //   // Add users to projects they have role-based access to
  //   sortedTimesheetUsers?.forEach(user => {
  //     projects?.forEach(project => {
  //       // Check if this specific user has access to this project
  //       const userHasProjectAccess = isUserProjectMember(user.user_id, project.id);

  //       if (userHasProjectAccess && !projectGroups[project.name]?.some(u => u.user_id === user.user_id)) {
  //         projectGroups[project.name]?.push(user);
  //       }
  //     });
  //   });

  //   return projectGroups;
  // }, [sortedTimesheetUsers, projects, canViewProjectTimesheets, selectedTimesheetProjects, isUserProjectMember]);



  // Project Management Functions
  // const toggleProject = (projectName: string) => {
  //   setExpandedProjects(prev => {
  //     const newSet = new Set(prev);
  //     if (newSet.has(projectName)) {
  //       newSet.delete(projectName);
  //     } else {
  //       newSet.add(projectName);
  //     }
  //     return newSet;
  //   });
  // };

  // const toggleAllProjects = (expand: boolean) => {
  //   if (expand) {
  //     setExpandedProjects(new Set(Object.keys(usersByProject)));
  //   } else {
  //     setExpandedProjects(new Set());
  //   }
  // };

  // const getUserPrimaryProject = (user: TeamTimesheetUser): string => {
  //   // Since we moved to user-centric approach, find first project user is member of
  //   const userProject = projects?.find(project =>
  //     isUserProjectMember(user.user_id, project.id)
  //   );

  //   if (userProject) return userProject.id;

  //   // Fallback: use first available project or create a default one
  //   if (projects.length > 0) {
  //     return projects[0].id;
  //   }

  //   // Last resort: use a default project ID
  //   return 'default-project';
  // };

  // // Date Navigation Functions
  // const navigateToPreviousDay = () => {
  //   const currentDate = selectedTimesheetDate || new Date();
  //   const previousDay = new Date(currentDate);
  //   previousDay.setDate(previousDay.getDate() - 1);
  //   previousDay.setHours(0, 0, 0, 0);
  //   setSelectedTimesheetDate(previousDay);
  // };

  // const navigateToNextDay = () => {
  //   const currentDate = selectedTimesheetDate || new Date();
  //   const nextDay = new Date(currentDate);
  //   nextDay.setDate(nextDay.getDate() + 1);
  //   nextDay.setHours(0, 0, 0, 0);
  //   setSelectedTimesheetDate(nextDay);
  // };

  // // Remove old scrolling functions - no longer needed with dropdown filters

  // // Calendar View Functions
  // const handleDateClick = (date: Date) => {
  //   // Discard any unsaved drafts for the currently selected date before navigating
  //   discardDraftsForDate(selectedTimesheetDate);
  //   const local = new Date(date);
  //   local.setHours(0, 0, 0, 0);
  //   // If clicking the same date, do not trigger loading or refetch
  //   if (selectedTimesheetDate) {
  //     const prev = new Date(selectedTimesheetDate);
  //     prev.setHours(0, 0, 0, 0);
  //     if (prev.getTime() === local.getTime()) {
  //       setViewMode('detail');
  //       return;
  //     }
  //   }
  //   setIsCalendarLoading(true);
  //   setSelectedTimesheetDate(local);
  // };

  // const backToCalendar = () => {
  //   // Restore previous saved values by discarding drafts for current date
  //   discardDraftsForDate(selectedTimesheetDate);
  //   setIsCalendarLoading(false);
  //   setViewMode('calendar');
  // };

  // useEffect(() => {
  //   // When a calendar click initiated a load, and the query has finished,
  //   // navigate to detail view and clear the loading flag.
  //   if (isCalendarLoading && !isTimesheetsFetching && selectedTimesheetDate) {
  //     setViewMode('detail');
  //     setIsCalendarLoading(false);
  //   }
  // }, [isCalendarLoading, isTimesheetsFetching, selectedTimesheetDate]);

  // Switching active employee: discard current date drafts and ensure fresh data
  // useEffect(() => {
  //   if (activeEmployeeTab && selectedTimesheetDate) {
  //     // Discard any unsaved drafts for the current date
  //     discardDraftsForDate(selectedTimesheetDate);

  //     // Invalidate queries to ensure we get fresh data for the new active employee
  //     const dateString = formatDateForAPI(selectedTimesheetDate);
  //     queryClient.invalidateQueries({
  //       queryKey: ['team-timesheets', orgId, dateString],
  //       exact: false
  //     });
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [activeEmployeeTab]);

  // Generate calendar grid with weeks - Memoized for performance
  // const getCurrentMonthCalendar = useMemo(() => {
  //   const today = new Date();
  //   const year = calendarRefDate.getFullYear();
  //   const month = calendarRefDate.getMonth();

  //   // Get first day of month and last day of month
  //   const firstDay = new Date(year, month, 1);
  //   const lastDay = new Date(year, month + 1, 0);

  //   // Get the first Sunday of the calendar view
  //   const startDate = new Date(firstDay);
  //   const startDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
  //   startDate.setDate(firstDay.getDate() - startDayOfWeek);

  //   // Get the last Saturday of the calendar view
  //   const endDate = new Date(lastDay);
  //   const endDayOfWeek = lastDay.getDay();
  //   endDate.setDate(lastDay.getDate() + (6 - endDayOfWeek));

  //   // Generate all dates for the calendar grid
  //   const weeks = [];
  //   let currentWeek = [];

  //   for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
  //     currentWeek.push(new Date(date));

  //     // If it's Saturday (day 6), complete the week
  //     if (date.getDay() === 6) {
  //       weeks.push(currentWeek);
  //       currentWeek = [];
  //     }
  //   }

  //   // Add any remaining days to the last week
  //   if (currentWeek.length > 0) {
  //     weeks.push(currentWeek);
  //   }

  //   return { weeks, currentMonth: month };
  // }, [calendarRefDate]);

  // // Get timesheet summary for date tabs - Memoized for performance
  // const getDateSummary = useCallback((date: Date, user: any) => {
  //   const dateKey = `${formatDateForAPI(date)}-${user?.user_id}`;

  //   // Check local timesheet status first
  //   if (timesheetStatus[dateKey]) {
  //     return {
  //       hasData: timesheetStatus[dateKey].hasData,
  //       inProgressCount: timesheetStatus[dateKey].hasData ? 1 : 0,
  //       blockedCount: 0,
  //       completedCount: 0
  //     };
  //   }

  //   // Check if this is the currently selected date with loaded data
  //   const isCurrentDate = selectedTimesheetDate &&
  //     date.toDateString() === selectedTimesheetDate.toDateString();

  //   if (isCurrentDate && user) {
  //     // Check for string content (saved data) or array content (task data)
  //     const inProgressData = user.in_progress || user.inProgress || [];
  //     const blockedData = user.blocked || [];
  //     const completedData = user.completed || [];

  //     // Check if data exists - either as non-empty strings or non-empty arrays
  //     const hasInProgress = Array.isArray(inProgressData) ? inProgressData.length > 0 :
  //       (typeof inProgressData === 'string' && inProgressData.trim().length > 0);
  //     const hasBlocked = Array.isArray(blockedData) ? blockedData.length > 0 :
  //       (typeof blockedData === 'string' && blockedData.trim().length > 0);
  //     const hasCompleted = Array.isArray(completedData) ? completedData.length > 0 :
  //       (typeof completedData === 'string' && completedData.trim().length > 0);

  //     const hasData = hasInProgress || hasBlocked || hasCompleted;

  //     return {
  //       hasData,
  //       inProgressCount: hasInProgress ? 1 : 0,
  //       blockedCount: hasBlocked ? 1 : 0,
  //       completedCount: hasCompleted ? 1 : 0
  //     };
  //   }

  //   return { hasData: false, inProgressCount: 0, blockedCount: 0, completedCount: 0 };
  // }, [timesheetStatus, selectedTimesheetDate]);

  // Get status icon for calendar date - Enhanced with month-level status
  // const getDateStatusIcon = useCallback((date: Date, user: any) => {
  //   const dateKey = formatDateForAPI(date);

  //   // Check month-level status first for better performance
  //   if (calendarStatus[dateKey]) {
  //     const status = calendarStatus[dateKey];
  //     return status.hasData ? (
  //       <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></div>
  //     ) : (
  //       <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
  //     );
  //   }

  //   // Fallback to current logic for selected date
  //   const summary = getDateSummary(date, user);
  //   return summary.hasData ? (
  //     <div className="w-2 h-2 rounded-full bg-green-500 dark:bg-green-400"></div>
  //   ) : (
  //     <div className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"></div>
  //   );
  // }, [calendarStatus, getDateSummary]);

  // // Data Management Functions
  // // Helper function to check if all timesheet fields are empty for a user
  // const checkAllFieldsEmpty = async (userId: string, currentField: 'in_progress' | 'completed' | 'blocked', currentValue: string) => {
  //   // Get current user data
  //   const currentUser = filteredTimesheetUsers?.find(u => u.user_id === userId);
  //   if (!currentUser) return true;

  //   // Check the values of all three fields, using the current value for the field being saved
  //   const inProgressValue = currentField === 'in_progress' ? currentValue :
  //     (typeof currentUser.in_progress === 'string' ? currentUser.in_progress :
  //       Array.isArray(currentUser.in_progress) ? currentUser.in_progress.join('') : '');

  //   const blockedValue = currentField === 'blocked' ? currentValue :
  //     (typeof currentUser.blocked === 'string' ? currentUser.blocked :
  //       Array.isArray(currentUser.blocked) ? currentUser.blocked.join('') : '');

  //   const completedValue = currentField === 'completed' ? currentValue :
  //     (typeof currentUser.completed === 'string' ? currentUser.completed :
  //       Array.isArray(currentUser.completed) ? currentUser.completed.join('') : '');

  //   // Check if all fields are empty or whitespace-only
  //   const allEmpty = (!inProgressValue || inProgressValue.trim().length === 0) &&
  //     (!blockedValue || blockedValue.trim().length === 0) &&
  //     (!completedValue || completedValue.trim().length === 0);

  //   return allEmpty;
  // };

  const saveTimesheetData = async (
    userId: string,
    field: 'in_progress' | 'completed' | 'blocked',
    value: string,
    specificDate: Date
  ) => {
    // Use the specific date if provided, otherwise fall back to selectedTimesheetDate
    const dateToSave = specificDate;
    if (!dateToSave || !orgId || !userId || !field) return;

    // Check permissions - users can edit their own timesheets, admins/owners can edit any
    if (userId !== user?.id && !['admin', 'owner'].includes(currentUserOrgRole || '')) {
      toast({
        title: 'Access Denied',
        description: 'You can only edit your own timesheets',
        variant: 'destructive'
      });
      return;
    }

    // Check date restrictions for members using the specific date
    const isSpecificDateRestricted = (() => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const targetDate = new Date(dateToSave);
      targetDate.setHours(0, 0, 0, 0);
      return targetDate > today;
    })();

    if (currentUserOrgRole === 'member' && isSpecificDateRestricted) {
      toast({
        title: 'Date Restricted',
        description: 'Members cannot edit future dates',
        variant: 'destructive'
      });
      return;
    }

    // Create a unique key for this field being saved
    const fieldKey = `${userId}-${field}`;

    try {
      // Add this field to the loading state
      setSavingFields(prev => new Set(prev).add(fieldKey));

      const updateData: UserTimesheetFieldUpdate = {
        org_id: orgId,
        user_id: userId,
        entry_date: formatDateForAPI(dateToSave),
        field_type: field,
        field_content: value
      };

      const response = await updateTimesheetField(updateData);

      if (response.success) {
        toast({
          title: 'Status updated successfully',
          variant: 'default'
        });

        // Update local calendar status optimistically using the specific date
        // const dateKey = formatDateForAPI(dateToSave);
        // const hasData = value.trim().length > 0;

        // setCalendarStatus(prev => ({
        //   ...prev,
        //   [dateKey]: {
        //     hasData: hasData || Object.values(prev[dateKey] || {}).some(Boolean),
        //     userCount: prev[dateKey]?.userCount || 1
        //   }
        // }));

        // Invalidate the query cache for this specific date so it refetches when navigated to
        const savedDateString = formatDateForAPI(dateToSave);

        // Invalidate all team-timesheet queries for this org and date (regardless of user filters)
        queryClient.invalidateQueries({
          queryKey: ['team-timesheets', orgId, savedDateString],
          exact: false // This will match queries that start with these keys
        });

        // Also invalidate calendar status for the saved date
        queryClient.invalidateQueries({
          queryKey: ['calendar-month-status', orgId, dateToSave.getFullYear(), dateToSave.getMonth() + 1],
          exact: false
        });

      } else {
        throw new Error(response.message || 'Failed to save');
      }
    } catch (error: any) {
      console.error('Failed to save timesheet data:', error);
      toast({
        title: 'Failed to save timesheet',
        description: error.message || 'Please try again',
        variant: 'destructive'
      });
    } finally {
      // Remove this field from the loading state
      setSavingFields(prev => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
    }
  };

  // const clearTimesheetFilters = () => {
  //   setSelectedTimesheetUsers([]);
  //   setSelectedTimesheetProjects([]);
  //   setTimesheetDateRange(undefined);
  //   setTempTimesheetDateRange(undefined);
  //   // Keep selectedTimesheetDate as is - it's just for display
  //   // setTimesheetSearchQuery('');
  // };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="flex w-full h-full relative overflow-hidden min-w-0">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-h-0 min-w-0 overflow-hidden">
        {/* Simplified Filter Header */}
        {!isTimesheetsFetching && (
          <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex-shrink-0">
            <div className="flex items-center justify-between gap-4">
              {/* Left Section - Filters */}
              <div className="flex items-center gap-3">
                {/* Member Selection Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[140px] justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span className="truncate">
                          {selectedMemberFilter === 'all'
                            ? 'All Members'
                            : (() => {
                              const selectedUser = sortedTimesheetUsers.find(u => u.user_id === selectedMemberFilter);
                              return selectedUser
                                ? deriveDisplayFromEmail(selectedUser.name || selectedUser.email || selectedUser.user_id).displayName
                                : 'All Members';
                            })()
                          }
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-64 max-h-72 overflow-auto">
                    {/* All Members Option */}
                    <DropdownMenuCheckboxItem
                      checked={selectedMemberFilter === 'all'}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedMemberFilter('all');
                        }
                      }}
                      className="cursor-pointer font-medium"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">All Members</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            View all team members
                          </div>
                        </div>
                      </div>
                    </DropdownMenuCheckboxItem>

                    {/* Individual Members */}
                    {sortedTimesheetUsers?.map((user) => {
                      const employeeProjects = getEmployeeProjects(user);
                      const isSelected = selectedMemberFilter === user.user_id;

                      return (
                        <DropdownMenuCheckboxItem
                          key={user.user_id}
                          checked={isSelected}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedMemberFilter(user.user_id);
                            }
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="w-8 h-8">
                              <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-xs">
                                {(user.avatar_initials || String(user.name || user.user_id).slice(0, 2)).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm truncate">
                                {deriveDisplayFromEmail(user.name || user.email || user.user_id).displayName}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                {user.designation || 'Team Member'} • {employeeProjects.length} projects
                              </div>
                            </div>
                          </div>
                        </DropdownMenuCheckboxItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Project Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="min-w-[120px] justify-between">
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4" />
                        <span className="truncate">
                          {selectedTimesheetProjects.length > 0
                            ? `${selectedTimesheetProjects.length} Projects`
                            : 'All Projects'
                          }
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 max-h-72 overflow-auto">
                    {/* Clear Selection */}
                    <DropdownMenuCheckboxItem
                      checked={selectedTimesheetProjects.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTimesheetProjects([]);
                        }
                      }}
                      className="cursor-pointer font-medium"
                    >
                      All Projects
                    </DropdownMenuCheckboxItem>

                    {/* Project List */}
                    {projects
                      ?.filter(project => {
                        // Apply role-based filtering
                        if (currentUserOrgRole === 'owner' || currentUserOrgRole === 'admin') {
                          return true;
                        } else if (currentUserOrgRole === 'member') {
                          return project?.members?.includes(user?.id) || false;
                        }
                        return false;
                      })
                      ?.sort((a, b) => a.name?.localeCompare(b.name))
                      ?.map((project) => (
                        <DropdownMenuCheckboxItem
                          key={project.id}
                          checked={selectedTimesheetProjects.includes(project.id)}
                          onCheckedChange={(checked) => {
                            setSelectedTimesheetProjects(prev =>
                              checked
                                ? [...prev, project.id]
                                : prev.filter(id => id !== project.id)
                            );
                          }}
                          className="cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-blue-500" />
                            <span className="truncate">{project.name}</span>
                          </div>
                        </DropdownMenuCheckboxItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Right Section - Date Range Filter and Expand/Collapse */}
              <div className="flex items-center gap-3">
                {/* Expand/Collapse All Buttons */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleExpandCollapseAll}
                  className="text-xs h-8 px-3 flex items-center gap-2"
                  title={allExpanded ? "Collapse all employee sections" : "Expand all employee sections"}
                >
                  {allExpanded ? (
                    <>
                      <ChevronUp className="w-3 h-3" />
                      Collapse All
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3" />
                      Expand All
                    </>
                  )}
                </Button>

                <Popover
                  open={isDetailDatePopoverOpen}
                  onOpenChange={(open) => {
                    if (open) {
                      // Sync temp range with current range when opening
                      setTempDetailDateRange(detailDateRange);
                    }
                    setIsDetailDatePopoverOpen(open);
                  }}
                >
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="min-w-[160px] justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span className="text-xs">
                          {detailDateRange?.from && detailDateRange?.to
                            ? `${detailDateRange.from.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${detailDateRange.to.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                            : 'Select range'
                          }
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 rotate-90" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-4" align="end">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Select Date Range</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            const today = new Date();
                            setTempDetailDateRange({ from: today, to: today });
                          }}
                          className="text-xs h-7 px-2"
                        >
                          Reset to Today
                        </Button>
                      </div>

                      {/* Quick Preset Buttons - Enhanced */}
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-gray-600 dark:text-gray-400">Quick Select:</div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const today = new Date();
                              setTempDetailDateRange({ from: today, to: today });
                            }}
                            className="text-xs h-8 justify-start"
                          >
                            <Calendar className="w-3 h-3 mr-2" />
                            Today
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const today = new Date();
                              const yesterday = new Date(today);
                              yesterday.setDate(today.getDate() - 1);
                              setTempDetailDateRange({ from: yesterday, to: yesterday });
                            }}
                            className="text-xs h-8 justify-start"
                          >
                            <Calendar className="w-3 h-3 mr-2" />
                            Yesterday
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const today = new Date();
                              const weekAgo = new Date(today);
                              weekAgo.setDate(today.getDate() - 6); // Last 7 days including today
                              setTempDetailDateRange({ from: weekAgo, to: today });
                            }}
                            className="text-xs h-8 justify-start"
                          >
                            <Calendar className="w-3 h-3 mr-2" />
                            Last 7 days
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const today = new Date();
                              const monthAgo = new Date(today);
                              monthAgo.setDate(today.getDate() - 29); // Last 30 days including today
                              setTempDetailDateRange({ from: monthAgo, to: today });
                            }}
                            className="text-xs h-8 justify-start"
                          >
                            <Calendar className="w-3 h-3 mr-2" />
                            Last 30 days
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const today = new Date();
                              const monday = new Date(today);
                              const day = today.getDay();
                              const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
                              monday.setDate(diff);
                              setTempDetailDateRange({ from: monday, to: today });
                            }}
                            className="text-xs h-8 justify-start col-span-2"
                          >
                            <Calendar className="w-3 h-3 mr-2" />
                            This Week (Mon to Today)
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const today = new Date();
                              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
                              setTempDetailDateRange({ from: firstDay, to: today });
                            }}
                            className="text-xs h-8 justify-start col-span-2"
                          >
                            <Calendar className="w-3 h-3 mr-2" />
                            This Month (1st to Today)
                          </Button>
                        </div>
                      </div>

                      {/* Individual Date Inputs */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Start Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {tempDetailDateRange?.from ? (
                                  tempDetailDateRange.from.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                ) : (
                                  <span>Pick start date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={tempDetailDateRange?.from}
                                onSelect={(date) => {
                                  if (date) {
                                    setTempDetailDateRange(prev => ({
                                      from: date,
                                      to: prev?.to && date <= prev.to ? prev.to : date
                                    }));
                                  }
                                }}
                                disabled={(date) =>
                                  tempDetailDateRange?.to ? date > tempDetailDateRange.to : false
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-gray-700 dark:text-gray-300">End Date</label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className="w-full justify-start text-left font-normal"
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {tempDetailDateRange?.to ? (
                                  tempDetailDateRange.to.toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric'
                                  })
                                ) : (
                                  <span>Pick end date</span>
                                )}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={tempDetailDateRange?.to}
                                onSelect={(date) => {
                                  if (date) {
                                    setTempDetailDateRange(prev => ({
                                      from: prev?.from && date >= prev.from ? prev.from : date,
                                      to: date
                                    }));
                                  }
                                }}
                                disabled={(date) =>
                                  tempDetailDateRange?.from ? date < tempDetailDateRange.from : false
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                      </div>

                      {/* Enhanced Visual Range Display */}
                      {tempDetailDateRange?.from && tempDetailDateRange?.to && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                              <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Selected Range:</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                {Math.ceil((tempDetailDateRange.to.getTime() - tempDetailDateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1} days
                              </Badge>
                              {(() => {
                                const today = new Date();
                                const isToday = tempDetailDateRange.from.toDateString() === today.toDateString() &&
                                  tempDetailDateRange.to.toDateString() === today.toDateString();
                                const isPast = tempDetailDateRange.to < today;
                                const isFuture = tempDetailDateRange.from > today;

                                if (isToday) {
                                  return <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Today</Badge>;
                                } else if (isPast) {
                                  return <Badge className="text-xs bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">Past</Badge>;
                                } else if (isFuture) {
                                  return <Badge className="text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">Future</Badge>;
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-blue-900 dark:text-blue-100 font-medium text-sm">
                              {tempDetailDateRange.from.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                              {' → '}
                              {tempDetailDateRange.to.toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </div>
                            <div className="text-xs text-blue-700 dark:text-blue-300">
                              {tempDetailDateRange.from.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                              through
                              {tempDetailDateRange.to.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex justify-end items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setIsDetailDatePopoverOpen(false)}
                            className="text-xs h-8 px-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            Cancel
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setDetailDateRange(tempDetailDateRange);
                              setIsDetailDatePopoverOpen(false);
                            }}
                            disabled={!tempDetailDateRange?.from || !tempDetailDateRange?.to}
                            className="text-xs h-8 px-3 bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={!tempDetailDateRange?.from || !tempDetailDateRange?.to
                              ? "Please select both start and end dates"
                              : "Apply the selected date range"}
                          >
                            Apply Range
                          </Button>
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isTimesheetsFetching && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-600">Loading updates...</p>
            </div>
          </div>
        )}

        {/* Employee Content Area */}
        {!(isTimesheetsFetching) && (
          <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
            {/* All Members Content */}
            <div className="flex-1 flex flex-col min-h-0 relative">
              {sortedTimesheetUsers.length > 0 ? (
                <div
                  ref={scrollContainerRef}
                  className="flex-1 overflow-y-auto overflow-x-hidden m-0 p-0 relative mb-8"
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#cbd5e1 transparent'
                  }}
                >
                  <div className="p-2 space-y-6 mb-8">
                    {/* Group data by employee (sections) */}
                    {sortedTimesheetUsers
                      .filter(user => selectedMemberFilter === 'all' || user.user_id === selectedMemberFilter)
                      .map((user) => (
                        <div key={user.user_id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                          {/* Employee Section Title */}
                          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b-2 border-blue-200 dark:border-blue-700 cursor-pointer hover:from-blue-100 dark:hover:from-blue-900/30 hover:to-indigo-100 dark:hover:to-indigo-900/30 transition-colors" onClick={() => toggleEmployeeExpansion(user.user_id)}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 text-xs">
                                <Avatar className="w-10 h-10 ring-2 ring-offset-1 ring-blue-500">
                                  <AvatarFallback className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold text-sm">
                                    {(user.avatar_initials || String(user.name || user.user_id).slice(0, 2)).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                                    {deriveDisplayFromEmail(user.name || user.email || user.user_id).displayName}
                                  </h3>
                                  <p className="text-xs text-blue-700 dark:text-blue-300 flex items-center flex-wrap gap-1">
                                    <span>{user.designation || 'Team Member'} • {user.email || user.user_id}</span>
                                    {getEmployeeProjects(user).length > 0 && (
                                      <>
                                        <span> • Projects:</span>
                                        {getEmployeeProjects(user).length <= 3 ? (
                                          getEmployeeProjects(user).map((projectName, idx) => (
                                            <Badge
                                              key={idx}
                                              variant="outline"
                                              className="text-xs px-2 py-0.5 bg-white text-gray-800 border-gray-300 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-400"
                                            >
                                              {projectName}
                                            </Badge>
                                          ))
                                        ) : (
                                          <>
                                            {getEmployeeProjects(user).slice(0, 3).map((projectName, idx) => (
                                              <Badge
                                                key={idx}
                                                variant="outline"
                                                className="text-xs px-2 py-0.5 bg-white text-gray-800 border-gray-300 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-400"
                                              >
                                                {projectName}
                                              </Badge>
                                            ))}
                                            <HoverCard>
                                              <HoverCardTrigger asChild>
                                                <Badge
                                                  variant="outline"
                                                  className="text-xs px-2 py-0.5 bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-600 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors"
                                                >
                                                  +{getEmployeeProjects(user).length - 3} more
                                                </Badge>
                                              </HoverCardTrigger>
                                              <HoverCardContent className="w-80">
                                                <div className="space-y-2">
                                                  <h4 className="text-sm font-semibold">All Projects ({getEmployeeProjects(user).length})</h4>
                                                  <div className="flex flex-wrap gap-1">
                                                    {getEmployeeProjects(user).map((projectName, idx) => (
                                                      <Badge
                                                        key={idx}
                                                        variant="outline"
                                                        className="text-xs px-2 py-0.5 bg-white text-gray-800 border-gray-300 dark:bg-gray-100 dark:text-gray-900 dark:border-gray-400"
                                                      >
                                                        {projectName}
                                                      </Badge>
                                                    ))}
                                                  </div>
                                                </div>
                                              </HoverCardContent>
                                            </HoverCard>
                                          </>
                                        )}
                                      </>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleEmployeeExpansion(user.user_id);
                                  }}
                                  title={expandedEmployees.has(user.user_id) ? "Collapse section" : "Expand section"}
                                >
                                  {expandedEmployees.has(user.user_id) ? (
                                    <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>

                          {/* Collapsible Table Content */}
                          {expandedEmployees.has(user.user_id) && (
                            <div className="overflow-x-auto">
                              <Table className="min-w-[1200px]">
                                <TableHeader>
                                  <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                    <TableHead className="w-[120px] text-center">Date</TableHead>
                                    <TableHead className="w-[300px] text-blue-600 dark:text-blue-400 font-semibold">In Progress</TableHead>
                                    <TableHead className="w-[300px] text-red-600 dark:text-red-400 font-semibold">Blockers</TableHead>
                                    <TableHead className="w-[300px] text-green-600 dark:text-green-400 font-semibold">Completed</TableHead>
                                    <TableHead className="w-[120px] text-center">Actions</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {detailDateRange?.from && detailDateRange?.to ? (
                                    (() => {
                                      const dates = [];
                                      const currentDate = new Date(detailDateRange.from);
                                      const endDate = new Date(detailDateRange.to);

                                      while (currentDate <= endDate) {
                                        dates.push(new Date(currentDate));
                                        currentDate.setDate(currentDate.getDate() + 1);
                                      }

                                      return dates.reverse().map((date) => {
                                        const isDateToday = date.toDateString() === new Date().toDateString();
                                        const dateKey = formatDateForAPI(date);
                                        const rowId = `${user.user_id}-${dateKey}`;
                                        const isEditing = editingRows.has(rowId);

                                        return (
                                          <TableRow
                                            key={rowId}
                                            className={isEditing ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500' : ''}
                                          >
                                            {/* Date Column */}
                                            <TableCell>
                                              <div className="text-center">
                                                <div className="font-bold text-sm text-gray-900 dark:text-gray-100">
                                                  {date.toLocaleDateString('en-US', {
                                                    weekday: 'short',
                                                    month: 'short',
                                                    day: 'numeric'
                                                  })}
                                                </div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                  {date.getFullYear()}
                                                </div>
                                              </div>
                                            </TableCell>

                                            {/* In Progress Column */}
                                            <TableCell>
                                              {isEditing ? (
                                                <div className="relative w-full">
                                                  <Textarea
                                                    value={editedData[rowId]?.in_progress || ''}
                                                    onChange={(e) => setEditedData({
                                                      ...editedData,
                                                      [rowId]: { ...editedData[rowId], in_progress: e.target.value }
                                                    })}
                                                    placeholder={isDateToday ? "What are you working on today?" : "What were you working on?"}
                                                    className="min-h-[48px] text-xs py-2 pr-8 resize-none"
                                                    rows={2}
                                                  />
                                                  {editedData[rowId]?.in_progress && editedData[rowId]?.in_progress.length > 80 && (
                                                    <button
                                                      onClick={() => setExpandedContent({ type: 'in_progress', content: editedData[rowId]?.in_progress, rowId })}
                                                      className="absolute top-1 right-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                      title="Expand to see full content"
                                                    >
                                                      <Maximize2 className="w-3 h-3 text-gray-500" />
                                                    </button>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="relative w-full group pr-6">
                                                  <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 pr-1">
                                                    {getTimesheetContent(user, date, 'in_progress') || (isDateToday ? "Click Edit to add what you're working on today" : "No work in progress")}
                                                  </div>
                                                  {/* Show maximize button only if content is long */}
                                                  {getTimesheetContent(user, date, 'in_progress') && getTimesheetContent(user, date, 'in_progress').length > 80 && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const content = getTimesheetContent(user, date, 'in_progress');
                                                        setExpandedContent({ type: 'in_progress', content, rowId });
                                                      }}
                                                      className="absolute top-0 right-0 p-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded shadow-sm border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                      title="View full content"
                                                    >
                                                      <Maximize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </TableCell>

                                            {/* Blockers Column */}
                                            <TableCell>
                                              {isEditing ? (
                                                <div className="relative w-full">
                                                  <Textarea
                                                    value={editedData[rowId]?.blocked || ''}
                                                    onChange={(e) => setEditedData({
                                                      ...editedData,
                                                      [rowId]: { ...editedData[rowId], blocked: e.target.value }
                                                    })}
                                                    placeholder={isDateToday ? "Any blockers or issues today?" : "Were there any blockers?"}
                                                    className="min-h-[48px] text-xs py-2 pr-8 resize-none"
                                                    rows={2}
                                                  />
                                                  {editedData[rowId]?.blocked && editedData[rowId]?.blocked.length > 80 && (
                                                    <button
                                                      onClick={() => setExpandedContent({ type: 'blocked', content: editedData[rowId]?.blocked, rowId })}
                                                      className="absolute top-1 right-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                      title="Expand to see full content"
                                                    >
                                                      <Maximize2 className="w-3 h-3 text-gray-500" />
                                                    </button>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="relative w-full group pr-6">
                                                  <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 pr-1">
                                                    {getTimesheetContent(user, date, 'blocked') || (isDateToday ? "Click Edit to add any blockers" : "No blockers reported")}
                                                  </div>
                                                  {getTimesheetContent(user, date, 'blocked') && getTimesheetContent(user, date, 'blocked').length > 80 && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const content = getTimesheetContent(user, date, 'blocked');
                                                        setExpandedContent({ type: 'blocked', content, rowId });
                                                      }}
                                                      className="absolute top-0 right-0 p-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded shadow-sm border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                      title="View full content"
                                                    >
                                                      <Maximize2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </TableCell>

                                            {/* Completed Column */}
                                            <TableCell>
                                              {isEditing ? (
                                                <div className="relative w-full">
                                                  <Textarea
                                                    value={editedData[rowId]?.completed || ''}
                                                    onChange={(e) => setEditedData({
                                                      ...editedData,
                                                      [rowId]: { ...editedData[rowId], completed: e.target.value }
                                                    })}
                                                    placeholder={isDateToday ? "What did you complete today?" : "What did you complete?"}
                                                    className="min-h-[48px] text-xs py-2 pr-8 resize-none"
                                                    rows={2}
                                                  />
                                                  {editedData[rowId]?.completed && editedData[rowId]?.completed.length > 80 && (
                                                    <button
                                                      onClick={() => setExpandedContent({ type: 'completed', content: editedData[rowId]?.completed, rowId })}
                                                      className="absolute top-1 right-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                                      title="Expand to see full content"
                                                    >
                                                      <Maximize2 className="w-3 h-3 text-gray-500" />
                                                    </button>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="relative w-full group pr-6">
                                                  <div className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 pr-1">
                                                    {getTimesheetContent(user, date, 'completed') || (isDateToday ? "Click Edit to add completed tasks" : "No completed tasks")}
                                                  </div>
                                                  {getTimesheetContent(user, date, 'completed') && getTimesheetContent(user, date, 'completed').length > 80 && (
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        const content = getTimesheetContent(user, date, 'completed');
                                                        setExpandedContent({ type: 'completed', content, rowId });
                                                      }}
                                                      className="absolute top-0 right-0 p-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded shadow-sm border border-gray-200 dark:border-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                      title="View full content"
                                                    >
                                                      <Maximize2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                                    </button>
                                                  )}
                                                </div>
                                              )}
                                            </TableCell>

                                            {/* Actions Column */}
                                            <TableCell className="text-center">
                                              {isEditing ? (
                                                <div className="flex items-center justify-center gap-1">
                                                  <Button
                                                    size="sm"
                                                    className="h-7 px-2 bg-green-500 hover:bg-green-600 text-white text-xs"
                                                    onClick={() => handleSaveRow(rowId, user, date)}
                                                  >
                                                    Save
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 px-2"
                                                    onClick={() => {
                                                      const newEditingRows = new Set(editingRows);
                                                      newEditingRows.delete(rowId);
                                                      setEditingRows(newEditingRows);
                                                      const newEditedData = { ...editedData };
                                                      delete newEditedData[rowId];
                                                      setEditedData(newEditedData);
                                                    }}
                                                  >
                                                    <X className="w-3.5 h-3.5" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <div className="flex items-center justify-center gap-1">
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-7 px-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    onClick={() => {
                                                      setEditingRows(new Set([...editingRows, rowId]));
                                                      // Initialize edited data with current values from timesheet
                                                      setEditedData({
                                                        ...editedData,
                                                        [rowId]: {
                                                          in_progress: getTimesheetContent(user, date, 'in_progress'),
                                                          blocked: getTimesheetContent(user, date, 'blocked'),
                                                          completed: getTimesheetContent(user, date, 'completed')
                                                        }
                                                      });
                                                    }}
                                                  >
                                                    Edit
                                                  </Button>
                                                </div>
                                              )}
                                            </TableCell>
                                          </TableRow>
                                        );
                                      });
                                    })()
                                  ) : (
                                    <TableRow>
                                      <TableCell colSpan={7} className="text-center py-8">
                                        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Select Date Range</h3>
                                        <p className="text-gray-500 dark:text-gray-400">Choose a date range above to view timeline data</p>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </TableBody>
                              </Table>
                            </div>
                          )}
                        </div>
                      ))}
                  </div>

                  {/* Modern Scroll Indicators */}
                  {/* {showScrollIndicator && !isNearBottom && (
                    <div className="absolute bottom-4 right-4 z-10">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={scrollToBottom}
                        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-lg border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-800 transition-all duration-200"
                      >
                        <ChevronDown className="w-4 h-4 mr-1" />
                        <span className="text-xs">More</span>
                      </Button>
                    </div>
                  )} */}

                  {/* Bottom Reached Indicator */}
                  {/* {showScrollIndicator && isNearBottom && (
                    <div className="absolute bottom-4 right-4 z-10">
                      <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg px-3 py-2 shadow-sm">
                        <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-medium">End of timeline</span>
                        </div>
                      </div>
                    </div>
                  )} */}
                </div>
              ) : (
                // Fallback: Show calendar view when no users are available
                <div className="flex-1 overflow-y-auto overflow-x-hidden m-0 p-0">
                  <div className="p-2 sm:p-3 space-y-2 sm:space-y-3">
                    {/* Header for no users state */}
                    <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/60 dark:from-gray-800/90 dark:to-gray-700/90 border border-slate-200 dark:border-gray-600 rounded-lg p-2 sm:p-3 shadow-sm flex-shrink-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                            <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                          </div>
                          <div>
                            {/* <h2 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-gray-100">
                              Team Calendar View
                            </h2> */}
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              No timesheet data available for the selected date
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 px-2 sm:px-3 py-2 rounded-lg border border-indigo-200 dark:border-indigo-700">
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <div className="text-xs sm:text-sm font-medium text-indigo-900 dark:text-indigo-100">
                                <div className="flex items-center gap-2 sm:gap-4">
                                  <span className="hidden sm:inline">Status:</span>
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                      <span className="text-xs">Not Started</span>
                                    </div>
                                    <div className="flex items-center gap-1 sm:gap-2">
                                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                      <span className="text-xs">Completed</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Expand Content Dialog */}
      <Dialog open={!!expandedContent} onOpenChange={() => setExpandedContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {expandedContent?.type === 'in_progress' ? (
                <>
                  <Clock className="w-5 h-5 text-blue-600" />
                  In Progress Details
                </>
              ) : expandedContent?.type === 'blocked' ? (
                <>
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Blockers Details
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Completed Details
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto">
            <p className="text-base text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words leading-relaxed">
              {expandedContent?.content}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ============================================================================
// EXPORT
// ============================================================================

export default TimesheetTab;
