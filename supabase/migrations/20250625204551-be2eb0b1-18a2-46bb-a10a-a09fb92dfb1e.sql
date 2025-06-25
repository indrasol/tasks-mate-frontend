
-- Drop all existing policies for user_organizations
DROP POLICY IF EXISTS "Users can view their organization memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can view their own organization memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can view organization memberships where they are members" ON public.user_organizations;
DROP POLICY IF EXISTS "Users can insert their own organization memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Owners and admins can manage organization memberships" ON public.user_organizations;
DROP POLICY IF EXISTS "Owners and admins can delete organization memberships" ON public.user_organizations;

-- Create a security definer function to check if user has admin/owner role
CREATE OR REPLACE FUNCTION public.user_has_org_role(org_id UUID, required_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_organizations 
    WHERE organization_id = org_id 
    AND user_id = auth.uid() 
    AND role = ANY(required_roles)
  );
$$;

-- Create simplified, non-recursive policies for user_organizations
CREATE POLICY "Users can view their own memberships" 
  ON public.user_organizations 
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own memberships" 
  ON public.user_organizations 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage memberships" 
  ON public.user_organizations 
  FOR UPDATE 
  USING (public.user_has_org_role(organization_id, ARRAY['owner', 'admin']));

CREATE POLICY "Admins can delete memberships" 
  ON public.user_organizations 
  FOR DELETE 
  USING (public.user_has_org_role(organization_id, ARRAY['owner', 'admin']));
