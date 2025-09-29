import React from 'react';
import { useNavigate } from 'react-router-dom';
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
}

interface DynamicFooterProps {
  config?: FooterConfig;
  siteTitle?: string;
}

export const DynamicFooter: React.FC<DynamicFooterProps> = ({
  config,
  siteTitle = "AuthorPage"
}) => {
  const navigate = useNavigate();
  
  const currentYear = new Date().getFullYear();
  const copyright = config?.copyright || `© ${currentYear} ${siteTitle}. All rights reserved.`;
  const customText = config?.customText || "Built with AuthorPage";
  const showPages = config?.showPages !== false;
  const showSocial = config?.showSocial !== false;

  const pageLinks = [
    { label: 'Home', url: '/' },
    { label: 'Authors', url: '/authors' },
    { label: 'Books', url: '/books' },
    { label: 'About', url: '/about' },
    { label: 'Contact', url: '/contact' },
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Service', url: '/terms' }
  ];

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

          {/* Quick Links */}
          {showPages && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Quick Links</h3>
              <ul className="space-y-2">
                {pageLinks.slice(0, 5).map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => navigate(link.url)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Legal Links */}
          {showPages && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">Legal</h3>
              <ul className="space-y-2">
                {pageLinks.slice(5).map((link, index) => (
                  <li key={index}>
                    <button
                      onClick={() => navigate(link.url)}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Contact & Social */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Connect</h3>
            
            {/* Contact Information */}
            {config?.contact && (
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
            )}

            {/* Social Links */}
            {showSocial && socialLinks.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                  Follow Us
                </h4>
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
        </div>

        {/* Bottom Section */}
        <div className="mt-8 pt-8 border-t border-border">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-sm text-muted-foreground">
              {copyright}
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span>Built with AuthorPage Platform</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};