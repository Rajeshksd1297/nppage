-- Create moderator permissions table
CREATE TABLE public.moderator_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT true,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  can_approve BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, feature)
);

-- Enable RLS
ALTER TABLE public.moderator_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage all moderator permissions
CREATE POLICY "Admins can manage moderator permissions"
ON public.moderator_permissions
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Moderators can view their own permissions
CREATE POLICY "Moderators can view their own permissions"
ON public.moderator_permissions
FOR SELECT
USING (auth.uid() = user_id);

-- Create function to check moderator permission
CREATE OR REPLACE FUNCTION public.has_moderator_permission(
  _user_id UUID,
  _feature TEXT,
  _permission TEXT
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _permission
    WHEN 'view' THEN can_view
    WHEN 'create' THEN can_create
    WHEN 'edit' THEN can_edit
    WHEN 'delete' THEN can_delete
    WHEN 'approve' THEN can_approve
    ELSE false
  END
  FROM public.moderator_permissions
  WHERE user_id = _user_id AND feature = _feature
  LIMIT 1
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_moderator_permissions_updated_at
BEFORE UPDATE ON public.moderator_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();