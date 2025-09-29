-- Create backup settings table
CREATE TABLE public.backup_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  frequency TEXT NOT NULL DEFAULT 'daily', -- daily, weekly, custom
  custom_schedule TEXT, -- for custom frequency (cron format)
  enabled BOOLEAN NOT NULL DEFAULT true,
  backup_types JSONB NOT NULL DEFAULT '["database", "files"]'::jsonb,
  storage_locations JSONB NOT NULL DEFAULT '["server", "cloud"]'::jsonb,
  versioning_enabled BOOLEAN NOT NULL DEFAULT true,
  max_versions INTEGER NOT NULL DEFAULT 10,
  compression_enabled BOOLEAN NOT NULL DEFAULT true,
  encryption_enabled BOOLEAN NOT NULL DEFAULT true,
  last_backup_at TIMESTAMP WITH TIME ZONE,
  next_backup_at TIMESTAMP WITH TIME ZONE,
  auto_cleanup_enabled BOOLEAN NOT NULL DEFAULT true,
  retention_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create backup jobs table
CREATE TABLE public.backup_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_type TEXT NOT NULL, -- full, incremental, files_only, database_only
  status TEXT NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  file_path TEXT,
  file_size BIGINT,
  backup_duration INTEGER, -- in seconds
  checksum TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create security settings table
CREATE TABLE public.security_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ssl_enforcement BOOLEAN NOT NULL DEFAULT true,
  https_redirect BOOLEAN NOT NULL DEFAULT true,
  hsts_enabled BOOLEAN NOT NULL DEFAULT true,
  password_min_length INTEGER NOT NULL DEFAULT 8,
  password_require_uppercase BOOLEAN NOT NULL DEFAULT true,
  password_require_lowercase BOOLEAN NOT NULL DEFAULT true,
  password_require_numbers BOOLEAN NOT NULL DEFAULT true,
  password_require_symbols BOOLEAN NOT NULL DEFAULT true,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
  session_timeout INTEGER NOT NULL DEFAULT 1440, -- minutes
  max_login_attempts INTEGER NOT NULL DEFAULT 5,
  lockout_duration INTEGER NOT NULL DEFAULT 15, -- minutes
  firewall_enabled BOOLEAN NOT NULL DEFAULT true,
  malware_scanning BOOLEAN NOT NULL DEFAULT true,
  auto_updates BOOLEAN NOT NULL DEFAULT true,
  ddos_protection BOOLEAN NOT NULL DEFAULT true,
  log_monitoring BOOLEAN NOT NULL DEFAULT true,
  data_encryption BOOLEAN NOT NULL DEFAULT true,
  security_alerts BOOLEAN NOT NULL DEFAULT true,
  alert_email TEXT,
  alert_sms TEXT,
  ip_whitelist JSONB DEFAULT '[]'::jsonb,
  ip_blacklist JSONB DEFAULT '[]'::jsonb,
  allowed_countries JSONB DEFAULT '[]'::jsonb,
  blocked_countries JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create security logs table
CREATE TABLE public.security_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL, -- login_attempt, suspicious_activity, breach_attempt, etc.
  severity TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, critical
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.backup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for backup_settings
CREATE POLICY "Admins can manage backup settings"
ON public.backup_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view backup settings"
ON public.backup_settings
FOR SELECT
USING (true);

-- RLS policies for backup_jobs
CREATE POLICY "Admins can manage backup jobs"
ON public.backup_jobs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can view backup jobs"
ON public.backup_jobs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS policies for security_settings
CREATE POLICY "Admins can manage security settings"
ON public.security_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Everyone can view security settings"
ON public.security_settings
FOR SELECT
USING (true);

-- RLS policies for security_logs
CREATE POLICY "Admins can manage security logs"
ON public.security_logs
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert security logs"
ON public.security_logs
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view security logs"
ON public.security_logs
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.backup_settings (frequency, enabled, backup_types, storage_locations, versioning_enabled, max_versions)
VALUES ('daily', true, '["database", "files"]', '["server", "cloud"]', true, 10);

INSERT INTO public.security_settings (
  ssl_enforcement, https_redirect, hsts_enabled, 
  password_min_length, two_factor_enabled,
  max_login_attempts, lockout_duration,
  firewall_enabled, malware_scanning, auto_updates,
  ddos_protection, log_monitoring, data_encryption,
  security_alerts
) VALUES (
  true, true, true,
  8, false,
  5, 15,
  true, true, true,
  true, true, true,
  true
);

-- Create triggers for updated_at
CREATE TRIGGER update_backup_settings_updated_at
  BEFORE UPDATE ON public.backup_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_security_settings_updated_at
  BEFORE UPDATE ON public.security_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();