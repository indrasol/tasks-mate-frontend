
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import MainNavigation from "@/components/navigation/MainNavigation";
import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/config';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';

const Scratchpad = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSaveCheck, setShowSaveCheck] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const currentOrgId = useCurrentOrgId();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const handler = (e: any) => setSidebarCollapsed(e.detail.collapsed);
    window.addEventListener('sidebar-toggle', handler);
    setSidebarCollapsed(getComputedStyle(document.documentElement).getPropertyValue('--sidebar-width').trim() === '4rem');
    return () => window.removeEventListener('sidebar-toggle', handler);
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/', {
                      state: {
                          redirectTo: location.pathname + location.search
                      },
                      replace: true
                  });
    }
  }, [user, loading, navigate]);

  // remove auto-save; only manual save
  // Load content on mount
  useEffect(() => {
    const fetchScratchpad = async () => {
      if (!currentOrgId) return;
      try {
        const res = await api.get<any>(`${API_ENDPOINTS.SCRATCHPADS}/${currentOrgId}`);
        if (res && typeof res.content === 'string') {
          setContent(res.content);
          if (res.updated_at) {
            setLastSaved(new Date(res.updated_at));
          }
        }
      } catch (err) {
        console.error('Failed to load scratchpad', err);
      }
    };
    fetchScratchpad();
  }, [currentOrgId]);

  // Format current date and time
  const getCurrentDateTime = () => {
    const now = new Date();
    return now.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleClear = async () => {
    setContent('');
    if (!currentOrgId) {
      setLastSaved(null);
      return;
    }
    try {
      await api.post<any>(`${API_ENDPOINTS.SCRATCHPADS}`, {
        org_id: currentOrgId,
        content: '',
      });
      setLastSaved(new Date());
      setShowSaveCheck(true);
      setTimeout(() => setShowSaveCheck(false), 2000);
    } catch (err) {
      console.error('Failed to clear scratchpad', err);
    }
  };

  const handleSave = async () => {
    if (!currentOrgId || !content.trim()) return;
    try {
      await api.post<any>(`${API_ENDPOINTS.SCRATCHPADS}`, {
        org_id: currentOrgId,
        content,
      });
      setLastSaved(new Date());
      setShowSaveCheck(true);
      setTimeout(() => setShowSaveCheck(false), 2000);
    } catch (err) {
      console.error('Failed to save scratchpad', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle slash commands
    if (e.key === '/') {
      // TODO: Implement slash menu for /task and /meeting
      console.log('Slash command triggered');
    }

    // Handle Cmd+Enter for todo conversion
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      // TODO: Implement "Convert highlighted todos" modal
      console.log('Convert todos triggered');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-tasksmate-green-end"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <MainNavigation />

      {/* Main Content - adjusted for left sidebar */}
      <div className="transition-all duration-300" style={{ marginLeft: sidebarCollapsed ? '4rem' : '16rem' }}>
        {/* Page Header */}
        <div className="px-8 py-4 bg-white/50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-sora font-bold text-2xl text-gray-900 dark:text-white mb-1">Scratchpad</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">{getCurrentDateTime()}</p>
            </div>
            <div className="flex items-center space-x-3">
              {showSaveCheck && (
                <div className="flex items-center text-green-600 animate-fade-in">
                  <Check className="w-4 h-4 mr-1" />
                  <span className="text-sm">Saved</span>
                </div>
              )}
              <Button variant="ghost" onClick={handleSave}>
                Save
              </Button>
              <Button variant="ghost" onClick={handleClear}>
                Clear
              </Button>
            </div>
          </div>
        </div>

        {/* Scratchpad Content */}
        <div className="px-8 py-6">
          <div className="">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Start typing… Scratch your content here"
                className="min-h-[calc(100vh-300px)] resize-none border-0 focus:ring-0 focus-visible:ring-0 p-6 text-base leading-relaxed dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                style={{
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                }}
              />
            </div>

            {lastSaved && (
              <div className="mt-4 text-center text-sm text-gray-500">
                Last saved: {lastSaved.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scratchpad;
