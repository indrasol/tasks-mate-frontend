
import React from 'react';
import { Image, FileText, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EvidenceGalleryProps {
  runId: string;
}

const EvidenceGallery = ({ runId }: EvidenceGalleryProps) => {
  // Mock evidence data
  const evidence = [
    {
      id: '1',
      type: 'image',
      name: 'login-page-screenshot.png',
      url: '/placeholder.svg',
      testCase: 'TC-001',
      uploadedAt: '2024-12-20T10:30:00Z'
    },
    {
      id: '2',
      type: 'image',
      name: 'task-creation-flow.gif',
      url: '/placeholder.svg',
      testCase: 'TC-002',
      uploadedAt: '2024-12-20T11:15:00Z'
    },
    {
      id: '3',
      type: 'pdf',
      name: 'test-report-summary.pdf',
      url: '#',
      testCase: 'General',
      uploadedAt: '2024-12-20T14:20:00Z'
    }
  ];

  return (
    <div className="space-y-6">
      {evidence.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg border">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Image className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No evidence uploaded</h3>
          <p className="text-gray-500">Upload screenshots, videos, or documents to track test evidence</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {evidence.map((item) => (
            <div key={item.id} className="bg-white rounded-lg border shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {item.type === 'image' ? (
                  <img 
                    src={item.url} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FileText className="w-12 h-12 text-gray-400" />
                )}
              </div>
              
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900 truncate flex-1 mr-2">
                    {item.name}
                  </h4>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {item.testCase}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EvidenceGallery;
