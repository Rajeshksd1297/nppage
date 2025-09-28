import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // For now, we'll log the email details instead of actually sending
    // In production, you would integrate with your email service here
    console.log("Newsletter Details:");
    console.log("From:", `${fromName} <${fromEmail}>`);
    console.log("Subject:", subject);
    console.log("Preview:", previewText);
    console.log("Recipients:", recipients.length);
    console.log("Content preview:", content.substring(0, 100) + "...");

    // Simulate successful sending
    await new Promise(resolve => setTimeout(resolve, 1000));

    console.log(`Newsletter sent successfully to ${recipients.length} recipients`);

    return new Response(JSON.stringify({ 
      success: true,
      recipientCount: recipients.length,
      messageId: `newsletter_${Date.now()}`,
      note: "Newsletter logged successfully. In production, this would send actual emails."
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