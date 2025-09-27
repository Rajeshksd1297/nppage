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
  ExternalLink,
  Settings,
  Eye,
  AlertCircle,
  CheckCircle,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  profiles?: {
    full_name: string;
    email: string;
  };
}

export default function EventsManagement() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventSettings, setEventSettings] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

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
    fetchEventSettings();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('events-changes')
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
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          profiles!user_id (
            full_name,
            email
          )
        `)
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents((data as any) || []);
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

  const fetchEventSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('event_settings' as any)
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setEventSettings(data as any);
    } catch (error) {
      console.error('Error fetching event settings:', error);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.title.trim()) {
      errors.push('Title is required');
    } else if (eventSettings?.max_title_length && formData.title.length > eventSettings.max_title_length) {
      errors.push(`Title must be less than ${eventSettings.max_title_length} characters`);
    }
    
    if (formData.description && eventSettings?.max_description_length && 
        formData.description.length > eventSettings.max_description_length) {
      errors.push(`Description must be less than ${eventSettings.max_description_length} characters`);
    }
    
    if (!formData.event_date) {
      errors.push('Event date is required');
    }
    
    if (formData.end_date && new Date(formData.end_date) <= new Date(formData.event_date)) {
      errors.push('End date must be after start date');
    }
    
    if (formData.is_virtual && !formData.meeting_link) {
      errors.push('Meeting link is required for virtual events');
    }
    
    if (!formData.is_virtual && !formData.location) {
      errors.push('Location is required for in-person events');
    }

    if (formData.max_attendees && eventSettings?.max_attendees_limit && 
        formData.max_attendees > eventSettings.max_attendees_limit) {
      errors.push(`Maximum attendees cannot exceed ${eventSettings.max_attendees_limit}`);
    }

    return errors;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      setUploadingImage(true);
      
      // Validate file size
      if (eventSettings?.allowed_image_size_mb && 
          file.size > eventSettings.allowed_image_size_mb * 1024 * 1024) {
        throw new Error(`Image size must be less than ${eventSettings.allowed_image_size_mb}MB`);
      }

      // Validate file type
      if (eventSettings?.allowed_image_types && 
          !eventSettings.allowed_image_types.includes(file.type)) {
        throw new Error('Image type not allowed');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `event-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const validationErrors = validateForm();
      if (validationErrors.length > 0) {
        toast({
          title: "Validation Error",
          description: validationErrors.join(', '),
          variant: "destructive",
        });
        return;
      }

      let imageUrl = formData.featured_image_url;
      
      // Upload image if file is selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }

      // Calculate end date if not provided
      let endDate = formData.end_date;
      if (!endDate && eventSettings?.default_duration_hours) {
        const startDate = new Date(formData.event_date);
        startDate.setHours(startDate.getHours() + eventSettings.default_duration_hours);
        endDate = startDate.toISOString().slice(0, 16);
      }

      const eventData = {
        ...formData,
        featured_image_url: imageUrl,
        max_attendees: formData.max_attendees || null,
        event_date: new Date(formData.event_date).toISOString(),
        end_date: endDate ? new Date(endDate).toISOString() : null,
        status: eventSettings?.require_approval ? 'pending' : formData.status,
      };

      if (selectedEvent) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', selectedEvent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Event updated successfully",
        });
        setIsEditOpen(false);
      } else {
        // Create new event
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');

        const { error } = await supabase
          .from('events')
          .insert([{ ...eventData, user_id: user.id }]);

        if (error) throw error;

        toast({
          title: "Success",
          description: eventSettings?.require_approval 
            ? "Event created and pending approval" 
            : "Event created successfully",
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
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

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
      status: eventSettings?.default_status || 'upcoming',
      featured_image_url: '',
    });
    setSelectedEvent(null);
    setImageFile(null);
  };

  const openViewDialog = (event: Event) => {
    setSelectedEvent(event);
    setIsViewOpen(true);
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || event.event_type === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
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
          <Label htmlFor="featured_image_url">Featured Image</Label>
          <div className="space-y-2">
            <Input
              id="featured_image_url"
              value={formData.featured_image_url}
              onChange={(e) => setFormData({ ...formData, featured_image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
            <div className="text-sm text-muted-foreground">Or upload an image:</div>
            <Input
              type="file"
              accept={eventSettings?.allowed_image_types?.join(',') || 'image/*'}
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              disabled={uploadingImage}
            />
            {eventSettings?.allowed_image_size_mb && (
              <p className="text-xs text-muted-foreground">
                Max size: {eventSettings.allowed_image_size_mb}MB
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Calendar className="h-8 w-8" />
            Events Management
          </h1>
          <p className="text-muted-foreground">Manage events and scheduling</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/event-settings')}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
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
                <Button onClick={handleSubmit} disabled={uploadingImage}>
                  {uploadingImage ? (
                    <>
                      <Upload className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Create Event'
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex-1 min-w-[200px]">
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
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="book_launch">Book Launch</SelectItem>
                <SelectItem value="signing">Book Signing</SelectItem>
                <SelectItem value="interview">Interview</SelectItem>
                <SelectItem value="conference">Conference</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Events ({filteredEvents.length})</CardTitle>
          <CardDescription>
            Manage and track all events
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Attendees</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : filteredEvents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    No events found
                  </TableCell>
                </TableRow>
              ) : (
                filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        {event.featured_image_url && (
                          <img 
                            src={event.featured_image_url} 
                            alt={event.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        )}
                        <div>
                          <div className="font-medium">{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground">
                              {event.description.length > 50 
                                ? `${event.description.substring(0, 50)}...` 
                                : event.description
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(event.event_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>
                          {new Date(event.event_date).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {event.is_virtual ? (
                          <Video className="h-4 w-4 text-blue-500" />
                        ) : (
                          <MapPin className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm">
                          {event.is_virtual ? 'Virtual' : (event.location || 'TBD')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">
                          {event.current_attendees || 0}
                          {event.max_attendees && ` / ${event.max_attendees}`}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(event.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openViewDialog(event)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(event)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        {event.is_virtual && event.meeting_link && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(event.meeting_link!, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details and settings.
            </DialogDescription>
          </DialogHeader>
          <EventForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={uploadingImage}>
              {uploadingImage ? (
                <>
                  <Upload className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Update Event'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {selectedEvent?.title}
            </DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-4">
              {selectedEvent.featured_image_url && (
                <img 
                  src={selectedEvent.featured_image_url} 
                  alt={selectedEvent.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Event Type</Label>
                  <div className="mt-1">{getEventTypeBadge(selectedEvent.event_type)}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedEvent.status)}</div>
                </div>
              </div>

              {selectedEvent.description && (
                <div>
                  <Label className="text-sm font-medium">Description</Label>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedEvent.description}
                  </p>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Start Date & Time</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(selectedEvent.event_date).toLocaleString()}
                    </span>
                  </div>
                </div>
                {selectedEvent.end_date && (
                  <div>
                    <Label className="text-sm font-medium">End Date & Time</Label>
                    <div className="mt-1 flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(selectedEvent.end_date).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm font-medium">Location</Label>
                <div className="mt-1 flex items-center space-x-2">
                  {selectedEvent.is_virtual ? (
                    <>
                      <Video className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Virtual Event</span>
                      {selectedEvent.meeting_link && (
                        <Button
                          variant="link"
                          size="sm"
                          onClick={() => window.open(selectedEvent.meeting_link!, '_blank')}
                          className="p-0 h-auto"
                        >
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Button>
                      )}
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{selectedEvent.location || 'TBD'}</span>
                    </>
                  )}
                </div>
              </div>

              {selectedEvent.registration_required && (
                <div>
                  <Label className="text-sm font-medium">Registration</Label>
                  <div className="mt-1 flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {selectedEvent.current_attendees || 0} attendees
                      {selectedEvent.max_attendees && ` (max: ${selectedEvent.max_attendees})`}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}