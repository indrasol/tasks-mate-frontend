
-- Create user_organizations junction table for many-to-many relationship
CREATE TABLE public.user_organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create projects table (referenced in the org cards)
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invitations table for team member invites
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add new columns to existing organizations table
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS billing_email TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- Enable Row Level Security on new tables
ALTER TABLE public.user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Update existing organizations RLS policies
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;
CREATE POLICY "Users can view organizations they belong to" 
  ON public.organizations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update organizations they own or admin" 
  ON public.organizations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Users can delete organizations they own" 
  ON public.organizations 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = organizations.id 
      AND user_id = auth.uid() 
      AND role = 'owner'
    )
  );

-- RLS Policies for user_organizations
CREATE POLICY "Users can view their organization memberships" 
  ON public.user_organizations 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM public.user_organizations uo 
      WHERE uo.organization_id = user_organizations.organization_id 
      AND uo.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own organization memberships" 
  ON public.user_organizations 
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and admins can manage organization memberships" 
  ON public.user_organizations 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = user_organizations.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can delete organization memberships" 
  ON public.user_organizations 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = user_organizations.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their organizations" 
  ON public.projects 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = projects.organization_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create projects in their organizations" 
  ON public.projects 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = projects.organization_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update projects in their organizations" 
  ON public.projects 
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = projects.organization_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete projects in their organizations" 
  ON public.projects 
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = projects.organization_id 
      AND user_id = auth.uid()
    )
  );

-- RLS Policies for invitations
CREATE POLICY "Users can view invitations for their organizations" 
  ON public.invitations 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = invitations.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can create invitations" 
  ON public.invitations 
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_organizations 
      WHERE organization_id = invitations.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Function to automatically add user as owner when creating an organization
CREATE OR REPLACE FUNCTION public.handle_new_organization()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert the creator as the owner of the organization
  INSERT INTO public.user_organizations (user_id, organization_id, role)
  VALUES (auth.uid(), NEW.id, 'owner');
  
  RETURN NEW;
END;
$$;

-- Trigger to automatically add user as owner when creating an organization
CREATE TRIGGER on_organization_created
  AFTER INSERT ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_organization();

-- Update the existing profiles table to include display_name and avatar_url
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
