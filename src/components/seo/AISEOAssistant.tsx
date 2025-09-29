import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AISEOSuggestion {
  title: string;
  description: string;
  keywords: string;
  improvements: string;
}

interface AISEOAssistantProps {
  content: string;
  currentTitle?: string;
  currentDescription?: string;
  currentKeywords?: string;
  contentType: 'book' | 'blog' | 'profile' | 'page';
  recordId?: string;
  onApplySuggestions?: (suggestions: AISEOSuggestion) => void;
  className?: string;
}

export const AISEOAssistant: React.FC<AISEOAssistantProps> = ({
  content,
  currentTitle,
  currentDescription,
  currentKeywords,
  contentType,
  recordId,
  onApplySuggestions,
  className
}) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISEOSuggestion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    if (!content.trim()) {
      toast({
        title: "No content provided",
        description: "Please provide content to analyze for SEO suggestions.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke('ai-seo-suggestions', {
        body: {
          content,
          currentTitle,
          currentDescription,
          currentKeywords,
          contentType,
          recordId
        }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Failed to generate suggestions');
      }

      if (data?.error) {
        if (data.error.includes('API key not configured') || data.error.includes('OpenAI API key not configured')) {
          setError('OpenAI API key not configured. Please contact your administrator to set up AI features.');
        } else if (data.error.includes('insufficient_quota') || data.error.includes('exceeded your current quota')) {
          setError('OpenAI quota exceeded. Please check your OpenAI billing and usage limits.');
        } else {
          setError(data.error);
        }
        return;
      }

      setSuggestions(data.suggestions);
      toast({
        title: "SEO suggestions generated!",
        description: "AI has analyzed your content and provided optimization suggestions.",
      });

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast({
        title: "Failed to generate suggestions",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applySuggestions = () => {
    if (suggestions && onApplySuggestions) {
      onApplySuggestions(suggestions);
      toast({
        title: "SEO suggestions applied!",
        description: "Your content has been updated with AI-optimized SEO fields.",
      });
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI SEO Assistant
        </CardTitle>
        <CardDescription>
          Get AI-powered SEO suggestions to optimize your {contentType} for search engines.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions && !error && (
          <Button 
            onClick={generateSuggestions} 
            disabled={loading || !content.trim()}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing content...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate SEO Suggestions
              </>
            )}
          </Button>
        )}

        {error && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 p-4 border border-destructive/20 rounded-md bg-destructive/5">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Error</p>
                <p className="text-sm text-destructive/80">{error}</p>
              </div>
            </div>
            
            {error.includes('API key not configured') && (
              <div className="p-4 border border-blue-200 rounded-md bg-blue-50">
                <h4 className="font-medium text-blue-900 mb-2">Setting Up AI Features</h4>
                <p className="text-sm text-blue-800 mb-3">
                  To use AI-powered SEO suggestions, you need to configure an OpenAI API key.
                </p>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>Steps to set up:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Get an API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Platform</a></li>
                    <li>Go to your <a href="https://supabase.com/dashboard/project/kovlbxzqasqhigygfiyj/settings/functions" target="_blank" rel="noopener noreferrer" className="underline">Supabase Functions Settings</a></li>
                    <li>Add a new secret named <code className="bg-blue-100 px-1 rounded">OPENAI_API_KEY</code></li>
                    <li>Paste your OpenAI API key as the value</li>
                  </ol>
                </div>
              </div>
            )}
            
            {error.includes('quota exceeded') && (
              <div className="p-4 border border-orange-200 rounded-md bg-orange-50">
                <h4 className="font-medium text-orange-900 mb-2">OpenAI Usage Limit Reached</h4>
                <p className="text-sm text-orange-800 mb-3">
                  You've exceeded your OpenAI API usage quota. This is managed through your OpenAI account.
                </p>
                <div className="text-sm text-orange-700 space-y-2">
                  <p><strong>To resolve this:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Check your usage at <a href="https://platform.openai.com/usage" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Usage Dashboard</a></li>
                    <li>Review your billing at <a href="https://platform.openai.com/account/billing" target="_blank" rel="noopener noreferrer" className="underline">OpenAI Billing</a></li>
                    <li>Add credits or upgrade your plan if needed</li>
                    <li>Wait for your quota to reset (monthly limits)</li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}

        {suggestions && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">AI Suggestions</h3>
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Generated
              </Badge>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Optimized Title</label>
                <p className="text-sm bg-muted p-2 rounded border">{suggestions.title}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Optimized Description</label>
                <p className="text-sm bg-muted p-2 rounded border">{suggestions.description}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Keywords</label>
                <p className="text-sm bg-muted p-2 rounded border">{suggestions.keywords}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">Improvements</label>
                <p className="text-sm bg-muted p-2 rounded border">{suggestions.improvements}</p>
              </div>
            </div>

            <div className="flex gap-2">
              {onApplySuggestions && (
                <Button onClick={applySuggestions} className="flex-1">
                  Apply Suggestions
                </Button>
              )}
              <Button variant="outline" onClick={() => setSuggestions(null)}>
                Generate New
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AISEOAssistant;