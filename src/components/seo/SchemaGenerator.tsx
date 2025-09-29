import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Copy, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SchemaData {
  type: string;
  name: string;
  description: string;
  url: string;
  image: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  publisher?: string;
  logo?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressRegion: string;
    postalCode: string;
    addressCountry: string;
  };
  contactPoint?: {
    telephone: string;
    contactType: string;
    email: string;
  };
  price?: string;
  currency?: string;
  availability?: string;
  brand?: string;
  reviews?: {
    rating: number;
    reviewCount: number;
  };
}

const SCHEMA_TYPES = [
  { value: 'Article', label: 'Article' },
  { value: 'BlogPosting', label: 'Blog Post' },
  { value: 'NewsArticle', label: 'News Article' },
  { value: 'Book', label: 'Book' },
  { value: 'Product', label: 'Product' },
  { value: 'Organization', label: 'Organization' },
  { value: 'Person', label: 'Person' },
  { value: 'LocalBusiness', label: 'Local Business' },
  { value: 'WebSite', label: 'Website' },
  { value: 'WebPage', label: 'Web Page' },
  { value: 'BreadcrumbList', label: 'Breadcrumb' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'HowTo', label: 'How-To' },
  { value: 'Recipe', label: 'Recipe' },
  { value: 'Event', label: 'Event' },
  { value: 'Review', label: 'Review' }
];

export const SchemaGenerator: React.FC = () => {
  const [schemaType, setSchemaType] = useState<string>('Article');
  const [schemaData, setSchemaData] = useState<SchemaData>({
    type: 'Article',
    name: '',
    description: '',
    url: '',
    image: ''
  });
  const [generatedSchema, setGeneratedSchema] = useState<string>('');
  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setSchemaData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setSchemaData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      } as any
    }));
  };

  const handleContactChange = (field: string, value: string) => {
    setSchemaData(prev => ({
      ...prev,
      contactPoint: {
        ...prev.contactPoint,
        [field]: value
      } as any
    }));
  };

  const generateSchema = () => {
    const schema: any = {
      '@context': 'https://schema.org',
      '@type': schemaData.type,
      name: schemaData.name,
      description: schemaData.description,
      url: schemaData.url
    };

    if (schemaData.image) {
      schema.image = schemaData.image;
    }

    // Add type-specific properties
    switch (schemaData.type) {
      case 'Article':
      case 'BlogPosting':
      case 'NewsArticle':
        if (schemaData.author) {
          schema.author = {
            '@type': 'Person',
            name: schemaData.author
          };
        }
        if (schemaData.datePublished) {
          schema.datePublished = schemaData.datePublished;
        }
        if (schemaData.dateModified) {
          schema.dateModified = schemaData.dateModified;
        }
        if (schemaData.publisher) {
          schema.publisher = {
            '@type': 'Organization',
            name: schemaData.publisher,
            logo: schemaData.logo ? {
              '@type': 'ImageObject',
              url: schemaData.logo
            } : undefined
          };
        }
        break;

      case 'Product':
        if (schemaData.brand) {
          schema.brand = {
            '@type': 'Brand',
            name: schemaData.brand
          };
        }
        if (schemaData.price && schemaData.currency) {
          schema.offers = {
            '@type': 'Offer',
            price: schemaData.price,
            priceCurrency: schemaData.currency,
            availability: schemaData.availability || 'https://schema.org/InStock'
          };
        }
        if (schemaData.reviews) {
          schema.aggregateRating = {
            '@type': 'AggregateRating',
            ratingValue: schemaData.reviews.rating,
            reviewCount: schemaData.reviews.reviewCount
          };
        }
        break;

      case 'LocalBusiness':
      case 'Organization':
        if (schemaData.address) {
          schema.address = {
            '@type': 'PostalAddress',
            ...schemaData.address
          };
        }
        if (schemaData.contactPoint) {
          schema.contactPoint = {
            '@type': 'ContactPoint',
            ...schemaData.contactPoint
          };
        }
        break;

      case 'Person':
        if (schemaData.author) {
          schema.jobTitle = schemaData.author;
        }
        break;

      case 'Book':
        if (schemaData.author) {
          schema.author = {
            '@type': 'Person',
            name: schemaData.author
          };
        }
        if (schemaData.datePublished) {
          schema.datePublished = schemaData.datePublished;
        }
        break;
    }

    const schemaString = JSON.stringify(schema, null, 2);
    setGeneratedSchema(schemaString);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSchema);
    toast({
      title: "Copied!",
      description: "Schema markup copied to clipboard",
    });
  };

  const downloadSchema = () => {
    const blob = new Blob([generatedSchema], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schema-${schemaData.type.toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const validateSchema = () => {
    window.open(`https://search.google.com/test/rich-results?url=${encodeURIComponent(schemaData.url)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Schema Markup Generator</CardTitle>
          <CardDescription>
            Generate structured data to help search engines understand your content
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="schema-type">Schema Type</Label>
              <Select value={schemaType} onValueChange={(value) => {
                setSchemaType(value);
                setSchemaData(prev => ({ ...prev, type: value }));
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select schema type" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEMA_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="content">Content Details</TabsTrigger>
                <TabsTrigger value="business">Business Info</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name/Title *</Label>
                    <Input
                      id="name"
                      value={schemaData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Enter name or title"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">URL *</Label>
                    <Input
                      id="url"
                      value={schemaData.url}
                      onChange={(e) => handleInputChange('url', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={schemaData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Brief description"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Image URL</Label>
                  <Input
                    id="image"
                    value={schemaData.image}
                    onChange={(e) => handleInputChange('image', e.target.value)}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                {(['Article', 'BlogPosting', 'NewsArticle', 'Book'].includes(schemaType)) && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="author">Author</Label>
                        <Input
                          id="author"
                          value={schemaData.author || ''}
                          onChange={(e) => handleInputChange('author', e.target.value)}
                          placeholder="Author name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="publisher">Publisher</Label>
                        <Input
                          id="publisher"
                          value={schemaData.publisher || ''}
                          onChange={(e) => handleInputChange('publisher', e.target.value)}
                          placeholder="Publisher name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="datePublished">Date Published</Label>
                        <Input
                          id="datePublished"
                          type="date"
                          value={schemaData.datePublished || ''}
                          onChange={(e) => handleInputChange('datePublished', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateModified">Date Modified</Label>
                        <Input
                          id="dateModified"
                          type="date"
                          value={schemaData.dateModified || ''}
                          onChange={(e) => handleInputChange('dateModified', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="logo">Publisher Logo URL</Label>
                      <Input
                        id="logo"
                        value={schemaData.logo || ''}
                        onChange={(e) => handleInputChange('logo', e.target.value)}
                        placeholder="https://example.com/logo.jpg"
                      />
                    </div>
                  </>
                )}

                {schemaType === 'Product' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="brand">Brand</Label>
                        <Input
                          id="brand"
                          value={schemaData.brand || ''}
                          onChange={(e) => handleInputChange('brand', e.target.value)}
                          placeholder="Brand name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="price">Price</Label>
                        <Input
                          id="price"
                          value={schemaData.price || ''}
                          onChange={(e) => handleInputChange('price', e.target.value)}
                          placeholder="29.99"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Input
                          id="currency"
                          value={schemaData.currency || ''}
                          onChange={(e) => handleInputChange('currency', e.target.value)}
                          placeholder="USD"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="availability">Availability</Label>
                      <Select value={schemaData.availability || ''} onValueChange={(value) => handleInputChange('availability', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select availability" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="https://schema.org/InStock">In Stock</SelectItem>
                          <SelectItem value="https://schema.org/OutOfStock">Out of Stock</SelectItem>
                          <SelectItem value="https://schema.org/PreOrder">Pre Order</SelectItem>
                          <SelectItem value="https://schema.org/BackOrder">Back Order</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </TabsContent>

              <TabsContent value="business" className="space-y-4">
                {(['LocalBusiness', 'Organization'].includes(schemaType)) && (
                  <>
                    <div className="space-y-4">
                      <h4 className="font-medium">Address Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="streetAddress">Street Address</Label>
                          <Input
                            id="streetAddress"
                            value={schemaData.address?.streetAddress || ''}
                            onChange={(e) => handleAddressChange('streetAddress', e.target.value)}
                            placeholder="123 Main St"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addressLocality">City</Label>
                          <Input
                            id="addressLocality"
                            value={schemaData.address?.addressLocality || ''}
                            onChange={(e) => handleAddressChange('addressLocality', e.target.value)}
                            placeholder="New York"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addressRegion">State/Region</Label>
                          <Input
                            id="addressRegion"
                            value={schemaData.address?.addressRegion || ''}
                            onChange={(e) => handleAddressChange('addressRegion', e.target.value)}
                            placeholder="NY"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input
                            id="postalCode"
                            value={schemaData.address?.postalCode || ''}
                            onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                            placeholder="10001"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="addressCountry">Country</Label>
                          <Input
                            id="addressCountry"
                            value={schemaData.address?.addressCountry || ''}
                            onChange={(e) => handleAddressChange('addressCountry', e.target.value)}
                            placeholder="US"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-medium">Contact Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="telephone">Phone</Label>
                          <Input
                            id="telephone"
                            value={schemaData.contactPoint?.telephone || ''}
                            onChange={(e) => handleContactChange('telephone', e.target.value)}
                            placeholder="+1-555-123-4567"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            value={schemaData.contactPoint?.email || ''}
                            onChange={(e) => handleContactChange('email', e.target.value)}
                            placeholder="contact@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactType">Contact Type</Label>
                          <Select value={schemaData.contactPoint?.contactType || ''} onValueChange={(value) => handleContactChange('contactType', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="customer service">Customer Service</SelectItem>
                              <SelectItem value="sales">Sales</SelectItem>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="billing">Billing</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </TabsContent>
            </Tabs>

            <Button onClick={generateSchema} className="w-full">
              Generate Schema Markup
            </Button>
          </div>
        </CardContent>
      </Card>

      {generatedSchema && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Generated Schema Markup
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadSchema}>
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button variant="outline" size="sm" onClick={validateSchema}>
                  <Eye className="h-4 w-4 mr-2" />
                  Test
                </Button>
              </div>
            </CardTitle>
            <CardDescription>
              Copy this JSON-LD markup and add it to your page's &lt;head&gt; section
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
              <code>{generatedSchema}</code>
            </pre>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">How to implement:</h4>
              <ol className="text-sm text-blue-800 space-y-1">
                <li>1. Copy the JSON-LD code above</li>
                <li>2. Wrap it in &lt;script type="application/ld+json"&gt; tags</li>
                <li>3. Add it to your page's &lt;head&gt; section</li>
                <li>4. Test with Google's Rich Results Test tool</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};