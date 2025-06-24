
import React, { useState } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import MainNavigation from "@/components/navigation/MainNavigation";
import ScratchpadButton from "@/components/scratchpad/ScratchpadButton";
import ScratchpadDrawer from "@/components/scratchpad/ScratchpadDrawer";

const Projects = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isScratchpadOpen, setIsScratchpadOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/');
    }
  }, [user, loading, navigate]);

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Navigation */}
      <MainNavigation onScratchpadOpen={() => setIsScratchpadOpen(true)} />

      {/* Main Content - adjusted for left sidebar */}
      <div className="ml-64 transition-all duration-300">
        {/* Page Header */}
        <div className="px-6 py-6 bg-white/50 border-b border-gray-200">
          <div className="max-w-7xl mx-auto">
            <h1 className="font-sora font-bold text-2xl text-gray-900 mb-2">Projects</h1>
            <p className="text-gray-600">Manage and organize your projects</p>
          </div>
        </div>

        {/* Projects Content */}
        <div className="px-6 py-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">Projects page coming soon!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scratchpad Components */}
      <ScratchpadButton onClick={() => setIsScratchpadOpen(true)} />
      <ScratchpadDrawer 
        open={isScratchpadOpen} 
        onOpenChange={setIsScratchpadOpen} 
      />
    </div>
  );
};

export default Projects;
