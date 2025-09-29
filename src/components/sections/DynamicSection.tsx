import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  BookOpen, 
  User, 
  Calendar, 
  Star, 
  ExternalLink,
  ArrowRight,
  Check,
  Crown,
  Zap,
  Users,
  MessageSquare,
  Award,
  TrendingUp,
  Globe,
  Palette,
  Mail,
  FileText,
  Shield,
  Clock
} from 'lucide-react';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  cover_image_url?: string;
  description?: string;
  status: string;
  publication_date?: string;
  user_id: string;
}

interface DynamicSectionProps {
  type: string;
  title: string;
  config: any;
  books?: Book[];
}

export const DynamicSection: React.FC<DynamicSectionProps> = ({
  type,
  title,
  config,
  books
}) => {
  const navigate = useNavigate();

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: JSX.Element } = {
      book: <BookOpen className="h-6 w-6" />,
      user: <User className="h-6 w-6" />,
      users: <Users className="h-6 w-6" />,
      calendar: <Calendar className="h-6 w-6" />,
      star: <Star className="h-6 w-6" />,
      check: <Check className="h-6 w-6" />,
      crown: <Crown className="h-6 w-6" />,
      zap: <Zap className="h-6 w-6" />,
      message: <MessageSquare className="h-6 w-6" />,
      award: <Award className="h-6 w-6" />,
      trending: <TrendingUp className="h-6 w-6" />,
      globe: <Globe className="h-6 w-6" />,
      palette: <Palette className="h-6 w-6" />,
      mail: <Mail className="h-6 w-6" />,
      file: <FileText className="h-6 w-6" />,
      shield: <Shield className="h-6 w-6" />,
      clock: <Clock className="h-6 w-6" />
    };
    return icons[iconName] || <Star className="h-6 w-6" />;
  };

  const getBackgroundClass = (bg?: string) => {
    if (!bg) return 'bg-background';
    
    const bgClasses: { [key: string]: string } = {
      'muted/20': 'bg-muted/20',
      'muted/50': 'bg-muted/50',
      'primary/5': 'bg-primary/5',
      'gradient-primary': 'bg-gradient-to-br from-primary/5 to-accent/5',
      'gradient-muted': 'bg-gradient-to-br from-muted/20 to-muted/30'
    };
    
    return bgClasses[bg] || bg;
  };

  const getAnimationClass = (animation?: string) => {
    const animations: { [key: string]: string } = {
      'fade-in': 'animate-fade-in',
      'slide-in-right': 'animate-slide-in-right',
      'scale-in': 'animate-scale-in'
    };
    return animations[animation || ''] || '';
  };

  // Render different section types
  const renderSectionContent = () => {
    switch (type) {
      case 'interactive_hero':
        return renderInteractiveHero();
      case 'premium_showcase':
        return renderPremiumShowcase();
      case 'free_vs_pro':
        return renderFreeVsPro();
      case 'faq':
        return renderFAQ();
      case 'free_success':
        return renderFreeSuccess();
      case 'book_showcase':
        return renderBookShowcase();
      case 'features_grid':
        return renderFeaturesGrid();
      case 'testimonials':
        return renderTestimonials();
      case 'stats':
        return renderStats();
      default:
        return renderGenericSection();
    }
  };

  const renderInteractiveHero = () => (
    <div className="text-center space-y-8">
      {/* Trust Signals */}
      {config.trustSignals && (
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          {config.trustSignals.map((signal: string, index: number) => (
            <Badge key={index} variant="secondary" className="bg-primary/10">
              <Check className="h-3 w-3 mr-1" />
              {signal}
            </Badge>
          ))}
        </div>
      )}

      {config.title && (
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground via-primary to-accent bg-clip-text text-transparent">
          {config.title}
        </h1>
      )}

      {config.subtitle && (
        <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto">
          {config.subtitle}
        </p>
      )}

      {config.features && (
        <div className="grid md:grid-cols-3 gap-8 my-12">
          {config.features.map((feature: any, index: number) => (
            <div key={index} className="text-center group">
              <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                {getIcon(feature.icon)}
              </div>
              <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      )}

      {config.buttons && (
        <div className="flex gap-4 justify-center flex-wrap">
          {config.buttons.map((button: any, index: number) => (
            <Button
              key={index}
              size="lg"
              variant={button.variant === 'primary' ? 'default' : 'outline'}
              onClick={() => navigate(button.url)}
              className={`
                font-bold transition-all duration-300
                ${button.effect === 'glow' ? 'shadow-lg hover:shadow-xl' : ''}
                ${button.variant === 'primary' ? 'bg-gradient-to-r from-primary to-accent' : ''}
              `}
            >
              {button.text}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ))}
        </div>
      )}
    </div>
  );

  const renderFreeVsPro = () => (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">{config.title}</h2>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{config.subtitle}</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {config.plans?.map((plan: any, index: number) => (
          <Card key={index} className={`
            relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105
            ${plan.popular ? 'border-primary shadow-lg' : 'border-green-200'}
          `}>
            {plan.popular && (
              <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-accent text-white text-center py-2 text-sm font-medium">
                <Crown className="inline h-4 w-4 mr-1" />
                {plan.highlight}
              </div>
            )}

            <CardHeader className={plan.popular ? 'pt-12' : 'pt-6'}>
              <div className="text-center space-y-4">
                {plan.image && (
                  <img src={plan.image} alt={plan.name} className="w-full h-48 object-cover rounded-lg" />
                )}
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-3xl font-bold">
                  ${plan.price}
                  <span className="text-lg font-normal text-muted-foreground">/{plan.period}</span>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features?.map((feature: string, featureIndex: number) => (
                  <li key={featureIndex} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="w-full"
                variant={plan.popular ? 'default' : 'outline'}
                onClick={() => navigate(plan.ctaUrl)}
              >
                {plan.ctaText}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderBookShowcase = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">Featured Books</h2>
        <p className="text-xl text-muted-foreground">Discover amazing stories from our authors</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {books?.slice(0, 6).map((book) => (
          <Card key={book.id} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader className="p-0">
              {book.cover_image_url ? (
                <img 
                  src={book.cover_image_url} 
                  alt={book.title}
                  className="w-full h-64 object-cover rounded-t-lg group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-64 bg-gradient-to-br from-primary/20 to-accent/20 rounded-t-lg flex items-center justify-center">
                  <BookOpen className="h-16 w-16 text-primary" />
                </div>
              )}
            </CardHeader>
            <CardContent className="p-6">
              <CardTitle className="text-lg mb-2 group-hover:text-primary transition-colors">
                {book.title}
              </CardTitle>
              {book.subtitle && (
                <CardDescription className="mb-3">{book.subtitle}</CardDescription>
              )}
              {book.description && (
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                  {book.description}
                </p>
              )}
              <Button variant="outline" size="sm" className="w-full group">
                View Book
                <ExternalLink className="ml-2 h-3 w-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderFeaturesGrid = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {config.features?.map((feature: any, index: number) => (
        <Card key={index} className="text-center hover:shadow-lg transition-all duration-300 group">
          <CardHeader>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              {getIcon(feature.icon)}
            </div>
            <CardTitle className="text-xl">{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-base">{feature.description}</CardDescription>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderFAQ = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">{config.title}</h2>
        <p className="text-xl text-muted-foreground">{config.subtitle}</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
        {config.categories?.map((category: any, categoryIndex: number) => (
          <div key={categoryIndex} className="space-y-4">
            <h3 className="text-2xl font-semibold">{category.name}</h3>
            {category.questions?.map((qa: any, qaIndex: number) => (
              <Card key={qaIndex} className="p-6">
                <CardTitle className="text-lg mb-3">{qa.question}</CardTitle>
                <CardDescription className="text-base leading-relaxed">{qa.answer}</CardDescription>
              </Card>
            ))}
          </div>
        ))}
      </div>
    </div>
  );

  const renderFreeSuccess = () => (
    <div className="text-center space-y-8">
      <h2 className="text-4xl font-bold">{config.title}</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {config.stories?.map((story: any, index: number) => (
          <Card key={index} className="text-center hover:shadow-lg transition-all duration-300">
            <CardHeader>
              <img 
                src={story.image} 
                alt={story.name}
                className="w-16 h-16 rounded-full mx-auto mb-4"
              />
              <CardTitle>{story.name}</CardTitle>
              <Badge variant="secondary">{story.plan}</Badge>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4 italic">"{story.quote}"</p>
              <p className="text-sm font-medium text-primary">{story.result}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderStats = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
      {config.stats?.map((stat: any, index: number) => (
        <div key={index} className="text-center">
          <div className="text-4xl font-bold text-primary mb-2">{stat.value}</div>
          <div className="text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>
  );

  const renderTestimonials = () => (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      {config.testimonials?.map((testimonial: any, index: number) => (
        <Card key={index} className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
            <div className="flex items-center">
              <img 
                src={testimonial.avatar} 
                alt={testimonial.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <div className="font-semibold">{testimonial.name}</div>
                <div className="text-sm text-muted-foreground">{testimonial.title}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderPremiumShowcase = () => (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold mb-4">{config.title}</h2>
        <p className="text-xl text-muted-foreground">{config.subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {config.items?.map((item: any, index: number) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-300">
            <CardHeader>
              {item.image && (
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="w-full h-48 object-cover rounded-lg mb-4 group-hover:scale-105 transition-transform"
                />
              )}
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  {getIcon(item.icon)}
                </div>
                {item.premium && <Badge className="bg-gradient-to-r from-primary to-accent">Pro</Badge>}
                {item.freeFeature && <Badge variant="secondary">Free</Badge>}
              </div>
              <CardTitle>{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {item.features?.map((feature: string, featureIndex: number) => (
                  <li key={featureIndex} className="flex items-center text-sm">
                    <Check className="h-3 w-3 text-green-500 mr-2" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderGenericSection = () => (
    <div className="text-center space-y-8">
      <h2 className="text-4xl font-bold">{title}</h2>
      {config.subtitle && (
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">{config.subtitle}</p>
      )}
      {config.content && (
        <div className="prose prose-lg mx-auto" dangerouslySetInnerHTML={{ __html: config.content }} />
      )}
    </div>
  );

  return (
    <section className={`
      py-16 lg:py-24
      ${getBackgroundClass(config.backgroundColor)}
      ${getAnimationClass(config.animation)}
    `}>
      <div className="container mx-auto px-6">
        {renderSectionContent()}
      </div>
    </section>
  );
};