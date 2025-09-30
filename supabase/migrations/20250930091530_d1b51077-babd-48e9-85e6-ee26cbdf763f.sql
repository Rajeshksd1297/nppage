-- Create AWS settings table
CREATE TABLE IF NOT EXISTS public.aws_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aws_access_key_id TEXT,
  aws_secret_access_key TEXT,
  default_region TEXT NOT NULL DEFAULT 'us-east-1',
  instance_type TEXT NOT NULL DEFAULT 't2.micro',
  key_pair_name TEXT,
  security_group_id TEXT,
  subnet_id TEXT,
  ami_id TEXT,
  auto_deploy_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aws_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage AWS settings
CREATE POLICY "Admins can manage AWS settings"
  ON public.aws_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create index
CREATE INDEX idx_aws_settings_created_at ON public.aws_settings(created_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_aws_settings_updated_at
  BEFORE UPDATE ON public.aws_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();