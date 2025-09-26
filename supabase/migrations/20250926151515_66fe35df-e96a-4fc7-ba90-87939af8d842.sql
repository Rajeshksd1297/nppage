-- Add missing columns to helpdesk_settings table
ALTER TABLE public.helpdesk_settings 
ADD COLUMN ticket_number_prefix text NOT NULL DEFAULT 'TICK',
ADD COLUMN ticket_statuses jsonb NOT NULL DEFAULT '["open", "in_progress", "pending", "resolved", "closed"]'::jsonb;