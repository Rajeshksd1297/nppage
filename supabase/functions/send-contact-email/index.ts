import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContactEmailRequest {
  name: string;
  email: string;
  subject?: string;
  message: string;
  type?: 'contact' | 'support' | 'feedback';
  contactedUserId?: string;
  userAgent?: string;
  userIp?: string;
}

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

const handler = async (req: Request): Promise<Response> => {
  console.log('Contact email request received:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      name, 
      email, 
      subject, 
      message, 
      type = 'contact',
      contactedUserId,
      userAgent,
      userIp
    }: ContactEmailRequest = await req.json();

    console.log('Processing contact email from:', email, 'Type:', type, 'Contacted User:', contactedUserId);

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields: name, email, message' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Initialize Supabase client for database operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store the contact submission in the database
    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name,
        email,
        subject,
        message,
        contacted_user_id: contactedUserId,
        user_agent: userAgent,
        source: 'contact_form',
        status: 'new',
        priority: 'medium'
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to store contact submission');
    }

    console.log('Contact submission stored with ID:', submission.id);

    // Get user's contact form settings and email
    let userEmail = null;
    let autoReplySettings = null;
    let emailsAttempted = 0;
    let emailsSuccessful = 0;
    
    if (contactedUserId) {
      // Get user's contact form settings
      const { data: formSettings } = await supabase
        .from('user_contact_form_settings')
        .select('notification_email, auto_reply_enabled, auto_reply_subject, auto_reply_message')
        .eq('user_id', contactedUserId)
        .maybeSingle();
      
      // Get user's signup email
      const { data: { user: contactedUser } } = await supabase.auth.admin.getUserById(contactedUserId);
      
      if (contactedUser?.email) {
        userEmail = formSettings?.notification_email || contactedUser.email;
        autoReplySettings = formSettings;
      }
    }

    // Try to send emails but don't fail if they don't work (due to Resend domain restrictions)
    const emailResults = [];

    // Send confirmation email to user who submitted the form
    if (autoReplySettings?.auto_reply_enabled) {
      try {
        emailsAttempted++;
        const userEmailResponse = await sendEmailWithResend(
          email,
          autoReplySettings.auto_reply_subject || "We received your message!",
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">Thank you for contacting us!</h1>
                <p style="color: #666; font-size: 16px;">We have received your message and will get back to you soon.</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <h3 style="color: #333; margin-bottom: 15px;">Your Message:</h3>
                <p style="color: #666; line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
              </div>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                <div style="color: #333; line-height: 1.6; white-space: pre-wrap;">${autoReplySettings.auto_reply_message || 'Thank you for contacting us. We will get back to you as soon as possible.'}</div>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
                <p>We typically respond within 24 hours.</p>
                <p>Best regards,<br>The Team</p>
              </div>
            </div>
          `
        );
        emailsSuccessful++;
        emailResults.push({ type: 'auto_reply', status: 'success' });
        console.log("Auto-reply email sent successfully");
      } catch (error: any) {
        console.log("Auto-reply email failed (likely due to domain restrictions):", error.message);
        emailResults.push({ type: 'auto_reply', status: 'failed', reason: 'domain_verification_required' });
      }
    }

    // Send notification email to the contacted user (using their signup email or notification email)
    if (userEmail) {
      try {
        emailsAttempted++;
        const adminEmailResponse = await sendEmailWithResend(
          userEmail,
          `New ${type} message from ${name}`,
          `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h1>New Contact Message</h1>
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>From:</strong> ${name} (${email})</p>
                <p><strong>Type:</strong> ${type}</p>
                ${subject ? `<p><strong>Subject:</strong> ${subject}</p>` : ''}
                <p><strong>Message:</strong></p>
                <p style="white-space: pre-wrap;">${message}</p>
                <hr style="margin: 15px 0;">
                <p style="font-size: 12px; color: #666;">
                  Submission ID: ${submission.id}<br>
                  Submitted at: ${new Date().toLocaleString()}
                </p>
              </div>
              <div style="margin-top: 20px;">
                <p><a href="https://your-domain.com/contact-management" style="color: #007bff;">View all messages in your dashboard</a></p>
              </div>
            </div>
          `,
          "Contact Form <onboarding@resend.dev>"
        );
        emailsSuccessful++;
        emailResults.push({ type: 'notification', status: 'success' });
        console.log("Notification email sent successfully");
      } catch (error: any) {
        console.log("Notification email failed (likely due to domain restrictions):", error.message);
        emailResults.push({ type: 'notification', status: 'failed', reason: 'domain_verification_required' });
      }
    }

    console.log(`Contact form processing completed. Emails attempted: ${emailsAttempted}, successful: ${emailsSuccessful}`);

    return new Response(JSON.stringify({ 
      success: true,
      submissionId: submission.id,
      emailResults: emailResults,
      message: emailsSuccessful > 0 
        ? "Message sent successfully!" 
        : "Message received! Due to email configuration, notifications may be limited, but your message has been saved and you can expect a response soon."
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Failed to send email",
        details: error
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