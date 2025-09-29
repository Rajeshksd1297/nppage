import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SEORequest {
  content: string;
  currentTitle?: string;
  currentDescription?: string;
  currentKeywords?: string;
  contentType: 'book' | 'blog' | 'profile' | 'page';
  recordId?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    
    if (!openAIApiKey) {
      console.log('OpenAI API key not configured');
      return new Response(JSON.stringify({ 
        error: 'OpenAI API key not configured. Please add your API key in the edge function settings.',
        suggestions: null 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseClient.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { content, currentTitle, currentDescription, currentKeywords, contentType, recordId }: SEORequest = await req.json();

    if (!content) {
      return new Response(JSON.stringify({ error: 'Content is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Generating SEO suggestions for ${contentType} content`);

    const prompt = `As an SEO expert, analyze the following ${contentType} content and provide optimized SEO suggestions:

Content: "${content.substring(0, 2000)}..."

Current SEO:
- Title: ${currentTitle || 'Not set'}
- Description: ${currentDescription || 'Not set'}
- Keywords: ${currentKeywords || 'Not set'}

Please provide:
1. An optimized SEO title (max 60 characters)
2. An optimized meta description (max 160 characters)  
3. 5-8 relevant keywords (comma-separated)
4. Brief explanation of improvements

Respond in this JSON format:
{
  "title": "optimized title here",
  "description": "optimized description here",
  "keywords": "keyword1, keyword2, keyword3",
  "improvements": "brief explanation of what was improved"
}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an SEO expert. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({ 
        error: 'Failed to generate SEO suggestions',
        details: errorData 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    let suggestions;
    try {
      suggestions = JSON.parse(aiResponse);
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      return new Response(JSON.stringify({ 
        error: 'Failed to parse AI response',
        rawResponse: aiResponse 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Log the suggestion generation to database
    if (recordId) {
      await supabaseClient
        .from('seo_suggestions_log')
        .insert({
          user_id: user.id,
          content_type: contentType,
          record_id: recordId,
          suggestions: suggestions,
          applied: false
        });
    }

    console.log('SEO suggestions generated successfully');

    return new Response(JSON.stringify({ 
      suggestions,
      success: true 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-seo-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: null 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});