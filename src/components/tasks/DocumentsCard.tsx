import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Download, Trash2, ExternalLink, File, Upload } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/projectUtils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

// Helper function to format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface Document {
  id: string;
  name: string;
  url: string;
  size?: number;
  type?: string;
  created_at?: string;
  created_by?: string;
}

interface DocumentsCardProps {
  documents: Document[];
  loading: boolean;
  onUpload: (files: FileList | null) => Promise<void>;
  onDelete: (documentId: string) => Promise<void>;
  onDownload?: (document: Document) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
}

export function DocumentsCard({
  documents = [],
  loading = false,
  onUpload,
  onDelete,
  onDownload,
  maxSizeMB = 10,
  allowedTypes = ['image/*', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/plain'],
}: DocumentsCardProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Validate files
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Check file type
      if (allowedTypes.length > 0 && !allowedTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.split('/*')[0]);
        }
        return file.type === type;
      })) {
        alert(`File type not allowed: ${file.name}`);
        return;
      }
      
      // Check file size (default 10MB)
      if (file.size > maxSizeMB * 1024 * 1024) {
        alert(`File too large: ${file.name}. Max size: ${maxSizeMB}MB`);
        return;
      }
    }
    
    try {
      setIsUploading(true);
      await onUpload(files);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileChange({ target: { files } } as any);
    }
  };

  const getFileIcon = (type?: string) => {
    if (!type) return <FileText className="h-4 w-4 text-gray-500" />;
    
    if (type.startsWith('image/')) {
      return <FileText className="h-4 w-4 text-blue-500" />;
    } else if (type.includes('pdf')) {
      return <FileText className="h-4 w-4 text-red-500" />;
    } else if (type.includes('word') || type.includes('document')) {
      return <FileText className="h-4 w-4 text-blue-600" />;
    } else if (type.includes('excel') || type.includes('spreadsheet')) {
      return <FileText className="h-4 w-4 text-green-600" />;
    } else if (type.includes('text')) {
      return <FileText className="h-4 w-4 text-gray-600" />;
    }
    
    return <FileText className="h-4 w-4 text-gray-400" />;
  };

  if (loading) {
    return (
      <Card className="glass border-0 shadow-tasksmate">
        <CardHeader>
          <CardTitle className="font-sora">Documents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/50">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass border-0 shadow-tasksmate">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-sora">Documents</CardTitle>
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              multiple
              accept={allowedTypes.join(',')}
            />
            <Button
              variant="outline"
              size="sm"
              className="micro-lift"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="animate-spin mr-2">↻</span>
                  Uploading...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center space-y-2">
              <Upload className="h-8 w-8 text-gray-400" />
              <p className="text-gray-500">Drop files here or click to upload</p>
              <p className="text-xs text-gray-400">
                Max {maxSizeMB}MB • {allowedTypes.map(t => t.split('/').pop()).filter(Boolean).join(', ')}
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="h-[200px] pr-3">
            <div className="space-y-2">
              {documents.map((doc) => (
                <div 
                  key={doc.id} 
                  className="group flex items-center justify-between p-3 rounded-lg bg-white/50 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2 rounded-full bg-gray-100">
                      {getFileIcon(doc.type)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {doc.size && (
                          <span>{formatFileSize(doc.size)}</span>
                        )}
                        {doc.created_at && (
                          <span>• {formatDate(doc.created_at)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-500 hover:text-gray-700"
                      onClick={() => onDownload ? onDownload(doc) : window.open(doc.url, '_blank')}
                      title="View"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-blue-500 hover:text-blue-700"
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = doc.url;
                        link.download = doc.name;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={() => onDelete(doc.id)}
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export default DocumentsCard;
