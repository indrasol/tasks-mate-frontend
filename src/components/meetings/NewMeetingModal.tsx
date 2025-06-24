
import { useState, useEffect } from 'react';
import { Calendar, Plus, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface NewMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateMeeting: (meetingData: any) => void;
  defaultDate?: string;
}

const NewMeetingModal = ({ open, onOpenChange, onCreateMeeting, defaultDate }: NewMeetingModalProps) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    meetingType: '',
    description: '',
    attendees: [] as string[],
    newAttendee: '',
    isRecurring: false,
    recurringDays: 1,
    isSameDay: false
  });

  const meetingTypes = ['Status Call', 'Retrospective', 'Knowshare', 'Product Call', 'Ad-hoc'];

  // Set default date when modal opens
  useEffect(() => {
    if (open && defaultDate) {
      setFormData(prev => ({ ...prev, date: defaultDate }));
    }
  }, [open, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Meeting title is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.date) {
      toast({
        title: "Error", 
        description: "Meeting date is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.meetingType) {
      toast({
        title: "Error",
        description: "Please select a meeting type",
        variant: "destructive"
      });
      return;
    }

    const meetingData = {
      ...formData,
      id: Date.now().toString(),
      status: 'draft',
      lastUpdated: 'just now'
    };

    onCreateMeeting(meetingData);

    // Reset form
    setFormData({
      title: '',
      date: '',
      time: '',
      meetingType: '',
      description: '',
      attendees: [],
      newAttendee: '',
      isRecurring: false,
      recurringDays: 1,
      isSameDay: false
    });
    
    toast({
      title: "Success",
      description: formData.isRecurring 
        ? `Recurring meeting created for ${formData.recurringDays} ${formData.isSameDay ? 'weeks' : 'days'}!`
        : "Meeting created successfully!",
    });
    
    onOpenChange(false);
  };

  const addAttendee = () => {
    if (formData.newAttendee.trim()) {
      setFormData(prev => ({
        ...prev,
        attendees: [...prev.attendees, prev.newAttendee.trim()],
        newAttendee: ''
      }));
    }
  };

  const removeAttendee = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attendees: prev.attendees.filter((_, i) => i !== index)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-500" />
            Create New Meeting
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Meeting Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Product Strategy Review"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="meetingType">Meeting Type *</Label>
            <Select value={formData.meetingType} onValueChange={(value) => setFormData(prev => ({ ...prev, meetingType: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select meeting type" />
              </SelectTrigger>
              <SelectContent>
                {meetingTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isRecurring: !!checked }))}
              />
              <Label htmlFor="recurring" className="text-sm font-medium">
                Make this a recurring meeting
              </Label>
            </div>
            
            {formData.isRecurring && (
              <div className="space-y-3 ml-6">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="sameDay"
                    checked={formData.isSameDay}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isSameDay: !!checked }))}
                  />
                  <Label htmlFor="sameDay" className="text-sm font-medium">
                    Same day every week
                  </Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="recurringDays">
                    Number of {formData.isSameDay ? 'weeks' : 'days'} to repeat
                  </Label>
                  <Input
                    id="recurringDays"
                    type="number"
                    min="1"
                    max="365"
                    value={formData.recurringDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringDays: parseInt(e.target.value) || 1 }))}
                    placeholder={formData.isSameDay ? "e.g., 4" : "e.g., 30"}
                  />
                  <p className="text-xs text-gray-500">
                    {formData.isSameDay 
                      ? `This will create the meeting every week on the same day for ${formData.recurringDays} weeks`
                      : `This will create the meeting for ${formData.recurringDays} consecutive days`
                    }
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Brief description of the meeting..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Attendees</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Add attendee email"
                value={formData.newAttendee}
                onChange={(e) => setFormData(prev => ({ ...prev, newAttendee: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
              />
              <Button type="button" onClick={addAttendee} size="icon" variant="outline">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {formData.attendees.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.attendees.map((attendee, index) => (
                  <div key={index} className="flex items-center gap-1 bg-gray-100 rounded-full px-3 py-1 text-sm">
                    <span>{attendee}</span>
                    <button
                      type="button"
                      onClick={() => removeAttendee(index)}
                      className="text-gray-500 hover:text-red-500"
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
              {formData.isRecurring 
                ? `Create ${formData.recurringDays} ${formData.isSameDay ? 'Weekly' : 'Daily'} Meetings` 
                : 'Create Meeting'
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewMeetingModal;
