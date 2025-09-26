export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string;
  author?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'book';
  publishedTime?: string;
  modifiedTime?: string;
}

export const updateSEO = (config: SEOConfig) => {
  // Update title
  document.title = config.title;

  // Update or create meta tags
  const updateMetaTag = (name: string, content: string, property?: boolean) => {
    const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
    let element = document.querySelector(selector) as HTMLMetaElement;
    
    if (!element) {
      element = document.createElement('meta');
      if (property) {
        element.setAttribute('property', name);
      } else {
        element.setAttribute('name', name);
      }
      document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
  };

  // Basic meta tags
  updateMetaTag('description', config.description);
  if (config.keywords) updateMetaTag('keywords', config.keywords);
  if (config.author) updateMetaTag('author', config.author);

  // Open Graph tags
  updateMetaTag('og:title', config.title, true);
  updateMetaTag('og:description', config.description, true);
  updateMetaTag('og:type', config.type || 'website', true);
  if (config.url) updateMetaTag('og:url', config.url, true);
  if (config.image) updateMetaTag('og:image', config.image, true);
  if (config.publishedTime) updateMetaTag('article:published_time', config.publishedTime, true);
  if (config.modifiedTime) updateMetaTag('article:modified_time', config.modifiedTime, true);

  // Twitter Card tags
  updateMetaTag('twitter:card', 'summary_large_image');
  updateMetaTag('twitter:title', config.title);
  updateMetaTag('twitter:description', config.description);
  if (config.image) updateMetaTag('twitter:image', config.image);

  // Canonical URL
  if (config.url) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', config.url);
  }
};

export const generateStructuredData = (type: 'Person' | 'Book' | 'Organization', data: any): Record<string, any> => {
  const baseSchema: Record<string, any> = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  let schema = { ...baseSchema };

  switch (type) {
    case 'Person':
      schema = {
        ...schema,
        name: data.name,
        description: data.bio,
        url: data.website,
        image: data.avatar,
        sameAs: data.socialLinks ? Object.values(data.socialLinks) : [],
        jobTitle: 'Author',
        knowsAbout: data.specializations || [],
      };
      break;
    case 'Book':
      schema = {
        ...schema,
        name: data.title,
        description: data.description,
        author: data.author,
        isbn: data.isbn,
        datePublished: data.publicationDate,
        genre: data.genres,
        image: data.coverImage,
        publisher: data.publisher,
        numberOfPages: data.pageCount,
      };
      break;
    case 'Organization':
      schema = {
        ...schema,
        name: data.name,
        description: data.description,
        url: data.url,
        logo: data.logo,
      };
      break;
  }

  // Remove undefined values
  Object.keys(schema).forEach(key => {
    if (schema[key] === undefined) {
      delete schema[key];
    }
  });

  return schema;
};

export const injectStructuredData = (schema: Record<string, any>) => {
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  
  // Remove existing structured data
  const existing = document.querySelector('script[type="application/ld+json"]');
  if (existing) {
    existing.remove();
  }
  
  document.head.appendChild(script);
};