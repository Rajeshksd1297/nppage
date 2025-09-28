import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, MessageSquare, Eye, ExternalLink } from 'lucide-react';
import { ContactFormWidget } from '@/components/ContactFormWidget';
import { useSubscription } from '@/hooks/useSubscription';
import { UpgradeBanner } from '@/components/UpgradeBanner';
import { supabase } from '@/integrations/supabase/client';
import { NavLink } from 'react-router-dom';

export default function ContactForm() {
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userSlug, setUserSlug] = useState<string>('');
  const { hasFeature, loading: subscriptionLoading } = useSubscription();

  const canUseContactForm = hasFeature('contact_form');

  useEffect(() => {
    getCurrentUser();
  }, []);

  const getCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
        
        // Get user profile to find slug
        const { data: profile } = await supabase
          .from('profiles')
          .select('slug')
          .eq('id', user.id)
          .single();
        
        if (profile?.slug) {
          setUserSlug(profile.slug);
        }
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  };

  if (subscriptionLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  if (!canUseContactForm) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Contact Form</h1>
          <p className="text-muted-foreground">
            Let readers get in touch with you directly
          </p>
        </div>

        <UpgradeBanner 
          message="Contact forms are a Pro feature"
          feature="contact forms to connect with your readers"
        />

        <Card className="mt-6 opacity-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Contact Form Preview
            </CardTitle>
            <CardDescription>
              This is how your contact form will appear to visitors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ContactFormWidget userId={currentUserId} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Contact Form</h1>
        <p className="text-muted-foreground">
          Manage how readers can get in touch with you
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-medium">Form Settings</h3>
                <p className="text-sm text-muted-foreground">Customize your contact form</p>
              </div>
              <NavLink to="/contact-form-settings">
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </NavLink>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-medium">Messages</h3>
                <p className="text-sm text-muted-foreground">View and reply to messages</p>
              </div>
              <NavLink to="/contact-management">
                <Button variant="outline" size="sm">
                  View Messages
                </Button>
              </NavLink>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Eye className="w-8 h-8 text-primary" />
              <div className="flex-1">
                <h3 className="font-medium">Live Form</h3>
                <p className="text-sm text-muted-foreground">See how visitors see it</p>
              </div>
              {userSlug ? (
                <a 
                  href={`/${userSlug}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Set Profile Slug
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Contact Form Preview
          </CardTitle>
          <CardDescription>
            This is how your contact form will appear to visitors on your profile
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactFormWidget 
            userId={currentUserId} 
            onSubmissionSuccess={() => {
              // Could show a success message or redirect
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}