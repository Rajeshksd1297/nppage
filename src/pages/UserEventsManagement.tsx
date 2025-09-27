import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Search,
  Calendar,
  MapPin,
  Users,
  Clock,
  Video,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FeatureAccessGuard } from '@/components/FeatureAccessGuard';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

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

export default function UserEventsManagement() {
  const { toast } = useToast();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

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
    fetchEvents();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('user-events-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events'
        },
        () => {
          fetchEvents();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents((data as Event[]) || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const eventData = {
        ...formData,
        max_attendees: formData.max_attendees || null,
        event_date: new Date(formData.event_date).toISOString(),
        end_date: formData.end_date ? new Date(formData.end_date).toISOString() : null,
        user_id: user.id,
      };

      if (selectedEvent) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', selectedEvent.id)
          .eq('user_id', user.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event updated successfully",
        });
        setIsEditOpen(false);
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert([eventData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event created successfully",
        });
        setIsCreateOpen(false);
      }

      resetForm();
      fetchEvents();
    } catch (error: any) {
      console.error('Error saving event:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save event",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Event deleted successfully",
      });
      fetchEvents();
    } catch (error: any) {
      console.error('Error deleting event:', error);
      toast({
        title: "Error",
        description: "Failed to delete event",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (event: Event) => {
    setSelectedEvent(event);
    setFormData({
      title: event.title,
      description: event.description || '',
      event_date: new Date(event.event_date).toISOString().slice(0, 16),
      end_date: event.end_date ? new Date(event.end_date).toISOString().slice(0, 16) : '',
      location: event.location || '',
      event_type: event.event_type,
      is_virtual: event.is_virtual,
      meeting_link: event.meeting_link || '',
      registration_required: event.registration_required,
      max_attendees: event.max_attendees,
      status: event.status,
      featured_image_url: event.featured_image_url || '',
    });
    setIsEditOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_date: '',
      end_date: '',
      location: '',
      event_type: 'general',
      is_virtual: false,
      meeting_link: '',
      registration_required: false,
      max_attendees: null,
      status: 'upcoming',
      featured_image_url: '',
    });
    setSelectedEvent(null);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      upcoming: { variant: 'default' as const, text: 'Upcoming' },
      ongoing: { variant: 'secondary' as const, text: 'Ongoing' },
      completed: { variant: 'outline' as const, text: 'Completed' },
      cancelled: { variant: 'destructive' as const, text: 'Cancelled' },
    };
    const config = variants[status as keyof typeof variants] || variants.upcoming;
    return <Badge variant={config.variant}>{config.text}</Badge>;
  };

  const getEventTypeBadge = (type: string) => {
    const colors = {
      general: 'bg-gray-100 text-gray-800',
      book_launch: 'bg-blue-100 text-blue-800',
      signing: 'bg-green-100 text-green-800',
      interview: 'bg-purple-100 text-purple-800',
      conference: 'bg-orange-100 text-orange-800',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${colors[type as keyof typeof colors]}`}>
        {type.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const EventForm = () => (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            placeholder="Enter event title"
          />
        </div>
        <div>
          <Label htmlFor="event_type">Event Type</Label>
          <Select
            value={formData.event_type}
            onValueChange={(value: Event['event_type']) => 
              setFormData({ ...formData, event_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">General</SelectItem>
              <SelectItem value="book_launch">Book Launch</SelectItem>
              <SelectItem value="signing">Book Signing</SelectItem>
              <SelectItem value="interview">Interview</SelectItem>
              <SelectItem value="conference">Conference</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe the event"
          rows={3}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="event_date">Start Date & Time</Label>
          <Input
            id="event_date"
            type="datetime-local"
            value={formData.event_date}
            onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="end_date">End Date & Time (Optional)</Label>
          <Input
            id="end_date"
            type="datetime-local"
            value={formData.end_date}
            onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="is_virtual"
          checked={formData.is_virtual}
          onCheckedChange={(checked) => setFormData({ ...formData, is_virtual: checked })}
        />
        <Label htmlFor="is_virtual">Virtual Event</Label>
      </div>

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
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Event venue address"
          />
        </div>
      )}

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
          <Label htmlFor="max_attendees">Maximum Attendees (Optional)</Label>
          <Input
            id="max_attendees"
            type="number"
            value={formData.max_attendees || ''}
            onChange={(e) => setFormData({ ...formData, max_attendees: parseInt(e.target.value) || null })}
            placeholder="Leave empty for unlimited"
          />
        </div>
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
        <div>
          <Label htmlFor="featured_image_url">Featured Image URL</Label>
          <Input
            id="featured_image_url"
            value={formData.featured_image_url}
            onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
        </div>
      </div>
    </div>
  );

  return (
    <FeatureAccessGuard feature="events">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            My Events
          </h1>
          <p className="text-muted-foreground">Manage your events and scheduling</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Event</DialogTitle>
              <DialogDescription>
                Create a new event with scheduling and registration details.
              </DialogDescription>
            </DialogHeader>
            <EventForm />
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Create Event</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading events...</div>
        ) : filteredEvents.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No events found</p>
            <p className="text-sm">Create your first event to get started</p>
          </div>
        ) : (
          filteredEvents.map((event) => (
            <Card key={event.id} className="overflow-hidden">
              {event.featured_image_url && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={event.featured_image_url}
                    alt={event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold line-clamp-1 mb-1">{event.title}</h3>
                    <div className="flex gap-2 mb-2">
                      {getStatusBadge(event.status)}
                      {getEventTypeBadge(event.event_type)}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{new Date(event.event_date).toLocaleString()}</span>
                  </div>
                  
                  {event.is_virtual ? (
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      <span>Virtual Event</span>
                      {event.meeting_link && (
                        <ExternalLink className="h-3 w-3" />
                      )}
                    </div>
                  ) : event.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                  )}

                  {event.registration_required && (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>
                        {event.current_attendees}
                        {event.max_attendees ? ` / ${event.max_attendees}` : ''} attendees
                      </span>
                    </div>
                  )}
                </div>

                {event.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {event.description}
                  </p>
                )}

                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(event)}
                  >
                    <Edit3 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(event.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update your event details and settings.
            </DialogDescription>
          </DialogHeader>
          <EventForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>Update Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </FeatureAccessGuard>
  );
}