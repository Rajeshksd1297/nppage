import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const sendEmailWithResend = async (to: string, subject: string, html: string, from?: string) => {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  if (!resendApiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: from || "AuthorPage <onboarding@resend.dev>",
      to: Array.isArray(to) ? to : [to],
      subject: subject,
      html: html,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API error: ${response.status} - ${errorData}`);
  }

  return await response.json();
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ReplyEmailRequest {
  submissionId: string;
  recipientEmail: string;
  recipientName: string;
  originalMessage: string;
  replyMessage: string;
  subject: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Reply email request received:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      submissionId, 
      recipientEmail, 
      recipientName, 
      originalMessage, 
      replyMessage, 
      subject 
    }: ReplyEmailRequest = await req.json();

    console.log('Processing reply email for submission:', submissionId);

    // Validate required fields
    if (!submissionId || !recipientEmail || !replyMessage) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: submissionId, recipientEmail, replyMessage' 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get admin user info
    const { data: { user } } = await supabase.auth.getUser();
    let adminName = 'AuthorPage Support';
    let adminEmail = 'support@authorpage.com';

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();

      if (profile) {
        adminName = profile.full_name || adminName;
        adminEmail = profile.email || adminEmail;
      }
    }

    // Send reply email
    const emailResponse = await sendEmailWithResend(
      recipientEmail,
      subject.startsWith('Re:') ? subject : `Re: ${subject}`,
      `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 10px;">Thank you for your message</h2>
            <p style="color: #666;">Hello ${recipientName},</p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
            <h3 style="color: #333; margin-bottom: 15px;">Our Response:</h3>
            <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${replyMessage}</div>
          </div>
          
          <div style="border-left: 4px solid #e9ecef; padding-left: 20px; margin-bottom: 30px;">
            <h4 style="color: #666; margin-bottom: 10px;">Your Original Message:</h4>
            <div style="color: #666; white-space: pre-wrap;">${originalMessage}</div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: left; color: #666; font-size: 14px;">
            <p>If you have any further questions, please don't hesitate to reach out.</p>
            <p>Best regards,<br>
            ${adminName}<br>
            ${adminEmail}</p>
            <hr style="margin: 15px 0; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #999;">
              Reference ID: ${submissionId}<br>
              This is a reply to your contact form submission.
            </p>
          </div>
        </div>
      `,
      `${adminName} <onboarding@resend.dev>`
    );

    console.log("Reply email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ 
      success: true,
      emailResponse
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-reply-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send reply email",
        details: error.message
      }),
      {
        status: 500,
        headers: { 
          "Content-Type": "application/json", 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);