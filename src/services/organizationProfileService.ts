import { api } from './apiService';

export interface CoreValue {
  id?: string;
  title: string;
  description: string;
  icon?: string;
  order: number;
  created_at?: string;
}

export interface OrganizationProfile {
  id?: string;
  org_id: string;
  vision?: string;
  mission?: string;
  core_values: CoreValue[];
  company_culture?: string;
  founding_year?: number;
  industry?: string;
  company_size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
  headquarters?: string;
  website_url?: string;
  sustainability_goals?: string;
  diversity_commitment?: string;
  community_involvement?: string;
  created_by?: string;
  last_updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OrganizationProfileResponse {
  success: boolean;
  message: string;
  data: OrganizationProfile;
}

/**
 * Get organization profile by organization ID
 */
export const getOrganizationProfile = async (orgId: string): Promise<OrganizationProfile> => {
  try {
    const response = await api.get<OrganizationProfileResponse>(`/organizations/profile/${orgId}`);
    
    // Check if response is HTML (indicates wrong endpoint or route not found)
    if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
      console.warn('Organization profile endpoint not found, returning default profile structure');
      return createDefaultProfile(orgId);
    }
    
    if (response && response.success && response.data) {
      return response.data;
    } else {
      // Return default profile instead of throwing error
      return createDefaultProfile(orgId);
    }
  } catch (error: any) {
    // Always return default profile structure instead of throwing errors
    // This ensures the UI always works even if the profile doesn't exist yet
    console.warn('Organization profile not available, using default structure:', error.message);
    return createDefaultProfile(orgId);
  }
};

// Helper function to create default profile structure
const createDefaultProfile = (orgId: string): OrganizationProfile => ({
  org_id: orgId,
  vision: '',
  mission: '',
  core_values: [],
  company_culture: '',
  founding_year: undefined,
  industry: '',
  company_size: undefined,
  headquarters: '',
  website_url: '',
  sustainability_goals: '',
  diversity_commitment: '',
  community_involvement: '',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

/**
 * Update organization profile
 */
export const updateOrganizationProfile = async (
  orgId: string, 
  profileData: Partial<OrganizationProfile>
): Promise<OrganizationProfile> => {
  try {
    // Clean up the data before sending
    const cleanData = { ...profileData };
    
    // Remove undefined values and clean up empty strings
    Object.keys(cleanData).forEach(key => {
      const value = (cleanData as any)[key];
      if (value === undefined || value === null) {
        delete (cleanData as any)[key];
      } else if (typeof value === 'string' && value.trim() === '') {
        (cleanData as any)[key] = '';
      }
    });
    
    // Remove org_id, id, and timestamp fields as they shouldn't be updated
    delete cleanData.org_id;
    delete cleanData.id;
    delete cleanData.created_at;
    delete cleanData.updated_at;
    delete cleanData.created_by;
    delete cleanData.last_updated_by;
    
    const response = await api.put<OrganizationProfileResponse>(
      `/organizations/profile/${orgId}`, 
      cleanData
    );
    
    // Check if response is HTML (indicates endpoint not available)
    if (typeof response === 'string' && response.includes('<!DOCTYPE html>')) {
      throw new Error('Organization profile feature is not yet available. Please try again later.');
    }
    
    if (response && response.success && response.data) {
      return response.data;
    } else {
      throw new Error(response?.message || 'Failed to update organization profile');
    }
  } catch (error: any) {
    console.error('Error updating organization profile:', error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('<!DOCTYPE html>') || error.message?.includes('not yet available')) {
      throw new Error('Organization profile feature is not yet available. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to update organization profile');
  }
};

/**
 * Create organization profile
 */
export const createOrganizationProfile = async (
  orgId: string, 
  profileData: Partial<OrganizationProfile>
): Promise<OrganizationProfile> => {
  try {
    // Clean up the data before sending
    const cleanData = { ...profileData };
    
    // Remove undefined values and clean up empty strings
    Object.keys(cleanData).forEach(key => {
      const value = (cleanData as any)[key];
      if (value === undefined || value === null) {
        delete (cleanData as any)[key];
      } else if (typeof value === 'string' && value.trim() === '') {
        (cleanData as any)[key] = '';
      }
    });
    
    // Remove org_id, id, and timestamp fields
    delete cleanData.org_id;
    delete cleanData.id;
    delete cleanData.created_at;
    delete cleanData.updated_at;
    delete cleanData.created_by;
    delete cleanData.last_updated_by;
    
    const response = await api.post<OrganizationProfileResponse>(
      `/organizations/profile/${orgId}`, 
      cleanData
    );
    
    if (response.success) {
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to create organization profile');
    }
  } catch (error: any) {
    console.error('Error creating organization profile:', error);
    throw new Error(error.message || 'Failed to create organization profile');
  }
};

/**
 * Delete organization profile
 */
export const deleteOrganizationProfile = async (orgId: string): Promise<void> => {
  try {
    const response = await api.del<{success: boolean, message: string}>(`/organizations/profile/${orgId}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Failed to delete organization profile');
    }
  } catch (error: any) {
    console.error('Error deleting organization profile:', error);
    throw new Error(error.message || 'Failed to delete organization profile');
  }
};

/**
 * Validate core value data
 */
export const validateCoreValue = (value: Partial<CoreValue>): string[] => {
  const errors: string[] = [];
  
  if (!value.title || value.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (value.title.length > 100) {
    errors.push('Title must be 100 characters or less');
  }
  
  if (!value.description || value.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (value.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }
  
  return errors;
};

/**
 * Validate organization profile data
 */
export const validateOrganizationProfile = (profile: Partial<OrganizationProfile>): string[] => {
  const errors: string[] = [];
  
  // Validate text field lengths
  if (profile.vision && profile.vision.length > 1000) {
    errors.push('Vision statement must be 1000 characters or less');
  }
  
  if (profile.mission && profile.mission.length > 1000) {
    errors.push('Mission statement must be 1000 characters or less');
  }
  
  if (profile.company_culture && profile.company_culture.length > 2000) {
    errors.push('Company culture description must be 2000 characters or less');
  }
  
  if (profile.industry && profile.industry.length > 100) {
    errors.push('Industry must be 100 characters or less');
  }
  
  if (profile.headquarters && profile.headquarters.length > 200) {
    errors.push('Headquarters must be 200 characters or less');
  }
  
  if (profile.sustainability_goals && profile.sustainability_goals.length > 1500) {
    errors.push('Sustainability goals must be 1500 characters or less');
  }
  
  if (profile.diversity_commitment && profile.diversity_commitment.length > 1500) {
    errors.push('Diversity commitment must be 1500 characters or less');
  }
  
  if (profile.community_involvement && profile.community_involvement.length > 1500) {
    errors.push('Community involvement must be 1500 characters or less');
  }
  
  // Validate founding year
  if (profile.founding_year) {
    const currentYear = new Date().getFullYear();
    if (profile.founding_year < 1800 || profile.founding_year > currentYear) {
      errors.push(`Founding year must be between 1800 and ${currentYear}`);
    }
  }
  
  // Validate website URL
  if (profile.website_url && profile.website_url.trim()) {
    const urlPattern = /^https?:\/\/.+/i;
    if (!urlPattern.test(profile.website_url)) {
      errors.push('Website URL must start with http:// or https://');
    }
  }
  
  // Validate core values
  if (profile.core_values) {
    if (profile.core_values.length > 10) {
      errors.push('Maximum 10 core values allowed');
    }
    
    const titles = profile.core_values.map(v => v.title?.trim().toLowerCase()).filter(Boolean);
    const uniqueTitles = new Set(titles);
    if (titles.length !== uniqueTitles.size) {
      errors.push('Core value titles must be unique');
    }
    
    profile.core_values.forEach((value, index) => {
      const valueErrors = validateCoreValue(value);
      valueErrors.forEach(error => {
        errors.push(`Core value ${index + 1}: ${error}`);
      });
    });
  }
  
  return errors;
};

/**
 * Get company size display text
 */
export const getCompanySizeDisplay = (size?: string): string => {
  switch (size) {
    case 'startup':
      return 'Startup (1-10 employees)';
    case 'small':
      return 'Small (11-50 employees)';
    case 'medium':
      return 'Medium (51-200 employees)';
    case 'large':
      return 'Large (201-1000 employees)';
    case 'enterprise':
      return 'Enterprise (1000+ employees)';
    default:
      return 'Not specified';
  }
};

/**
 * Generate unique ID for new core values
 */
export const generateCoreValueId = (): string => {
  return `cv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
