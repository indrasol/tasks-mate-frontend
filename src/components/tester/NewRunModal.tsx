
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface NewRunModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NewRunModal = ({ open, onOpenChange }: NewRunModalProps) => {
  const [formData, setFormData] = useState({
    product: '',
    version: '',
    environment: '',
    testPlan: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Creating new test run:', formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      product: '',
      version: '',
      environment: '',
      testPlan: ''
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Test Run</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="product">Product</Label>
            <Select value={formData.product} onValueChange={(value) => setFormData({...formData, product: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tasksmate-web">TasksMate Web</SelectItem>
                <SelectItem value="tasksmate-mobile">TasksMate Mobile</SelectItem>
                <SelectItem value="tasksmate-api">TasksMate API</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="version">Version</Label>
            <Input
              id="version"
              placeholder="e.g., 2.1.0"
              value={formData.version}
              onChange={(e) => setFormData({...formData, version: e.target.value})}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="environment">Environment</Label>
            <Select value={formData.environment} onValueChange={(value) => setFormData({...formData, environment: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select environment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="testPlan">Test Plan Template</Label>
            <Select value={formData.testPlan} onValueChange={(value) => setFormData({...formData, testPlan: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Select test plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="smoke">Smoke Test</SelectItem>
                <SelectItem value="regression">Regression Test</SelectItem>
                <SelectItem value="integration">Integration Test</SelectItem>
                <SelectItem value="user-acceptance">User Acceptance Test</SelectItem>
              </SelectContent>
            </Select>
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
              Create & Start
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewRunModal;
