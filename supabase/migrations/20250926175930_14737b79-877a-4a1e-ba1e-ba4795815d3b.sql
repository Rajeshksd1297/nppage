-- Update existing users to have slugs based on their email
UPDATE profiles 
SET slug = CASE 
  WHEN slug IS NULL OR slug = '' THEN 
    lower(regexp_replace(split_part(email, '@', 1), '[^a-z0-9]+', '-', 'g'))
  ELSE slug 
END
WHERE slug IS NULL OR slug = '';