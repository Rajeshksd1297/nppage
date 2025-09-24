import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Books from "./pages/Books";
import BookEdit from "./pages/BookEdit";
import Profile from "./pages/Profile";
import Analytics from "./pages/Analytics";
import AdminUsers from "./pages/admin/Users";
import AdminBooks from "./pages/admin/BooksAdmin";
import AdminSettings from "./pages/admin/Settings";
import { DashboardLayout } from "./components/layout/DashboardLayout";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
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
            <Route path="/books/:id" element={
              <DashboardLayout>
                <BookEdit />
              </DashboardLayout>
            } />
            <Route path="/profile" element={
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            } />
            <Route path="/analytics" element={
              <DashboardLayout>
                <Analytics />
              </DashboardLayout>
            } />
            <Route path="/admin/users" element={
              <DashboardLayout>
                <AdminUsers />
              </DashboardLayout>
            } />
            <Route path="/admin/books" element={
              <DashboardLayout>
                <AdminBooks />
              </DashboardLayout>
            } />
            <Route path="/admin/settings" element={
              <DashboardLayout>
                <AdminSettings />
              </DashboardLayout>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
