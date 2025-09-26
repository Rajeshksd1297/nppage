import { UseFormReturn } from "react-hook-form";
import { BookField, getFieldsByCategory, getCategoryDisplayName } from "@/utils/bookFieldUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";

interface DynamicBookFormProps {
  form: UseFormReturn<any>;
  mode: 'add' | 'edit' | 'view';
}

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
          <FormField
            control={form.control}
            name={field.name}
            rules={{ required: field.required ? `${field.label} is required` : false }}
            render={({ field: formField }) => (
              <FormItem>
                <Select 
                  onValueChange={formField.onChange} 
                  defaultValue={formField.value}
                  disabled={isReadOnly}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {field.options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      
      case 'multiselect':
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
            <div className="space-y-2">
              {isReadOnly ? (
                links.length > 0 ? (
                  links.map((link: any, index: number) => (
                    <div key={index} className="p-2 bg-muted rounded">
                      <strong>{link.platform}:</strong> {link.url}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No purchase links available</p>
                )
              ) : (
                <p className="text-muted-foreground text-sm">
                  Purchase links are automatically managed based on affiliate settings configured by the admin.
                </p>
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
  const categories: ('basic' | 'publishing' | 'seo' | 'advanced')[] = ['basic', 'publishing', 'seo', 'advanced'];

  return (
    <div className="space-y-6">
      {categories.map(category => {
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
  );
}