/**
 * Site Configuration
 * Centralized configuration for site-wide settings
 */

export const siteConfig = {
  name: 'Go My Page',
  domain: 'gomypage.com',
  url: 'https://gomypage.com',
  description: 'Go My Page - Professional Author Platform',
  tagline: 'Create professional author profiles and showcase your books',
  
  social: {
    twitter: '@gomypage',
  },
  
  contact: {
    email: 'contact@gomypage.com',
  },
  
  seo: {
    defaultTitle: 'Go My Page - Author Platform',
    titleTemplate: '%s | Go My Page',
    defaultDescription: 'Create professional author profiles and showcase your books with Go My Page',
  },
} as const;

export type SiteConfig = typeof siteConfig;
