import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Award,
  Building2,
  CheckCircle2,
  Compass,
  Edit,
  Eye,
  Globe,
  HandHeart,
  Heart,
  Leaf,
  Lightbulb,
  Loader2,
  Plus,
  Save,
  Shield,
  Star,
  Target,
  Users,
  X,
  Zap
} from 'lucide-react';
import React, { useCallback, useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useCurrentOrganization } from '@/hooks/useCurrentOrganization';

import {
  CoreValue,
  generateCoreValueId,
  getCompanySizeDisplay,
  getOrganizationProfile,
  OrganizationProfile,
  updateOrganizationProfile,
  validateCoreValue,
  validateOrganizationProfile
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

interface CoreValuesCardProps {
  canEdit: boolean;
  isSectionEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  renderCoreValues: React.ReactNode;
}

const CoreValuesCard: React.FC<CoreValuesCardProps> = ({
  canEdit,
  isSectionEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  renderCoreValues
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-600" />
              Core Values
            </CardTitle>
            <CardDescription className="text-xs">
              The fundamental beliefs and principles that guide your organization
            </CardDescription>
          </div>
          {canEdit && (
            <div className="flex justify-end gap-2">
              {isSectionEditing ? (
                <>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={onSave} disabled={isSaving} title={isSaving ? "Saving..." : "Save"}>
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 text-green-600 animate-spin" /></>
                    ) : (
                      <><Save className="h-4 w-4 text-green-600" /></>
                    )}
                  </Button>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onCancel} disabled={isSaving} title="Cancel">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>

                </>
              ) : (
                <Button variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0" onClick={onEdit}>
                  <Edit className="h-4 w-4 text-green-600 mr-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {renderCoreValues}
      </CardContent>
    </Card>
  );
};

interface CompanyDetailsCardProps {
  canEdit: boolean;
  isSectionEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  profile?: OrganizationProfile;
  editData: Partial<OrganizationProfile>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<OrganizationProfile>>>;
}

const CompanyDetailsCard: React.FC<CompanyDetailsCardProps> = ({
  canEdit,
  isSectionEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  profile,
  editData,
  setEditData
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              Company Details
            </CardTitle>
            <CardDescription className="text-xs">
              Basic information about your organization
            </CardDescription>
          </div>
          {canEdit && (
            <div className="flex justify-end gap-2">
              {isSectionEditing ? (
                <>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={onSave} disabled={isSaving} title={isSaving ? "Saving..." : "Save"}>
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 text-green-600 animate-spin" /></>
                    ) : (
                      <><Save className="h-4 w-4 text-green-600" /></>
                    )}
                  </Button>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onCancel} disabled={isSaving} title="Cancel">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0" onClick={onEdit}>
                  <Edit className="h-4 w-4 text-green-600 mr-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="industry">Industry</Label>
            {isSectionEditing ? (
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
            {isSectionEditing ? (
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
            {isSectionEditing ? (
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
            {isSectionEditing ? (
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
            {isSectionEditing ? (
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
            {isSectionEditing ? (
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
  );
};

interface SustainabilityCardProps {
  canEdit: boolean;
  isSectionEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  profile?: OrganizationProfile;
  editData: Partial<OrganizationProfile>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<OrganizationProfile>>>;
}

const SustainabilityCard: React.FC<SustainabilityCardProps> = ({
  canEdit,
  isSectionEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  profile,
  editData,
  setEditData
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <Leaf className="w-5 h-5 text-green-600" />
              Sustainability
            </CardTitle>
            <CardDescription className="text-xs">Environmental and sustainability goals</CardDescription>
          </div>
          {canEdit && (
            <div className="flex justify-end gap-2">
              {isSectionEditing ? (
                <>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={onSave} disabled={isSaving} title={isSaving ? "Saving..." : "Save"}>
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 text-green-600 animate-spin" /></>
                    ) : (
                      <><Save className="h-4 w-4 text-green-600" /></>
                    )}
                  </Button>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onCancel} disabled={isSaving} title="Cancel">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0" onClick={onEdit}>
                  <Edit className="h-4 w-4 text-green-600 mr-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSectionEditing ? (
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
  );
};

interface DiversityCardProps {
  canEdit: boolean;
  isSectionEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  profile?: OrganizationProfile;
  editData: Partial<OrganizationProfile>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<OrganizationProfile>>>;
}

const DiversityCard: React.FC<DiversityCardProps> = ({
  canEdit,
  isSectionEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  profile,
  editData,
  setEditData
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-600" />
              Diversity & Inclusion
            </CardTitle>
            <CardDescription className="text-xs">Commitment to diversity and inclusion</CardDescription>
          </div>
          {canEdit && (
            <div className="flex justify-end gap-2">
              {isSectionEditing ? (
                <>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={onSave} disabled={isSaving} title={isSaving ? "Saving..." : "Save"}>
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 text-green-600 animate-spin" /></>
                    ) : (
                      <><Save className="h-4 w-4 text-green-600" /></>
                    )}
                  </Button>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onCancel} disabled={isSaving} title="Cancel">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0" onClick={onEdit}>
                  <Edit className="h-4 w-4 text-green-600 mr-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSectionEditing ? (
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
  );
};

interface CommunityImpactCardProps {
  canEdit: boolean;
  isSectionEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
  profile?: OrganizationProfile;
  editData: Partial<OrganizationProfile>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<OrganizationProfile>>>;
}

const CommunityImpactCard: React.FC<CommunityImpactCardProps> = ({
  canEdit,
  isSectionEditing,
  isSaving,
  onEdit,
  onCancel,
  onSave,
  profile,
  editData,
  setEditData
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <HandHeart className="w-5 h-5 text-blue-600" />
              Community Impact
            </CardTitle>
            <CardDescription className="text-xs">Community involvement and social impact</CardDescription>
          </div>
          {canEdit && (
            <div className="flex justify-end gap-2">
              {isSectionEditing ? (
                <>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={onSave} disabled={isSaving} title={isSaving ? "Saving..." : "Save"}>
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 text-green-600 animate-spin" /></>
                    ) : (
                      <><Save className="h-4 w-4 text-green-600" /></>
                    )}
                  </Button>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onCancel} disabled={isSaving} title="Cancel">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0" onClick={onEdit}>
                  <Edit className="h-4 w-4 text-green-600 mr-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSectionEditing ? (
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
  );
};

// Extracted section components (Phase 1: Mission & Vision)
interface MissionCardProps {
  profile?: OrganizationProfile;
  editData: Partial<OrganizationProfile>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<OrganizationProfile>>>;
}

const MissionCard: React.FC<MissionCardProps & {
  canEdit: boolean;
  isSectionEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}> = ({ profile, editData, setEditData, canEdit, isSectionEditing, isSaving, onEdit, onCancel, onSave }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Mission Statement
            </CardTitle>
            <CardDescription className="text-xs">
              What your organization does and why it exists
            </CardDescription>
          </div>
          {canEdit && (
            <div className="flex justify-end gap-2">
              {isSectionEditing ? (
                <>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={onSave} disabled={isSaving} title={isSaving ? "Saving..." : "Save"}>
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 text-green-600 animate-spin" /></>
                    ) : (
                      <><Save className="h-4 w-4 text-green-600" /></>
                    )}
                  </Button>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onCancel} disabled={isSaving} title="Cancel">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0" onClick={onEdit}>
                  <Edit className="h-4 w-4 text-green-600 mr-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSectionEditing ? (
          <Textarea
            value={editData.mission || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, mission: e.target.value }))}
            placeholder="Enter your organization's mission statement..."
            rows={4}
            maxLength={1000}
            className="resize-none"
          />
        ) : (
          <div className="min-h-[100px] flex">
            {profile?.mission ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {profile.mission}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center justify-center items-center w-full">
                No mission statement defined
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface VisionCardProps {
  profile?: OrganizationProfile;
  editData: Partial<OrganizationProfile>;
  setEditData: React.Dispatch<React.SetStateAction<Partial<OrganizationProfile>>>;
}

const VisionCard: React.FC<VisionCardProps & {
  canEdit: boolean;
  isSectionEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onCancel: () => void;
  onSave: () => void;
}> = ({ profile, editData, setEditData, canEdit, isSectionEditing, isSaving, onEdit, onCancel, onSave }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-md flex items-center gap-2">
              <Eye className="w-5 h-5 text-purple-600" />
              Vision Statement
            </CardTitle>
            <CardDescription className="text-xs">
              Your organization's aspirational future state
            </CardDescription>
          </div>
          {canEdit && (
            <div className="flex justify-end gap-2">
              {isSectionEditing ? (
                <>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 ml-2"
                    onClick={onSave} disabled={isSaving} title={isSaving ? "Saving..." : "Save"}>
                    {isSaving ? (
                      <><Loader2 className="h-4 w-4 text-green-600 animate-spin" /></>
                    ) : (
                      <><Save className="h-4 w-4 text-green-600" /></>
                    )}
                  </Button>
                  <Button variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={onCancel} disabled={isSaving} title="Cancel">
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </>
              ) : (
                <Button variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0" onClick={onEdit}>
                  <Edit className="h-4 w-4 text-green-600 mr-2" />
                </Button>
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isSectionEditing ? (
          <Textarea
            value={editData.vision || ''}
            onChange={(e) => setEditData(prev => ({ ...prev, vision: e.target.value }))}
            placeholder="Enter your organization's vision statement..."
            rows={4}
            maxLength={1000}
            className="resize-none"
          />
        ) : (
          <div className="min-h-[100px] flex">
            {profile?.vision ? (
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                {profile.vision}
              </p>
            ) : (
              <p className="text-xs text-gray-500 dark:text-gray-400 italic text-center justify-center items-center w-full">
                No vision statement defined
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
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
  
  // Get current organization data for the name
  const { data: currentOrg } = useCurrentOrganization(orgId);
  // Per-section editing state for all sections
  const [editingSections, setEditingSections] = useState({
    mission: false,
    vision: false,
    core_values: false,
    company_details: false,
    sustainability: false,
    diversity: false,
    community: false
  });

  // Per-section saving state for all sections
  const [savingSections, setSavingSections] = useState({
    mission: false,
    vision: false,
    core_values: false,
    company_details: false,
    sustainability: false,
    diversity: false,
    community: false
  });
  const [editData, setEditData] = useState<Partial<OrganizationProfile>>({});
  const [newValue, setNewValue] = useState<Partial<CoreValue>>({
    title: '',
    description: '',
    icon: 'star',
    order: 1
  });
  const [isAddingValue, setIsAddingValue] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);


  // Section field mappings for per-section editing
  const sectionFields = {
    mission: ['mission'] as const,
    vision: ['vision'] as const,
    core_values: ['core_values'] as const,
    company_details: [
      'company_culture',
      'founding_year',
      'industry',
      'company_size',
      'website_url',
      'headquarters'
    ] as const,
    sustainability: ['sustainability_goals'] as const,
    diversity: ['diversity_commitment'] as const,
    community: ['community_involvement'] as const,
  };

  const pick = <T extends object, K extends readonly (keyof T)[]>(obj: T, keys: K) => {
    const out = {} as Partial<T>;
    (keys as readonly (keyof T)[]).forEach((k) => {
      if (obj[k] !== undefined) out[k] = obj[k];
    });
    return out;
  };

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

  // Section-specific save handler for all sections
  const handleSaveSection = useCallback((section: keyof typeof sectionFields) => {
    const fields = sectionFields[section];
    const payload = pick(editData as OrganizationProfile, fields);

    // Special validation for core_values section
    if (section === 'core_values') {
      // Core values validation is handled separately when adding/removing values
      // No additional validation needed here
    } else {
      const errors = validateOrganizationProfile(payload as Partial<OrganizationProfile>);
      if (errors.length > 0) {
        setValidationErrors(errors);
        toast({
          title: 'Validation Error',
          description: 'Please fix the validation errors for this section before saving.',
          variant: 'destructive',
        });
        return;
      }
    }

    setValidationErrors([]);
    setSavingSections((prev) => ({ ...prev, [section]: true }));

    updateMutation.mutate(payload, {
      onSuccess: () => {
        setEditingSections((prev) => ({ ...prev, [section]: false }));
        setSavingSections((prev) => ({ ...prev, [section]: false }));
      },
      onError: () => {
        setSavingSections((prev) => ({ ...prev, [section]: false }));
      }
    });
  }, [editData, updateMutation]);

  // Section-specific edit handler for all sections
  const handleEditSection = useCallback((section: keyof typeof sectionFields) => {
    const fields = sectionFields[section];
    const sectionData = pick((profile || {}) as OrganizationProfile, fields);

    // Special handling for core_values section
    if (section === 'core_values') {
      setEditData((prev) => ({
        ...prev,
        core_values: profile?.core_values || []
      }));
    } else {
      setEditData((prev) => ({ ...prev, ...sectionData }));
    }

    setEditingSections((prev) => ({ ...prev, [section]: true }));
    setValidationErrors([]);
  }, [profile]);

  // Section-specific cancel handler for all sections
  const handleCancelSection = useCallback((section: keyof typeof sectionFields) => {
    const fields = sectionFields[section];
    const reset = pick((profile || {}) as OrganizationProfile, fields);
    setEditData((prev) => ({ ...prev, ...reset }));
    setEditingSections((prev) => ({ ...prev, [section]: false }));
    setValidationErrors([]);

    // Special handling for core_values section
    if (section === 'core_values') {
      setIsAddingValue(false);
      setNewValue({ title: '', description: '', icon: 'star', order: 1 });
    }
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

  // Global handler functions
  const handleGlobalEdit = useCallback(() => {
    // Enable editing for all sections and populate editData with current profile data
    setEditData(profile || {});
    setEditingSections({
      mission: true,
      vision: true,
      core_values: true,
      company_details: true,
      sustainability: true,
      diversity: true,
      community: true
    });
    setValidationErrors([]);
  }, [profile]);

  const handleGlobalCancel = useCallback(() => {
    // Cancel editing for all sections and reset data
    setEditingSections({
      mission: false,
      vision: false,
      core_values: false,
      company_details: false,
      sustainability: false,
      diversity: false,
      community: false
    });

    // Reset all edit data to original profile data
    setEditData({});

    // Reset core values specific state
    setIsAddingValue(false);
    setNewValue({ title: '', description: '', icon: 'star', order: 1 });
    setValidationErrors([]);
  }, []);

  const handleGlobalSave = useCallback(() => {
    // Validate all sections before saving
    const allErrors: string[] = [];

    // Validate organization profile fields
    const profileErrors = validateOrganizationProfile(editData as Partial<OrganizationProfile>);
    allErrors.push(...profileErrors);

    // Validate core values if they exist
    if (editData.core_values) {
      editData.core_values.forEach((value, index) => {
        const valueErrors = validateCoreValue(value);
        valueErrors.forEach(error => {
          allErrors.push(`Core Value ${index + 1}: ${error}`);
        });
      });
    }

    if (allErrors.length > 0) {
      setValidationErrors(allErrors);
      toast({
        title: 'Validation Error',
        description: 'Please fix the validation errors before saving.',
        variant: 'destructive',
      });
      return;
    }

    // Save all data
    setValidationErrors([]);

    // Set all sections to saving state
    setSavingSections({
      mission: true,
      vision: true,
      core_values: true,
      company_details: true,
      sustainability: true,
      diversity: true,
      community: true
    });

    updateMutation.mutate(editData, {
      onSuccess: () => {
        // Turn off editing for all sections
        setEditingSections({
          mission: false,
          vision: false,
          core_values: false,
          company_details: false,
          sustainability: false,
          diversity: false,
          community: false
        });

        // Turn off saving state for all sections
        setSavingSections({
          mission: false,
          vision: false,
          core_values: false,
          company_details: false,
          sustainability: false,
          diversity: false,
          community: false
        });

        // Reset core values specific state
        setIsAddingValue(false);
        setNewValue({ title: '', description: '', icon: 'star', order: 1 });
      },
      onError: () => {
        // Turn off saving state for all sections on error
        setSavingSections({
          mission: false,
          vision: false,
          core_values: false,
          company_details: false,
          sustainability: false,
          diversity: false,
          community: false
        });
      }
    });
  }, [editData, updateMutation]);

  const renderCoreValues = useMemo(() => {

    const values = editingSections.core_values ? editData.core_values : profile?.core_values;

    return (
      <div className="flex flex-1 gap-4 items-start justify-between">

        {(!values || values.length === 0) &&

          (
            <div className="flex flex-1 justify-center items-center">

              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Heart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-md font-medium mb-2">No core values defined yet</p>
                <p className="text-xs">Define the fundamental beliefs that guide your organization</p>
                {
                  canEdit && !editingSections.core_values && !isAddingValue && (
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setEditingSections(prev => ({ ...prev, core_values: true }));
                        setIsAddingValue(true); // Automatically show the form when no values exist
                      }}
                      className="mt-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                    >
                      <Plus className="w-6 h-6 mr-2" />
                      Add Core Value
                    </Button>
                  )
                }
                {/* {canEdit && !editingSections.core_values && (
            <Button
              variant="outline"
              onClick={() => {
                setEditingSections(prev => ({ ...prev, core_values: true }));
                setIsAddingValue(true); // Automatically show the form when no values exist
              }}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Core Values
            </Button>
          )} */}
              </div>
            </div>
          )
        }


        {(values && values.length > 0) && (
          // include scroll
          <div className="overflow-auto w-full" style={{ maxHeight: '350px' }}>

            <div className="flex flex-1 justify-start items-start flex-wrap gap-2 w-auto">
              {values?.map((value, index) => {
                const IconComponent = VALUE_ICONS[value.icon as keyof typeof VALUE_ICONS] || Star;

                return (
                  <Card key={value.id || index} className="w-full group hover:shadow-md transition-all duration-200 p-0 m-1">
                    <CardHeader className="px-4 pt-4 pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1 flex-1 min-w-0">
                          <div className="p-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex-shrink-0">
                            <IconComponent className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <CardTitle className="text-md font-semibold truncate">{value.title}</CardTitle>
                        </div>
                        {editingSections.core_values && (
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                            {index < values?.length - 1 && (
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
                    <CardContent className="px-4 py-2">
                      <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Add New Value Card */}
        {editingSections.core_values && (
          <>
            <Card className="">
              <CardContent className="flex items-center justify-center h-full min-h-[160px]">
                {
                  // isAddingValue ? 
                  (
                    <div className="w-full space-y-2">
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="value-icon">Icon</Label>
                        <Select value={newValue.icon || 'star'} onValueChange={(value) => setNewValue(prev => ({ ...prev, icon: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an icon" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(VALUE_ICONS).map(([key, IconComponent]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <IconComponent className="w-4 h-4" />
                                  <span className="capitalize">{key.replace('_', ' ')}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 mt-2">
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
                          placeholder="Describe this core value and its importance to your organization..."
                          rows={3}
                          maxLength={500}
                        />
                      </div>

                      <div className="flex gap-2 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddValue}
                          className="w-full text-green-600 border-green-600 hover:bg-green-50 hover:text-green-700"
                          title="Add Value"
                          disabled={!newValue.title || !newValue.description}
                        >
                          {/* <Plus className="h-4 w-4 mr-2" /> */}
                          Add Value
                        </Button>
                        {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingValue(false)}
                        className="text-red-600 border-red-600 hover:bg-red-50 hover:text-red-700"
                        title="Cancel"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button> */}
                      </div>
                    </div>
                  )
                  // : (
                  //   <Button
                  //     variant="ghost"
                  //     onClick={() => setIsAddingValue(true)}
                  //     className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                  //   >
                  //     <Plus className="w-6 h-6 mr-2" />
                  //     Add Core Value
                  //   </Button>
                  // )
                }
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }, [profile?.core_values, editData.core_values, editingSections.core_values, isAddingValue, newValue, canEdit, handleRemoveValue, handleAddValue, handleMoveValue]);

  // Show loading state if no orgId or if data is loading
  if (!orgId || isLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
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
        <div className="space-y-4 p-4 pb-20">

          {/* Header with Action Buttons */}
          {canEdit && (
            <Alert>
              <Building2 className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">
                      Welcome to{' '}
                      <span className="text-green-600 dark:text-green-400 font-bold">
                        {currentOrg?.name || 'your Organization'}
                      </span>{' '}
                      Profile!
                    </p>
                    <div className="flex gap-2">
                      {Object.values(editingSections).some(Boolean) ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleGlobalCancel}
                            disabled={Object.values(savingSections).some(Boolean)}
                            className="border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                          >
                            ✕ Cancel All
                          </Button>
                          <Button
                            size="sm"
                            onClick={handleGlobalSave}
                            disabled={Object.values(savingSections).some(Boolean)}
                            className="bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0"
                          >
                            {Object.values(savingSections).some(Boolean) ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Saving All...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                💾 Save All Changes
                              </>
                            )}
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          onClick={handleGlobalEdit}
                          className={`${
                            profile && !profile.mission && !profile.vision && (!profile.core_values || profile.core_values.length === 0)
                              ? "bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transition-all duration-200 border-0"
                              : "bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 hover:border-gray-400 transition-all duration-200"
                          }`}>
                          {profile && !profile.mission && !profile.vision && (!profile.core_values || profile.core_values.length === 0)
                            ? "✨ Start Building Profile"
                            : "✏️ Edit All Sections"
                          }
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs mb-2">
                    This is where you can define your organization's identity. Start by adding your mission statement,
                    vision, and core values to help your team understand what drives your organization.
                  </p>
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
                      <li key={index} className="text-xs">{error}</li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Mission & Vision */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MissionCard
              profile={profile}
              editData={editData}
              setEditData={setEditData}
              canEdit={canEdit}
              isSectionEditing={editingSections.mission}
              isSaving={savingSections.mission}
              onEdit={() => handleEditSection('mission')}
              onCancel={() => handleCancelSection('mission')}
              onSave={() => handleSaveSection('mission')}
            />
            <VisionCard
              profile={profile}
              editData={editData}
              setEditData={setEditData}
              canEdit={canEdit}
              isSectionEditing={editingSections.vision}
              isSaving={savingSections.vision}
              onEdit={() => handleEditSection('vision')}
              onCancel={() => handleCancelSection('vision')}
              onSave={() => handleSaveSection('vision')}
            />
          </div>

          {/* Core Values */}
          <CoreValuesCard
            canEdit={canEdit}
            isSectionEditing={editingSections.core_values}
            isSaving={savingSections.core_values}
            onEdit={() => handleEditSection('core_values')}
            onCancel={() => handleCancelSection('core_values')}
            onSave={() => handleSaveSection('core_values')}
            renderCoreValues={renderCoreValues}
          />

          {/* Company Details */}
          <CompanyDetailsCard
            profile={profile}
            editData={editData}
            setEditData={setEditData}
            canEdit={canEdit}
            isSectionEditing={editingSections.company_details}
            isSaving={savingSections.company_details}
            onEdit={() => handleEditSection('company_details')}
            onCancel={() => handleCancelSection('company_details')}
            onSave={() => handleSaveSection('company_details')}
          />

          {/* Social Impact & Commitments */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SustainabilityCard
              profile={profile}
              editData={editData}
              setEditData={setEditData}
              canEdit={canEdit}
              isSectionEditing={editingSections.sustainability}
              isSaving={savingSections.sustainability}
              onEdit={() => handleEditSection('sustainability')}
              onCancel={() => handleCancelSection('sustainability')}
              onSave={() => handleSaveSection('sustainability')}
            />
            <DiversityCard
              profile={profile}
              editData={editData}
              setEditData={setEditData}
              canEdit={canEdit}
              isSectionEditing={editingSections.diversity}
              isSaving={savingSections.diversity}
              onEdit={() => handleEditSection('diversity')}
              onCancel={() => handleCancelSection('diversity')}
              onSave={() => handleSaveSection('diversity')}
            />
            <CommunityImpactCard
              profile={profile}
              editData={editData}
              setEditData={setEditData}
              canEdit={canEdit}
              isSectionEditing={editingSections.community}
              isSaving={savingSections.community}
              onEdit={() => handleEditSection('community')}
              onCancel={() => handleCancelSection('community')}
              onSave={() => handleSaveSection('community')}
            />
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
