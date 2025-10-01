// Force rebuild after MediaKit removal
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { PlanSync } from "@/components/PlanSync";
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
import PublisherDashboard from "./pages/PublisherDashboard";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import SEOSettings from './pages/admin/SEOSettings';
import PublisherManagement from './pages/admin/PublisherManagement';
import PublisherFieldEdit from './pages/admin/PublisherFieldEdit';
import PublisherUserAssignment from './pages/admin/PublisherUserAssignment';
import ONIXManager from './pages/ONIXManager';
import Themes from "./pages/Themes";
import ContactForm from "./pages/ContactForm";
import UserContactManagement from "./pages/UserContactManagement";
import ContactFormSettings from "./pages/ContactFormSettings";

import BookCatalog from "./pages/admin/BookCatalog";
import ISBNLookupPage from "./pages/admin/ISBNLookup";
import AffiliateSettingsPage from "./pages/admin/AffiliateSettings";
import BookFieldSettingsPage from "./pages/admin/BookFieldSettings";
import BookAnalyticsPage from "./pages/admin/BookAnalytics";
import AdminUsers from "./pages/admin/Users";
import UserEdit from "./pages/admin/UserEdit";
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
import ContactManagement from "./pages/admin/ContactManagement";
import ContactSubmissionDetail from "./pages/ContactSubmissionDetail";
import AdminContactFormSettings from "./pages/admin/ContactFormSettings";
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
import PublicPage from "./pages/PublicPage";
import PublisherPublicView from "./pages/PublisherPublicView";
import AWSDeployment from "./pages/admin/AWSDeployment";
import BackupSecurityCenter from "./pages/admin/BackupSecurityCenter";

// User management imports
import UserBlogManagement from "./pages/UserBlogManagement";
import UserBlogCreate from "./pages/UserBlogCreate";
import UserBlogEdit from "./pages/UserBlogEdit";
import UserEventsManagement from "./pages/UserEventsManagement";
import UserEventCreate from "./pages/UserEventCreate";
import UserEventEdit from "./pages/UserEventEdit";
import UserAwardsManagement from "./pages/UserAwardsManagement";
import UserAwardCreate from "./pages/UserAwardCreate";
import UserAwardEdit from "./pages/UserAwardEdit";
import UserFaqManagement from "./pages/UserFaqManagement";
import UserFaqCreate from "./pages/UserFaqCreate";
import UserFaqEdit from "./pages/UserFaqEdit";
import UserNewsletterManagement from "./pages/UserNewsletterManagement";
import UserNewsletterCreate from "./pages/UserNewsletterCreate";
import UserNewsletterSettings from "./pages/UserNewsletterSettings";
import UserNewsletterEdit from "./pages/UserNewsletterEdit";

import { DashboardLayout } from "./components/layout/DashboardLayout";
import { AdminAccessGuard } from "./components/AdminAccessGuard";
import CookieConsentSettings from "./pages/CookieConsentSettings";
import { TestEmailSender } from "./components/TestEmailSender";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <PlanSync />
      <Toaster />
        <Sonner />
        
          <ThemeProvider>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/page/:slug" element={<PublicPage />} />
            <Route path="/publisher/:slug" element={<PublisherPublicView />} />
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
            <Route path="/publisher-dashboard" element={
              <DashboardLayout>
                <PublisherDashboard />
              </DashboardLayout>
            } />
            <Route path="/advanced-analytics" element={
              <DashboardLayout>
                <AdvancedAnalytics />
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
            <Route path="/admin/users/:userId/edit" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <UserEdit />
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
            <Route path="/admin/help-desk" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AdminHelpDesk />
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
            <Route path="/admin/contact-management" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <ContactManagement />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/contact-submission/:id" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <ContactSubmissionDetail />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/contact-form-settings" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AdminContactFormSettings />
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
            <Route path="/admin/cookie-consent" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <CookieConsentSettings />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/aws-deployment" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <AWSDeployment />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/backup-security" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <BackupSecurityCenter />
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
            <Route path="/admin/publishers/field/new" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <PublisherFieldEdit />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/publishers/field/edit" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <PublisherFieldEdit />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            <Route path="/admin/publishers/assign-users" element={
              <DashboardLayout>
                <AdminAccessGuard>
                  <PublisherUserAssignment />
                </AdminAccessGuard>
              </DashboardLayout>
            } />
            
            {/* User Content Management Routes */}
            <Route path="/user-blog-management" element={
              <DashboardLayout>
                <UserBlogManagement />
              </DashboardLayout>
            } />
            <Route path="/user-blog-management/create" element={
              <DashboardLayout>
                <UserBlogCreate />
              </DashboardLayout>
            } />
            <Route path="/user-blog-management/edit/:id" element={
              <DashboardLayout>
                <UserBlogEdit />
              </DashboardLayout>
            } />
            <Route path="/user-events-management" element={
              <DashboardLayout>
                <UserEventsManagement />
              </DashboardLayout>
            } />
            <Route path="/user-events-management/create" element={
              <DashboardLayout>
                <UserEventCreate />
              </DashboardLayout>
            } />
            <Route path="/user-events-management/edit/:id" element={
              <DashboardLayout>
                <UserEventEdit />
              </DashboardLayout>
            } />
            <Route path="/user-awards-management/create" element={
              <DashboardLayout>
                <UserAwardCreate />
              </DashboardLayout>
            } />
            <Route path="/user-awards-management/edit/:id" element={
              <DashboardLayout>
                <UserAwardEdit />
              </DashboardLayout>
            } />
            <Route path="/user-faq-management/create" element={
              <DashboardLayout>
                <UserFaqCreate />
              </DashboardLayout>
            } />
            <Route path="/user-faq-management/edit/:id" element={
              <DashboardLayout>
                <UserFaqEdit />
              </DashboardLayout>
            } />
            <Route path="/user-newsletter-management/create" element={
              <DashboardLayout>
                <UserNewsletterCreate />
              </DashboardLayout>
            } />
            <Route path="/user-newsletter-settings" element={
              <DashboardLayout>
                <UserNewsletterSettings />
              </DashboardLayout>
            } />
            <Route path="/user-newsletter-management/edit/:id" element={
              <DashboardLayout>
                <UserNewsletterEdit />
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
            <Route path="/contact-form" element={
              <DashboardLayout>
                <ContactForm />
              </DashboardLayout>
            } />
            <Route path="/contact-management" element={
              <DashboardLayout>
                <UserContactManagement />
              </DashboardLayout>
            } />
            <Route path="/contact-form-settings" element={
              <DashboardLayout>
                <ContactFormSettings />
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
