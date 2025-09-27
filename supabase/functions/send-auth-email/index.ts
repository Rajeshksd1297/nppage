import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AuthEmailRequest {
  email: string;
  type: 'signup' | 'recovery' | 'magic_link' | 'email_change';
  token_hash?: string;
  token?: string;
  redirect_to?: string;
  site_url?: string;
}

const sendEmailWithResend = async (to: string, subject: string, html: string) => {
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
      from: "AuthorPage <onboarding@resend.dev>",
      to: [to],
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

const generateEmailTemplate = (type: string, data: any) => {
  const baseUrl = data.site_url || 'https://f70b130c-9d98-4474-b5cd-ecfa1eee5e12.lovableproject.com';
  
  switch (type) {
    case 'signup':
      return {
        subject: 'Confirm your email address',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">Welcome to AuthorPage!</h1>
              <p style="color: #666; font-size: 16px;">Please confirm your email address to get started</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <a href="${baseUrl}/auth/confirm?token_hash=${data.token_hash}&type=signup&redirect_to=${encodeURIComponent(data.redirect_to || baseUrl + '/dashboard')}" 
                 style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Confirm Email Address
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
              <p>If you didn't create an account, you can safely ignore this email.</p>
              <p>This link will expire in 24 hours.</p>
            </div>
          </div>
        `
      };
      
    case 'recovery':
      return {
        subject: 'Reset your password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">Reset Your Password</h1>
              <p style="color: #666; font-size: 16px;">Click the button below to reset your password</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <a href="${baseUrl}/auth/reset-password?token_hash=${data.token_hash}&type=recovery&redirect_to=${encodeURIComponent(data.redirect_to || baseUrl + '/dashboard')}" 
                 style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
              <p>If you didn't request a password reset, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
            </div>
          </div>
        `
      };
      
    case 'magic_link':
      return {
        subject: 'Your magic login link',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #333; font-size: 28px; margin-bottom: 10px;">Magic Login Link</h1>
              <p style="color: #666; font-size: 16px;">Click the button below to sign in to your account</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 30px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
              <a href="${baseUrl}/auth/confirm?token_hash=${data.token_hash}&type=magiclink&redirect_to=${encodeURIComponent(data.redirect_to || baseUrl + '/dashboard')}" 
                 style="background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                Sign In
              </a>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
              <p>If you didn't request this login link, you can safely ignore this email.</p>
              <p>This link will expire in 1 hour.</p>
            </div>
          </div>
        `
      };
      
    default:
      return {
        subject: 'Email confirmation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1>Email Confirmation</h1>
            <p>Please confirm your email address by clicking the link below:</p>
            <a href="${baseUrl}/auth/confirm?token_hash=${data.token_hash}&type=${type}&redirect_to=${encodeURIComponent(data.redirect_to || baseUrl)}">
              Confirm Email
            </a>
          </div>
        `
      };
  }
};

const handler = async (req: Request): Promise<Response> => {
  console.log('Auth email webhook received:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Handle both webhook and direct API calls
    let emailData: AuthEmailRequest;
    
    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json();
      console.log('Webhook body:', JSON.stringify(body, null, 2));
      
      // Check if this is a Supabase auth webhook
      if (body.user && body.email_data) {
        emailData = {
          email: body.user.email,
          type: body.email_data.email_action_type || 'signup',
          token_hash: body.email_data.token_hash,
          token: body.email_data.token,
          redirect_to: body.email_data.redirect_to,
          site_url: body.email_data.site_url
        };
      } else {
        // Direct API call
        emailData = body;
      }
    } else {
      return new Response(JSON.stringify({ error: 'Invalid content type' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    console.log('Processing email data:', emailData);

    if (!emailData.email || !emailData.type) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, type' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    const template = generateEmailTemplate(emailData.type, emailData);
    
    console.log('Sending email to:', emailData.email, 'Type:', emailData.type);
    
    const emailResponse = await sendEmailWithResend(
      emailData.email,
      template.subject,
      template.html
    );

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-auth-email function:", error);
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