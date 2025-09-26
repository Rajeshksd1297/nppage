-- Create help desk tickets table
CREATE TABLE public.tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_number text NOT NULL UNIQUE DEFAULT 'TICK-' || LPAD(FLOOR(RANDOM() * 1000000)::text, 6, '0'),
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'pending', 'resolved', 'closed')),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category text,
  created_by uuid NOT NULL,
  assigned_to uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved_at timestamp with time zone,
  closed_at timestamp with time zone
);

-- Create ticket replies table
CREATE TABLE public.ticket_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  content text NOT NULL,
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ticket assignments table (for history tracking)
CREATE TABLE public.ticket_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  assigned_by uuid NOT NULL,
  assigned_to uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ticket status history table
CREATE TABLE public.ticket_status_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  old_status text,
  new_status text NOT NULL,
  changed_by uuid NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create ticket tasks table
CREATE TABLE public.ticket_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id uuid NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_to uuid,
  created_by uuid NOT NULL,
  due_date timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create help desk settings table
CREATE TABLE public.helpdesk_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_assign_tickets boolean NOT NULL DEFAULT false,
  default_priority text NOT NULL DEFAULT 'medium',
  categories jsonb NOT NULL DEFAULT '["General", "Technical", "Billing", "Feature Request", "Bug Report"]'::jsonb,
  email_notifications boolean NOT NULL DEFAULT true,
  business_hours jsonb NOT NULL DEFAULT '{"start": "09:00", "end": "17:00", "timezone": "UTC", "days": ["monday", "tuesday", "wednesday", "thursday", "friday"]}'::jsonb,
  sla_response_hours integer NOT NULL DEFAULT 24,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.helpdesk_settings (id) VALUES (gen_random_uuid());

-- Enable RLS on all tables
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tickets
CREATE POLICY "Users can view their own tickets" 
ON public.tickets 
FOR SELECT 
USING (created_by = auth.uid() OR has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can create their own tickets" 
ON public.tickets 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Admins can manage all tickets" 
ON public.tickets 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for ticket replies
CREATE POLICY "Users can view replies for their tickets" 
ON public.ticket_replies 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_replies.ticket_id 
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Users can reply to their tickets" 
ON public.ticket_replies 
FOR INSERT 
WITH CHECK (
  user_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_replies.ticket_id 
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Admins can manage all replies" 
ON public.ticket_replies 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for assignments
CREATE POLICY "Admins can manage ticket assignments" 
ON public.ticket_assignments 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for status history
CREATE POLICY "Users can view status history for their tickets" 
ON public.ticket_status_history 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_status_history.ticket_id 
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Admins can manage status history" 
ON public.ticket_status_history 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for tasks
CREATE POLICY "Users can view tasks for their tickets" 
ON public.ticket_tasks 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.tickets 
    WHERE id = ticket_tasks.ticket_id 
    AND (created_by = auth.uid() OR has_role(auth.uid(), 'admin'))
  )
);

CREATE POLICY "Admins can manage all tasks" 
ON public.ticket_tasks 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for settings
CREATE POLICY "Admins can manage helpdesk settings" 
ON public.helpdesk_settings 
FOR ALL 
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Everyone can view helpdesk settings" 
ON public.helpdesk_settings 
FOR SELECT 
USING (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_tickets_updated_at
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_replies_updated_at
BEFORE UPDATE ON public.ticket_replies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ticket_tasks_updated_at
BEFORE UPDATE ON public.ticket_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_helpdesk_settings_updated_at
BEFORE UPDATE ON public.helpdesk_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically create status history
CREATE OR REPLACE FUNCTION public.create_ticket_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != NEW.status THEN
    INSERT INTO public.ticket_status_history (
      ticket_id,
      old_status,
      new_status,
      changed_by
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid()
    );
  END IF;
  
  -- Set resolved_at when status changes to resolved
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = now();
  END IF;
  
  -- Set closed_at when status changes to closed
  IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
    NEW.closed_at = now();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status history
CREATE TRIGGER create_ticket_status_history_trigger
BEFORE UPDATE ON public.tickets
FOR EACH ROW
EXECUTE FUNCTION public.create_ticket_status_history();