import { DemoSetup } from '@/components/DemoSetup';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Users, BarChart3, Globe } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="container mx-auto px-6 py-16">
        <div className="text-center space-y-6 mb-16">
          <div className="flex items-center justify-center mb-6">
            <BookOpen className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-5xl font-bold tracking-tight">AuthorPage Platform</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Create professional author profiles, showcase your books, and track your audience engagement with beautiful universal links.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')}>
              Get Started
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/auth')}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Author Profiles</h3>
            <p className="text-muted-foreground">Create beautiful, professional profiles with bio, publications, and contact information.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Book Pages</h3>
            <p className="text-muted-foreground">Showcase your books with detailed pages including covers, descriptions, and purchase links.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <Globe className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Universal Links</h3>
            <p className="text-muted-foreground">Share clean, professional URLs that work perfectly across social media and marketing.</p>
          </div>
          
          <div className="text-center space-y-4">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto">
              <BarChart3 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold">Analytics</h3>
            <p className="text-muted-foreground">Track page views, engagement, and audience insights to grow your readership.</p>
          </div>
        </div>

        {/* Demo Setup Section */}
        <div className="max-w-2xl mx-auto">
          <DemoSetup />
        </div>
      </div>
    </div>
  );
};

export default Index;
