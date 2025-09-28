import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Calendar, AlertCircle, MapPin, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FeatureAccessGuard } from '@/components/FeatureAccessGuard';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EventSettings {
  id: string;
  max_title_length: number;
  max_content_length: number;
  max_description_length: number;
  allowed_image_size_mb: number;
  allowed_image_types: string[];
  require_approval: boolean;
  default_duration_hours: number;
  categories: string[];
  default_status: string;
  allow_virtual_events: boolean;
  allow_registration: boolean;
  max_attendees_limit: number;
  auto_generate_slug: boolean;
  enable_featured_images: boolean;
}

interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  event_type: 'general' | 'book_launch' | 'signing' | 'interview' | 'conference';
  is_virtual: boolean;
  meeting_link: string | null;
  registration_required: boolean;
  max_attendees: number | null;
  current_attendees: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  featured_image_url: string | null;
  created_at: string;
  updated_at: string;
}

export default function UserEventCreate() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [eventSettings, setEventSettings] = useState<EventSettings | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_date: '',
    end_date: '',
    location: '',
    event_type: 'general' as Event['event_type'],
    is_virtual: false,
    meeting_link: '',
    registration_required: false,
    max_attendees: null as number | null,
    status: 'upcoming' as Event['status'],
    featured_image_url: '',
  });

  useEffect(() => {
    fetchEventSettings();
  }, []);

  const fetchEventSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('event_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      if (data) {
        const settings = {
          id: data.id,
          max_title_length: data.max_title_length || 100,
          max_content_length: data.max_content_length || 2000,
          max_description_length: data.max_content_length || 2000,
          allowed_image_size_mb: data.max_image_size || 5,
          allowed_image_types: Array.isArray(data.allowed_image_types) ? data.allowed_image_types as string[] : ['image/jpeg', 'image/png', 'image/webp'],
          require_approval: data.require_approval || false,
          default_duration_hours: data.default_event_duration || 2,
          categories: Array.isArray(data.categories) ? data.categories as string[] : [],
          default_status: 'upcoming',
          allow_virtual_events: true,
          allow_registration: data.allow_user_events !== false,
          max_attendees_limit: data.max_attendees_default || 1000,
          auto_generate_slug: true,
          enable_featured_images: true,
        };
        
        setEventSettings(settings);
        
        // Set default status from settings
        setFormData(prev => ({
          ...prev,
          status: 'upcoming' as Event['status']
        }));
      }
    } catch (error: any) {
      console.error('Error fetching event settings:', error);
      toast({
        title: "Warning",
        description: "Could not load event settings. Using defaults.",
        variant: "destructive",
      });
    } finally {
      setSettingsLoading(false);
    }
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.title.trim()) {
      errors.push("Title is required");
    } else if (eventSettings && formData.title.length > eventSettings.max_title_length) {
      errors.push(`Title must be less than ${eventSettings.max_title_length} characters`);
    }

    if (!formData.event_date) {
      errors.push("Event date is required");
    }

    if (formData.description && eventSettings && formData.description.length > eventSettings.max_description_length) {
      errors.push(`Description must be less than ${eventSettings.max_description_length} characters`);
    }

    if (formData.is_virtual && !eventSettings?.allow_virtual_events) {
      errors.push("Virtual events are not allowed");
    }

    if (formData.registration_required && !eventSettings?.allow_registration) {
      errors.push("Event registration is not allowed");
    }

    if (formData.max_attendees && eventSettings && formData.max_attendees > eventSettings.max_attendees_limit) {
      errors.push(`Maximum attendees cannot exceed ${eventSettings.max_attendees_limit}`);
    }

    return errors;
  };

  const getAllowedEventTypes = () => {
    return [
      { value: 'general', label: 'General' },
      { value: 'book_launch', label: 'Book Launch' },
      { value: 'signing', label: 'Book Signing' },
      { value: 'interview', label: 'Interview' },
      { value: 'conference', label: 'Conference' },
    ];
  };

  const handleSubmit = async () => {
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      toast({
        title: "Validation Error",
        description: validationErrors.join(", "),
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Calculate end date if not provided
      let endDate = formData.end_date;
      if (!endDate && formData.event_date && eventSettings?.default_duration_hours) {
        const startDate = new Date(formData.event_date);
        const endDateTime = new Date(startDate.getTime() + (eventSettings.default_duration_hours * 60 * 60 * 1000));
        endDate = endDateTime.toISOString().slice(0, 16);
      }

      // Set status based on approval requirements
      const finalStatus = eventSettings?.require_approval && formData.status === 'upcoming' 
        ? 'pending' 
        : formData.status;

      const eventData = {
        title: formData.title,
        description: formData.description,
        event_date: new Date(formData.event_date).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        location: formData.location,
        event_type: formData.event_type,
        is_virtual: formData.is_virtual,
        meeting_link: formData.meeting_link,
        registration_required: formData.registration_required,
        max_attendees: formData.max_attendees,
        status: finalStatus,
        featured_image_url: formData.featured_image_url,
        user_id: user.id,
      };

      const { error } = await supabase
        .from('events')
        .insert([eventData]);

      if (error) throw error;

      const successMessage = eventSettings?.require_approval && formData.status === 'upcoming'
        ? "Event created and submitted for approval"
        : "Event created successfully";

      toast({
        title: "Success",
        description: successMessage,
      });
      
      navigate('/user-events-management');
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getCharacterCount = (text: string, max?: number) => {
    const color = max && text.length > max * 0.9 ? 'text-red-500' : 'text-muted-foreground';
    return (
      <span className={`text-xs ${color}`}>
        {text.length}{max ? `/${max}` : ''}
      </span>
    );
  };

  if (settingsLoading) {
    return (
      <FeatureAccessGuard feature="events">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading event settings...</p>
          </div>
        </div>
      </FeatureAccessGuard>
    );
  }

  return (
    <FeatureAccessGuard feature="events">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/user-events-management')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Calendar className="h-8 w-8" />
                Create Event
              </h1>
              <p className="text-muted-foreground">Schedule and publish your event</p>
            </div>
          </div>
          <Button onClick={handleSubmit} disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Saving...' : 'Create Event'}
          </Button>
        </div>

        {/* Approval Notice */}
        {eventSettings?.require_approval && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Events will be submitted for admin approval before going live.
            </AlertDescription>
          </Alert>
        )}

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="title">Event Title *</Label>
                    {getCharacterCount(formData.title, eventSettings?.max_title_length)}
                  </div>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter event title"
                    maxLength={eventSettings?.max_title_length}
                  />
                </div>
                <div>
                  <Label htmlFor="event_type">Event Type</Label>
                  <Select
                    value={formData.event_type}
                    onValueChange={(value: Event['event_type']) => setFormData({ ...formData, event_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAllowedEventTypes().map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label htmlFor="description">Description</Label>
                  {getCharacterCount(formData.description, eventSettings?.max_description_length)}
                </div>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the event"
                  rows={4}
                  maxLength={eventSettings?.max_description_length}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="event_date">Start Date & Time *</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="end_date">End Date & Time</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {eventSettings?.default_duration_hours && `Default: ${eventSettings.default_duration_hours}h duration`}
                  </p>
                </div>
              </div>

              {eventSettings?.allow_virtual_events && (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_virtual"
                    checked={formData.is_virtual}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_virtual: checked })}
                  />
                  <Label htmlFor="is_virtual" className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Virtual Event
                  </Label>
                </div>
              )}

              {formData.is_virtual ? (
                <div>
                  <Label htmlFor="meeting_link">Meeting Link</Label>
                  <Input
                    id="meeting_link"
                    value={formData.meeting_link}
                    onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                    placeholder="https://zoom.us/j/..."
                  />
                </div>
              ) : (
                <div>
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Event venue address"
                  />
                </div>
              )}

              {eventSettings?.allow_registration && (
                <>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="registration_required"
                      checked={formData.registration_required}
                      onCheckedChange={(checked) => setFormData({ ...formData, registration_required: checked })}
                    />
                    <Label htmlFor="registration_required">Registration Required</Label>
                  </div>

                  {formData.registration_required && (
                    <div>
                      <Label htmlFor="max_attendees">Maximum Attendees</Label>
                      <Input
                        id="max_attendees"
                        type="number"
                        value={formData.max_attendees || ''}
                        onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) || null })}
                        placeholder="Leave empty for unlimited"
                        max={eventSettings?.max_attendees_limit}
                      />
                      {eventSettings?.max_attendees_limit && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Maximum allowed: {eventSettings.max_attendees_limit}
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: Event['status']) => 
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Ongoing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {eventSettings?.enable_featured_images && (
                  <div>
                    <Label htmlFor="featured_image_url">Featured Image URL</Label>
                    <Input
                      id="featured_image_url"
                      value={formData.featured_image_url}
                      onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
                      placeholder="https://example.com/image.jpg"
                    />
                    {eventSettings && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Max size: {eventSettings.allowed_image_size_mb}MB. 
                        Allowed types: {eventSettings.allowed_image_types.join(', ')}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </FeatureAccessGuard>
  );
}