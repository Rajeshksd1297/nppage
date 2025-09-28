-- Create contact_submissions table for storing form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  subject text,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'::text CHECK (status IN ('new', 'in_progress', 'replied', 'resolved', 'spam')),
  priority text DEFAULT 'medium'::text CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  submitted_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  user_ip inet,
  user_agent text,
  source text DEFAULT 'contact_form'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  replied_at timestamp with time zone,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create contact_replies table for storing admin replies
CREATE TABLE IF NOT EXISTS public.contact_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_submission_id uuid NOT NULL REFERENCES public.contact_submissions(id) ON DELETE CASCADE,
  reply_message text NOT NULL,
  replied_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_internal boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_replies ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_submissions
CREATE POLICY "Admins can view all contact submissions" 
ON public.contact_submissions FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update contact submissions" 
ON public.contact_submissions FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can insert contact submissions" 
ON public.contact_submissions FOR INSERT 
WITH CHECK (true);

-- RLS policies for contact_replies
CREATE POLICY "Admins can view all contact replies" 
ON public.contact_replies FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert contact replies" 
ON public.contact_replies FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update their own contact replies" 
ON public.contact_replies FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) AND replied_by = auth.uid());

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_contact_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_contact_submissions_updated_at
  BEFORE UPDATE ON public.contact_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_updated_at();

CREATE TRIGGER update_contact_replies_updated_at
  BEFORE UPDATE ON public.contact_replies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_contact_updated_at();

-- Enable realtime for contact submissions and replies
ALTER TABLE public.contact_submissions REPLICA IDENTITY FULL;
ALTER TABLE public.contact_replies REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.contact_submissions;
ALTER publication supabase_realtime ADD TABLE public.contact_replies;