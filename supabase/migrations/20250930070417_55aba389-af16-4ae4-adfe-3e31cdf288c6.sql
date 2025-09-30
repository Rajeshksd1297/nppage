-- Add enhanced publisher settings columns
ALTER TABLE public.publisher_settings
ADD COLUMN IF NOT EXISTS allow_author_invites boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS require_author_approval boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_author_self_registration boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS max_books_per_author integer DEFAULT 50,
ADD COLUMN IF NOT EXISTS enable_content_moderation boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS auto_publish_enabled boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS require_admin_review boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS enable_author_analytics boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_email_notifications boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_author_requests boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS notify_new_book_submissions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS allow_author_messaging boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS enable_collaborative_editing boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS default_book_visibility text DEFAULT 'private',
ADD COLUMN IF NOT EXISTS allow_author_themes boolean DEFAULT true;

COMMENT ON COLUMN public.publisher_settings.allow_author_invites IS 'Allow publishers to invite authors';
COMMENT ON COLUMN public.publisher_settings.require_author_approval IS 'Authors need publisher approval to join';
COMMENT ON COLUMN public.publisher_settings.allow_author_self_registration IS 'Allow authors to register directly with publishers';
COMMENT ON COLUMN public.publisher_settings.max_books_per_author IS 'Maximum books an author can have';
COMMENT ON COLUMN public.publisher_settings.enable_content_moderation IS 'Enable content moderation for submissions';
COMMENT ON COLUMN public.publisher_settings.auto_publish_enabled IS 'Automatically publish approved content';
COMMENT ON COLUMN public.publisher_settings.require_admin_review IS 'Require platform admin review for new content';
COMMENT ON COLUMN public.publisher_settings.enable_author_analytics IS 'Enable analytics for authors';
COMMENT ON COLUMN public.publisher_settings.enable_email_notifications IS 'Send email notifications';
COMMENT ON COLUMN public.publisher_settings.notify_new_author_requests IS 'Notify publishers of new author requests';
COMMENT ON COLUMN public.publisher_settings.notify_new_book_submissions IS 'Notify publishers of new book submissions';
COMMENT ON COLUMN public.publisher_settings.allow_author_messaging IS 'Allow messaging between publishers and authors';
COMMENT ON COLUMN public.publisher_settings.enable_collaborative_editing IS 'Enable collaborative editing features';
COMMENT ON COLUMN public.publisher_settings.default_book_visibility IS 'Default visibility for new books';
COMMENT ON COLUMN public.publisher_settings.allow_author_themes IS 'Allow authors to customize themes';