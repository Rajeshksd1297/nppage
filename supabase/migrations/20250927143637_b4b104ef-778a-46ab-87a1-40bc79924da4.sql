-- Fix the mismatched email in profile 
UPDATE profiles 
SET email = 'admin@demo.com'
WHERE id = 'bac401e5-5853-4b12-b642-c5ac229c265d';

-- Now add unique constraint on email in profiles  
ALTER TABLE profiles 
ADD CONSTRAINT profiles_email_unique UNIQUE (email);

-- Handle newsletter subscribers duplicates using row_number
WITH duplicates AS (
  SELECT id, 
         ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at) as rn
  FROM newsletter_subscribers
)
DELETE FROM newsletter_subscribers 
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- Add unique constraint for newsletter subscribers
ALTER TABLE newsletter_subscribers 
ADD CONSTRAINT newsletter_subscribers_email_unique UNIQUE (email);