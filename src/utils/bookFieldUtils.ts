export interface BookField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'multiselect' | 'url' | 'email' | 'json';
  required: boolean;
  visible: boolean;
  enabled: boolean;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    pattern?: string;
  };
  category: 'basic' | 'publishing' | 'seo' | 'advanced';
  systemField: boolean;
  order: number;
}

const defaultFields: BookField[] = [
  {
    id: 'title',
    name: 'title',
    label: 'Book Title',
    type: 'text',
    required: true,
    visible: true,
    enabled: true,
    placeholder: 'Enter the book title',
    helpText: 'The main title of your book',
    category: 'basic',
    systemField: true,
    order: 1,
    validation: { minLength: 1, maxLength: 200 }
  },
  {
    id: 'subtitle',
    name: 'subtitle',
    label: 'Subtitle',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Enter the book subtitle (optional)',
    helpText: 'Additional title information',
    category: 'basic',
    systemField: false,
    order: 2,
    validation: { maxLength: 200 }
  },
  {
    id: 'description',
    name: 'description',
    label: 'Description',
    type: 'textarea',
    required: true,
    visible: true,
    enabled: true,
    placeholder: 'Describe your book...',
    helpText: 'A compelling description of your book',
    category: 'basic',
    systemField: false,
    order: 3,
    validation: { minLength: 10, maxLength: 2000 }
  },
  {
    id: 'isbn',
    name: 'isbn',
    label: 'ISBN',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Enter ISBN (10 or 13 digits)',
    helpText: 'International Standard Book Number',
    category: 'publishing',
    systemField: false,
    order: 4,
    validation: { pattern: '^[0-9]{10,13}$' }
  },
  {
    id: 'category',
    name: 'category',
    label: 'Category',
    type: 'select',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Select a category',
    helpText: 'Primary book category',
    category: 'basic',
    systemField: false,
    order: 5,
    options: ['Fiction', 'Non-Fiction', 'Biography', 'Science Fiction', 'Fantasy', 'Romance', 'Mystery', 'Thriller', 'Self-Help', 'Business', 'History', 'Science', 'Technology', 'Art', 'Philosophy', 'Religion', 'Children', 'Young Adult', 'Poetry', 'Drama']
  },
  {
    id: 'genres',
    name: 'genres',
    label: 'Genres',
    type: 'multiselect',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Select genres',
    helpText: 'Multiple genres that apply to your book',
    category: 'basic',
    systemField: false,
    order: 6,
    options: ['Action', 'Adventure', 'Comedy', 'Crime', 'Drama', 'Fantasy', 'Historical', 'Horror', 'Romance', 'Science Fiction', 'Thriller', 'Western', 'Biography', 'Memoir', 'Self-Help', 'Business', 'Health', 'Travel', 'Cooking', 'Art', 'Music', 'Sports', 'Politics', 'Religion', 'Philosophy', 'Psychology', 'Education', 'Technology', 'Science']
  },
  {
    id: 'publisher',
    name: 'publisher',
    label: 'Publisher',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Enter publisher name',
    helpText: 'The publisher of your book',
    category: 'publishing',
    systemField: false,
    order: 7,
    validation: { maxLength: 100 }
  },
  {
    id: 'publication_date',
    name: 'publication_date',
    label: 'Publication Date',
    type: 'date',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Select publication date',
    helpText: 'When the book was or will be published',
    category: 'publishing',
    systemField: false,
    order: 8
  },
  {
    id: 'page_count',
    name: 'page_count',
    label: 'Page Count',
    type: 'number',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Enter number of pages',
    helpText: 'Total number of pages in the book',
    category: 'publishing',
    systemField: false,
    order: 9,
    validation: { min: 1, max: 10000 }
  },
  {
    id: 'language',
    name: 'language',
    label: 'Language',
    type: 'select',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Select language',
    helpText: 'Primary language of the book',
    category: 'publishing',
    systemField: false,
    order: 10,
    defaultValue: 'en',
    options: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi', 'other']
  },
  {
    id: 'cover_image_url',
    name: 'cover_image_url',
    label: 'Cover Image URL',
    type: 'url',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'https://example.com/cover.jpg',
    helpText: 'URL to your book cover image',
    category: 'basic',
    systemField: false,
    order: 11
  },
  {
    id: 'seo_title',
    name: 'seo_title',
    label: 'SEO Title',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'SEO optimized title',
    helpText: 'Title optimized for search engines',
    category: 'seo',
    systemField: false,
    order: 12,
    validation: { maxLength: 60 }
  },
  {
    id: 'seo_description',
    name: 'seo_description',
    label: 'SEO Description',
    type: 'textarea',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'SEO meta description',
    helpText: 'Description for search engine results',
    category: 'seo',
    systemField: false,
    order: 13,
    validation: { maxLength: 160 }
  },
  {
    id: 'seo_keywords',
    name: 'seo_keywords',
    label: 'SEO Keywords',
    type: 'text',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'keyword1, keyword2, keyword3',
    helpText: 'Comma-separated keywords for SEO',
    category: 'seo',
    systemField: false,
    order: 14,
    validation: { maxLength: 200 }
  },
  {
    id: 'purchase_links',
    name: 'purchase_links',
    label: 'Purchase Links',
    type: 'json',
    required: false,
    visible: true,
    enabled: true,
    placeholder: 'Managed by affiliate settings',
    helpText: 'Links where readers can purchase your book',
    category: 'advanced',
    systemField: false,
    order: 15
  }
];

export const getBookFieldSettings = (): BookField[] => {
  try {
    const savedSettings = localStorage.getItem('bookFieldSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Error loading field settings:', error);
  }
  return defaultFields;
};

export const getEnabledVisibleFields = (): BookField[] => {
  return getBookFieldSettings().filter(field => field.enabled && field.visible);
};

export const getFieldsByCategory = (category: 'basic' | 'publishing' | 'seo' | 'advanced'): BookField[] => {
  return getEnabledVisibleFields()
    .filter(field => field.category === category)
    .sort((a, b) => a.order - b.order);
};

export const getCategoryDisplayName = (category: string): string => {
  switch (category) {
    case 'basic': return 'Basic Info';
    case 'publishing': return 'Publishing';
    case 'seo': return 'SEO';
    case 'advanced': return 'Advanced (Available Links)';
    default: return category;
  }
};