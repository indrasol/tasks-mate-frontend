import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { toast } from "sonner";

interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  owner: string;
  targetDate: string;
  comments: number;
  progress: number;
  tags?: string[];
  attachments?: string[];
  createdBy?: string;
  createdDate?: string;
}

const TaskDetail = () => {
  const { taskId } = useParams<{ taskId: string }>();
  const navigate = useNavigate();

  const [task, setTask] = useState<Task | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('');
  const [owner, setOwner] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);

  useEffect(() => {
    const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const foundTask = storedTasks.find((t: Task) => t.id === taskId);

    if (foundTask) {
      setTask(foundTask);
      setName(foundTask.name);
      setDescription(foundTask.description);
      setStatus(foundTask.status);
      setOwner(foundTask.owner);
      setTargetDate(foundTask.targetDate);
      setTags(foundTask.tags || []);
      setAttachments(foundTask.attachments || []);
    } else {
      toast.error('Task not found');
      navigate('/tasks_catalog');
    }
  }, [taskId, navigate]);

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleSaveClick = () => {
    if (!name.trim() || !description.trim() || !status.trim() || !owner.trim() || !targetDate.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }

    const updatedTask = {
      ...task,
      name,
      description,
      status,
      owner,
      targetDate,
      tags,
      attachments,
    };

    const storedTasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const updatedTasks = storedTasks.map((t: Task) => (t.id === taskId ? updatedTask : t));
    localStorage.setItem('tasks', JSON.stringify(updatedTasks));
    localStorage.setItem('taskDetails', JSON.stringify(updatedTask));

    setTask(updatedTask);
    setEditMode(false);
    toast.success('Task updated successfully!');
  };

  const handleCancelClick = () => {
    setEditMode(false);
    setName(task?.name || '');
    setDescription(task?.description || '');
    setStatus(task?.status || '');
    setOwner(task?.owner || '');
    setTargetDate(task?.targetDate || '');
    setTags(task?.tags || []);
    setAttachments(task?.attachments || []);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.pdf,.doc,.docx,.txt,.jpg,.png';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files) {
        handleFilesSelected(Array.from(target.files));
      }
    };
    input.click(); // Fixed: cast to HTMLInputElement to access click method
  };

  const handleFilesSelected = (files: File[]) => {
    const newAttachments = files.map(file => file.name);
    setAttachments([...attachments, ...newAttachments]);
    toast.success(`${files.length} files attached!`);
  };

  const handleRemoveAttachment = (attachmentToRemove: string) => {
    setAttachments(attachments.filter(attachment => attachment !== attachmentToRemove));
  };

  const handleAddComment = useCallback(() => {
    if (newComment.trim()) {
      setComments([...comments, newComment.trim()]);
      setNewComment('');
      toast.success('Comment added!');
    }
  }, [newComment, comments]);

  if (!task) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-4">Task Detail</h1>

      <div className="mb-4">
        <h2 className="text-xl font-semibold">Task ID: {task.id}</h2>
      </div>

      {editMode ? (
        <div>
          <div className="mb-4">
            <Label htmlFor="name">Task Name</Label>
            <Input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="todo">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                    <span>To Do</span>
                  </div>
                </SelectItem>
                <SelectItem value="in-progress">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>In Progress</span>
                  </div>
                </SelectItem>
                <SelectItem value="completed">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span>Completed</span>
                  </div>
                </SelectItem>
                <SelectItem value="blocked">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span>Blocked</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label htmlFor="owner">Owner</Label>
            <Select value={owner} onValueChange={setOwner}>
              <SelectTrigger>
                <SelectValue placeholder="Select owner" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-50">
                <SelectItem value="JD">John Doe (JD)</SelectItem>
                <SelectItem value="SK">Sarah Kim (SK)</SelectItem>
                <SelectItem value="MR">Mike Rodriguez (MR)</SelectItem>
                <SelectItem value="AM">Anna Miller (AM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="mb-4">
            <Label htmlFor="targetDate">Target Date</Label>
            <Input
              type="date"
              id="targetDate"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full"
            />
          </div>

          <div className="mb-4">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1 bg-blue-100 text-blue-800 hover:bg-blue-200">
                  <span>{tag}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-blue-900" onClick={() => handleRemoveTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex mt-2">
              <Input
                type="text"
                placeholder="Add a tag"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                className="mr-2"
              />
              <Button type="button" variant="outline" onClick={handleAddTag} disabled={!newTag.trim()}>
                Add Tag
              </Button>
            </div>
          </div>

          <div className="mb-4">
            <Label>Attachments</Label>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1 bg-green-100 text-green-800 hover:bg-green-200">
                  <span>{attachment}</span>
                  <X className="h-3 w-3 cursor-pointer hover:text-green-900" onClick={() => handleRemoveAttachment(attachment)} />
                </Badge>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={handleFileUpload} className="mt-2">
              Upload Files
            </Button>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleCancelClick}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSaveClick}>
              Save
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <Label>Description</Label>
            <p>{task.description}</p>
          </div>

          <div className="mb-4">
            <Label>Status</Label>
            <p>{task.status}</p>
          </div>

          <div className="mb-4">
            <Label>Owner</Label>
            <p>{task.owner}</p>
          </div>

          <div className="mb-4">
            <Label>Target Date</Label>
            <p>{task.targetDate}</p>
          </div>

          <div className="mb-4">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {task.tags && task.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <Label>Attachments</Label>
            <div className="flex flex-wrap gap-2">
              {attachments.map((attachment, index) => (
                <Badge key={index} variant="secondary" className="flex items-center space-x-1 bg-green-100 text-green-800 hover:bg-green-200">
                  <span>{attachment}</span>
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleEditClick}>Edit</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDetail;
