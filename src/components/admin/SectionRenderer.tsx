import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, BarChart3, Users, Globe, CheckCircle } from 'lucide-react';

interface SectionConfig {
  title?: string;
  subtitle?: string;
  description?: string;
  backgroundColor?: string;
  textColor?: string;
  buttons?: Array<{ text: string; url: string; variant: 'primary' | 'secondary' }>;
  items?: Array<any>;
  features?: Array<any>;
  trustSignals?: Array<string>;
  plans?: Array<any>;
  stories?: Array<any>;
  categories?: Array<any>;
}

interface SectionRendererProps {
  type: string;
  config: SectionConfig;
  className?: string;
}

const SectionRenderer = ({ type, config, className = '' }: SectionRendererProps) => {
  const renderHeroSection = () => (
    <div className={`py-16 px-8 text-center ${className}`}>
      {config.title && (
        <h1 className="text-4xl font-bold mb-4">{config.title}</h1>
      )}
      {config.subtitle && (
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{config.subtitle}</p>
      )}
      {config.features && (
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {config.features.slice(0, 3).map((feature: any, index: number) => (
            <div key={index} className="text-center">
              <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
              <h3 className="font-semibold mb-1">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      )}
      {config.buttons && (
        <div className="flex justify-center space-x-4">
          {config.buttons.slice(0, 2).map((button: any, index: number) => (
            <Button
              key={index}
              variant={button.variant === 'primary' ? 'default' : 'outline'}
              size="lg"
            >
              {button.text}
            </Button>
          ))}
        </div>
      )}
      {config.trustSignals && (
        <div className="mt-8 text-sm text-muted-foreground">
          {config.trustSignals.slice(0, 3).map((signal: string, index: number) => (
            <div key={index} className="mb-1">{signal}</div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStatsSection = () => (
    <div className={`py-12 px-8 ${className}`}>
      {config.title && (
        <h2 className="text-3xl font-bold text-center mb-8">{config.title}</h2>
      )}
      <div className="grid md:grid-cols-4 gap-8">
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">15,000+</div>
          <div className="text-muted-foreground">Authors</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">50,000+</div>
          <div className="text-muted-foreground">Books Published</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">94%</div>
          <div className="text-muted-foreground">Success Rate</div>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">24/7</div>
          <div className="text-muted-foreground">Support</div>
        </div>
      </div>
    </div>
  );

  const renderFeaturesSection = () => (
    <div className={`py-12 px-8 ${className}`}>
      {config.title && (
        <h2 className="text-3xl font-bold text-center mb-4">{config.title}</h2>
      )}
      {config.subtitle && (
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">{config.subtitle}</p>
      )}
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { icon: Star, title: "Professional Profiles", description: "Beautiful author profiles that showcase your work" },
          { icon: BarChart3, title: "Advanced Analytics", description: "Track your readers and book performance" },
          { icon: Users, title: "Community Features", description: "Connect with other authors and readers" }
        ].map((feature, index) => (
          <div key={index} className="text-center">
            <feature.icon className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPricingSection = () => (
    <div className={`py-12 px-8 ${className}`}>
      {config.title && (
        <h2 className="text-3xl font-bold text-center mb-4">{config.title}</h2>
      )}
      {config.subtitle && (
        <p className="text-lg text-muted-foreground text-center mb-12">{config.subtitle}</p>
      )}
      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <div className="border rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-2">Free Plan</h3>
          <div className="text-4xl font-bold text-primary mb-4">$0</div>
          <p className="text-muted-foreground mb-6">Perfect for getting started</p>
          <ul className="text-left space-y-2 mb-6">
            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Up to 5 books</li>
            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Basic profile</li>
            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Basic themes</li>
          </ul>
          <Button variant="outline" className="w-full">Get Started</Button>
        </div>
        <div className="border rounded-lg p-8 text-center bg-primary/5 border-primary">
          <Badge className="mb-2">Popular</Badge>
          <h3 className="text-2xl font-bold mb-2">Pro Plan</h3>
          <div className="text-4xl font-bold text-primary mb-4">$19.99</div>
          <p className="text-muted-foreground mb-6">For serious authors</p>
          <ul className="text-left space-y-2 mb-6">
            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Unlimited books</li>
            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Custom domain</li>
            <li className="flex items-center"><CheckCircle className="h-4 w-4 text-green-500 mr-2" /> Premium themes</li>
          </ul>
          <Button className="w-full">Start 30-Day Trial</Button>
        </div>
      </div>
    </div>
  );

  const renderFaqSection = () => (
    <div className={`py-12 px-8 ${className}`}>
      {config.title && (
        <h2 className="text-3xl font-bold text-center mb-4">{config.title}</h2>
      )}
      {config.subtitle && (
        <p className="text-lg text-muted-foreground text-center mb-12">{config.subtitle}</p>
      )}
      <div className="max-w-3xl mx-auto space-y-4">
        {[
          { question: "How quickly can I set up my profile?", answer: "Most authors have their profile live within 2-3 minutes." },
          { question: "Do I need technical skills?", answer: "Not at all! Everything is point-and-click with intuitive tools." },
          { question: "Can I use my own domain?", answer: "Yes! Pro plans include custom domain support." }
        ].map((faq, index) => (
          <div key={index} className="border rounded-lg p-6">
            <h3 className="font-semibold mb-2">{faq.question}</h3>
            <p className="text-muted-foreground">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderSuccessStoriesSection = () => (
    <div className={`py-12 px-8 ${className}`}>
      {config.title && (
        <h2 className="text-3xl font-bold text-center mb-4">{config.title}</h2>
      )}
      {config.subtitle && (
        <p className="text-lg text-muted-foreground text-center mb-12">{config.subtitle}</p>
      )}
      <div className="grid md:grid-cols-3 gap-8">
        {[
          { name: "Sarah Mitchell", genre: "Romance Author", achievement: "300% increase in sales" },
          { name: "Marcus Chen", genre: "Sci-Fi Author", achievement: "First bestseller in 6 months" },
          { name: "Elena Rodriguez", genre: "Fantasy Author", achievement: "Traditional publishing deal" }
        ].map((story, index) => (
          <div key={index} className="text-center border rounded-lg p-6">
            <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
            <h3 className="font-semibold mb-1">{story.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{story.genre}</p>
            <p className="font-medium text-primary">{story.achievement}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderCtaSection = () => (
    <div className={`py-16 px-8 text-center bg-primary text-primary-foreground ${className}`}>
      {config.title && (
        <h2 className="text-3xl font-bold mb-4">{config.title}</h2>
      )}
      {config.subtitle && (
        <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">{config.subtitle}</p>
      )}
      {config.buttons && (
        <div className="flex justify-center space-x-4">
          {config.buttons.slice(0, 2).map((button: any, index: number) => (
            <Button
              key={index}
              variant={button.variant === 'primary' ? 'secondary' : 'outline'}
              size="lg"
              className="text-primary bg-white hover:bg-gray-100"
            >
              {button.text}
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  const getBackgroundClasses = () => {
    switch (config.backgroundColor) {
      case 'muted': return 'bg-muted';
      case 'primary': return 'bg-primary text-primary-foreground';
      case 'secondary': return 'bg-secondary text-secondary-foreground';
      case 'accent': return 'bg-accent text-accent-foreground';
      default: return 'bg-background';
    }
  };

  const backgroundClasses = getBackgroundClasses();

  switch (type) {
    case 'hero':
    case 'interactive_hero':
      return <div className={backgroundClasses}>{renderHeroSection()}</div>;
    case 'stats':
      return <div className={backgroundClasses}>{renderStatsSection()}</div>;
    case 'features':
      return <div className={backgroundClasses}>{renderFeaturesSection()}</div>;
    case 'free_vs_pro':
    case 'pricing':
      return <div className={backgroundClasses}>{renderPricingSection()}</div>;
    case 'faq':
      return <div className={backgroundClasses}>{renderFaqSection()}</div>;
    case 'success_stories':
    case 'free_success':
      return <div className={backgroundClasses}>{renderSuccessStoriesSection()}</div>;
    case 'trial_cta':
    case 'final_cta':
      return <div className={backgroundClasses}>{renderCtaSection()}</div>;
    default:
      return (
        <div className={`py-12 px-8 ${backgroundClasses} ${className}`}>
          {config.title && (
            <h2 className="text-2xl font-bold mb-4">{config.title}</h2>
          )}
          {config.subtitle && (
            <p className="text-muted-foreground">{config.subtitle}</p>
          )}
          <div className="text-center text-muted-foreground mt-8">
            <div className="text-sm">Section Type: {type}</div>
          </div>
        </div>
      );
  }
};

export default SectionRenderer;