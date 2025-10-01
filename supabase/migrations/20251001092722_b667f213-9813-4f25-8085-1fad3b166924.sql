-- Create GoDaddy hosting settings table
CREATE TABLE IF NOT EXISTS public.godaddy_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  ftp_host TEXT NOT NULL,
  ftp_username TEXT NOT NULL,
  ftp_password TEXT NOT NULL,
  ftp_port INTEGER DEFAULT 21,
  deployment_path TEXT DEFAULT '/public_html',
  domain TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.godaddy_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage GoDaddy settings
CREATE POLICY "Only admins can view GoDaddy settings"
  ON public.godaddy_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert GoDaddy settings"
  ON public.godaddy_settings
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can update GoDaddy settings"
  ON public.godaddy_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete GoDaddy settings"
  ON public.godaddy_settings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Create GoDaddy deployments tracking table
CREATE TABLE IF NOT EXISTS public.godaddy_deployments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  deployment_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  build_log TEXT,
  deployment_log TEXT,
  domain TEXT,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.godaddy_deployments ENABLE ROW LEVEL SECURITY;

-- Only admins can view deployment history
CREATE POLICY "Only admins can view GoDaddy deployments"
  ON public.godaddy_deployments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

CREATE POLICY "Only admins can insert GoDaddy deployments"
  ON public.godaddy_deployments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role = 'admin'
    )
  );

-- Add updated_at trigger for godaddy_settings
CREATE TRIGGER update_godaddy_settings_updated_at
  BEFORE UPDATE ON public.godaddy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_godaddy_settings_user_id ON public.godaddy_settings(user_id);
CREATE INDEX idx_godaddy_deployments_user_id ON public.godaddy_deployments(user_id);
CREATE INDEX idx_godaddy_deployments_status ON public.godaddy_deployments(status);
CREATE INDEX idx_godaddy_deployments_created_at ON public.godaddy_deployments(created_at DESC);