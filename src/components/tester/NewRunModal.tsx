
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface NewRunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewRunModal = ({ open, onOpenChange }: NewRunModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    project: '',
    testedBy: '',
    assignedTo: [] as string[]
  });

  // Mock team members data
  const teamMembers = [
    { id: '1', name: 'John Doe' },
    { id: '2', name: 'Jane Smith' },
    { id: '3', name: 'Mike Johnson' },
    { id: '4', name: 'Sarah Wilson' }
  ];

  const handleAssignedToChange = (memberId: string) => {
    const memberName = teamMembers.find(m => m.id === memberId)?.name || '';
    if (!formData.assignedTo.includes(memberName)) {
      setFormData({
        ...formData,
        assignedTo: [...formData.assignedTo, memberName]
      });
    }
  };

  const removeAssignedMember = (memberName: string) => {
    setFormData({
      ...formData,
      assignedTo: formData.assignedTo.filter(name => name !== memberName)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Creating new test book:', formData);
    onOpenChange(false);
    setFormData({
      name: '',
      project: '',
      testedBy: '',
      assignedTo: []
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Test Book</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Book Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              placeholder="Enter book name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select value={formData.project} onValueChange={(value) => setFormData({...formData, project: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tasksmate-web">TasksMate Web</SelectItem>
                <SelectItem value="tasksmate-mobile">TasksMate Mobile</SelectItem>
                <SelectItem value="tasksmate-api">TasksMate API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testedBy">Tested By</Label>
            <Select value={formData.testedBy} onValueChange={(value) => setFormData({...formData, testedBy: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select tester" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers.map((member) => (
                  <SelectItem key={member.id} value={member.name}>
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assignedTo">Assign To</Label>
            <Select onValueChange={handleAssignedToChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select team members" />
              </SelectTrigger>
              <SelectContent>
                {teamMembers
                  .filter(member => !formData.assignedTo.includes(member.name))
                  .map((member) => (
                    <SelectItem key={member.id} value={member.id}>
                      {member.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {formData.assignedTo.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.assignedTo.map((memberName) => (
                  <Badge key={memberName} variant="secondary" className="flex items-center gap-1">
                    {memberName}
                    <X 
                      className="w-3 h-3 cursor-pointer hover:text-red-500" 
                      onClick={() => removeAssignedMember(memberName)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-green-500 hover:bg-green-600 text-white"
            >
              Create
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewRunModal;
