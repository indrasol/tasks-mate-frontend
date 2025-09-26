import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Building2, 
  Target, 
  Eye, 
  Heart, 
  Globe, 
  Users, 
  MapPin, 
  Calendar,
  Leaf,
  HandHeart,
  Save,
  Plus,
  X,
  Edit3,
  Lightbulb,
  Star,
  Shield,
  Zap,
  Award,
  Compass,
  Loader2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/hooks/use-toast';

import { 
  OrganizationProfile, 
  CoreValue, 
  getOrganizationProfile, 
  updateOrganizationProfile,
  validateOrganizationProfile,
  validateCoreValue,
  getCompanySizeDisplay,
  generateCoreValueId
} from '@/services/organizationProfileService';

// Icon mapping for core values
const VALUE_ICONS = {
  lightbulb: Lightbulb,
  star: Star,
  shield: Shield,
  zap: Zap,
  award: Award,
  compass: Compass,
  heart: Heart,
  users: Users,
  target: Target,
  globe: Globe
};

interface OrganizationProfileTabProps {
  orgId: string;
  canEdit: boolean;
}

const OrganizationProfileTab: React.FC<OrganizationProfileTabProps> = ({ 
  orgId, 
  canEdit 
}) => {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<OrganizationProfile>>({});
  const [newValue, setNewValue] = useState<Partial<CoreValue>>({ 
    title: '', 
    description: '', 
    icon: 'star',
    order: 1
  });
  const [isAddingValue, setIsAddingValue] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Fetch organization profile
  const {
    data: profile,
    isLoading,
    error,
    isError
  } = useQuery({
    queryKey: ['organization-profile', orgId],
    queryFn: () => getOrganizationProfile(orgId),
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on 403/404 errors
      if (error?.message?.includes('403') || error?.message?.includes('404') || 
          error?.message?.includes('Not Found') || error?.message?.includes('Forbidden')) {
        return false;
      }
      return failureCount < 2;
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<OrganizationProfile>) => 
      updateOrganizationProfile(orgId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-profile', orgId] });
      setIsEditing(false);
      setValidationErrors([]);
      toast({
        title: "Profile Updated",
        description: "Organization profile has been successfully updated.",
        variant: "default"
      });
    },
    onError: (error: any) => {
      console.error('Update error:', error);
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update organization profile. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Initialize edit data when profile loads
  useEffect(() => {
    if (profile && !isEditing) {
      setEditData(profile);
    }
  }, [profile, isEditing]);

  // Reset validation errors when editing stops
  useEffect(() => {
    if (!isEditing) {
      setValidationErrors([]);
    }
  }, [isEditing]);

  const handleSave = useCallback(() => {
    // Validate data before saving
    const errors = validateOrganizationProfile(editData);
    
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast({
        title: "Validation Error",
        description: "Please fix the validation errors before saving.",
        variant: "destructive"
      });
      return;
    }

    setValidationErrors([]);
    updateMutation.mutate(editData);
  }, [editData, updateMutation]);

  const handleCancel = useCallback(() => {
    setEditData(profile || {});
    setIsEditing(false);
    setIsAddingValue(false);
    setNewValue({ title: '', description: '', icon: 'star', order: 1 });
    setValidationErrors([]);
  }, [profile]);

  const handleAddValue = useCallback(() => {
    const errors = validateCoreValue(newValue);
    if (errors.length > 0) {
      toast({
        title: "Validation Error",
        description: errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    if (!newValue.title || !newValue.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in both title and description for the core value",
        variant: "destructive"
      });
      return;
    }

    const coreValue: CoreValue = {
      id: generateCoreValueId(),
      title: newValue.title,
      description: newValue.description,
      icon: newValue.icon || 'star',
      order: (editData.core_values?.length || 0) + 1,
      created_at: new Date().toISOString()
    };

    setEditData(prev => ({
      ...prev,
      core_values: [...(prev.core_values || []), coreValue]
    }));

    setNewValue({ title: '', description: '', icon: 'star', order: 1 });
    setIsAddingValue(false);
  }, [newValue, editData.core_values]);

  const handleRemoveValue = useCallback((index: number) => {
    setEditData(prev => ({
      ...prev,
      core_values: prev.core_values?.filter((_, i) => i !== index) || []
    }));
  }, []);

  const handleMoveValue = useCallback((fromIndex: number, toIndex: number) => {
    if (!editData.core_values) return;
    
    const values = [...editData.core_values];
    const [moved] = values.splice(fromIndex, 1);
    values.splice(toIndex, 0, moved);
    
    // Update order values
    const updatedValues = values.map((value, index) => ({
      ...value,
      order: index + 1
    }));

    setEditData(prev => ({
      ...prev,
      core_values: updatedValues
    }));
  }, [editData.core_values]);

  const renderCoreValues = useMemo(() => {
    const values = isEditing ? editData.core_values : profile?.core_values;
    if (!values || values.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No core values defined yet</p>
          <p className="text-sm">Define the fundamental beliefs that guide your organization</p>
          {canEdit && !isEditing && (
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Core Values
            </Button>
          )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {values.map((value, index) => {
          const IconComponent = VALUE_ICONS[value.icon as keyof typeof VALUE_ICONS] || Star;
          
          return (
            <Card key={value.id || index} className="relative group hover:shadow-md transition-all duration-200">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                      <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-lg font-semibold truncate">{value.title}</CardTitle>
                  </div>
                  {isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveValue(index, index - 1)}
                          className="text-gray-500 hover:text-blue-600 p-1 h-auto"
                          title="Move up"
                        >
                          ↑
                        </Button>
                      )}
                      {index < values.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMoveValue(index, index + 1)}
                          className="text-gray-500 hover:text-blue-600 p-1 h-auto"
                          title="Move down"
                        >
                          ↓
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveValue(index)}
                        className="text-red-500 hover:text-red-700 p-1 h-auto"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {value.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Add New Value Card */}
        {isEditing && (
          <Card className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
            <CardContent className="flex items-center justify-center h-full min-h-[160px]">
              {isAddingValue ? (
                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="value-title">Title</Label>
                    <Input
                      id="value-title"
                      value={newValue.title || ''}
                      onChange={(e) => setNewValue(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g., Innovation Excellence"
                      maxLength={100}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value-description">Description</Label>
                    <Textarea
                      id="value-description"
                      value={newValue.description || ''}
                      onChange={(e) => setNewValue(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe this core value..."
                      maxLength={500}
                      rows={3}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="value-icon">Icon</Label>
                    <Select 
                      value={newValue.icon} 
                      onValueChange={(value) => setNewValue(prev => ({ ...prev, icon: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(VALUE_ICONS).map(([key, IconComp]) => (
                          <SelectItem key={key} value={key}>
                            <div className="flex items-center gap-2">
                              <IconComp className="w-4 h-4" />
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddValue}>Add Value</Button>
                    <Button size="sm" variant="outline" onClick={() => setIsAddingValue(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  onClick={() => setIsAddingValue(true)}
                  className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                >
                  <Plus className="w-6 h-6 mr-2" />
                  Add Core Value
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }, [profile?.core_values, editData.core_values, isEditing, isAddingValue, newValue, canEdit, handleRemoveValue, handleAddValue, handleMoveValue]);

  // Show loading state if no orgId or if data is loading
  if (!orgId || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">
            {!orgId ? 'Loading organization...' : 'Loading organization profile...'}
          </p>
        </div>
      </div>
    );
  }

  // Remove the error state since we now always return a default profile
  // if (isError) {
  //   return (
  //     <div className="text-center py-8">
  //       <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
  //       <p className="text-red-600 dark:text-red-400 mb-4">
  //         {error?.message || 'Failed to load organization profile'}
  //       </p>
  //       <Button variant="outline" onClick={() => window.location.reload()}>
  //         Retry
  //       </Button>
  //     </div>
  //   );
  // }

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <div className="space-y-6 p-6 pb-20">
      {/* Action Buttons */}
      {canEdit && (
        <div className="flex justify-end gap-2">
          {isEditing ? (
            <>
              <Button 
                variant="outline" 
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSave}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={() => setIsEditing(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              {profile && !profile.mission && !profile.vision && (!profile.core_values || profile.core_values.length === 0)
                ? "Start Building Profile"
                : "Edit Profile"
              }
            </Button>
          )}
        </div>
      )}

      {/* Welcome Message for Empty Profile */}
      {profile && !profile.mission && !profile.vision && (!profile.core_values || profile.core_values.length === 0) && !isEditing && canEdit && (
        <Alert>
          <Building2 className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium">Welcome to your Organization Profile!</p>
              <p className="text-sm">
                This is where you can define your organization's identity. Start by adding your mission statement, 
                vision, and core values to help your team understand what drives your organization.
              </p>
              <Button onClick={() => setIsEditing(true)} className="mt-2">
                <Plus className="w-4 h-4 mr-2" />
                Start Building Profile
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Please fix the following errors:</p>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index} className="text-sm">{error}</li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Mission & Vision */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Mission Statement
            </CardTitle>
            <CardDescription>
              What your organization does and why it exists
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.mission || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, mission: e.target.value }))}
                placeholder="Enter your organization's mission statement..."
                rows={4}
                maxLength={1000}
                className="resize-none"
              />
            ) : (
              <div className="min-h-[100px] flex items-center">
                {profile?.mission ? (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {profile.mission}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No mission statement defined
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Vision Statement
            </CardTitle>
            <CardDescription>
              Your organization's aspirational future state
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.vision || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, vision: e.target.value }))}
                placeholder="Enter your organization's vision statement..."
                rows={4}
                maxLength={1000}
                className="resize-none"
              />
            ) : (
              <div className="min-h-[100px] flex items-center">
                {profile?.vision ? (
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {profile.vision}
                  </p>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 italic">
                    No vision statement defined
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Core Values */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-600" />
            Core Values
          </CardTitle>
          <CardDescription>
            The fundamental beliefs and principles that guide your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderCoreValues}
        </CardContent>
      </Card>

      {/* Company Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-green-600" />
            Company Details
          </CardTitle>
          <CardDescription>
            Basic information about your organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              {isEditing ? (
                <Input
                  id="industry"
                  value={editData.industry || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, industry: e.target.value }))}
                  placeholder="e.g., Technology, Healthcare"
                  maxLength={100}
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 py-2">
                  {profile?.industry || 'Not specified'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company-size">Company Size</Label>
              {isEditing ? (
                <Select 
                  value={editData.company_size || ''} 
                  onValueChange={(value) => setEditData(prev => ({ ...prev, company_size: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup (1-10)</SelectItem>
                    <SelectItem value="small">Small (11-50)</SelectItem>
                    <SelectItem value="medium">Medium (51-200)</SelectItem>
                    <SelectItem value="large">Large (201-1000)</SelectItem>
                    <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 py-2">
                  {getCompanySizeDisplay(profile?.company_size)}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="founding-year">Founded</Label>
              {isEditing ? (
                <Input
                  id="founding-year"
                  type="number"
                  value={editData.founding_year || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, founding_year: parseInt(e.target.value) || undefined }))}
                  placeholder="e.g., 2020"
                  min="1800"
                  max="2030"
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 py-2">
                  {profile?.founding_year || 'Not specified'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="headquarters">Headquarters</Label>
              {isEditing ? (
                <Input
                  id="headquarters"
                  value={editData.headquarters || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, headquarters: e.target.value }))}
                  placeholder="e.g., San Francisco, CA"
                  maxLength={200}
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 py-2">
                  {profile?.headquarters || 'Not specified'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              {isEditing ? (
                <Input
                  id="website"
                  type="url"
                  value={editData.website_url || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, website_url: e.target.value }))}
                  placeholder="https://www.example.com"
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 py-2">
                  {profile?.website_url ? (
                    <a 
                      href={profile.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {profile.website_url}
                    </a>
                  ) : (
                    'Not specified'
                  )}
                </p>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-culture">Company Culture</Label>
              {isEditing ? (
                <Textarea
                  id="company-culture"
                  value={editData.company_culture || ''}
                  onChange={(e) => setEditData(prev => ({ ...prev, company_culture: e.target.value }))}
                  placeholder="Describe your company culture, work environment, and team dynamics..."
                  rows={3}
                  maxLength={2000}
                  className="resize-none"
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  {profile?.company_culture || 'Not specified'}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Impact & Commitments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Sustainability
            </CardTitle>
            <CardDescription>Environmental and sustainability goals</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.sustainability_goals || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, sustainability_goals: e.target.value }))}
                placeholder="Describe your sustainability initiatives..."
                rows={4}
                maxLength={1500}
                className="resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed min-h-[100px]">
                {profile?.sustainability_goals || 'Not specified'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Diversity & Inclusion
            </CardTitle>
            <CardDescription>Commitment to diversity and inclusion</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.diversity_commitment || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, diversity_commitment: e.target.value }))}
                placeholder="Describe your D&I initiatives..."
                rows={4}
                maxLength={1500}
                className="resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed min-h-[100px]">
                {profile?.diversity_commitment || 'Not specified'}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-blue-600" />
              Community Impact
            </CardTitle>
            <CardDescription>Community involvement and social impact</CardDescription>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.community_involvement || ''}
                onChange={(e) => setEditData(prev => ({ ...prev, community_involvement: e.target.value }))}
                placeholder="Describe your community involvement..."
                rows={4}
                maxLength={1500}
                className="resize-none"
              />
            ) : (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed min-h-[100px]">
                {profile?.community_involvement || 'Not specified'}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Last Updated Info */}
      {profile?.updated_at && (
        <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-4 border-t">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Last updated on {new Date(profile.updated_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default OrganizationProfileTab;
