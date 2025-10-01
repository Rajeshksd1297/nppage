import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { EC2Client, GetConsoleOutputCommand } from "npm:@aws-sdk/client-ec2@3.709.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticRequest {
  instanceId: string;
  region: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error('User not authenticated');
    }

    const { instanceId, region } = await req.json() as DiagnosticRequest;

    console.log(`Fetching console logs for instance ${instanceId} in ${region}`);

    // Get AWS settings
    const { data: awsSettings, error: settingsError } = await supabaseClient
      .from('aws_settings')
      .select('*')
      .order('created_at', { desc: true })
      .limit(1)
      .maybeSingle();

    if (settingsError || !awsSettings) {
      throw new Error('AWS credentials not configured');
    }

    // Initialize EC2 Client
    const ec2Client = new EC2Client({
      region: region,
      credentials: {
        accessKeyId: awsSettings.aws_access_key_id,
        secretAccessKey: awsSettings.aws_secret_access_key,
      },
    });

    // Get console output (contains user-data script logs)
    const command = new GetConsoleOutputCommand({
      InstanceId: instanceId,
      Latest: true,
    });

    const response = await ec2Client.send(command);
    
    // Decode base64 output (AWS returns it base64 encoded)
    let consoleOutput = '';
    if (response.Output) {
      try {
        // Deno way to decode base64
        const decoder = new TextDecoder();
        const data = Uint8Array.from(atob(response.Output), c => c.charCodeAt(0));
        consoleOutput = decoder.decode(data);
      } catch (decodeError) {
        console.error('Error decoding console output:', decodeError);
        consoleOutput = response.Output; // Use as-is if decode fails
      }
    }

    console.log(`Console output length: ${consoleOutput.length} bytes`);

    // Parse the console output to find setup progress
    const diagnostics = parseConsoleOutput(consoleOutput);

    return new Response(
      JSON.stringify({
        success: true,
        diagnostics,
        consoleOutput: consoleOutput.slice(-2000), // Last 2000 chars
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('SSH diagnostic error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function parseConsoleOutput(output: string) {
  const diagnostics = {
    setupStarted: false,
    setupComplete: false,
    progressPercent: 0,
    currentStep: 'Initializing',
    steps: {
      systemUpdate: false,
      nginxInstall: false,
      nodejsInstall: false,
      applicationSetup: false,
      serviceStart: false,
    },
    errors: [] as string[],
    warnings: [] as string[],
    lastLogLines: [] as string[],
  };

  if (!output || output.length === 0) {
    diagnostics.warnings.push('No console output available yet - instance may still be starting');
    return diagnostics;
  }

  // Get last 20 lines for display
  const lines = output.split('\n');
  diagnostics.lastLogLines = lines.slice(-20).filter(l => l.trim());

  // Check for setup markers
  if (output.includes('Cloud-init') || output.includes('user-data')) {
    diagnostics.setupStarted = true;
  }

  // Check each setup step
  if (output.includes('apt-get update') || output.includes('Updating package')) {
    diagnostics.steps.systemUpdate = true;
    diagnostics.currentStep = 'Updating system packages';
    diagnostics.progressPercent = 20;
  }

  if (output.includes('nginx') && (output.includes('install') || output.includes('Setting up nginx'))) {
    diagnostics.steps.nginxInstall = true;
    diagnostics.currentStep = 'Installing Nginx web server';
    diagnostics.progressPercent = 40;
  }

  if (output.includes('nodejs') || output.includes('node') && output.includes('install')) {
    diagnostics.steps.nodejsInstall = true;
    diagnostics.currentStep = 'Installing Node.js runtime';
    diagnostics.progressPercent = 60;
  }

  if (output.includes('systemctl start nginx') || output.includes('systemctl enable nginx')) {
    diagnostics.steps.serviceStart = true;
    diagnostics.currentStep = 'Starting web services';
    diagnostics.progressPercent = 80;
  }

  // Check for completion
  if (output.includes('Cloud-init') && output.includes('finished')) {
    diagnostics.setupComplete = true;
    diagnostics.currentStep = 'Setup complete';
    diagnostics.progressPercent = 100;
  }

  // Check for errors
  if (output.match(/error|failed|fatal/i)) {
    const errorLines = lines.filter(l => l.match(/error|failed|fatal/i));
    diagnostics.errors.push(...errorLines.slice(-5));
  }

  // If no specific progress detected but setup started
  if (diagnostics.setupStarted && !diagnostics.steps.systemUpdate) {
    diagnostics.currentStep = 'Initializing system setup';
    diagnostics.progressPercent = 10;
  }

  return diagnostics;
}
