import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import ProfileManager from "./pages/ProfileManager";
import Analytics from "./pages/Analytics";
import Subscription from "./pages/Subscription";
import CustomDomains from "./pages/CustomDomains";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import SEODashboard from './pages/SEODashboard';
import Articles from './pages/Articles';
import ArticleEditor from './pages/ArticleEditor';
import SEOSettings from './pages/admin/SEOSettings';
import PublisherManagement from './pages/admin/PublisherManagement';
import SocialConnections from './pages/SocialConnections';
import ONIXManager from './pages/ONIXManager';
import Themes from "./pages/Themes";
import ContactForm from "./pages/ContactForm";
import MediaKit from "./pages/MediaKit";
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
import { DashboardLayout } from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ThemeProvider>
          <Routes>
            <Route path="/" element={<Index />} />
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
                <ProfileManager />
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
            <Route path="/articles" element={
              <DashboardLayout>
                <Articles />
              </DashboardLayout>
            } />
            <Route path="/article-editor" element={
              <DashboardLayout>
                <ArticleEditor />
              </DashboardLayout>
            } />
            <Route path="/article-editor/:id" element={
              <DashboardLayout>
                <ArticleEditor />
              </DashboardLayout>
            } />
            <Route path="/admin/seo-settings" element={
              <DashboardLayout>
                <SEOSettings />
              </DashboardLayout>
            } />
            <Route path="/admin/publishers" element={
              <DashboardLayout>
                <PublisherManagement />
              </DashboardLayout>
            } />
            <Route path="/social-connections" element={
              <DashboardLayout>
                <SocialConnections />
              </DashboardLayout>
            } />
            <Route path="/onix-manager" element={
              <DashboardLayout>
                <ONIXManager />
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
            <Route path="/media-kit" element={
              <DashboardLayout>
                <MediaKit />
              </DashboardLayout>
            } />
            <Route path="/admin" element={
              <DashboardLayout>
                <AdminDashboard />
              </DashboardLayout>
            } />
            <Route path="/admin/users" element={
              <DashboardLayout>
                <AdminUsers />
              </DashboardLayout>
            } />
            <Route path="/admin/book-catalog" element={
              <DashboardLayout>
                <BookCatalog />
              </DashboardLayout>
            } />
            <Route path="/admin/isbn-lookup" element={
              <DashboardLayout>
                <ISBNLookupPage />
              </DashboardLayout>
            } />
            <Route path="/admin/affiliate-settings" element={
              <DashboardLayout>
                <AffiliateSettingsPage />
              </DashboardLayout>
            } />
            <Route path="/admin/field-settings" element={
              <DashboardLayout>
                <BookFieldSettingsPage />
              </DashboardLayout>
            } />
            <Route path="/admin/book-analytics" element={
              <DashboardLayout>
                <BookAnalyticsPage />
              </DashboardLayout>
            } />
            <Route path="/admin/books" element={
              <DashboardLayout>
                <AdminBooks />
              </DashboardLayout>
            } />
            <Route path="/admin/books-management" element={
              <DashboardLayout>
                <BooksManagement />
              </DashboardLayout>
            } />
            <Route path="/admin/settings" element={
              <DashboardLayout>
                <AdminSettings />
              </DashboardLayout>
            } />
            <Route path="/admin/site-settings" element={
              <DashboardLayout>
                <SiteSettings />
              </DashboardLayout>
            } />
            <Route path="/admin/email-settings" element={
              <DashboardLayout>
                <EmailSettings />
              </DashboardLayout>
            } />
            <Route path="/admin/package-management" element={
              <DashboardLayout>
                <PackageManagement />
              </DashboardLayout>
            } />
            <Route path="/admin/domain-settings" element={
              <DashboardLayout>
                <DomainSettings />
              </DashboardLayout>
            } />
            <Route path="/admin/help-desk" element={
              <DashboardLayout>
                <AdminHelpDesk />
              </DashboardLayout>
            } />
            <Route path="/admin/help-desk-settings" element={
              <DashboardLayout>
                <HelpDeskSettings />
              </DashboardLayout>
            } />
            <Route path="/admin/ticket/:id" element={
              <DashboardLayout>
                <TicketDetails />
              </DashboardLayout>
            } />
            <Route path="/support-tickets" element={
              <DashboardLayout>
                <SupportTickets />
              </DashboardLayout>
            } />
            <Route path="/admin/theme-management" element={
              <DashboardLayout>
                <ThemeManagement />
              </DashboardLayout>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            {/* Public author profile route - must be last before catch-all */}
            <Route path="/:slug" element={<AuthorProfile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </ThemeProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
