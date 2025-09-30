-- Rename subdomain column to slug and update constraint
ALTER TABLE public.publishers 
  DROP CONSTRAINT publishers_subdomain_key;

ALTER TABLE public.publishers 
  RENAME COLUMN subdomain TO slug;

ALTER TABLE public.publishers 
  ADD CONSTRAINT publishers_slug_key UNIQUE (slug);

-- Update any existing data to add pub prefix if not already present
UPDATE public.publishers 
SET slug = CASE 
  WHEN slug NOT LIKE 'pub-%' THEN 'pub-' || slug 
  ELSE slug 
END;