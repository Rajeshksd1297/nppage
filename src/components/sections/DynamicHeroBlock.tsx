import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  Check, 
  Crown, 
  Star, 
  BookOpen,
  Users,
  Zap,
  Globe,
  Award,
  TrendingUp
} from 'lucide-react';

interface HeroConfig {
  layout?: 'centered' | 'split' | 'minimal';
  title?: string;
  subtitle?: string;
  description?: string;
  buttons?: Array<{
    text: string;
    url: string;
    variant?: 'primary' | 'secondary' | 'outline';
    size?: 'sm' | 'lg' | 'xl';
    effect?: 'glow' | 'hover-lift' | 'none';
  }>;
  features?: Array<{
    icon: string;
    title: string;
    description: string;
  }>;
  trustSignals?: string[];
  backgroundImage?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  animation?: 'fade-in' | 'slide-in' | 'scale-in';
  showStats?: boolean;
  stats?: Array<{
    value: string;
    label: string;
    icon?: string;
  }>;
}

interface DynamicHeroBlockProps {
  config: HeroConfig;
  name?: string;
  description?: string;
}

export const DynamicHeroBlock: React.FC<DynamicHeroBlockProps> = ({
  config,
  name,
  description
}) => {
  const navigate = useNavigate();

  const getIcon = (iconName: string) => {
    const icons: { [key: string]: JSX.Element } = {
      check: <Check className="h-6 w-6" />,
      crown: <Crown className="h-6 w-6" />,
      star: <Star className="h-6 w-6" />,
      book: <BookOpen className="h-6 w-6" />,
      users: <Users className="h-6 w-6" />,
      zap: <Zap className="h-6 w-6" />,
      globe: <Globe className="h-6 w-6" />,
      award: <Award className="h-6 w-6" />,
      trending: <TrendingUp className="h-6 w-6" />
    };
    return icons[iconName] || <Star className="h-6 w-6" />;
  };

  const getBackgroundClass = (bg?: string) => {
    if (!bg) return 'bg-gradient-to-br from-primary/5 via-background to-accent/5';
    
    const bgClasses: { [key: string]: string } = {
      'gradient-primary': 'bg-gradient-to-br from-primary/10 to-accent/10',
      'gradient-muted': 'bg-gradient-to-br from-muted/20 to-muted/30',
      'image': 'bg-cover bg-center relative',
      'solid': 'bg-background'
    };
    
    return bgClasses[bg] || bg;
  };

  const getAnimationClass = (animation?: string) => {
    const animations: { [key: string]: string } = {
      'fade-in': 'animate-fade-in',
      'slide-in': 'animate-slide-in-right',
      'scale-in': 'animate-scale-in'
    };
    return animations[animation || ''] || '';
  };

  const getTextAlignClass = (align?: string) => {
    return align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';
  };

  const handleButtonClick = (url: string) => {
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  return (
    <section className={`
      py-20 lg:py-32 relative overflow-hidden
      ${getBackgroundClass(config.backgroundColor)}
      ${getAnimationClass(config.animation)}
    `}>
      {/* Background Image Overlay */}
      {config.backgroundImage && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${config.backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20" />
        </>
      )}

      <div className="container mx-auto px-6 relative z-10">
        {/* Trust Signals */}
        {config.trustSignals && config.trustSignals.length > 0 && (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {config.trustSignals.map((signal, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="bg-white/10 backdrop-blur-sm text-foreground border-primary/20"
              >
                <Check className="h-3 w-3 mr-1" />
                {signal}
              </Badge>
            ))}
          </div>
        )}

        <div className={`max-w-6xl mx-auto ${getTextAlignClass(config.textAlign)}`}>
          {/* Main Content */}
          <div className="space-y-8">
            {/* Title */}
            {config.title && (
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight bg-gradient-to-br from-foreground via-primary to-accent bg-clip-text text-transparent">
                {config.title}
              </h1>
            )}

            {/* Subtitle */}
            {config.subtitle && (
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                {config.subtitle}
              </p>
            )}

            {/* Description */}
            {config.description && (
              <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                {config.description}
              </p>
            )}

            {/* Features */}
            {config.features && config.features.length > 0 && (
              <div className="flex justify-center gap-8 my-12 flex-wrap">
                {config.features.map((feature, index) => (
                  <div key={index} className="text-center group max-w-xs">
                    <div className="w-16 h-16 bg-primary/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 group-hover:bg-primary/20 transition-all duration-300">
                      <div className="text-primary">
                        {getIcon(feature.icon)}
                      </div>
                    </div>
                    <h3 className="font-bold text-foreground text-lg mb-2">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            {config.buttons && config.buttons.length > 0 && (
              <div className="flex gap-4 justify-center flex-wrap">
                {config.buttons.map((button, index) => (
                  <Button
                    key={index}
                    size={button.size === 'xl' ? 'lg' : (button.size || 'lg')}
                    variant={button.variant === 'primary' ? 'default' : button.variant === 'secondary' ? 'secondary' : 'outline'}
                    onClick={() => handleButtonClick(button.url)}
                    className={`
                      font-bold transition-all duration-300 group
                      ${button.size === 'xl' ? 'text-xl px-12 py-6 h-16' : ''}
                      ${button.effect === 'glow' ? 'shadow-2xl shadow-primary/40 hover:shadow-3xl hover:shadow-primary/60' : ''}
                      ${button.effect === 'hover-lift' ? 'hover:scale-105 hover:-translate-y-1' : ''}
                      ${button.variant === 'primary' ? 'bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90' : ''}
                    `}
                  >
                    {button.variant === 'primary' && <Check className="mr-2 h-5 w-5" />}
                    {button.variant === 'secondary' && <Crown className="mr-2 h-5 w-5" />}
                    {button.text}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                ))}
              </div>
            )}

            {/* Stats */}
            {config.showStats && config.stats && config.stats.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 pt-16 border-t border-border/50">
                {config.stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    {stat.icon && (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-3">
                        {getIcon(stat.icon)}
                      </div>
                    )}
                    <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};