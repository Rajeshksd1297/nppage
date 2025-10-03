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

    // Return instructions for automated deployment
    const deploymentInstructions = `
===============================================================
AUTOMATED DEPLOYMENT OPTIONS FOR EC2
===============================================================

Instance: ${instanceId}
IP: ${ec2Ip}
Repository: ${githubRepo}
Branch: ${branch}

===============================================================
OPTION 1: AWS SSM (NO SSH KEY REQUIRED - RECOMMENDED)
===============================================================

This method uses AWS Systems Manager and requires NO .pem file!

Prerequisites:
1. Install AWS CLI: https://aws.amazon.com/cli/
2. Install Session Manager plugin:
   https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html

3. Ensure your EC2 instance has SSM role attached:
   - Go to EC2 Console > Instance > Actions > Security > Modify IAM role
   - Attach: AmazonSSMManagedInstanceCore

Connect without SSH key:
   aws ssm start-session --target ${instanceId} --region us-east-1

Then run the deployment script below.

===============================================================
OPTION 2: GITHUB ACTIONS (FULLY AUTOMATED)
===============================================================

Add this workflow to .github/workflows/deploy.yml in your repo:

name: Deploy to EC2
on:
  push:
    branches: [${branch}]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to EC2 via SSM
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
        run: |
          aws ssm send-command \\
            --instance-ids ${instanceId} \\
            --document-name "AWS-RunShellScript" \\
            --parameters 'commands=[
              "cd /var/www/${projectName} || mkdir -p /var/www/${projectName}",
              "cd /var/www/${projectName}",
              "if [ -d .git ]; then git pull origin ${branch}; else git clone -b ${branch} ${githubRepo} .; fi",
              "npm install",
              "${buildCommand}",
              "sudo rm -rf /var/www/html/*",
              "sudo cp -r dist/* /var/www/html/",
              "sudo systemctl restart nginx"
            ]' \\
            --output text

Then add these secrets to GitHub:
Settings > Secrets > Actions > New repository secret
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY

===============================================================
OPTION 3: MANUAL SSH (If you still prefer SSH)
===============================================================

ssh -i /path/to/your-keypair.pem ubuntu@${ec2Ip}

Then run the deployment script:

===============================================================
DEPLOYMENT SCRIPT (deploy.sh)
===============================================================

#!/bin/bash
set -e

echo "Starting deployment..."

# Detect OS and set package manager
if [ -f /etc/debian_version ]; then
    PKG_MANAGER="apt-get"
    WEB_USER="www-data"
    WEB_SERVER="nginx"
    echo "Detected Debian/Ubuntu system"
elif [ -f /etc/redhat-release ]; then
    PKG_MANAGER="yum"
    WEB_USER="nginx"
    WEB_SERVER="nginx"
    echo "Detected RedHat/CentOS/Amazon Linux system"
else
    echo "Unsupported OS"
    exit 1
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    sudo $PKG_MANAGER update -y
    sudo $PKG_MANAGER install -y git
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    if [ "$PKG_MANAGER" = "apt-get" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo $PKG_MANAGER install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
fi

# Create deployment directory
DEPLOY_DIR="/var/www/${projectName}"
sudo mkdir -p $DEPLOY_DIR
sudo chown -R $USER:$USER $DEPLOY_DIR
cd $DEPLOY_DIR

# Clone or update repository
if [ -d ".git" ]; then
    echo "Updating from ${branch}..."
    git fetch origin
    git checkout ${branch}
    git pull origin ${branch}
else
    echo "Cloning repository..."
    git clone -b ${branch} ${githubRepo} .
fi

# Install and build
echo "Installing dependencies..."
npm install

echo "Building..."
${buildCommand}

# Deploy
echo "Deploying..."
if [ -d "dist" ]; then
    sudo mkdir -p /var/www/html
    sudo rm -rf /var/www/html/*
    sudo cp -r dist/* /var/www/html/
fi

# Set permissions
sudo chown -R $WEB_USER:$WEB_USER /var/www/html
sudo chmod -R 755 /var/www/html
sudo systemctl restart $WEB_SERVER

echo "Done! Visit: http://${ec2Ip}"

===============================================================

To run this script:

Via SSM (no key needed):
   aws ssm start-session --target ${instanceId}
   # Then paste and run the script above

Via SSH (requires .pem file):
   ssh -i /path/to/your-keypair.pem ubuntu@${ec2Ip}
   # Then paste and run the script above

===============================================================
RECOMMENDATION: Use Option 1 (SSM) or Option 2 (GitHub Actions)
for automated deployment without managing SSH keys!
===============================================================
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
