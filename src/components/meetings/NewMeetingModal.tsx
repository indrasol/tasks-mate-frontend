
import { useState } from 'react';
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

interface NewMeetingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateMeeting: (meetingData: any) => void;
}

const NewMeetingModal = ({ open, onOpenChange, onCreateMeeting }: NewMeetingModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    product: '',
    description: '',
    attendees: [] as string[],
    newAttendee: ''
  });

  const products = ['TasksMate', 'Core Platform', 'Analytics Suite'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date || !formData.product) {
      return;
    }

    onCreateMeeting({
      ...formData,
      id: Date.now().toString(),
      status: 'draft',
      lastUpdated: 'just now'
    });

    // Reset form
    setFormData({
      title: '',
      date: '',
      time: '',
      product: '',
      description: '',
      attendees: [],
      newAttendee: ''
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
      <DialogContent className="sm:max-w-md">
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
            <Label htmlFor="product">Product *</Label>
            <Select value={formData.product} onValueChange={(value) => setFormData(prev => ({ ...prev, product: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product} value={product}>
                    {product}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              Create Meeting
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewMeetingModal;
