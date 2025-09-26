-- Add policy to allow public access to public profiles
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (public_profile = true);