import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  subject: string;
  content: string;
  previewText?: string;
  fromEmail: string;
  fromName: string;
  recipients: string[];
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header to get user ID
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { auth: { persistSession: false } }
    );

    // Set auth header
    const token = authHeader.replace('Bearer ', '');
    supabase.auth.setSession({
      access_token: token,
      refresh_token: ''
    } as any);

    const { 
      subject, 
      content, 
      previewText,
      fromEmail, 
      fromName, 
      recipients 
    }: NewsletterRequest = await req.json();

    // Validate inputs
    if (!subject || !content || !fromEmail || !recipients.length) {
      throw new Error("Missing required fields");
    }

    if (recipients.length > 100) {
      throw new Error("Too many recipients. Maximum is 100 per batch.");
    }

    // Get user and their settings
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return new Response(
        JSON.stringify({ error: 'User not authenticated' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: settings } = await supabase
      .from('user_newsletter_settings')
      .select('email_provider, resend_api_key')
      .eq('user_id', user.user.id)
      .single();

    // If user has Resend configured, use it
    if (settings?.email_provider === 'resend' && settings?.resend_api_key) {
      try {
        const { Resend } = await import('https://esm.sh/resend@2.0.0');
        const resend = new Resend(settings.resend_api_key);

        const emailPromises = recipients.map(async (recipient: string) => {
          return await resend.emails.send({
            from: `${fromName} <${fromEmail}>`,
            to: [recipient],
            subject: subject,
            html: `
              ${previewText ? `<div style="display: none;">${previewText}</div>` : ''}
              ${content}
              <br><br>
              <hr>
              <p style="font-size: 12px; color: #666;">
                <a href="#" style="color: #666;">Unsubscribe</a>
              </p>
            `,
          });
        });

        await Promise.all(emailPromises);

        console.log(`Newsletter sent via Resend to ${recipients.length} recipients`);

        return new Response(JSON.stringify({ 
          success: true,
          recipientCount: recipients.length,
          messageId: `newsletter_${Date.now()}`,
          provider: 'resend',
          message: "Newsletter sent successfully via Resend"
        }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            ...corsHeaders,
          },
        });

      } catch (resendError: any) {
        console.error('Resend error:', resendError);
        return new Response(
          JSON.stringify({ 
            error: `Resend API error: ${resendError.message}`,
            success: false
          }),
          {
            status: 500,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Fallback to system logging (simulate sending)
    console.log("Newsletter Details (System Default):");
    console.log("From:", `${fromName} <${fromEmail}>`);
    console.log("Subject:", subject);
    console.log("Preview:", previewText);
    console.log("Recipients:", recipients.length);
    console.log("Content preview:", content.substring(0, 100) + "...");

    // Simulate successful sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`Newsletter logged successfully to ${recipients.length} recipients`);

    return new Response(JSON.stringify({ 
      success: true,
      recipientCount: recipients.length,
      messageId: `newsletter_${Date.now()}`,
      provider: 'system',
      note: "Newsletter logged successfully. Configure Resend in settings for actual email delivery."
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-newsletter function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);