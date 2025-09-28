// Force rebuild after MediaKit removal
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AuthorProfile from "./pages/AuthorProfile";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import BookEdit from "./pages/BookEdit";
import BookEntryMethod from "./pages/BookEntryMethod";
import BookView from "./pages/BookView";
import ProfileSettings from "./pages/ProfileSettings";
import Analytics from "./pages/Analytics";
import Subscription from "./pages/Subscription";
import CustomDomains from "./pages/CustomDomains";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import SEODashboard from './pages/SEODashboard';
import SEOSettings from './pages/admin/SEOSettings';
import PublisherManagement from './pages/admin/PublisherManagement';
import SocialConnections from './pages/SocialConnections';
import ONIXManager from './pages/ONIXManager';
import Themes from "./pages/Themes";
import ContactForm from "./pages/ContactForm";

import BookCatalog from "./pages/admin/BookCatalog";
import ISBNLookupPage from "./pages/admin/ISBNLookup";
import AffiliateSettingsPage from "./pages/admin/AffiliateSettings";
import BookFieldSettingsPage from "./pages/admin/BookFieldSettings";
import BookAnalyticsPage from "./pages/admin/BookAnalytics";
import AdminUsers from "./pages/admin/Users";
import AdminBooks from "./pages/admin/BooksAdmin";
import BooksManagement from "./pages/admin/BooksManagement";
import AdminSettings from "./pages/admin/Settings";
import AdminDashboard from "./pages/admin/AdminDashboard";
import SiteSettings from "./pages/admin/SiteSettings";
import EmailSettings from "./pages/admin/EmailSettings";
import PackageManagement from "./pages/admin/PackageManagement";
import DomainSettings from "./pages/admin/DomainSettings";
import AdminHelpDesk from "./pages/admin/HelpDesk";
import HelpDeskSettings from "./pages/admin/HelpDeskSettings";
import TicketDetails from "./pages/admin/TicketDetails";
import SupportTickets from "./pages/SupportTickets";
import ThemeManagement from "./pages/admin/ThemeManagement";
import BlogManagement from "./pages/admin/BlogManagement";
import BlogSettings from "./pages/admin/BlogSettings";
import EventsManagement from "./pages/admin/EventsManagement";
import AwardsManagement from "./pages/admin/AwardsManagement";
import FaqManagement from "./pages/admin/FaqManagement";
import NewsletterManagement from "./pages/admin/NewsletterManagement";
import NewsletterSettings from "./pages/admin/NewsletterSettings";
import EventSettings from "./pages/admin/EventSettings";
import AwardsSettings from "./pages/admin/AwardsSettings";
import FaqSettings from "./pages/admin/FaqSettings";
import HomePageManagement from "./pages/admin/HomePageManagement";
import HomePageEditor from "./pages/admin/HomePageEditor";
import Home from "./pages/Home";

// User management imports
import UserBlogManagement from "./pages/UserBlogManagement";
import UserEventsManagement from "./pages/UserEventsManagement";
import UserAwardsManagement from "./pages/UserAwardsManagement";
import UserFaqManagement from "./pages/UserFaqManagement";
import UserNewsletterManagement from "./pages/UserNewsletterManagement";

import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AdminAccessGuard } from "./components/AdminAccessGuard";
import { TestEmailSender } from "./components/TestEmailSender";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
          <ThemeProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/landing" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            } />
            <Route path="/books" element={
              <DashboardLayout>
                <Books />
              </DashboardLayout>
            } />
            <Route path="/books/new" element={
              <DashboardLayout>
                <BookEntryMethod />
              </DashboardLayout>
            } />
            <Route path="/books/new/form" element={
              <DashboardLayout>
                <BookEdit />
              </DashboardLayout>
            } />
            <Route path="/books/:id" element={
              <DashboardLayout>
                <BookView />
              </DashboardLayout>
            } />
            <Route path="/books/:id/edit" element={
              <DashboardLayout>
                <BookEdit />
              </DashboardLayout>
            } />
            <Route path="/profile" element={
              <DashboardLayout>
                <ProfileSettings />
              </DashboardLayout>
            } />
            <Route path="/analytics" element={
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            } />
            <Route path="/subscription" element={
              <DashboardLayout>
                <Subscription />
              </DashboardLayout>
            } />
            <Route path="/custom-domains" element={
              <DashboardLayout>
                <CustomDomains />
              </DashboardLayout>
            } />
            <Route path="/advanced-analytics" element={
              <DashboardLayout>
                <AdvancedAnalytics />
              </DashboardLayout>
            } />
            <Route path="/seo-dashboard" element={
              <DashboardLayout>
                <SEODashboard />
              </DashboardLayout>
            } />
            <Route path="/admin" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AdminDashboard />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/users" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AdminUsers />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/book-catalog" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <BookCatalog />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/isbn-lookup" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <ISBNLookupPage />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/affiliate-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AffiliateSettingsPage />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/field-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <BookFieldSettingsPage />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/book-analytics" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <BookAnalyticsPage />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/books" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AdminBooks />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/books-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <BooksManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AdminSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/site-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <SiteSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/email-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <EmailSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/test-emails" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <div className="container mx-auto py-6 flex justify-center">
                    <TestEmailSender />
                  </div>
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/package-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <PackageManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/domain-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <DomainSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/help-desk" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AdminHelpDesk />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/help-desk-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <HelpDeskSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/seo-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <SEOSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/ticket/:id" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <TicketDetails />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/theme-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <ThemeManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/blog-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <BlogManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/blog-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <BlogSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/events-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <EventsManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/event-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <EventSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/awards-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AwardsManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/awards-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AwardsSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/faq-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <FaqManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/faq-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <FaqSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/newsletter-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <NewsletterManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/newsletter-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <NewsletterSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/home-page-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <HomePageManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/home-page-editor" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <HomePageEditor />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/publishers" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <PublisherManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            
            {/* User Content Management Routes */}
            <Route path="/user-blog-management" element={
              <DashboardLayout>
                <UserBlogManagement />
              </DashboardLayout>
            } />
            <Route path="/user-events-management" element={
              <DashboardLayout>
                <UserEventsManagement />
              </DashboardLayout>
            } />
            <Route path="/user-awards-management" element={
              <DashboardLayout>
                <UserAwardsManagement />
              </DashboardLayout>
            } />
            <Route path="/user-faq-management" element={
              <DashboardLayout>
                <UserFaqManagement />
              </DashboardLayout>
            } />
            <Route path="/user-newsletter-management" element={
              <DashboardLayout>
                <UserNewsletterManagement />
              </DashboardLayout>
            } />
            <Route path="/themes" element={
              <DashboardLayout>
                <Themes />
              </DashboardLayout>
            } />
            <Route path="/social-connections" element={
              <DashboardLayout>
                <SocialConnections />
              </DashboardLayout>
            } />
            <Route path="/contact-form" element={
              <DashboardLayout>
                <ContactForm />
              </DashboardLayout>
            } />
            <Route path="/onix-manager" element={
              <DashboardLayout>
                <ONIXManager />
              </DashboardLayout>
            } />
            <Route path="/support-tickets" element={
              <DashboardLayout>
                <SupportTickets />
              </DashboardLayout>
            } />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            {/* Public author profile route - must be last before catch-all */}
            <Route path="/:slug" element={<AuthorProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ThemeProvider>
        
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
