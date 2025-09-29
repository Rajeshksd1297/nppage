import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useDynamicFooter } from '@/hooks/useDynamicFooter';
import { 
  BookOpen, 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Mail,
  MapPin,
  Phone,
  Globe
} from 'lucide-react';

interface FooterConfig {
  copyright?: string;
  showPages?: boolean;
  customText?: string;
  showSocial?: boolean;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  contact?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  navigation?: Array<{
    label: string;
    url: string;
    external?: boolean;
  }>;
}

interface DynamicFooterProps {
  config?: FooterConfig;
  siteTitle?: string;
}

export const DynamicFooter: React.FC<DynamicFooterProps> = ({
  config: propConfig,
  siteTitle: propSiteTitle
}) => {
  const navigate = useNavigate();
  
  // Load dynamic configuration from database
  const { footerConfig, siteTitle: dbSiteTitle, loading } = useDynamicFooter();
  
  // Use prop config if provided, otherwise use database config
  const config = propConfig || footerConfig;
  const siteTitle = propSiteTitle || dbSiteTitle;
  // Show loading skeleton if still loading and no prop config provided
  if (loading && !propConfig) {
    return (
      <footer className="bg-muted/50 border-t">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="space-y-4">
                <div className="h-5 bg-muted rounded w-24 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div>
                  <div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </footer>
    );
  }
  
  const currentYear = new Date().getFullYear();
  const copyright = config?.copyright || `© ${currentYear} ${siteTitle}. All rights reserved.`;
  const customText = config?.customText || "";
  const showPages = config?.showPages && config?.navigation && config.navigation.length > 0;
  const showSocial = config?.showSocial && config?.socialLinks;

  // Use navigation from config, or empty array
  const navigationLinks = config?.navigation || [];

  const socialLinks = [
    { 
      icon: <Twitter className="h-5 w-5" />, 
      url: config?.socialLinks?.twitter, 
      label: 'Twitter' 
    },
    { 
      icon: <Facebook className="h-5 w-5" />, 
      url: config?.socialLinks?.facebook, 
      label: 'Facebook' 
    },
    { 
      icon: <Instagram className="h-5 w-5" />, 
      url: config?.socialLinks?.instagram, 
      label: 'Instagram' 
    },
    { 
      icon: <Linkedin className="h-5 w-5" />, 
      url: config?.socialLinks?.linkedin, 
      label: 'LinkedIn' 
    }
  ].filter(link => link.url);

  const handleNavigation = (url: string, external?: boolean) => {
    if (external) {
      window.open(url, '_blank');
    } else {
      navigate(url);
    }
  };

  return (
    <footer className="bg-muted/50 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {siteTitle}
              </span>
            </div>
            <p className="text-sm text-muted-foreground max-w-xs">
              Professional author profiles and book showcases for the modern writer.
            </p>
            {customText && (
              <p className="text-xs text-muted-foreground">
                {customText}
              </p>
            )}
          </div>

          {/* Navigation Links - Only show if configured */}
          {showPages && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
              <ul className="space-y-2">
                {navigationLinks.map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => handleNavigation(link.url, link.external)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors text-left"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact Information - Only show if configured */}
          {config?.contact && (config.contact.email || config.contact.phone || config.contact.address) && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Contact</h3>
              <div className="space-y-2">
                {config.contact.email && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <a 
                      href={`mailto:${config.contact.email}`}
                      className="hover:text-primary transition-colors"
                    >
                      {config.contact.email}
                    </a>
                  </div>
                )}
                
                {config.contact.phone && (
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <a 
                      href={`tel:${config.contact.phone}`}
                      className="hover:text-primary transition-colors"
                    >
                      {config.contact.phone}
                    </a>
                  </div>
                )}
                
                {config.contact.address && (
                  <div className="flex items-start space-x-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5" />
                    <span>{config.contact.address}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Social Links - Only show if configured */}
          {showSocial && socialLinks.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Follow Us</h3>
              <div className="flex space-x-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-muted-foreground">
              {copyright}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};