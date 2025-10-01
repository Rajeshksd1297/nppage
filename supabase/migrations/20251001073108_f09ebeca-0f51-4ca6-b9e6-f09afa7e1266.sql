-- Add 'moderator' to the app_role enum if it doesn't exist
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';