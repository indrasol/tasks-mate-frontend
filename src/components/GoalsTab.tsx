import React, { useMemo, useState, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Target, Plus, Search, Calendar, X, Users, ChevronDown, Trash2, Maximize2, AlertTriangle } from 'lucide-react';
import { useOrgUserGoals } from '@/hooks/useOrgUserGoals';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import { useAuth } from '@/hooks/useAuth';
import type { BackendOrgMember } from '@/types/organization';
import type { Goal, GoalStatus } from '@/types/goal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createGoal, updateGoal, deleteGoal } from '@/services/goalService';
import { toast } from '@/hooks/use-toast';

interface GoalsTabProps {
  orgId: string;
  realOrgMembers: BackendOrgMember[];
}

// Color mapping for tags
const tagColors = [
  'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
  'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700',
  'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700',
  'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
  'bg-pink-100 text-pink-800 border-pink-300 dark:bg-pink-900/30 dark:text-pink-300 dark:border-pink-700',
  'bg-indigo-100 text-indigo-800 border-indigo-300 dark:bg-indigo-900/30 dark:text-indigo-300 dark:border-indigo-700',
  'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-700',
  'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-700',
  'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-300 dark:border-rose-700',
  'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700',
];

// Hash function to consistently assign colors to tags
const getTagColor = (tag: string): string => {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return tagColors[Math.abs(hash) % tagColors.length];
};

interface EditableGoal {
  id?: string;
  member: string;
  categories: string[];
  subCategories: string[];
  goal: string;
  target: string;
  startDate: Date | undefined;
  endDate: Date | undefined;
  isNew?: boolean;
  sectionId?: string;
}

interface Section {
  id: string;
  title: string;
  order: number;
}

export default function GoalsTab({ orgId, realOrgMembers }: GoalsTabProps) {
  const { user } = useAuth();
  const { data: membersFromHook } = useOrganizationMembers(orgId);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [newRows, setNewRows] = useState<EditableGoal[]>([]);
  const [editedData, setEditedData] = useState<Record<string, EditableGoal>>({});
  
  // Tag input states
  const [categoryInput, setCategoryInput] = useState<Record<string, string>>({});
  const [subCategoryInput, setSubCategoryInput] = useState<Record<string, string>>({});
  
  // Sections management
  const [sections, setSections] = useState<Section[]>([
    { id: 'default-section', title: '', order: 0 }
  ]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [sectionTitleInputs, setSectionTitleInputs] = useState<Record<string, string>>({});
  
  // Expand dialog states
  const [expandedContent, setExpandedContent] = useState<{ type: 'goal' | 'target'; content: string; rowId: string } | null>(null);
  
  // Delete confirmation states
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ goalId: string; goalTitle: string } | null>(null);

  const effectiveMembers = useMemo(
    () => (realOrgMembers?.length ? realOrgMembers : (membersFromHook || [])),
    [realOrgMembers, membersFromHook]
  );

  // Fetch all goals
  const filters = useMemo(() => ({
    page,
    pageSize: 100,
    status: 'all' as const,
  }), [page]);

  const { data, isLoading, isFetching } = useOrgUserGoals(orgId, filters);

  const items = data?.items ?? [];
  const memberIndex = useMemo(() => {
    const all = effectiveMembers || [];
    const idx: Record<string, BackendOrgMember> = {} as any;
    for (const m of all) {
      if (m && m.user_id !== undefined && m.user_id !== null) {
        idx[String(m.user_id)] = m;
      }
    }
    return idx;
  }, [effectiveMembers]);

  // Client-side filtering
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(goal => {
      const title = (goal.title || '').toLowerCase();
      const description = (goal.description || '').toLowerCase();
      const category = (goal.category || '').toLowerCase();
      const subCategory = (goal.subCategory || '').toLowerCase();
      
      return title.includes(query) || 
             description.includes(query) || 
             category.includes(query) || 
             subCategory.includes(query);
    });
  }, [items, searchQuery]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (payload: any) => createGoal(orgId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-user-goals', orgId] });
      toast({ title: 'Goal created successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to create goal', variant: 'destructive' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ goalId, payload }: { goalId: string; payload: any }) => 
      updateGoal(orgId, goalId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-user-goals', orgId] });
      toast({ title: 'Goal updated successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to update goal', variant: 'destructive' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (goalId: string) => deleteGoal(orgId, goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-user-goals', orgId] });
      toast({ title: 'Goal deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete goal', variant: 'destructive' });
    }
  });

  const addNewRow = (sectionId: string = 'default-section') => {
    const tempId = `new-${Date.now()}`;
    const newRow: EditableGoal = {
      id: tempId,
      member: '',
      categories: [],
      subCategories: [],
      goal: '',
      target: '',
      startDate: undefined,
      endDate: undefined,
      isNew: true,
      sectionId
    };
    setNewRows([...newRows, newRow]);
    setEditingRows(new Set([...editingRows, tempId]));
    setCategoryInput({ ...categoryInput, [tempId]: '' });
    setSubCategoryInput({ ...subCategoryInput, [tempId]: '' });
  };

  const addNewSection = () => {
    const newSectionId = `section-${Date.now()}`;
    const newSection: Section = {
      id: newSectionId,
      title: '',
      order: sections.length
    };
    setSections([...sections, newSection]);
    setEditingSectionId(newSectionId);
    setSectionTitleInputs({ ...sectionTitleInputs, [newSectionId]: '' });
  };

  const saveSection = (sectionId: string) => {
    const title = sectionTitleInputs[sectionId] || '';
    setSections(sections.map(s => 
      s.id === sectionId ? { ...s, title } : s
    ));
    setEditingSectionId(null);
  };

  const deleteSection = (sectionId: string) => {
    if (sectionId === 'default-section') return; // Can't delete default section
    
    // Move goals from deleted section to default section
    setNewRows(newRows.map(row => 
      row.sectionId === sectionId ? { ...row, sectionId: 'default-section' } : row
    ));
    
    setSections(sections.filter(s => s.id !== sectionId));
  };

  const handleEdit = (goalId: string, goal: Goal) => {
    setEditingRows(new Set([...editingRows, goalId]));
    const assignee = goal.assignees?.[0];
    
    // Parse existing categories and subcategories (stored as comma-separated in backend)
    const categories = goal.category ? goal.category.split(',').map(c => c.trim()).filter(Boolean) : [];
    const subCategories = goal.subCategory ? goal.subCategory.split(',').map(c => c.trim()).filter(Boolean) : [];
    
    setEditedData({
      ...editedData,
      [goalId]: {
        id: goalId,
        member: assignee?.userId || '',
        categories,
        subCategories,
        goal: goal.title || '',
        target: goal.description || '',
        startDate: goal.startDate ? new Date(goal.startDate) : undefined,
        endDate: goal.dueDate ? new Date(goal.dueDate) : undefined,
      }
    });
    setCategoryInput({ ...categoryInput, [goalId]: '' });
    setSubCategoryInput({ ...subCategoryInput, [goalId]: '' });
  };

  const handleSave = async (goalId: string, isNew: boolean) => {
    const data = isNew ? newRows.find(r => r.id === goalId) : editedData[goalId];
    if (!data || !data.goal.trim()) {
      toast({ title: 'Goal title is required', variant: 'destructive' });
      return;
    }

    const payload = {
      title: data.goal.trim(),
      description: data.target.trim() || undefined,
      category: data.categories.join(', ') || undefined,
      subCategory: data.subCategories.join(', ') || undefined,
      status: 'active' as GoalStatus,
      startDate: data.startDate ? formatDateForAPI(data.startDate) : undefined,
      dueDate: data.endDate ? formatDateForAPI(data.endDate) : undefined,
      visibility: 'org' as const,
      assignees: data.member ? [{ userId: data.member, role: 'owner' as const }] : [],
    };

    if (isNew) {
      await createMutation.mutateAsync(payload);
      setNewRows(newRows.filter(r => r.id !== goalId));
    } else {
      await updateMutation.mutateAsync({ goalId, payload });
    }

    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(goalId);
    setEditingRows(newEditingRows);
    
    // Clean up input states
    const newCatInput = { ...categoryInput };
    delete newCatInput[goalId];
    setCategoryInput(newCatInput);
    
    const newSubCatInput = { ...subCategoryInput };
    delete newSubCatInput[goalId];
    setSubCategoryInput(newSubCatInput);
  };

  const handleCancel = (goalId: string, isNew: boolean) => {
    if (isNew) {
      setNewRows(newRows.filter(r => r.id !== goalId));
    }
    const newEditingRows = new Set(editingRows);
    newEditingRows.delete(goalId);
    setEditingRows(newEditingRows);
    
    const newEditedData = { ...editedData };
    delete newEditedData[goalId];
    setEditedData(newEditedData);
    
    // Clean up input states
    const newCatInput = { ...categoryInput };
    delete newCatInput[goalId];
    setCategoryInput(newCatInput);
    
    const newSubCatInput = { ...subCategoryInput };
    delete newSubCatInput[goalId];
    setSubCategoryInput(newSubCatInput);
  };

  const handleDelete = async (goalId: string, goalTitle: string) => {
    setDeleteConfirmation({ goalId, goalTitle });
  };

  const confirmDelete = async () => {
    if (!deleteConfirmation) return;
    
    await deleteMutation.mutateAsync(deleteConfirmation.goalId);
    setDeleteConfirmation(null);
  };

  const updateField = (goalId: string, field: keyof EditableGoal, value: any, isNew: boolean) => {
    if (isNew) {
      setNewRows(newRows.map(row => 
        row.id === goalId ? { ...row, [field]: value } : row
      ));
    } else {
      setEditedData({
        ...editedData,
        [goalId]: {
          ...editedData[goalId],
          [field]: value
        }
      });
    }
  };

  // Tag management functions
  const addCategory = (goalId: string, isNew: boolean) => {
    const input = categoryInput[goalId]?.trim();
    if (!input) return;
    
    const data = isNew ? newRows.find(r => r.id === goalId) : editedData[goalId];
    if (!data) return;
    
    if (!data.categories.includes(input)) {
      updateField(goalId, 'categories', [...data.categories, input], isNew);
    }
    setCategoryInput({ ...categoryInput, [goalId]: '' });
  };

  const removeCategory = (goalId: string, category: string, isNew: boolean) => {
    const data = isNew ? newRows.find(r => r.id === goalId) : editedData[goalId];
    if (!data) return;
    
    updateField(goalId, 'categories', data.categories.filter(c => c !== category), isNew);
  };

  const addSubCategory = (goalId: string, isNew: boolean) => {
    const input = subCategoryInput[goalId]?.trim();
    if (!input) return;
    
    const data = isNew ? newRows.find(r => r.id === goalId) : editedData[goalId];
    if (!data) return;
    
    if (!data.subCategories.includes(input)) {
      updateField(goalId, 'subCategories', [...data.subCategories, input], isNew);
    }
    setSubCategoryInput({ ...subCategoryInput, [goalId]: '' });
  };

  const removeSubCategory = (goalId: string, subCategory: string, isNew: boolean) => {
    const data = isNew ? newRows.find(r => r.id === goalId) : editedData[goalId];
    if (!data) return;
    
    updateField(goalId, 'subCategories', data.subCategories.filter(c => c !== subCategory), isNew);
  };

  const handleCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>, goalId: string, isNew: boolean) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCategory(goalId, isNew);
    }
  };

  const handleSubCategoryKeyDown = (e: KeyboardEvent<HTMLInputElement>, goalId: string, isNew: boolean) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSubCategory(goalId, isNew);
    }
  };

  const allRows = [...newRows, ...filteredItems.map(goal => {
    const assignee = goal.assignees?.[0];
    const categories = goal.category ? goal.category.split(',').map(c => c.trim()).filter(Boolean) : [];
    const subCategories = goal.subCategory ? goal.subCategory.split(',').map(c => c.trim()).filter(Boolean) : [];
    
    return {
      id: goal.id,
      member: assignee?.userId || '',
      categories,
      subCategories,
      goal: goal.title || '',
      target: goal.description || '',
      startDate: goal.startDate ? new Date(goal.startDate) : undefined,
      endDate: goal.dueDate ? new Date(goal.dueDate) : undefined,
      isNew: false,
      sectionId: 'default-section', // All existing goals go to default section for now
      originalGoal: goal,
    };
  })];

  // Group rows by section
  const rowsBySection = useMemo(() => {
    const grouped: Record<string, typeof allRows> = {};
    sections.forEach(section => {
      grouped[section.id] = allRows.filter(row => row.sectionId === section.id);
    });
    return grouped;
  }, [allRows, sections]);

  return (
    <div className="flex flex-col h-full w-full bg-gray-50/50 dark:bg-gray-900/50">
      {/* Header with Search */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600 dark:text-green-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Organization Goals</h2>
            </div>
            
            {/* Search Bar */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                className="pl-9 pr-4 h-9 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700"
                placeholder="Search goals..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 dark:text-gray-400">
            {allRows.length} {allRows.length === 1 ? 'goal' : 'goals'}
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="flex-1 overflow-auto">
        {isLoading || isFetching ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading goals...</p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-6">
            {/* Render each section */}
            {sections.map((section, sectionIndex) => {
              const sectionRows = rowsBySection[section.id] || [];
              const isEditingThisSection = editingSectionId === section.id;
              const sectionHasTitle = section.title.trim().length > 0;

              return (
                <div key={section.id} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  {/* Section Title */}
                  {!isEditingThisSection && !sectionHasTitle ? (
                    <div 
                      className="px-4 py-3 bg-blue-50/20 dark:bg-blue-900/5 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-all cursor-pointer border-b-2 border-dotted border-blue-400/60 dark:border-blue-600/60"
                      onClick={() => {
                        setEditingSectionId(section.id);
                        setSectionTitleInputs({ ...sectionTitleInputs, [section.id]: section.title });
                      }}
                    >
                      <div className="flex items-center justify-center gap-2 text-blue-600 dark:text-blue-400">
                        <Plus className="w-4 h-4" />
                        <span className="text-sm font-medium">Click here to add section title</span>
                      </div>
                    </div>
                  ) : (
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b-2 border-blue-200 dark:border-blue-700">
                      {isEditingThisSection ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={sectionTitleInputs[section.id] || ''}
                            onChange={(e) => setSectionTitleInputs({ ...sectionTitleInputs, [section.id]: e.target.value })}
                            placeholder="Enter section title (e.g., Leadership Goals - Jun 2025 to Dec 2025)"
                            className="flex-1 h-9 text-base font-semibold"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                saveSection(section.id);
                              }
                            }}
                          />
                          <Button
                            size="sm"
                            onClick={() => saveSection(section.id)}
                            className="bg-blue-500 hover:bg-blue-600 text-white h-9"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (section.id !== 'default-section') {
                                deleteSection(section.id);
                              } else {
                                setEditingSectionId(null);
                              }
                            }}
                            className="h-9"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                            {section.title}
                          </h3>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setEditingSectionId(section.id);
                                setSectionTitleInputs({ ...sectionTitleInputs, [section.id]: section.title });
                              }}
                              className="text-xs text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                            >
                              Edit
                            </Button>
                            {section.id !== 'default-section' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteSection(section.id)}
                                className="text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30"
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Table with horizontal scroll */}
                  <div className="overflow-x-auto">
                    <Table className="min-w-[1200px]">
                      <TableHeader>
                        <TableRow className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                          <TableHead className="w-[180px]">Member</TableHead>
                          <TableHead className="w-[150px]">Category</TableHead>
                          <TableHead className="w-[150px]">Sub-Category</TableHead>
                          <TableHead className="w-[250px]">Goal</TableHead>
                          <TableHead className="w-[200px]">Target</TableHead>
                          <TableHead className="w-[120px]">Start Date</TableHead>
                          <TableHead className="w-[120px]">End Date</TableHead>
                          <TableHead className="w-[120px] text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sectionRows.map((row, index) => {
                          const isEditing = editingRows.has(row.id!);
                          const isNew = row.isNew || newRows.some(r => r.id === row.id);
                          const data = isEditing ? (isNew ? row : editedData[row.id!] || row) : row;

                          return (
                            <TableRow 
                              key={row.id}
                              className={isEditing ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-500' : ''}
                            >
                              {/* Member Column */}
                              <TableCell>
                                {isEditing ? (
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        className="w-full justify-between h-8 text-xs"
                                      >
                                        <div className="flex items-center gap-1 truncate">
                                          <Users className="w-3 h-3 flex-shrink-0" />
                                          <span className="truncate">
                                            {data.member ? memberIndex[data.member]?.displayName || 'Select' : 'Select'}
                                          </span>
                                        </div>
                                        <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56">
                                      {effectiveMembers.map(m => (
                                        <DropdownMenuCheckboxItem
                                          key={m.user_id}
                                          checked={data.member === String(m.user_id)}
                                          onCheckedChange={(checked) => {
                                            if (checked) {
                                              updateField(row.id!, 'member', String(m.user_id), isNew);
                                            }
                                          }}
                                        >
                                          <div className="flex items-center gap-2">
                                            <Avatar className="w-5 h-5">
                                              <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs">{m.displayName}</span>
                                          </div>
                                        </DropdownMenuCheckboxItem>
                                      ))}
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                ) : data.member ? (
                                  <div className="flex items-center gap-2">
                                    <Avatar className="w-6 h-6">
                                      <AvatarFallback className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                                        {memberIndex[data.member]?.initials || '??'}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm truncate">{memberIndex[data.member]?.displayName || 'Unknown'}</span>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">No member</span>
                                )}
                              </TableCell>

                              {/* Category Column */}
                              <TableCell>
                                {isEditing ? (
                                  <div className="w-full">
                                    <div className="flex flex-wrap gap-1 mb-1">
                                      {data.categories.map((cat, idx) => (
                                        <Badge 
                                          key={idx}
                                          variant="outline" 
                                          className={`${getTagColor(cat)} text-xs px-2 py-0.5 flex items-center gap-1`}
                                        >
                                          {cat}
                                          <button
                                            onClick={() => removeCategory(row.id!, cat, isNew)}
                                            className="hover:bg-black/10 rounded-full p-0.5"
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                    <Input
                                      value={categoryInput[row.id!] || ''}
                                      onChange={(e) => setCategoryInput({ ...categoryInput, [row.id!]: e.target.value })}
                                      onKeyDown={(e) => handleCategoryKeyDown(e, row.id!, isNew)}
                                      placeholder="Type & press Enter"
                                      className="h-8 text-xs w-full"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {data.categories.length > 0 ? (
                                      data.categories.map((cat, idx) => (
                                        <Badge 
                                          key={idx}
                                          variant="outline" 
                                          className={`${getTagColor(cat)} text-xs px-2 py-0.5`}
                                        >
                                          {cat}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">No category</span>
                                    )}
                                  </div>
                                )}
                              </TableCell>

                              {/* Sub-Category Column */}
                              <TableCell>
                                {isEditing ? (
                                  <div className="w-full">
                                    <div className="flex flex-wrap gap-1 mb-1">
                                      {data.subCategories.map((subCat, idx) => (
                                        <Badge 
                                          key={idx}
                                          variant="outline" 
                                          className={`${getTagColor(subCat)} text-xs px-2 py-0.5 flex items-center gap-1`}
                                        >
                                          {subCat}
                                          <button
                                            onClick={() => removeSubCategory(row.id!, subCat, isNew)}
                                            className="hover:bg-black/10 rounded-full p-0.5"
                                          >
                                            <X className="w-2.5 h-2.5" />
                                          </button>
                                        </Badge>
                                      ))}
                                    </div>
                                    <Input
                                      value={subCategoryInput[row.id!] || ''}
                                      onChange={(e) => setSubCategoryInput({ ...subCategoryInput, [row.id!]: e.target.value })}
                                      onKeyDown={(e) => handleSubCategoryKeyDown(e, row.id!, isNew)}
                                      placeholder="Type & press Enter"
                                      className="h-8 text-xs w-full"
                                    />
                                  </div>
                                ) : (
                                  <div className="flex flex-wrap gap-1 items-center">
                                    {data.subCategories.length > 0 ? (
                                      data.subCategories.map((subCat, idx) => (
                                        <Badge 
                                          key={idx}
                                          variant="outline" 
                                          className={`${getTagColor(subCat)} text-xs px-2 py-0.5`}
                                        >
                                          {subCat}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-400 italic">-</span>
                                    )}
                                  </div>
                                )}
                              </TableCell>

                              {/* Goal Column */}
                              <TableCell>
                                {isEditing ? (
                                  <div className="relative w-full">
                                    <Textarea
                                      value={data.goal}
                                      onChange={(e) => updateField(row.id!, 'goal', e.target.value, isNew)}
                                      placeholder="Enter goal..."
                                      className="min-h-[48px] text-xs py-2 pr-8 resize-none"
                                      rows={2}
                                    />
                                    {data.goal && data.goal.length > 80 && (
                                      <button
                                        onClick={() => setExpandedContent({ type: 'goal', content: data.goal, rowId: row.id! })}
                                        className="absolute top-1 right-1 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                                        title="Expand to see full content"
                                      >
                                        <Maximize2 className="w-3 h-3 text-gray-500" />
                                      </button>
                                    )}
                                  </div>
                                ) : (
                                  <div className="relative w-full group pr-6">
                                    <div className="text-sm text-gray-900 dark:text-gray-100 line-clamp-2 pr-1">
                                      {data.goal || <span className="text-gray-400 italic">No goal</span>}
                                    </div>
                                    {data.goal && data.goal.length > 80 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedContent({ type: 'goal', content: data.goal, rowId: row.id! });
                                        }}
                                        className="absolute top-0 right-0 p-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded shadow-sm border border-gray-200 dark:border-gray-600"
                                        title="View full content"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </TableCell>

                              {/* Target Column */}
                              <TableCell>
                                {isEditing ? (
                                  <div className="relative w-full">
                                    <Textarea
                                      value={data.target}
                                      onChange={(e) => updateField(row.id!, 'target', e.target.value, isNew)}
                                      placeholder="Target..."
                                      className="min-h-[48px] text-xs py-2 pr-8 resize-none"
                                      rows={2}
                                    />
                                    {data.target && data.target.length > 80 && (
                                      <button
                                        onClick={() => setExpandedContent({ type: 'target', content: data.target, rowId: row.id! })}
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
                                      {data.target || <span className="text-gray-400 italic">-</span>}
                                    </div>
                                    {data.target && data.target.length > 80 && (
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setExpandedContent({ type: 'target', content: data.target, rowId: row.id! });
                                        }}
                                        className="absolute top-0 right-0 p-1 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded shadow-sm border border-gray-200 dark:border-gray-600"
                                        title="View full content"
                                      >
                                        <Maximize2 className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </TableCell>

                              {/* Start Date Column */}
                              <TableCell>
                                {isEditing ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-7 w-full text-xs justify-start px-2">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {data.startDate ? formatDate(data.startDate) : 'Date'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={data.startDate}
                                        onSelect={(date) => updateField(row.id!, 'startDate', date, isNew)}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                ) : data.startDate ? (
                                  <div className="text-xs text-gray-700 dark:text-gray-300">
                                    {formatDate(data.startDate)}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">-</span>
                                )}
                              </TableCell>

                              {/* End Date Column */}
                              <TableCell>
                                {isEditing ? (
                                  <Popover>
                                    <PopoverTrigger asChild>
                                      <Button variant="outline" size="sm" className="h-7 w-full text-xs justify-start px-2">
                                        <Calendar className="w-3 h-3 mr-1" />
                                        {data.endDate ? formatDate(data.endDate) : 'Date'}
                                      </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                      <CalendarComponent
                                        mode="single"
                                        selected={data.endDate}
                                        onSelect={(date) => updateField(row.id!, 'endDate', date, isNew)}
                                      />
                                    </PopoverContent>
                                  </Popover>
                                ) : data.endDate ? (
                                  <div className="text-xs text-gray-700 dark:text-gray-300">
                                    {formatDate(data.endDate)}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">-</span>
                                )}
                              </TableCell>

                              {/* Actions Column */}
                              <TableCell className="text-center">
                                {isEditing ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <Button
                                      size="sm"
                                      className="h-7 px-2 bg-green-500 hover:bg-green-600 text-white text-xs"
                                      onClick={() => handleSave(row.id!, isNew)}
                                      disabled={createMutation.isPending || updateMutation.isPending}
                                    >
                                      Save
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2"
                                      onClick={() => handleCancel(row.id!, isNew)}
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
                                      onClick={() => handleEdit(row.id!, (row as any).originalGoal)}
                                    >
                                      Edit
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 hover:bg-red-50 dark:hover:bg-red-900/20"
                                      onClick={() => handleDelete(row.id!, data.goal)}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-red-600" />
                                    </Button>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Add New Goal Button */}
                  <div 
                    className="mt-4 p-4 bg-green-50/20 dark:bg-green-900/5 hover:bg-green-50/40 dark:hover:bg-green-900/10 transition-all cursor-pointer border-2 border-dotted border-green-400/60 dark:border-green-600/60 rounded-lg"
                    onClick={() => addNewRow(section.id)}
                  >
                    <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">Click here to add a new goal</span>
                    </div>
                  </div>
                                </div>
                              );
                            })}

                            {/* Add New Section Placeholder */}
                            <div 
                              className="bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-purple-400/60 dark:border-purple-600/60 shadow-sm overflow-hidden cursor-pointer hover:border-purple-500 hover:bg-purple-50/20 dark:hover:bg-purple-900/10 transition-all"
                              onClick={addNewSection}
                            >
                              <div className="px-4 py-6 flex items-center justify-center gap-2 text-purple-600 dark:text-purple-400">
                                <Plus className="w-5 h-5" />
                                <span className="text-base font-semibold">Click here to add a new section</span>
                              </div>
                            </div>
          </div>
        )}
      </div>

      {/* Expand Content Dialog */}
      <Dialog open={!!expandedContent} onOpenChange={() => setExpandedContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {expandedContent?.type === 'goal' ? (
                <>
                  <Target className="w-5 h-5 text-blue-600" />
                  Goal Details
                </>
              ) : (
                <>
                  <Target className="w-5 h-5 text-green-600" />
                  Target Details
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-gray-100">Delete Goal?</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {/* Warning Message */}
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm text-red-800 dark:text-red-300 leading-relaxed">
                This action cannot be undone.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1 h-10 font-medium hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setDeleteConfirmation(null)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 h-10 font-medium bg-red-600 hover:bg-red-700 text-white"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Goal
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function formatDate(d: Date | undefined): string {
  if (!d) return '';
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${month}/${day}`;
}

function formatDateForAPI(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
