
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Search, Plus, MessageCircle, Calendar, User, MoreHorizontal, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const TasksCatalog = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const tasks = [
    {
      id: 'T1234',
      name: 'Redesign Dashboard UI',
      description: 'Create modern, responsive dashboard with glassmorphism effects',
      status: 'active',
      progress: 65,
      owner: 'Sarah K.',
      targetDate: '2024-01-15',
      comments: 8,
      hasAiSummary: true
    },
    {
      id: 'T1235',
      name: 'API Integration',
      description: 'Connect frontend with new backend endpoints',
      status: 'blocked',
      progress: 30,
      owner: 'Mike R.',
      targetDate: '2024-01-20',
      comments: 12,
      hasAiSummary: true
    },
    {
      id: 'T1236',
      name: 'User Testing',
      description: 'Conduct usability tests with 10 participants',
      status: 'completed',
      progress: 100,
      owner: 'Alex M.',
      targetDate: '2024-01-10',
      comments: 5,
      hasAiSummary: false
    },
    {
      id: 'T1237',
      name: 'Mobile Optimization',
      description: 'Ensure responsive design works on all devices',
      status: 'pending',
      progress: 0,
      owner: 'Lisa T.',
      targetDate: '2024-01-25',
      comments: 3,
      hasAiSummary: false
    },
    {
      id: 'T1238',
      name: 'Performance Audit',
      description: 'Analyze and optimize application performance',
      status: 'active',
      progress: 45,
      owner: 'John D.',
      targetDate: '2024-01-18',
      comments: 6,
      hasAiSummary: true
    },
    {
      id: 'T1239',
      name: 'Documentation Update',
      description: 'Update API documentation and user guides',
      status: 'active',
      progress: 80,
      owner: 'Emma S.',
      targetDate: '2024-01-12',
      comments: 4,
      hasAiSummary: false
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'active': return 'bg-blue-500';
      case 'blocked': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      blocked: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Top Navigation */}
      <nav className="px-6 py-4 bg-white/50 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-full bg-tasksmate-gradient flex items-center justify-center">
                <Check className="h-5 w-5 text-white" />
              </div>
              <span className="font-sora font-bold text-xl">TasksMate</span>
            </Link>
            <div className="h-6 w-px bg-gray-300"></div>
            <h1 className="font-sora font-semibold text-lg">Task Catalog</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <Avatar className="w-8 h-8">
              <AvatarFallback>SK</AvatarFallback>
            </Avatar>
            <Button className="bg-tasksmate-gradient hover:scale-105 transition-transform duration-200">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div className="px-6 py-4 bg-white/30 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-tasksmate-gradient' : ''}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-tasksmate-gradient' : ''}
              >
                List
              </Button>
            </div>
            
            <div className="flex items-center space-x-2">
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Owner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="sarah">Sarah K.</SelectItem>
                  <SelectItem value="mike">Mike R.</SelectItem>
                  <SelectItem value="alex">Alex M.</SelectItem>
                </SelectContent>
              </Select>
              
              <Select>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="blocked">Blocked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by keyword or ID (e.g. T1234)"
              className="pl-10 glass border-0"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="px-6 py-8">
        <div className="max-w-7xl mx-auto">
          <div className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {tasks.map((task) => (
              <Card key={task.id} className="glass border-0 shadow-tasksmate micro-lift group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-1 h-8 rounded-full ${getStatusColor(task.status)}`}></div>
                      <div>
                        <Badge variant="secondary" className="text-xs font-mono">
                          {task.id}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {task.hasAiSummary && (
                        <Badge className="bg-tasksmate-gradient text-white border-0 text-xs">
                          <Zap className="mr-1 h-3 w-3" />
                          AI
                        </Badge>
                      )}
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <Link to={`/tasks/${task.id}`}>
                    <div className="space-y-2 cursor-pointer">
                      <h3 className="font-sora font-semibold text-lg leading-tight hover:text-tasksmate-green-end transition-colors">
                        {task.name}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-2">
                        {task.description}
                      </p>
                    </div>
                  </Link>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Progress</span>
                      <span className="text-xs font-medium">{task.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-tasksmate-gradient h-2 rounded-full transition-all duration-300"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarFallback className="text-xs">
                          {task.owner.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs text-gray-600">{task.owner}</span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={`${getStatusBadge(task.status)} text-xs`}>
                        {task.status}
                      </Badge>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">{new Date(task.targetDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-gray-500">
                        <MessageCircle className="h-3 w-3" />
                        <span className="text-xs">{task.comments}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {tasks.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-tasksmate-gradient/20 flex items-center justify-center mx-auto mb-4">
                <Plus className="h-8 w-8 text-tasksmate-green-end" />
              </div>
              <h3 className="font-sora font-semibold text-lg mb-2">No tasks yet</h3>
              <p className="text-gray-600 mb-4">Create your first task to get started</p>
              <Button className="bg-tasksmate-gradient">
                <Plus className="mr-2 h-4 w-4" />
                New Task
              </Button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TasksCatalog;
