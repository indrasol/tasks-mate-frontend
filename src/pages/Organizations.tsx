
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Search, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Organization {
  id: string;
  name: string;
  plan: string;
  billing_email?: string;
  project_count: number;
}

const Organizations = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgBillingEmail, setNewOrgBillingEmail] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchOrganizations();
    }
  }, [user]);

  const fetchOrganizations = async () => {
    try {
      console.log('Fetching organizations for user:', user?.id);
      
      // Get organizations through user_organizations junction table
      const { data: userOrgs, error: userOrgsError } = await supabase
        .from('user_organizations')
        .select(`
          organization_id,
          role,
          organizations (
            id,
            name,
            plan,
            billing_email
          )
        `)
        .eq('user_id', user?.id);

      if (userOrgsError) {
        console.error('Error fetching user organizations:', userOrgsError);
        throw userOrgsError;
      }

      console.log('User organizations data:', userOrgs);

      if (!userOrgs || userOrgs.length === 0) {
        console.log('No organizations found for user');
        setOrganizations([]);
        setLoading(false);
        return;
      }

      // Get project counts for each organization
      const orgIds = userOrgs.map(uo => uo.organization_id);
      const { data: projectCounts, error: projectError } = await supabase
        .from('projects')
        .select('organization_id')
        .in('organization_id', orgIds);

      if (projectError) {
        console.error('Error fetching project counts:', projectError);
      }

      // Count projects per organization
      const projectCountMap = (projectCounts || []).reduce((acc, project) => {
        acc[project.organization_id] = (acc[project.organization_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Format organizations data
      const formattedOrgs = userOrgs
        .filter(uo => uo.organizations) // Filter out any null organizations
        .map(uo => ({
          id: uo.organizations.id,
          name: uo.organizations.name,
          plan: uo.organizations.plan,
          billing_email: uo.organizations.billing_email,
          project_count: projectCountMap[uo.organization_id] || 0
        }));

      console.log('Formatted organizations:', formattedOrgs);
      setOrganizations(formattedOrgs);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setCreating(true);
    try {
      console.log('Creating organization:', newOrgName);
      
      const { data, error } = await supabase
        .from('organizations')
        .insert({
          name: newOrgName.trim(),
          billing_email: newOrgBillingEmail.trim() || null
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating organization:', error);
        throw error;
      }

      console.log('Organization created:', data);

      toast({
        title: "Success",
        description: "Organization created successfully"
      });

      setIsCreateModalOpen(false);
      setNewOrgName('');
      setNewOrgBillingEmail('');
      
      // Navigate to dashboard with new org_id
      navigate(`/?org_id=${data.id}`);
    } catch (error) {
      console.error('Error creating organization:', error);
      toast({
        title: "Error",
        description: "Failed to create organization",
        variant: "destructive"
      });
    } finally {
      setCreating(false);
    }
  };

  const handleOrgCardClick = (orgId: string) => {
    // Navigate to the dashboard with the organization ID
    navigate(`/?org_id=${orgId}`);
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Your Organizations</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search for an organization"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-500 hover:bg-green-600">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Organization
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Organization</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateOrganization} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="orgName">Organization Name *</Label>
                      <Input
                        id="orgName"
                        value={newOrgName}
                        onChange={(e) => setNewOrgName(e.target.value)}
                        placeholder="Enter organization name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="billingEmail">Billing Email (optional)</Label>
                      <Input
                        id="billingEmail"
                        type="email"
                        value={newOrgBillingEmail}
                        onChange={(e) => setNewOrgBillingEmail(e.target.value)}
                        placeholder="billing@example.com"
                      />
                    </div>
                    <Button 
                      type="submit" 
                      className="w-full bg-green-500 hover:bg-green-600"
                      disabled={creating}
                    >
                      {creating ? 'Creating...' : 'Create & Enter'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {filteredOrganizations.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No organizations found' : 'Get started by creating your first organization'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery 
                ? 'Try adjusting your search query' 
                : 'Organizations help you manage projects and collaborate with your team'
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-green-500 hover:bg-green-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Organization
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredOrganizations.map((org) => (
              <Card 
                key={org.id}
                className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:-translate-y-1 min-w-[280px]"
                onClick={() => handleOrgCardClick(org.id)}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleOrgCardClick(org.id);
                }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 truncate">{org.name}</h3>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge variant={org.plan === 'pro' ? 'default' : 'secondary'}>
                          {org.plan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                        </Badge>
                        <span className="text-gray-400">•</span>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-3 h-3 mr-1" />
                          {org.project_count} project{org.project_count !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Organizations;
