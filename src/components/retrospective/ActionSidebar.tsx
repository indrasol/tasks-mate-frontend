
import { Rocket, TrendingUp, Users, Clock, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface RetroItem {
  id: string;
  text: string;
  author: string;
  authorAvatar?: string;
  votes: number;
  votedBy: string[];
  lane: 'went-well' | 'didnt-go-well' | 'ideas';
}

interface ActionSidebarProps {
  topVotedItems: RetroItem[];
  items: RetroItem[];
  onCreateTask: (item: RetroItem) => void;
}

const ActionSidebar = ({ topVotedItems, items, onCreateTask }: ActionSidebarProps) => {
  const totalItems = items.length;
  const wentWellCount = items.filter(item => item.lane === 'went-well').length;
  const didntGoWellCount = items.filter(item => item.lane === 'didnt-go-well').length;
  const ideasCount = items.filter(item => item.lane === 'ideas').length;
  const totalVotes = items.reduce((sum, item) => sum + item.votes, 0);

  // Mock mood average (would be calculated from actual poll data)
  const moodAverage = 72; // percentage

  return (
    <div className="w-80 space-y-6">
      {/* Top-Voted Ideas */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-green-600" />
            Top-Voted Ideas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {topVotedItems.length === 0 ? (
            <p className="text-sm text-gray-500 italic">No voted ideas yet</p>
          ) : (
            topVotedItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-relaxed">{item.text}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {item.votes} votes
                    </Badge>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => onCreateTask(item)}
                  className="bg-green-500 hover:bg-green-600 shrink-0"
                >
                  <Rocket className="w-3 h-3 mr-1" />
                  Task
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Retro Stats */}
      <Card className="bg-white/80 backdrop-blur-sm border border-white/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-blue-600" />
            Retro Stats
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Total Items by Lane */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Items by Lane</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-green-200"></div>
                  Went Well
                </span>
                <Badge variant="outline">{wentWellCount}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-orange-200"></div>
                  Didn't Go Well
                </span>
                <Badge variant="outline">{didntGoWellCount}</Badge>
              </div>
              
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-blue-200"></div>
                  Ideas
                </span>
                <Badge variant="outline">{ideasCount}</Badge>
              </div>
            </div>
            
            <div className="pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm font-medium">
                <span>Total Items</span>
                <Badge className="bg-gray-100 text-gray-700">{totalItems}</Badge>
              </div>
            </div>
          </div>

          {/* Mood Poll Average */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Team Mood</h4>
            <div className="flex items-center gap-3">
              <Progress value={moodAverage} className="flex-1" />
              <Badge variant="outline" className="bg-green-50 text-green-700">
                {moodAverage}%
              </Badge>
            </div>
            <p className="text-xs text-gray-500">Overall team satisfaction</p>
          </div>

          {/* Total Votes */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Engagement</h4>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Votes Cast</span>
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                {totalVotes}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ActionSidebar;
