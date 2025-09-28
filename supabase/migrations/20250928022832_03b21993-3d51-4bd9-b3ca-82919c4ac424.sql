-- Update contact_submissions to associate with the user being contacted
ALTER TABLE public.contact_submissions ADD COLUMN contacted_user_id uuid REFERENCES auth.users(id);

-- Update RLS policies to allow users to see submissions meant for them
DROP POLICY IF EXISTS "Admins can view all contact submissions" ON public.contact_submissions;
DROP POLICY IF EXISTS "Admins can update contact submissions" ON public.contact_submissions;

-- Users can view submissions meant for them and admins can view all
CREATE POLICY "Users can view their received contact submissions" 
ON public.contact_submissions FOR SELECT 
USING (auth.uid() = contacted_user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Users can update submissions meant for them and admins can update all
CREATE POLICY "Users can update their received contact submissions" 
ON public.contact_submissions FOR UPDATE 
USING (auth.uid() = contacted_user_id OR has_role(auth.uid(), 'admin'::app_role));

-- Update contact_replies RLS policies
DROP POLICY IF EXISTS "Admins can view all contact replies" ON public.contact_replies;
DROP POLICY IF EXISTS "Admins can insert contact replies" ON public.contact_replies;
DROP POLICY IF EXISTS "Admins can update their own contact replies" ON public.contact_replies;

-- Users can view replies to their submissions and admins can view all
CREATE POLICY "Users can view replies to their contact submissions" 
ON public.contact_replies FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.contact_submissions 
    WHERE id = contact_replies.contact_submission_id 
    AND contacted_user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can reply to submissions meant for them and admins can reply to all
CREATE POLICY "Users can reply to their contact submissions" 
ON public.contact_replies FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.contact_submissions 
    WHERE id = contact_replies.contact_submission_id 
    AND contacted_user_id = auth.uid()
  ) OR has_role(auth.uid(), 'admin'::app_role)
);

-- Users can update their own replies
CREATE POLICY "Users can update their own contact replies" 
ON public.contact_replies FOR UPDATE 
USING (replied_by = auth.uid());