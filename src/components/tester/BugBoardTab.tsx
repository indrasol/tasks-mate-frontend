
import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface BugBoardTabProps {
  runId: string;
}

const BugBoardTab = ({ runId }: BugBoardTabProps) => {
  return (
    <div className="text-center py-16">
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ExternalLink className="w-12 h-12 text-blue-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Bug Board</h3>
        <p className="text-gray-500 mb-6">
          Manage and track bugs in a dedicated Kanban board view
        </p>
        <Button asChild className="bg-green-500 hover:bg-green-600 text-white">
          <Link to={`/tester-zone/runs/${runId}/bugs`}>
            Open Bug Board
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default BugBoardTab;
