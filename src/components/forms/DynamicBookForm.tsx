import { UseFormReturn } from "react-hook-form";
import { BookField, getFieldsByCategory, getCategoryDisplayName } from "@/utils/bookFieldUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface DynamicBookFormProps {
  form: UseFormReturn<any>;
  mode: 'add' | 'edit' | 'view';
}

const generateAffiliateLinksForForm = (isbn: string, title: string = '', form: UseFormReturn<any>) => {
  // First check if affiliate settings exist, if not create default ones
  let savedAffiliateSettings = localStorage.getItem('affiliateSettings');
  
  if (!savedAffiliateSettings) {
    // Create default affiliate settings for demo
    const defaultSettings = {
      amazon: {
        enabled: true,
        displayName: 'Amazon',
        baseUrl: 'https://amazon.com/dp/{isbn}',
        parameters: { tag: 'demo-20' },
        description: 'Amazon affiliate link'
      },
      bookshop: {
        enabled: true,
        displayName: 'Bookshop',
        baseUrl: 'https://bookshop.org/books/{isbn}',
        parameters: { a: 'demo' },
        description: 'Bookshop affiliate link'
      },
      kobo: {
        enabled: true,
        displayName: 'Kobo',
        baseUrl: 'https://www.kobo.com/search',
        parameters: { query: '{isbn}' },
        description: 'Kobo store link'
      },
      googleBooks: {
        enabled: true,
        displayName: 'Google Books',
        baseUrl: 'https://books.google.com/books',
        parameters: { isbn: '{isbn}' },
        description: 'Google Books link'
      },
      barnesNoble: {
        enabled: true,
        displayName: 'Barnes & Noble',
        baseUrl: 'https://www.barnesandnoble.com/s/{isbn}',
        parameters: {},
        description: 'Barnes & Noble link'
      },
      applebooks: {
        enabled: true,
        displayName: 'Apple Books',
        baseUrl: 'https://books.apple.com/search',
        parameters: { term: '{title}' },
        description: 'Apple Books link'
      }
    };
    
    localStorage.setItem('affiliateSettings', JSON.stringify(defaultSettings));
    savedAffiliateSettings = JSON.stringify(defaultSettings);
  }

  try {
    const affiliateSettings = JSON.parse(savedAffiliateSettings);
    const purchaseLinks = [];
    
    if (affiliateSettings.amazon?.enabled) {
      purchaseLinks.push({
        platform: 'Amazon',
        url: `https://amazon.com/dp/${isbn}?tag=${affiliateSettings.amazon.parameters?.tag || 'demo-20'}`,
        affiliate_id: affiliateSettings.amazon.parameters?.tag || 'demo-20'
      });
    }
    
    if (affiliateSettings.bookshop?.enabled) {
      purchaseLinks.push({
        platform: 'Bookshop',
        url: `https://bookshop.org/books/${isbn}?a=${affiliateSettings.bookshop.parameters?.a || 'demo'}`,
        affiliate_id: affiliateSettings.bookshop.parameters?.a || 'demo'
      });
    }

    if (affiliateSettings.kobo?.enabled) {
      purchaseLinks.push({
        platform: 'Kobo',
        url: `https://www.kobo.com/search?query=${isbn}`,
        affiliate_id: ''
      });
    }

    if (affiliateSettings.googleBooks?.enabled) {
      purchaseLinks.push({
        platform: 'Google Books',
        url: `https://books.google.com/books?isbn=${isbn}`,
        affiliate_id: ''
      });
    }

    if (affiliateSettings.barnesNoble?.enabled) {
      purchaseLinks.push({
        platform: 'Barnes & Noble',
        url: `https://www.barnesandnoble.com/s/${isbn}`,
        affiliate_id: ''
      });
    }

    if (affiliateSettings.applebooks?.enabled) {
      purchaseLinks.push({
        platform: 'Apple Books',
        url: `https://books.apple.com/search?term=${encodeURIComponent(title)}`,
        affiliate_id: ''
      });
    }
    
    form.setValue('purchase_links', purchaseLinks);
    return purchaseLinks;
  } catch (error) {
    console.error('Error generating affiliate links:', error);
    return [];
  }
};

const FieldComponent = ({ field, form, mode }: { field: BookField; form: UseFormReturn<any>; mode: 'add' | 'edit' | 'view' }) => {
  const isReadOnly = mode === 'view';
  
  const renderField = () => {
    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            disabled={isReadOnly}
            {...form.register(field.name, {
              required: field.required ? `${field.label} is required` : false,
              minLength: field.validation?.minLength ? {
                value: field.validation.minLength,
                message: `${field.label} must be at least ${field.validation.minLength} characters`
              } : undefined,
              maxLength: field.validation?.maxLength ? {
                value: field.validation.maxLength,
                message: `${field.label} must be at most ${field.validation.maxLength} characters`
              } : undefined
            })}
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            placeholder={field.placeholder}
            disabled={isReadOnly}
            {...form.register(field.name, {
              required: field.required ? `${field.label} is required` : false,
              min: field.validation?.min ? {
                value: field.validation.min,
                message: `${field.label} must be at least ${field.validation.min}`
              } : undefined,
              max: field.validation?.max ? {
                value: field.validation.max,
                message: `${field.label} must be at most ${field.validation.max}`
              } : undefined,
              valueAsNumber: true
            })}
          />
        );
      
      case 'date':
        return (
          <Input
            type="date"
            disabled={isReadOnly}
            {...form.register(field.name, {
              required: field.required ? `${field.label} is required` : false
            })}
          />
        );
      
      case 'select':
        return (
          <Select 
            onValueChange={(value) => form.setValue(field.name, value)}
            defaultValue={form.watch(field.name) || field.defaultValue || ''}
            disabled={isReadOnly}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      
      case 'multiselect':
        if (field.name === 'genres') {
          // Special handling for genres as dropdown
          return (
            <Select 
              onValueChange={(value) => {
                const currentValues = form.watch(field.name) || [];
                if (!currentValues.includes(value)) {
                  form.setValue(field.name, [...currentValues, value]);
                }
              }}
              disabled={isReadOnly}
            >
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {field.options?.map((option) => (
                  <SelectItem key={option} value={option} className="hover:bg-muted">
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }
        // Default multiselect as checkboxes for other fields
        return (
          <div className="space-y-2">
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <Checkbox
                  id={`${field.name}-${option}`}
                  disabled={isReadOnly}
                  checked={form.watch(field.name)?.includes(option) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = form.getValues(field.name) || [];
                    if (checked) {
                      form.setValue(field.name, [...currentValues, option]);
                    } else {
                      form.setValue(field.name, currentValues.filter((v: string) => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${field.name}-${option}`} className="text-sm">
                  {option}
                </Label>
              </div>
            ))}
          </div>
        );
      
      case 'url':
        return (
          <Input
            type="url"
            placeholder={field.placeholder}
            disabled={isReadOnly}
            {...form.register(field.name, {
              required: field.required ? `${field.label} is required` : false,
              pattern: field.validation?.pattern ? {
                value: new RegExp(field.validation.pattern),
                message: `Please enter a valid ${field.label.toLowerCase()}`
              } : undefined
            })}
          />
        );
      
      case 'email':
        return (
          <Input
            type="email"
            placeholder={field.placeholder}
            disabled={isReadOnly}
            {...form.register(field.name, {
              required: field.required ? `${field.label} is required` : false
            })}
          />
        );
      
      case 'json':
        if (field.name === 'purchase_links') {
          const links = form.watch(field.name) || [];
          return (
            <div className="space-y-3">
              {links.length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm text-muted-foreground">
                      Auto-generated affiliate purchase links:
                    </p>
                    {!isReadOnly && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const isbn = form.watch('isbn');
                          const title = form.watch('title');
                          if (isbn) {
                            // Regenerate affiliate links
                            generateAffiliateLinksForForm(isbn, title, form);
                          }
                        }}
                      >
                        Refresh Links
                      </Button>
                    )}
                  </div>
                  {links.map((link: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-primary">
                            {link.platform?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{link.platform}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-md">
                            {link.url}
                          </p>
                        </div>
                      </div>
                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={() => window.open(link.url, '_blank')}
                          className="text-xs text-primary hover:text-primary/80 px-2 py-1 rounded bg-primary/10"
                        >
                          Test Link
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800 mb-2">
                      <strong>No affiliate links generated</strong>
                    </p>
                    <p className="text-xs text-yellow-700">
                      {!form.watch('isbn') 
                        ? 'ISBN is required to generate affiliate purchase links.'
                        : 'Click the button below to generate affiliate links.'}
                    </p>
                  </div>
                  
                  {!isReadOnly && form.watch('isbn') && (
                    <Button
                      type="button"
                      onClick={() => {
                        const isbn = form.watch('isbn');
                        const title = form.watch('title');
                        generateAffiliateLinksForForm(isbn, title, form);
                      }}
                      className="w-full"
                    >
                      Generate Affiliate Links
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        }
        return (
          <Textarea
            placeholder="JSON format"
            disabled={isReadOnly}
            {...form.register(field.name)}
          />
        );
      
      default:
        return (
          <Input
            type="text"
            placeholder={field.placeholder}
            disabled={isReadOnly}
            {...form.register(field.name, {
              required: field.required ? `${field.label} is required` : false,
              minLength: field.validation?.minLength ? {
                value: field.validation.minLength,
                message: `${field.label} must be at least ${field.validation.minLength} characters`
              } : undefined,
              maxLength: field.validation?.maxLength ? {
                value: field.validation.maxLength,
                message: `${field.label} must be at most ${field.validation.maxLength} characters`
              } : undefined,
              pattern: field.validation?.pattern ? {
                value: new RegExp(field.validation.pattern),
                message: `Please enter a valid ${field.label.toLowerCase()}`
              } : undefined
            })}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={field.name} className="text-sm font-medium">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderField()}
      
      {/* Show selected genres as badges */}
      {field.name === 'genres' && form.watch(field.name)?.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {form.watch(field.name).map((genre: string) => (
            <div key={genre} className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-sm">
              {genre}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    const currentValues = form.getValues(field.name) || [];
                    form.setValue(field.name, currentValues.filter((v: string) => v !== genre));
                  }}
                  className="ml-1 text-primary hover:text-primary/80"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      
      {field.helpText && (
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
      {form.formState.errors[field.name] && (
        <p className="text-xs text-destructive">
          {form.formState.errors[field.name]?.message as string}
        </p>
      )}
    </div>
  );
};

export function DynamicBookForm({ form, mode }: DynamicBookFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const categories: ('basic' | 'publishing' | 'seo' | 'advanced')[] = ['basic', 'publishing', 'seo', 'advanced'];
  const stepLabels = ['Basic Info', 'Publishing', 'SEO', 'Available Links'];

  const validateCurrentStep = () => {
    const currentCategory = categories[currentStep];
    const fields = getFieldsByCategory(currentCategory);
    const requiredFields = fields.filter(field => field.required);
    
    for (const field of requiredFields) {
      const value = form.watch(field.name);
      if (!value || (Array.isArray(value) && value.length === 0) || value.toString().trim() === '') {
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep < categories.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const renderStep = (stepIndex: number) => {
    const category = categories[stepIndex];
    const fields = getFieldsByCategory(category);
    
    if (fields.length === 0) return null;

    return (
      <div className="space-y-4">
        {fields.map(field => (
          <FieldComponent 
            key={field.id} 
            field={field} 
            form={form} 
            mode={mode}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Step Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {stepLabels.map((label, index) => (
            <div key={index} className="flex items-center">
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 transition-colors hover:scale-105 ${
                  index === currentStep 
                    ? 'border-primary bg-primary text-primary-foreground' 
                    : index < currentStep 
                      ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/80'
                      : 'border-muted-foreground bg-background text-muted-foreground hover:border-primary hover:text-primary'
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </button>
              <button
                type="button"
                onClick={() => handleStepClick(index)}
                className={`ml-2 text-sm font-medium transition-colors hover:text-primary ${
                  index === currentStep ? 'text-foreground' : 'text-muted-foreground'
                }`}
              >
                {label}
              </button>
              {index < stepLabels.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 transition-colors ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            Step {currentStep + 1} of {categories.length}
          </Badge>
        </div>
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">
            {getCategoryDisplayName(categories[currentStep])}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {renderStep(currentStep)}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      {mode !== 'view' && (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          <Button
            type="button"
            onClick={handleNext}
            disabled={currentStep === categories.length - 1 || !validateCurrentStep()}
            className="flex items-center gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* View Mode: Show All Steps */}
      {mode === 'view' && (
        <div className="space-y-6">
          {categories.map((category, index) => {
            if (index === currentStep) return null; // Already shown above
            
            const fields = getFieldsByCategory(category);
            if (fields.length === 0) return null;

            return (
              <Card key={category}>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {getCategoryDisplayName(category)}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fields.map(field => (
                    <FieldComponent 
                      key={field.id} 
                      field={field} 
                      form={form} 
                      mode={mode}
                    />
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}