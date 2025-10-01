import React, { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Calendar, CheckCircle, Pause, Target, Archive, Eye, EyeOff, Users } from 'lucide-react';
import { useOrganizationMembers } from '@/hooks/useOrganizationMembers';
import type { GoalStatus } from '@/types/goal';

interface GoalFormProps {
  orgId: string;
  defaultAssigneeId?: string;
  onSubmit: (payload: {
    title: string;
    description?: string;
    category?: string;
    subCategory?: string;
    status: GoalStatus;
    startDate?: string;
    dueDate?: string;
    visibility?: 'org' | 'private';
    assignees: { userId: string; role: 'owner' | 'contributor' | 'viewer' }[];
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const statusOptions: { value: GoalStatus; label: string; icon: any }[] = [
  { value: 'active', label: 'Active', icon: Target },
  { value: 'paused', label: 'Paused', icon: Pause },
  { value: 'done', label: 'Done', icon: CheckCircle },
  { value: 'draft', label: 'Draft', icon: Archive },
];

export default function GoalForm({ orgId, defaultAssigneeId, onSubmit, onCancel, isSubmitting }: GoalFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [status, setStatus] = useState<GoalStatus>('active');

  const [startPopover, setStartPopover] = useState(false);
  const [duePopover, setDuePopover] = useState(false);
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);

  const [visibility, setVisibility] = useState<'org' | 'private'>('org');

  // Assignee selection
  const { data: members = [] } = useOrganizationMembers(orgId);
  const [selectedUsers, setSelectedUsers] = useState<string[]>(defaultAssigneeId ? [String(defaultAssigneeId)] : []);
  const [includeDefaultAssignee, setIncludeDefaultAssignee] = useState<boolean>(!!defaultAssigneeId);

  const isValid = title.trim().length > 0;

  const submit = async () => {
    if (!isValid) return;

    let finalUsers = [...selectedUsers];
    if (includeDefaultAssignee && defaultAssigneeId && !finalUsers.includes(String(defaultAssigneeId))) {
      finalUsers.push(String(defaultAssigneeId));
    }

    const assignees =
      finalUsers.map(uid => ({
        userId: uid,
        role: defaultAssigneeId && String(uid) === String(defaultAssigneeId) ? 'owner' as const : 'contributor' as const,
      }));

    await onSubmit({
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim() || undefined,
      subCategory: subCategory.trim() || undefined,
      status,
      startDate: startDate ? formatDate(startDate) : undefined,
      dueDate: dueDate ? formatDate(dueDate) : undefined,
      visibility,
      assignees,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Goal title" />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={4} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Category</label>
          <Input 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            placeholder="e.g., Revenue, Marketing, Sales" 
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Sub-Category</label>
          <Input 
            value={subCategory} 
            onChange={(e) => setSubCategory(e.target.value)} 
            placeholder="e.g., AI Track, SEO, Content" 
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Status</label>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {statusOptions.map(s => {
          const Icon = s.icon;
          const active = status === s.value;
          return (
            <Button key={s.value} variant={active ? 'default' : 'outline'} onClick={() => setStatus(s.value)} className="justify-start">
              <Icon className="w-4 h-4 mr-2" />
              {s.label}
            </Button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Start Date</label>
          <Popover open={startPopover} onOpenChange={setStartPopover}>
            <PopoverTrigger asChild>
              <Button variant={startDate ? 'default' : 'outline'} className="justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                {startDate ? formatDate(startDate) : 'Not set'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <CalendarComponent
                mode="single"
                selected={startDate as any}
                onSelect={(d: any) => setStartDate(d ?? undefined)}
                className="rounded-md border"
              />
              <div className="mt-2 flex justify-between">
                <Button size="sm" variant="outline" onClick={() => { setStartDate(undefined); setStartPopover(false); }}>Clear</Button>
                <Button size="sm" onClick={() => setStartPopover(false)}>Apply</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Due Date</label>
          <Popover open={duePopover} onOpenChange={setDuePopover}>
            <PopoverTrigger asChild>
              <Button variant={dueDate ? 'default' : 'outline'} className="justify-start">
                <Calendar className="w-4 h-4 mr-2" />
                {dueDate ? formatDate(dueDate) : 'Not set'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <CalendarComponent
                mode="single"
                selected={dueDate as any}
                onSelect={(d: any) => setDueDate(d ?? undefined)}
                className="rounded-md border"
              />
              <div className="mt-2 flex justify-between">
                <Button size="sm" variant="outline" onClick={() => { setDueDate(undefined); setDuePopover(false); }}>Clear</Button>
                <Button size="sm" onClick={() => setDuePopover(false)}>Apply</Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Assignees</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                {selectedUsers.length ? `${selectedUsers.length} Selected` : 'Select assignees'}
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 max-h-72 overflow-auto">
            {members.map((m: any) => {
              const id = String(m.user_id);
              return (
                <DropdownMenuCheckboxItem
                  key={id}
                  checked={selectedUsers.includes(id)}
                  onCheckedChange={(checked) => {
                    setSelectedUsers(checked ? [...selectedUsers, id] : selectedUsers.filter(x => x !== id));
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                      <AvatarFallback className="text-xs">{m.initials}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="text-sm">{m.displayName}</div>
                      <div className="text-[10px] text-gray-500">{m.email}</div>
                    </div>
                  </div>
                </DropdownMenuCheckboxItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {defaultAssigneeId && (
        <div className="flex items-center gap-2">
          <input
            id="include-default-assignee"
            type="checkbox"
            checked={includeDefaultAssignee}
            onChange={(e) => setIncludeDefaultAssignee(e.target.checked)}
          />
          <label htmlFor="include-default-assignee" className="text-sm text-gray-700 dark:text-gray-300">
            Include selected member as Owner
          </label>
        </div>
      )}

      <div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">Visibility</label>
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant={visibility === 'org' ? 'default' : 'outline'}
            onClick={() => setVisibility('org')}
            className="justify-start"
          >
            <Eye className="w-4 h-4 mr-2" />
            Organization
          </Button>
          <Button
            variant={visibility === 'private' ? 'default' : 'outline'}
            onClick={() => setVisibility('private')}
            className="justify-start"
          >
            <EyeOff className="w-4 h-4 mr-2" />
            Private
          </Button>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
        <Button onClick={submit} disabled={!isValid || !!isSubmitting}>{isSubmitting ? 'Creating...' : 'Create Goal'}</Button>
      </div>
    </div>
  );
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}