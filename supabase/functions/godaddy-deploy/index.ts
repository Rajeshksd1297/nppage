import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeploymentRequest {
  deployment_name: string;
  ftp_host?: string;
  ftp_username?: string;
  ftp_password?: string;
  ftp_port?: number;
  deployment_path?: string;
  domain?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: DeploymentRequest = await req.json();
    
    // Fetch or use provided FTP settings
    let ftpSettings;
    if (requestData.ftp_host && requestData.ftp_username && requestData.ftp_password) {
      ftpSettings = {
        ftp_host: requestData.ftp_host,
        ftp_username: requestData.ftp_username,
        ftp_password: requestData.ftp_password,
        ftp_port: requestData.ftp_port || 21,
        deployment_path: requestData.deployment_path || '/public_html',
        domain: requestData.domain || ''
      };
    } else {
      const { data: settings, error: settingsError } = await supabase
        .from('godaddy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (settingsError || !settings) {
        throw new Error('GoDaddy settings not configured. Please configure FTP settings first.');
      }
      ftpSettings = settings;
    }

    // Create deployment record
    const { data: deployment, error: deploymentError } = await supabase
      .from('godaddy_deployments')
      .insert({
        user_id: user.id,
        deployment_name: requestData.deployment_name,
        status: 'in_progress',
        domain: ftpSettings.domain,
      })
      .select()
      .single();

    if (deploymentError || !deployment) {
      throw new Error('Failed to create deployment record');
    }

    // Record manual deployment
    let deploymentLog = '=== GoDaddy Deployment Record ===\n\n';
    
    try {
      deploymentLog += '📋 Deployment Information:\n';
      deploymentLog += `  - Deployment Name: ${requestData.deployment_name}\n`;
      deploymentLog += `  - FTP Host: ${ftpSettings.ftp_host}\n`;
      deploymentLog += `  - FTP Port: ${ftpSettings.ftp_port}\n`;
      deploymentLog += `  - Deployment Path: ${ftpSettings.deployment_path}\n`;
      deploymentLog += `  - Domain: ${ftpSettings.domain}\n`;
      deploymentLog += `  - Recorded At: ${new Date().toISOString()}\n\n`;

      deploymentLog += '✅ Deployment Recorded Successfully\n\n';
      deploymentLog += `🌐 Your application should be live at: https://${ftpSettings.domain}\n\n`;
      
      deploymentLog += 'Manual Deployment Checklist:\n';
      deploymentLog += '☐ Built application locally (npm run build)\n';
      deploymentLog += '☐ Uploaded all dist folder contents via FTP\n';
      deploymentLog += '☐ Verified .htaccess file is present\n';
      deploymentLog += '☐ Set correct file permissions (644 for files, 755 for folders)\n';
      deploymentLog += '☐ Tested website in browser\n';
      deploymentLog += '☐ Verified all routes work correctly\n';
      deploymentLog += '☐ Checked SSL/HTTPS is active\n\n';
      
      deploymentLog += 'Troubleshooting:\n';
      deploymentLog += '• If seeing 404 errors: Check .htaccess is uploaded\n';
      deploymentLog += '• If blank page: Check browser console for errors\n';
      deploymentLog += '• If assets not loading: Verify all files were uploaded\n';
      deploymentLog += '• If FTP issues: Use Status Check tab to test connection\n';

      // Update deployment record with success
      await supabase
        .from('godaddy_deployments')
        .update({
          status: 'success',
          deployment_log: deploymentLog,
          completed_at: new Date().toISOString()
        })
        .eq('id', deployment.id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Deployment recorded successfully',
          deployment_id: deployment.id,
          url: `https://${ftpSettings.domain}`,
          log: deploymentLog
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } catch (deployError) {
      deploymentLog += `\n\n❌ ERROR: ${deployError.message}\n`;
      
      await supabase
        .from('godaddy_deployments')
        .update({
          status: 'failed',
          deployment_log: deploymentLog,
          completed_at: new Date().toISOString()
        })
        .eq('id', deployment.id);

      throw deployError;
    }

  } catch (error) {
    console.error('Deployment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
