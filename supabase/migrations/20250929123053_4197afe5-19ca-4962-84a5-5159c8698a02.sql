-- Make necessary tables publicly readable for home page display
-- These tables need to be accessible without authentication for the public home page

-- Allow public access to site_settings
CREATE POLICY "Allow public read access to site_settings" 
ON public.site_settings 
FOR SELECT 
USING (true);

-- Allow public access to hero_blocks
CREATE POLICY "Allow public read access to hero_blocks" 
ON public.hero_blocks 
FOR SELECT 
USING (enabled = true);

-- Allow public access to home_page_sections
CREATE POLICY "Allow public read access to home_page_sections" 
ON public.home_page_sections 
FOR SELECT 
USING (enabled = true);

-- Allow public access to published books for showcasing
CREATE POLICY "Allow public read access to published books" 
ON public.books 
FOR SELECT 
USING (status = 'published');