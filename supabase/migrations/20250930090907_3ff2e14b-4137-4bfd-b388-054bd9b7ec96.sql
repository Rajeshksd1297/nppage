-- Create table for AWS deployment configurations
CREATE TABLE IF NOT EXISTS public.aws_deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  deployment_name TEXT NOT NULL,
  ec2_instance_id TEXT,
  ec2_public_ip TEXT,
  region TEXT NOT NULL DEFAULT 'us-east-1',
  status TEXT NOT NULL DEFAULT 'pending',
  last_deployed_at TIMESTAMP WITH TIME ZONE,
  deployment_log TEXT,
  auto_deploy BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.aws_deployments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own deployments"
  ON public.aws_deployments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own deployments"
  ON public.aws_deployments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deployments"
  ON public.aws_deployments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own deployments"
  ON public.aws_deployments FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all deployments
CREATE POLICY "Admins can view all deployments"
  ON public.aws_deployments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_aws_deployments_user_id ON public.aws_deployments(user_id);
CREATE INDEX idx_aws_deployments_status ON public.aws_deployments(status);

-- Create trigger for updated_at
CREATE TRIGGER update_aws_deployments_updated_at
  BEFORE UPDATE ON public.aws_deployments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();