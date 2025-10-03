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

    if (!ec2Ip || !instanceId || !githubRepo) {
      throw new Error('EC2 IP, instance ID, and GitHub repository are required');
    }

    console.log('Starting deployment to EC2:', { ec2Ip, instanceId, githubRepo, branch });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Store GitHub repo URL in deployment record
    await supabase
      .from('aws_deployments')
      .update({ 
        deployment_log: `GitHub Repository: ${githubRepo}\nBranch: ${branch}\nDeployment initiated at ${new Date().toISOString()}`
      })
      .eq('instance_id', instanceId);

    console.log('Deployment record updated with GitHub info');

    // Return instructions for manual deployment via SSH
    const deploymentInstructions = `
═══════════════════════════════════════════════════════════
🚀 DEPLOYMENT INSTRUCTIONS FOR EC2
═══════════════════════════════════════════════════════════

📍 Instance: ${instanceId}
🌐 IP: ${ec2Ip}
📦 Repository: ${githubRepo}
🌿 Branch: ${branch}

Follow these steps to deploy your application:

1️⃣ SSH into your EC2 instance:
   ssh -i your-key.pem ec2-user@${ec2Ip}

2️⃣ Run the deployment script:

#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Install Git (if not present)
if ! command -v git &> /dev/null; then
    echo "📦 Installing Git..."
    sudo yum install -y git
fi

# Install Node.js (if not present)
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
    sudo yum install -y nodejs
fi

# Create deployment directory
DEPLOY_DIR="/var/www/${projectName}"
sudo mkdir -p \\$DEPLOY_DIR
sudo chown -R ec2-user:ec2-user \\$DEPLOY_DIR
cd \\$DEPLOY_DIR

# Clone or update repository
if [ -d ".git" ]; then
    echo "📥 Updating from ${branch}..."
    git fetch origin
    git checkout ${branch}
    git pull origin ${branch}
else
    echo "📥 Cloning repository..."
    git clone -b ${branch} ${githubRepo} .
fi

# Install and build
echo "📦 Installing dependencies..."
npm install

echo "🏗️ Building..."
${buildCommand}

# Deploy
echo "📋 Deploying..."
if [ -d "dist" ]; then
    sudo rm -rf /var/www/html/*
    sudo cp -r dist/* /var/www/html/
fi

# Set permissions
sudo chown -R nginx:nginx /var/www/html
sudo chmod -R 755 /var/www/html
sudo systemctl restart nginx

echo "✅ Done! Visit: http://${ec2Ip}"

═══════════════════════════════════════════════════════════

💡 TIP: Save this script as deploy.sh and run with: bash deploy.sh
`;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deployment instructions generated',
        instructions: deploymentInstructions,
        deployedUrl: `http://${ec2Ip}`,
        note: 'SSH into your EC2 instance and run the provided deployment script'
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
