import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface SEORequest {
  content: string;
  currentTitle?: string;
  currentDescription?: string;
  currentKeywords?: string;
  contentType: string;
  recordId?: string;
  platformName?: string; // Optional: specify which platform to use
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get user from request
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('User not authenticated');
    }

    const seoRequest: SEORequest = await req.json();
    console.log('SEO request received:', { contentType: seoRequest.contentType, recordId: seoRequest.recordId });

    // Get AI platform settings
    const { data: platforms, error: platformError } = await supabase
      .from('ai_platform_settings')
      .select('*')
      .eq('is_active', true)
      .order('is_default', { ascending: false });

    if (platformError) {
      console.error('Error fetching platforms:', platformError);
      throw new Error('Failed to fetch AI platform settings');
    }

    if (!platforms || platforms.length === 0) {
      return new Response(JSON.stringify({
        error: 'No AI platforms configured. Please configure at least one AI platform in the settings.',
        showConfigButton: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Find the platform to use
    let selectedPlatform = platforms.find(p => p.platform_name === seoRequest.platformName);
    if (!selectedPlatform) {
      selectedPlatform = platforms.find(p => p.is_default) || platforms[0];
    }

    if (!selectedPlatform.api_key_encrypted) {
      return new Response(JSON.stringify({
        error: `${selectedPlatform.display_name} API key not configured. Please add your API key in the platform settings.`,
        showConfigButton: true
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Using ${selectedPlatform.display_name} with model ${selectedPlatform.model_name}`);

    // Generate SEO suggestions based on platform
    let suggestions;
    switch (selectedPlatform.platform_name) {
      case 'openai':
        suggestions = await generateOpenAISuggestions(selectedPlatform, seoRequest);
        break;
      case 'google_gemini':
        suggestions = await generateGeminiSuggestions(selectedPlatform, seoRequest);
        break;
      case 'anthropic':
        suggestions = await generateAnthropicSuggestions(selectedPlatform, seoRequest);
        break;
      case 'perplexity':
        suggestions = await generatePerplexitySuggestions(selectedPlatform, seoRequest);
        break;
      default:
        throw new Error(`Unsupported platform: ${selectedPlatform.platform_name}`);
    }

    // Log the suggestion to database if recordId is provided
    if (seoRequest.recordId) {
      try {
        await supabase
          .from('seo_suggestions_log')
          .insert({
            record_id: seoRequest.recordId,
            content_type: seoRequest.contentType,
            suggestions: suggestions,
            platform_used: selectedPlatform.platform_name,
            model_used: selectedPlatform.model_name,
            user_id: user.id
          });
        console.log('SEO suggestion logged successfully');
      } catch (logError) {
        console.error('Error logging suggestion:', logError);
        // Don't fail the request if logging fails
      }
    }

    return new Response(JSON.stringify({ 
      suggestions,
      platform_used: selectedPlatform.display_name,
      model_used: selectedPlatform.model_name
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-seo-suggestions-multi function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ 
      error: 'Failed to generate SEO suggestions', 
      details: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateOpenAISuggestions(platform: any, request: SEORequest) {
  const prompt = createSEOPrompt(request);
  
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${platform.api_key_encrypted}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: platform.model_name,
      messages: [
        { role: 'system', content: 'You are an SEO expert. Provide optimized SEO suggestions in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('OpenAI API error:', errorData);
    throw new Error(`OpenAI API error: ${errorData}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

async function generateGeminiSuggestions(platform: any, request: SEORequest) {
  const prompt = createSEOPrompt(request);
  
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${platform.model_name}:generateContent?key=${platform.api_key_encrypted}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `You are an SEO expert. Provide optimized SEO suggestions in JSON format.\n\n${prompt}`
        }]
      }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      }
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Gemini API error:', errorData);
    throw new Error(`Gemini API error: ${errorData}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  return JSON.parse(content);
}

async function generateAnthropicSuggestions(platform: any, request: SEORequest) {
  const prompt = createSEOPrompt(request);
  
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${platform.api_key_encrypted}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: platform.model_name,
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: `You are an SEO expert. Provide optimized SEO suggestions in JSON format.\n\n${prompt}`
      }]
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Anthropic API error:', errorData);
    throw new Error(`Anthropic API error: ${errorData}`);
  }

  const data = await response.json();
  const content = data.content[0].text;
  return JSON.parse(content);
}

async function generatePerplexitySuggestions(platform: any, request: SEORequest) {
  const prompt = createSEOPrompt(request);
  
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${platform.api_key_encrypted}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: platform.model_name,
      messages: [
        { role: 'system', content: 'You are an SEO expert. Provide optimized SEO suggestions in JSON format.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Perplexity API error:', errorData);
    throw new Error(`Perplexity API error: ${errorData}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  return JSON.parse(content);
}

function createSEOPrompt(request: SEORequest): string {
  return `
Analyze the following content and provide SEO suggestions in JSON format with these exact fields:
- title: An optimized title (max 60 characters)
- description: An optimized meta description (max 160 characters)  
- keywords: Comma-separated relevant keywords
- improvements: Specific recommendations for SEO improvement

Content Type: ${request.contentType}
Current Title: ${request.currentTitle || 'None'}
Current Description: ${request.currentDescription || 'None'}
Current Keywords: ${request.currentKeywords || 'None'}

Content to analyze:
${request.content}

Return only valid JSON with no additional text or formatting.
`;
}