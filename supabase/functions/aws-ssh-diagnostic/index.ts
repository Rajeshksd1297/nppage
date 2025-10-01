import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DiagnosticRequest {
  instanceId: string;
  region: string;
  autoFix?: boolean;
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

    const { instanceId, region, autoFix = false } = await req.json() as DiagnosticRequest;

    console.log(`Running SSH diagnostics for instance ${instanceId} in ${region} (autoFix: ${autoFix})`);

    // Get deployment details including private key
    const { data: deployment, error: deploymentError } = await supabaseClient
      .from('aws_deployments')
      .select('*')
      .eq('ec2_instance_id', instanceId)
      .order('created_at', { desc: true })
      .limit(1)
      .maybeSingle();

    if (deploymentError || !deployment) {
      throw new Error('Deployment not found for this instance');
    }

    if (!deployment.ec2_public_ip) {
      throw new Error('No public IP found for this instance');
    }

    // Extract private key from deployment log
    const log = deployment.deployment_log || '';
    const keyMatch = log.match(/-----BEGIN RSA PRIVATE KEY-----[\s\S]*?-----END RSA PRIVATE KEY-----/);
    
    if (!keyMatch) {
      throw new Error('SSH private key not found in deployment. Please ensure the key was saved during deployment.');
    }

    const privateKey = keyMatch[0];
    const publicIp = deployment.ec2_public_ip;

    console.log(`Connecting to ${publicIp} via SSH...`);

    // Run SSH diagnostics
    const diagnostics = await runSSHDiagnostics(publicIp, privateKey, autoFix);

    return new Response(
      JSON.stringify({
        success: true,
        diagnostics,
        autoFixApplied: autoFix,
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

async function runSSHDiagnostics(host: string, privateKey: string, autoFix: boolean) {
  const diagnostics = {
    connected: false,
    nginx: {
      installed: false,
      running: false,
      enabled: false,
      status: '',
    },
    nodejs: {
      installed: false,
      version: '',
    },
    application: {
      found: false,
      running: false,
    },
    ports: {
      port80Listening: false,
      port3000Listening: false,
    },
    fixes: [] as string[],
    errors: [] as string[],
  };

  try {
    // Save private key to temporary file
    const keyPath = await Deno.makeTempFile({ suffix: '.pem' });
    await Deno.writeTextFile(keyPath, privateKey);
    await Deno.chmod(keyPath, 0o600);

    // Helper function to run SSH commands
    const runSSH = async (command: string): Promise<{ stdout: string; stderr: string; success: boolean }> => {
      try {
        const process = new Deno.Command('ssh', {
          args: [
            '-i', keyPath,
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'UserKnownHostsFile=/dev/null',
            '-o', 'ConnectTimeout=10',
            `ubuntu@${host}`,
            command
          ],
          stdout: 'piped',
          stderr: 'piped',
        });

        const { code, stdout, stderr } = await process.output();
        const stdoutText = new TextDecoder().decode(stdout);
        const stderrText = new TextDecoder().decode(stderr);

        return {
          stdout: stdoutText,
          stderr: stderrText,
          success: code === 0,
        };
      } catch (error) {
        return {
          stdout: '',
          stderr: error.message,
          success: false,
        };
      }
    };

    // Test SSH connection
    console.log('Testing SSH connection...');
    const connectionTest = await runSSH('echo "connected"');
    if (!connectionTest.success) {
      throw new Error(`SSH connection failed: ${connectionTest.stderr}`);
    }
    diagnostics.connected = true;
    console.log('✓ SSH connection successful');

    // Check Nginx installation
    console.log('Checking Nginx...');
    const nginxCheck = await runSSH('which nginx');
    diagnostics.nginx.installed = nginxCheck.success;

    if (diagnostics.nginx.installed) {
      // Check if Nginx is running
      const nginxStatus = await runSSH('systemctl is-active nginx');
      diagnostics.nginx.running = nginxStatus.stdout.trim() === 'active';

      // Check if Nginx is enabled
      const nginxEnabled = await runSSH('systemctl is-enabled nginx');
      diagnostics.nginx.enabled = nginxEnabled.stdout.trim() === 'enabled';

      // Get full status
      const nginxFullStatus = await runSSH('systemctl status nginx || true');
      diagnostics.nginx.status = nginxFullStatus.stdout;

      // Auto-fix: Start and enable Nginx if not running
      if (autoFix && !diagnostics.nginx.running) {
        console.log('Auto-fixing: Starting Nginx...');
        await runSSH('sudo systemctl start nginx');
        await runSSH('sudo systemctl enable nginx');
        diagnostics.fixes.push('Started and enabled Nginx service');
      }
    } else if (autoFix) {
      console.log('Auto-fixing: Installing Nginx...');
      await runSSH('sudo apt-get update && sudo apt-get install -y nginx');
      await runSSH('sudo systemctl start nginx');
      await runSSH('sudo systemctl enable nginx');
      diagnostics.nginx.installed = true;
      diagnostics.nginx.running = true;
      diagnostics.fixes.push('Installed and started Nginx');
    }

    // Check Node.js
    console.log('Checking Node.js...');
    const nodeCheck = await runSSH('node --version');
    diagnostics.nodejs.installed = nodeCheck.success;
    diagnostics.nodejs.version = nodeCheck.stdout.trim();

    // Check ports
    console.log('Checking listening ports...');
    const portsCheck = await runSSH('sudo netstat -tlnp | grep LISTEN || sudo ss -tlnp | grep LISTEN');
    diagnostics.ports.port80Listening = portsCheck.stdout.includes(':80');
    diagnostics.ports.port3000Listening = portsCheck.stdout.includes(':3000');

    // Check application
    const appCheck = await runSSH('ls -la /home/ubuntu/app/server.js 2>/dev/null');
    diagnostics.application.found = appCheck.success;

    if (diagnostics.application.found) {
      const appRunning = await runSSH('pm2 list | grep app || ps aux | grep "node.*server.js"');
      diagnostics.application.running = appRunning.stdout.includes('app') || appRunning.stdout.includes('server.js');
    }

    // Clean up
    await Deno.remove(keyPath);

    console.log('Diagnostics complete:', diagnostics);
    return diagnostics;

  } catch (error) {
    diagnostics.errors.push(error.message);
    console.error('Diagnostic error:', error);
    return diagnostics;
  }
}
