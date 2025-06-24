
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  Plus, 
  Edit2, 
  Trash2, 
  Rocket,
  Timer,
  Copy,
  FileDown,
  Send,
  Sparkles
} from "lucide-react";
import MainNavigation from "@/components/navigation/MainNavigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import RetroCard from "@/components/retrospective/RetroCard";
import RetroLane from "@/components/retrospective/RetroLane";
import MoodPoll from "@/components/retrospective/MoodPoll";
import RetroTimer from "@/components/retrospective/RetroTimer";
import ActionSidebar from "@/components/retrospective/ActionSidebar";
import EndRetroDialog from "@/components/retrospective/EndRetroDialog";

interface RetroItem {
  id: string;
  text: string;
  author: string;
  authorAvatar?: string;
  votes: number;
  votedBy: string[];
  lane: 'went-well' | 'didnt-go-well' | 'ideas';
}

const RetrospectiveMeeting = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState("Sprint 15 Retrospective");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [items, setItems] = useState<RetroItem[]>([]);
  const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
  const [retroStatus, setRetroStatus] = useState<'draft' | 'archived'>('draft');
  const [timerMinutes, setTimerMinutes] = useState(15);
  const [currentUser] = useState("current-user"); // Mock current user

  const meeting = {
    title: title,
    date: "2024-06-10",
    endDate: "2024-06-24",
    participants: [
      { name: "John Doe", avatar: "/placeholder.svg?height=32&width=32", email: "john@company.com" },
      { name: "Sarah Wilson", avatar: "/placeholder.svg?height=32&width=32", email: "sarah@company.com" },
      { name: "Mike Chen", avatar: "/placeholder.svg?height=32&width=32", email: "mike@company.com" }
    ]
  };

  const formatDateRange = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}-${endDate.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' })}`;
  };

  const addItem = (lane: RetroItem['lane'], text: string) => {
    if (!text.trim()) return;
    
    const newItem: RetroItem = {
      id: `item-${Date.now()}`,
      text: text.trim(),
      author: currentUser,
      authorAvatar: "/placeholder.svg?height=24&width=24",
      votes: 0,
      votedBy: [],
      lane
    };
    
    setItems(prev => [...prev, newItem]);
  };

  const updateItem = (id: string, text: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, text } : item
    ));
  };

  const deleteItem = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const voteItem = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const hasVoted = item.votedBy.includes(currentUser);
        const userVoteCount = prev.filter(i => i.votedBy.includes(currentUser)).reduce((acc, i) => acc + (i.votedBy.includes(currentUser) ? 1 : 0), 0);
        
        if (!hasVoted && userVoteCount < 3) {
          return {
            ...item,
            votes: item.votes + 1,
            votedBy: [...item.votedBy, currentUser]
          };
        } else if (hasVoted) {
          return {
            ...item,
            votes: item.votes - 1,
            votedBy: item.votedBy.filter(user => user !== currentUser)
          };
        }
      }
      return item;
    }));
  };

  const createTaskFromItem = (item: RetroItem) => {
    console.log(`Creating task from: ${item.text}`);
    // Implementation for creating task would go here
  };

  const handleEndRetro = () => {
    setRetroStatus('archived');
    setIsEndDialogOpen(false);
  };

  const generateSummary = () => {
    console.log("Generating AI summary...");
    // Implementation for AI summary generation would go here
  };

  const getItemsByLane = (lane: RetroItem['lane']) => {
    return items.filter(item => item.lane === lane);
  };

  const getTopVotedItems = () => {
    return items
      .filter(item => item.lane === 'ideas' && item.votes > 0)
      .sort((a, b) => b.votes - a.votes)
      .slice(0, 5);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <MainNavigation />
      
      {/* Page Header */}
      <div className="bg-white/90 backdrop-blur-md border-b border-white/30 shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/meetings')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Meetings
              </Button>
              <span className="text-gray-400">/</span>
              {isEditingTitle ? (
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => setIsEditingTitle(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                  className="font-semibold text-gray-900 border-none p-0 h-auto"
                  autoFocus
                />
              ) : (
                <h1 
                  className="font-semibold text-gray-900 cursor-pointer hover:text-green-600 transition-colors"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {title}
                </h1>
              )}
              <Badge 
                variant={retroStatus === 'draft' ? 'outline' : 'secondary'}
                className={retroStatus === 'draft' ? 'border-amber-300 text-amber-700' : 'bg-gray-100 text-gray-600'}
              >
                {retroStatus === 'draft' ? 'Draft' : 'Archived'}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={generateSummary}
                variant="ghost"
                className="text-gray-600 hover:text-gray-900"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Summary
              </Button>
              <Button
                onClick={() => setIsEndDialogOpen(true)}
                className="bg-green-500 hover:bg-green-600"
                disabled={retroStatus === 'archived'}
              >
                End Retro
              </Button>
            </div>
          </div>

          {/* Meta Row */}
          <div className="flex items-center gap-6 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              {formatDateRange(meeting.date, meeting.endDate)}
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-600" />
              <div className="flex -space-x-2">
                {meeting.participants.map((participant, index) => (
                  <Avatar key={index} className="w-8 h-8 border-2 border-white">
                    <AvatarImage src={participant.avatar} alt={participant.name} />
                    <AvatarFallback className="text-xs">
                      {participant.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                + Invite
              </Button>
            </div>

            <MoodPoll />
            
            <RetroTimer 
              initialMinutes={timerMinutes}
              onTimeUp={() => console.log("Time's up!")}
            />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <div className="flex gap-6">
          {/* Main Retro Board */}
          <div className="flex-1">
            <div className="grid grid-cols-3 gap-6 mb-8">
              <RetroLane
                title="Went Well ✔️"
                color="mint"
                items={getItemsByLane('went-well')}
                onAddItem={(text) => addItem('went-well', text)}
                onUpdateItem={updateItem}
                onDeleteItem={deleteItem}
                onVoteItem={voteItem}
                onCreateTask={createTaskFromItem}
                disabled={retroStatus === 'archived'}
                showVoting={false}
              />
              
              <RetroLane
                title="Didn't Go Well ⚠️"
                color="peach"
                items={getItemsByLane('didnt-go-well')}
                onAddItem={(text) => addItem('didnt-go-well', text)}
                onUpdateItem={updateItem}
                onDeleteItem={deleteItem}
                onVoteItem={voteItem}
                onCreateTask={createTaskFromItem}
                disabled={retroStatus === 'archived'}
                showVoting={false}
              />
              
              <RetroLane
                title="Ideas 💡"
                color="sky"
                items={getItemsByLane('ideas')}
                onAddItem={(text) => addItem('ideas', text)}
                onUpdateItem={updateItem}
                onDeleteItem={deleteItem}
                onVoteItem={voteItem}
                onCreateTask={createTaskFromItem}
                disabled={retroStatus === 'archived'}
                showVoting={true}
                currentUser={currentUser}
              />
            </div>
          </div>

          {/* Action Sidebar */}
          <ActionSidebar
            topVotedItems={getTopVotedItems()}
            items={items}
            onCreateTask={createTaskFromItem}
          />
        </div>
      </div>

      <EndRetroDialog
        open={isEndDialogOpen}
        onOpenChange={setIsEndDialogOpen}
        onConfirm={handleEndRetro}
        retroData={{
          title,
          items,
          participants: meeting.participants.length
        }}
      />
    </div>
  );
};

export default RetrospectiveMeeting;
