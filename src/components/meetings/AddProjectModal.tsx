
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface AddProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddProject: (projectData: any) => void;
}

const AddProjectModal = ({ open, onOpenChange, onAddProject }: AddProjectModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    teamLead: '',
    members: [] as string[],
    newMember: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Error",
        description: "Project name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.teamLead.trim()) {
      toast({
        title: "Error",
        description: "Team lead is required",
        variant: "destructive"
      });
      return;
    }

    const projectData = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      teamLead: formData.teamLead,
      members: formData.members.map((memberName, index) => ({
        id: (Date.now() + index).toString(),
        name: memberName,
        role: 'Developer'
      }))
    };

    onAddProject(projectData);

    // Reset form
    setFormData({
      name: '',
      description: '',
      teamLead: '',
      members: [],
      newMember: ''
    });
    
    toast({
      title: "Success",
      description: "Project added successfully!",
    });
    
    onOpenChange(false);
  };

  const addMember = () => {
    if (formData.newMember.trim()) {
      setFormData(prev => ({
        ...prev,
        members: [...prev.members, prev.newMember.trim()],
        newMember: ''
      }));
    }
  };

  const removeMember = (index: number) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.filter((_, i) => i !== index)
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addMember();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Project</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Mobile App Development"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the project..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="teamLead">Team Lead *</Label>
            <Input
              id="teamLead"
              placeholder="Team lead name"
              value={formData.teamLead}
              onChange={(e) => setFormData(prev => ({ ...prev, teamLead: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Team Members</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add team member name"
                value={formData.newMember}
                onChange={(e) => setFormData(prev => ({ ...prev, newMember: e.target.value }))}
                onKeyDown={handleKeyDown}
              />
              <Button 
                type="button" 
                onClick={addMember} 
                size="icon" 
                variant="outline"
                className="shrink-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.members.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.members.map((member, index) => (
                  <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
                    <span>{member}</span>
                    <button
                      type="button"
                      onClick={() => removeMember(index)}
                      className="text-gray-500 hover:text-red-500 ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              Add Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProjectModal;
