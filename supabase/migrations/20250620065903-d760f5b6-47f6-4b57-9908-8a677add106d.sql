
-- First, let's see what policies currently exist and drop them properly
DROP POLICY IF EXISTS "Allow organization creation during signup" ON public.organizations;
DROP POLICY IF EXISTS "Users can create organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON public.organizations;

-- Now create the correct policies for easy sign-ups
CREATE POLICY "Organizations can be created by anyone" 
  ON public.organizations 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "Users can view organizations they belong to" 
  ON public.organizations 
  FOR SELECT 
  USING (id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));
