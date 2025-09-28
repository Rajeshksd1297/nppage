import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  TrendingUp, 
  Users, 
  Eye, 
  PlusCircle, 
  Calendar, 
  CreditCard, 
  Crown,
  MessageSquare,
  Newspaper,
  Award,
  HelpCircle,
  Mail,
  ExternalLink,
  Lock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useSubscription } from "@/hooks/useSubscription";
import { useDynamicFeatures } from "@/hooks/useDynamicFeatures";
import { DashboardWelcome } from "@/components/DashboardWelcome";

interface UserContentStats {
  totalBooks: number;
  publishedBooks: number;
  totalViews: number;
  thisMonthViews: number;
  blogPosts: number;
  publishedBlogPosts: number;
  events: number;
  upcomingEvents: number;
  awards: number;
  faqs: number;
  publishedFaqs: number;
  newsletterSubscribers: number;
  contactSubmissions: number;
  thisMonthContacts: number;
}

interface RecentActivity {
  type: 'book' | 'blog' | 'event' | 'award' | 'faq' | 'contact';
  title: string;
  date: string;
  status?: string;
  url: string;
}

export function DynamicUserDashboard() {
  const [stats, setStats] = useState<UserContentStats>({
    totalBooks: 0,
    publishedBooks: 0,
    totalViews: 0,
    thisMonthViews: 0,
    blogPosts: 0,
    publishedBlogPosts: 0,
    events: 0,
    upcomingEvents: 0,
    awards: 0,
    faqs: 0,
    publishedFaqs: 0,
    newsletterSubscribers: 0,
    contactSubmissions: 0,
    thisMonthContacts: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const navigate = useNavigate();
  
  const {
    subscription,
    hasFeature,
    getLimit,
    isOnTrial,
    trialDaysLeft,
    isPro,
    getCurrentPlanName
  } = useSubscription();
  
  const { getPlanFeatures } = useDynamicFeatures();

  useEffect(() => {
    fetchDynamicDashboardData();
  }, []);

  const fetchDynamicDashboardData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      setUserProfile(profile);

      // Get current plan features
      const currentPlanFeatures = subscription?.subscription_plans?.id 
        ? getPlanFeatures(subscription.subscription_plans.id) 
        : [];

      const thisMonthStart = new Date();
      thisMonthStart.setDate(1);

      // Initialize stats
      const newStats: UserContentStats = {
        totalBooks: 0,
        publishedBooks: 0,
        totalViews: 0,
        thisMonthViews: 0,
        blogPosts: 0,
        publishedBlogPosts: 0,
        events: 0,
        upcomingEvents: 0,
        awards: 0,
        faqs: 0,
        publishedFaqs: 0,
        newsletterSubscribers: 0,
        contactSubmissions: 0,
        thisMonthContacts: 0
      };

      const activity: RecentActivity[] = [];

      // Fetch books data (always available)
      const { data: books } = await supabase
        .from('books')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (books) {
        newStats.totalBooks = books.length;
        newStats.publishedBooks = books.filter(b => b.status === 'published').length;
        
        books.slice(0, 3).forEach(book => {
          activity.push({
            type: 'book',
            title: book.title,
            date: book.created_at,
            status: book.status,
            url: `/books/${book.id}`
          });
        });
      }

      // Fetch analytics for books and profile views
      const { data: analytics } = await supabase
        .from('page_analytics')
        .select('*')
        .or(`page_type.eq.profile,and(page_type.eq.book,page_id.in.(${books?.map(b => b.slug).join(',') || 'none'}))`);

      if (analytics) {
        newStats.totalViews = analytics.length;
        newStats.thisMonthViews = analytics.filter(a => 
          new Date(a.created_at) >= thisMonthStart
        ).length;
      }

      // Conditionally fetch data based on enabled features
      const enabledFeatures = currentPlanFeatures.map(f => f.id);

      // Blog data
      if (enabledFeatures.includes('blog')) {
        const { data: blogPosts } = await supabase
          .from('blog_posts')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (blogPosts) {
          newStats.blogPosts = blogPosts.length;
          newStats.publishedBlogPosts = blogPosts.filter(p => p.status === 'published').length;
          
          blogPosts.slice(0, 2).forEach(post => {
            activity.push({
              type: 'blog',
              title: post.title,
              date: post.created_at,
              status: post.status,
              url: `/user-blog-management`
            });
          });
        }
      }

      // Events data
      if (enabledFeatures.includes('events')) {
        const { data: events } = await supabase
          .from('events')
          .select('*')
          .eq('user_id', user.id)
          .order('event_date', { ascending: false });

        if (events) {
          newStats.events = events.length;
          newStats.upcomingEvents = events.filter(e => 
            new Date(e.event_date) > new Date()
          ).length;
          
          events.slice(0, 2).forEach(event => {
            activity.push({
              type: 'event',
              title: event.title,
              date: event.created_at,
              status: event.status,
              url: `/user-events-management`
            });
          });
        }
      }

      // Awards data
      if (enabledFeatures.includes('awards')) {
        const { data: awards } = await supabase
          .from('awards')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (awards) {
          newStats.awards = awards.length;
          
          awards.slice(0, 2).forEach(award => {
            activity.push({
              type: 'award',
              title: award.title,
              date: award.created_at,
              url: `/user-awards-management`
            });
          });
        }
      }

      // FAQ data
      if (enabledFeatures.includes('faq')) {
        const { data: faqs } = await supabase
          .from('faqs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (faqs) {
          newStats.faqs = faqs.length;
          newStats.publishedFaqs = faqs.filter(f => f.is_published).length;
          
          faqs.slice(0, 2).forEach(faq => {
            activity.push({
              type: 'faq',
              title: faq.question,
              date: faq.created_at,
              url: `/user-faq-management`
            });
          });
        }
      }

      // Newsletter data
      if (enabledFeatures.includes('newsletter')) {
        const { data: subscribers } = await supabase
          .from('newsletter_subscribers')
          .select('*')
          .eq('user_id', user.id);

        if (subscribers) {
          newStats.newsletterSubscribers = subscribers.length;
        }
      }

      // Contact submissions data
      if (enabledFeatures.includes('contact_forms')) {
        const { data: contacts } = await supabase
          .from('contact_submissions')
          .select('*')
          .eq('contacted_user_id', user.id)
          .order('created_at', { ascending: false });

        if (contacts) {
          newStats.contactSubmissions = contacts.length;
          newStats.thisMonthContacts = contacts.filter(c => 
            new Date(c.created_at) >= thisMonthStart
          ).length;
          
          contacts.slice(0, 2).forEach(contact => {
            activity.push({
              type: 'contact',
              title: `Message from ${contact.name}`,
              date: contact.created_at,
              status: contact.status,
              url: `/contact-management`
            });
          });
        }
      }

      setStats(newStats);
      
      // Sort recent activity by date
      setRecentActivity(
        activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
      );

    } catch (error) {
      console.error('Error fetching dynamic dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFeatureCards = () => {
    if (!subscription?.subscription_plans?.id) return [];
    
    const currentPlanFeatures = getPlanFeatures(subscription.subscription_plans.id);
    const enabledFeatures = currentPlanFeatures.map(f => f.id);

    const allFeatureCards = [
      {
        id: 'blog',
        title: 'Blog Posts',
        icon: Newspaper,
        value: stats.blogPosts,
        subtitle: `${stats.publishedBlogPosts} published`,
        action: () => navigate('/user-blog-management'),
        actionLabel: 'Manage Blog'
      },
      {
        id: 'events',
        title: 'Events',
        icon: Calendar,
        value: stats.events,
        subtitle: `${stats.upcomingEvents} upcoming`,
        action: () => navigate('/user-events-management'),
        actionLabel: 'Manage Events'
      },
      {
        id: 'awards',
        title: 'Awards',
        icon: Award,
        value: stats.awards,
        subtitle: 'achievements',
        action: () => navigate('/user-awards-management'),
        actionLabel: 'Manage Awards'
      },
      {
        id: 'faq',
        title: 'FAQs',
        icon: HelpCircle,
        value: stats.faqs,
        subtitle: `${stats.publishedFaqs} published`,
        action: () => navigate('/user-faq-management'),
        actionLabel: 'Manage FAQ'
      },
      {
        id: 'newsletter',
        title: 'Newsletter',
        icon: Mail,
        value: stats.newsletterSubscribers,
        subtitle: 'subscribers',
        action: () => navigate('/user-newsletter-management'),
        actionLabel: 'Manage Newsletter'
      },
      {
        id: 'contact_forms',
        title: 'Contact Messages',
        icon: MessageSquare,
        value: stats.contactSubmissions,
        subtitle: `${stats.thisMonthContacts} this month`,
        action: () => navigate('/contact-management'),
        actionLabel: 'View Messages'
      }
    ];

    return allFeatureCards.map(card => ({
      ...card,
      enabled: enabledFeatures.includes(card.id)
    }));
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'book': return BookOpen;
      case 'blog': return Newspaper;
      case 'event': return Calendar;
      case 'award': return Award;
      case 'faq': return HelpCircle;
      case 'contact': return MessageSquare;
      default: return BookOpen;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardWelcome 
        userName={userProfile?.full_name} 
        subscriptionPlan={subscription?.subscription_plans?.name || 'Free'} 
        isPro={isPro()} 
        isOnTrial={isOnTrial()} 
        trialDaysLeft={trialDaysLeft} 
      />
      
      {/* Core Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Books</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground">{stats.publishedBooks} published</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalViews}</div>
            <p className="text-xs text-muted-foreground">All time page visits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.thisMonthViews}</div>
            <p className="text-xs text-muted-foreground">Views this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile?.slug ? 'Live' : 'Setup'}</div>
            <p className="text-xs text-muted-foreground">
              {userProfile?.slug ? (
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => window.open(`/${userProfile.slug}`, '_blank')}>
                  View Profile <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              ) : (
                <Button variant="link" className="h-auto p-0 text-xs" onClick={() => navigate('/profile')}>
                  Complete Setup
                </Button>
              )}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Feature-based Content Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {getFeatureCards().map(card => (
          <Card key={card.id} className={`${!card.enabled ? 'opacity-60' : ''}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {card.title}
                {!card.enabled && <Lock className="h-3 w-3 text-muted-foreground" />}
              </CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.enabled ? card.value : '-'}</div>
              <p className="text-xs text-muted-foreground mb-2">{card.enabled ? card.subtitle : 'Premium Feature'}</p>
              <Button 
                size="sm" 
                variant={card.enabled ? "outline" : "default"}
                onClick={card.enabled ? card.action : () => navigate('/subscription')}
                className="w-full"
              >
                {card.enabled ? card.actionLabel : 'Upgrade to Access'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Subscription Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription Overview
            {subscription?.subscription_plans?.name && (
              <Badge variant={isPro() ? 'default' : 'secondary'} className="ml-2">
                {subscription.subscription_plans.name}
                {isPro() && <Crown className="h-3 w-3 ml-1" />}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.totalBooks}</p>
              <p className="text-sm text-muted-foreground">
                Books ({getLimit('books') === Infinity ? 'Unlimited' : `${getLimit('books')} max`})
              </p>
              {getLimit('books') !== Infinity && stats.totalBooks >= getLimit('books') && (
                <Badge variant="destructive" className="mt-1 text-xs">Limit Reached</Badge>
              )}
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.publishedBooks}</p>
              <p className="text-sm text-muted-foreground">Published Books</p>
            </div>
            <div className="text-center p-4 bg-muted/50 rounded-lg">
              <p className="text-2xl font-bold text-primary">{stats.totalViews}</p>
              <p className="text-sm text-muted-foreground">Total Views</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest content updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const IconComponent = getActivityIcon(activity.type);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">{activity.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                          {activity.status && ` • ${activity.status}`}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => navigate(activity.url)}>
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button onClick={() => navigate('/books/new')} className="flex items-center gap-2">
          <PlusCircle className="h-4 w-4" />
          Add New Book
        </Button>
        <Button onClick={() => navigate('/profile')} variant="outline" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          Edit Profile
        </Button>
        <Button onClick={() => navigate('/analytics')} variant="outline" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          View Analytics
        </Button>
        <Button onClick={() => navigate('/subscription')} variant="outline" className="flex items-center gap-2">
          <Crown className="h-4 w-4" />
          Manage Subscription
        </Button>
      </div>
    </div>
  );
}