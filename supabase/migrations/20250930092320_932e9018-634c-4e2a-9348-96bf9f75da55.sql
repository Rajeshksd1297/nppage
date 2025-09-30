-- Update default region to Mumbai
ALTER TABLE public.aws_settings 
  ALTER COLUMN default_region SET DEFAULT 'ap-south-1';