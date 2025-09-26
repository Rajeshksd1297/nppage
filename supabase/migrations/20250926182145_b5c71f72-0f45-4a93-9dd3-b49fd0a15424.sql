-- Add mobile number and country code fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN mobile_number text,
ADD COLUMN country_code text DEFAULT '+1';