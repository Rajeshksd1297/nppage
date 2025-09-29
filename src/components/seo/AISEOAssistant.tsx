import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, CheckCircle, AlertCircle, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import AIPlatformSettings from '@/components/admin/AIPlatformSettings';

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
  const [showPlatformSettings, setShowPlatformSettings] = useState(false);
  const [platformUsed, setPlatformUsed] = useState<string | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const { toast } = useToast();

  const generateSuggestions = async () => {
    if (!content || !content.trim()) {
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
      const { data, error: functionError } = await supabase.functions.invoke('ai-seo-suggestions-multi', {
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
        if (data.error.includes('No AI platforms configured') || data.showConfigButton) {
          setError(data.error);
          setShowPlatformSettings(true);
        } else if (data.error.includes('insufficient_quota') || data.error.includes('exceeded your current quota')) {
          setError('AI quota exceeded. Please check your billing and usage limits.');
        } else {
          setError(data.error);
        }
        return;
      }

      setSuggestions(data.suggestions);
      setPlatformUsed(data.platform_used);
      setModelUsed(data.model_used);
      toast({
        title: "SEO suggestions generated!",
        description: `AI has analyzed your content using ${data.platform_used}.`,
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

  if (showPlatformSettings) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">AI Platform Configuration Required</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowPlatformSettings(false)}
          >
            Hide Settings
          </Button>
        </div>
        <AIPlatformSettings />
        <Button 
          onClick={() => {
            setShowPlatformSettings(false);
            setError(null);
          }}
          className="w-full"
        >
          Back to SEO Assistant
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI SEO Assistant
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPlatformSettings(true)}
            className="ml-auto"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </CardTitle>
        <CardDescription>
          Get AI-powered SEO suggestions to optimize your {contentType} for search engines.
          {platformUsed && modelUsed && (
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                Last used: {platformUsed} ({modelUsed})
              </Badge>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!suggestions && !error && (
          <Button 
            onClick={generateSuggestions} 
            disabled={loading || !content || !content.trim()}
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
            
            {error.includes('quota exceeded') && (
              <div className="p-4 border border-orange-200 rounded-md bg-orange-50">
                <h4 className="font-medium text-orange-900 mb-2">AI Usage Limit Reached</h4>
                <p className="text-sm text-orange-800 mb-3">
                  You've exceeded your AI API usage quota. This is managed through your AI provider account.
                </p>
                <div className="text-sm text-orange-700 space-y-2">
                  <p><strong>To resolve this:</strong></p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>Check your usage in your AI provider's dashboard</li>
                    <li>Review your billing and add credits if needed</li>
                    <li>Wait for your quota to reset</li>
                    <li>Or configure a different AI platform in settings</li>
                  </ol>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => setShowPlatformSettings(true)}
              className="w-full"
            >
              <Settings className="mr-2 h-4 w-4" />
              Configure AI Platforms
            </Button>
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