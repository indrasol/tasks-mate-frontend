// components/FeedbackForm.tsx
import MainNavigation from '@/components/navigation/MainNavigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { API_ENDPOINTS } from '@/config';
import { toast } from '@/hooks/use-toast';
import { api } from '@/services/apiService';
import React, { useEffect, useState } from 'react';

const moduleNames = [
    'Organizations',
    'Projects',
    'Tasks',
    'Bug Trackers',
    'Bugs',
    'Members Management',
];

const feedbackTypes = ['Bug', 'Suggestion', 'General'];

const FeedbackForm: React.FC = () => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedModule, setSelectedModule] = useState('');
    const [feedbackType, setFeedbackType] = useState('');
    const [message, setMessage] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
        window.addEventListener('sidebar-toggle', handler);
        setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
        return () => window.removeEventListener('sidebar-toggle', handler);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModule || !feedbackType || !message) {
            toast({
                title: "Error",
                description: "Please fill in all required fields.",
                variant: "destructive"
            });
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post(API_ENDPOINTS.FEEDBACK, {
                module: selectedModule,
                type: feedbackType,
                message
            });

            // Reset form
            setSelectedModule('');
            setFeedbackType('');
            setMessage('');
            setEmail('');

            toast({
                title: "Success",
                description: "Thank you for your feedback! We'll review it shortly.",
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Error",
                description: "Failed to submit feedback. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            <MainNavigation />

            <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
                <div className="px-8 py-6 bg-white/50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-sora font-bold text-2xl text-gray-900 mb-1">Submit Feedback</h1>
                            <p className="text-sm text-muted-foreground">
                                Share your thoughts, report issues, or suggest improvements
                            </p>
                        </div>
                    </div>
                </div>

                <div className="px-8 py-6">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="module" className="text-sm font-medium">
                                    Module <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={selectedModule}
                                    onValueChange={setSelectedModule}
                                    required
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a module" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {moduleNames.map((mod) => (
                                            <SelectItem key={mod} value={mod}>
                                                {mod}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-sm font-medium">
                                    Feedback Type <span className="text-destructive">*</span>
                                </Label>
                                <RadioGroup
                                    value={feedbackType}
                                    onValueChange={setFeedbackType}
                                    className="space-y-2"
                                >
                                    {feedbackTypes.map((type) => (
                                        <div key={type} className="flex items-center space-x-2">
                                            <RadioGroupItem value={type} id={type} />
                                            <Label htmlFor={type} className="font-normal cursor-pointer">
                                                {type}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message" className="text-sm font-medium">
                                    Feedback Message <span className="text-destructive">*</span>
                                </Label>
                                <Textarea
                                    id="message"
                                    rows={6}
                                    placeholder="Please provide detailed feedback..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                    required
                                    className="min-h-[120px]"
                                />
                            </div>

                            <div className="flex justify-end pt-2">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-6"
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeedbackForm;
