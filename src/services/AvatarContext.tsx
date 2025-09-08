import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/apiService';
import { API_ENDPOINTS } from '@/config';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentOrgId } from '@/hooks/useCurrentOrgId';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';
import { toast } from '@/hooks/use-toast';

interface AvatarContextType {
  avatarUrl: string | null;
  setAvatarUrl: (url: string | null) => void;
  updateAvatar: (file: File) => Promise<string | null>;
  isEnlarged: boolean;
  setIsEnlarged: (isEnlarged: boolean) => void;
  previewUrl: string | null;
  isUploading: boolean;
}

const AvatarContext = createContext<AvatarContextType>({
  avatarUrl: null,
  setAvatarUrl: () => {},
  updateAvatar: async () => null,
  isEnlarged: false,
  setIsEnlarged: () => {},
  previewUrl: null,
  isUploading: false,
});

export const AvatarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const currentOrgId = useCurrentOrgId();
  const { data: currentOrg } = useCurrentOrganization(currentOrgId || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isEnlarged, setIsEnlarged] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize avatar URL from user metadata if available
  useEffect(() => {
    if (user?.user_metadata?.avatar_url) {
      setAvatarUrl(user.user_metadata.avatar_url);
    }
  }, [user]);

  const updateAvatar = async (file: File): Promise<string | null> => {
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    setIsUploading(true);

    toast({
      title: "Uploading avatar",
      description: "Please wait...",
    });

    try {
      // (Optional) Generate optimistic preview while uploading
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewUrl(result);
      };

      // Prepare multipart form data
      const formData = new FormData();
      formData.append('file', file);

      // Pass current organization name if available
      const orgName = currentOrg?.name;
      if (orgName) {
        formData.append('org_name', orgName);
      }

      // Call backend API
      const response = await api.post<{ avatar_url: string }>(`${API_ENDPOINTS.USERS}/upload`, formData);

      const newUrl = response?.avatar_url;
      if (newUrl) {

        setAvatarUrl(newUrl);

        toast({
          title: "Success",
          description: "Avatar uploaded successfully",
        });
        
        // Refresh user session to get updated metadata
        try {
          await supabase.auth.refreshSession();
          // Small delay to ensure metadata is fully synced
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.warn('Failed to refresh session after avatar update:', error);
        }
      }

      return newUrl ?? null;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: "Failed to upload avatar",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <AvatarContext.Provider value={{ 
      avatarUrl, 
      setAvatarUrl, 
      updateAvatar,
      isEnlarged,
      setIsEnlarged,
      previewUrl: isEnlarged ? (previewUrl || avatarUrl) : null,
      isUploading,
    }}>
      {children}
    </AvatarContext.Provider>
  );
};

export const useAvatar = () => useContext(AvatarContext);
