import React from 'react';
import { DynamicHomePage } from '@/components/DynamicHomePage';

// Public Home component that bypasses authentication
const PublicHome = () => {
  console.log('PublicHome component rendering - no auth required');
  
  // Simple fallback content in case DynamicHomePage fails
  return (
    <div>
      <DynamicHomePage />
      
      {/* Fallback content if dynamic loading fails */}
      <noscript>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-6 max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold">Welcome to AuthorPage</h1>
            <p className="text-xl text-muted-foreground">
              Professional author profiles and book showcases for the modern writer.
            </p>
            <div className="flex gap-4 justify-center">
              <a 
                href="/auth" 
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Get Started
              </a>
              <a 
                href="/auth" 
                className="px-6 py-3 border border-border rounded-lg hover:bg-accent"
              >
                Sign In
              </a>
            </div>
          </div>
        </div>
      </noscript>
    </div>
  );
};

export default PublicHome;