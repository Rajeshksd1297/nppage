import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      ec2Ip, 
      instanceId, 
      githubRepo, 
      branch = 'main',
      buildCommand = 'npm run build',
      projectName = 'app'
    } = await req.json();

    if (!ec2Ip || !instanceId) {
      throw new Error('EC2 IP and instance ID are required');
    }

    console.log('Starting deployment to EC2:', { ec2Ip, instanceId, githubRepo, branch });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get SSH key from deployment logs
    const { data: logData, error: logError } = await supabase
      .from('aws_deployment_logs')
      .select('log_data')
      .eq('instance_id', instanceId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (logError) {
      console.error('Error fetching logs:', logError);
      throw new Error('Could not retrieve deployment logs');
    }

    // Find SSH key in logs
    let sshKeyContent = '';
    for (const log of logData || []) {
      if (log.log_data?.key_content) {
        sshKeyContent = log.log_data.key_content;
        break;
      }
      if (log.log_data?.message?.includes('BEGIN RSA PRIVATE KEY')) {
        sshKeyContent = log.log_data.message;
        break;
      }
    }

    if (!sshKeyContent) {
      throw new Error('SSH key not found in deployment logs');
    }

    // Create temporary SSH key file
    const keyPath = `/tmp/deploy_key_${Date.now()}.pem`;
    await Deno.writeTextFile(keyPath, sshKeyContent);
    await Deno.chmod(keyPath, 0o600);

    console.log('SSH key prepared, starting deployment script...');

    // Create deployment script
    const deployScript = githubRepo ? `
#!/bin/bash
set -e

echo "🚀 Starting deployment process..."

# Install git if not present
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo yum install -y git
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Create deployment directory
DEPLOY_DIR="/var/www/${projectName}"
sudo mkdir -p $DEPLOY_DIR
sudo chown -R ec2-user:ec2-user $DEPLOY_DIR

cd $DEPLOY_DIR

# Clone or pull repository
if [ -d ".git" ]; then
    echo "📥 Pulling latest changes from ${branch}..."
    git fetch origin
    git checkout ${branch}
    git pull origin ${branch}
else
    echo "📥 Cloning repository..."
    git clone -b ${branch} ${githubRepo} .
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production=false

# Build application
echo "🏗️ Building application..."
${buildCommand}

# Deploy to web directory
echo "📋 Deploying to web directory..."
if [ -d "dist" ]; then
    sudo rm -rf /var/www/html/*
    sudo cp -r dist/* /var/www/html/
elif [ -d "build" ]; then
    sudo rm -rf /var/www/html/*
    sudo cp -r build/* /var/www/html/
else
    echo "⚠️ No dist or build folder found, copying all files..."
    sudo cp -r * /var/www/html/
fi

# Set permissions
echo "🔐 Setting permissions..."
sudo chown -R nginx:nginx /var/www/html
sudo chmod -R 755 /var/www/html

# Restart services
echo "🔄 Restarting Nginx..."
sudo systemctl restart nginx

echo "✅ Deployment complete!"
echo "🌐 Your site should now be live at: http://${ec2Ip}"
` : `
#!/bin/bash
set -e

echo "⚠️ No GitHub repository provided"
echo "Please configure GitHub repository in deployment settings"
exit 1
`;

    // Execute deployment on EC2
    console.log('Executing deployment script on EC2...');
    const sshCommand = new Deno.Command("ssh", {
      args: [
        "-i", keyPath,
        "-o", "StrictHostKeyChecking=no",
        "-o", "UserKnownHostsFile=/dev/null",
        "-o", "ConnectTimeout=30",
        `ec2-user@${ec2Ip}`,
        deployScript
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await sshCommand.output();
    
    // Clean up key file
    try {
      await Deno.remove(keyPath);
    } catch (e) {
      console.log("Could not remove temp key file:", e);
    }

    const output = new TextDecoder().decode(stdout);
    const errorOutput = new TextDecoder().decode(stderr);

    console.log('Deployment output:', output);
    if (errorOutput) console.error('Deployment stderr:', errorOutput);

    // Log deployment attempt
    await supabase.from('aws_deployment_logs').insert({
      instance_id: instanceId,
      log_level: code === 0 ? 'info' : 'error',
      message: code === 0 ? 'Deployment completed successfully' : 'Deployment failed',
      log_data: {
        output,
        errorOutput,
        exitCode: code,
        githubRepo,
        branch
      }
    });

    if (code !== 0) {
      throw new Error(`Deployment failed: ${errorOutput || output}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deployment completed successfully',
        output,
        deployedUrl: `http://${ec2Ip}`
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Deployment error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: 'Failed to deploy application to EC2'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
