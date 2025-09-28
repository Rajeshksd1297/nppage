import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useNavigate } from 'react-router-dom';
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

interface Event {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_date: string;
  end_date: string | null;
  location: string | null;
  event_type: string;
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
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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
    navigate(`/user-events-management/edit/${event.id}`);
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
      <span className={`px-2 py-1 rounded-full text-xs ${colors[type as keyof typeof colors] || colors.general}`}>
        {type.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

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
        <Button onClick={() => navigate('/user-events-management/create')}>
          <Plus className="h-4 w-4 mr-2" />
          Create Event
        </Button>
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

      {/* Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Events ({filteredEvents.length})</CardTitle>
          <CardDescription>
            Manage your event schedule and details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading events...</div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events found</p>
              <p className="text-sm">Create your first event to get started</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => {
                  const eventDate = formatEventDate(event.event_date);
                  return (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{event.title}</div>
                          {event.description && (
                            <div className="text-sm text-muted-foreground line-clamp-1">
                              {event.description}
                            </div>
                          )}
                          {event.registration_required && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                              <Users className="h-3 w-3" />
                              {event.current_attendees}/{event.max_attendees || '∞'} attendees
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getEventTypeBadge(event.event_type)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          <div>
                            <div>{eventDate.date}</div>
                            <div className="text-muted-foreground">{eventDate.time}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          {event.is_virtual ? (
                            <>
                              <Video className="h-3 w-3" />
                              <span>Virtual</span>
                              {event.meeting_link && (
                                <ExternalLink 
                                  className="h-3 w-3 text-muted-foreground cursor-pointer" 
                                  onClick={() => window.open(event.meeting_link!, '_blank')}
                                />
                              )}
                            </>
                          ) : (
                            <>
                              <MapPin className="h-3 w-3" />
                              <span>{event.location || 'TBD'}</span>
                            </>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(event.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditDialog(event)}
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDelete(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </FeatureAccessGuard>
  );
}