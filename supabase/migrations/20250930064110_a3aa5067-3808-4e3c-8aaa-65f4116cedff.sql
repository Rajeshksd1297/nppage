-- Add description and custom_fields to publishers table
ALTER TABLE public.publishers 
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS custom_fields jsonb DEFAULT '{}'::jsonb;

-- Create publisher_field_settings table for dynamic form management
CREATE TABLE IF NOT EXISTS public.publisher_field_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  is_required boolean DEFAULT false,
  is_enabled boolean DEFAULT true,
  is_custom boolean DEFAULT false,
  placeholder text,
  validation_rules jsonb DEFAULT '{}'::jsonb,
  options jsonb,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(field_name)
);

-- Enable RLS on publisher_field_settings
ALTER TABLE public.publisher_field_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for publisher_field_settings
CREATE POLICY "Everyone can view enabled publisher field settings"
ON public.publisher_field_settings
FOR SELECT
USING (is_enabled = true);

CREATE POLICY "Admins can manage publisher field settings"
ON public.publisher_field_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default field settings
INSERT INTO public.publisher_field_settings (field_name, field_label, field_type, is_required, is_enabled, is_custom, placeholder, sort_order) VALUES
('name', 'Publisher Name', 'text', true, true, false, 'My Publishing House', 1),
('slug', 'Publisher Slug', 'text', true, true, false, 'yourpublisher', 2),
('contact_email', 'Contact Email', 'email', true, true, false, 'contact@yourpublisher.com', 3),
('website_url', 'Website URL', 'url', false, true, false, 'https://yourpublisher.com', 4),
('description', 'Description', 'textarea', false, true, false, 'Tell us about your publishing house...', 5),
('phone', 'Phone Number', 'text', false, false, true, '+1 (555) 123-4567', 6),
('address', 'Address', 'textarea', false, false, true, 'Street, City, Country', 7),
('founded_year', 'Founded Year', 'number', false, false, true, '2020', 8)
ON CONFLICT (field_name) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_publisher_field_settings_updated_at
BEFORE UPDATE ON public.publisher_field_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TABLE public.publisher_field_settings IS 'Dynamic form field configuration for publisher profiles';
COMMENT ON COLUMN public.publishers.description IS 'Publisher description/about text';
COMMENT ON COLUMN public.publishers.custom_fields IS 'JSON object containing custom field values';