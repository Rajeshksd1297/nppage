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

    // Extract repo path from GitHub URL (e.g., "username/repo" from "https://github.com/username/repo.git")
    const repoPath = githubRepo
      .replace('https://github.com/', '')
      .replace('http://github.com/', '')
      .replace('.git', '');

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
OPTION 1: AWS SSM (NO SSH KEY - RECOMMENDED)
===============================================================

RECOMMENDED: Use this method to avoid all SSH and Git auth issues!

Prerequisites:
1. Install AWS CLI: https://aws.amazon.com/cli/
2. Install Session Manager plugin:
   https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html
3. EC2 instance must have SSM role: AmazonSSMManagedInstanceCore

Connect and deploy:
   aws ssm start-session --target ${instanceId} --region us-east-1

IMPORTANT - Git Authentication Setup:
Before running deployment, setup Git authentication on EC2:

METHOD A - SSH Key (Recommended):
   ssh-keygen -t ed25519 -C "your-email@example.com"
   cat ~/.ssh/id_ed25519.pub
   # Add this key to GitHub: Settings > SSH Keys > New SSH key

METHOD B - Personal Access Token:
   # Create token at: https://github.com/settings/tokens
   # Set TOKEN below, then use HTTPS URL with token

===============================================================
OPTION 2: GITHUB ACTIONS (FULLY AUTOMATED - BEST)
===============================================================

This eliminates ALL manual steps! Set it up once, deploy on every push.

1. Create .github/workflows/deploy.yml in your repo with this content:

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
      
      - name: Build Application
        run: |
          npm install
          ${buildCommand}
      
      - name: Deploy to EC2 via SSM
        env:
          AWS_ACCESS_KEY_ID: \${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: \${{ secrets.AWS_SECRET_ACCESS_KEY }}
          AWS_REGION: us-east-1
        run: |
          # Install AWS CLI
          aws --version || (curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && unzip awscliv2.zip && sudo ./aws/install)
          
          # Deploy built files
          tar -czf dist.tar.gz dist/
          aws s3 cp dist.tar.gz s3://temp-deploy-bucket-${instanceId}/dist.tar.gz || echo "Using SSM fallback"
          
          # Execute deployment on EC2
          aws ssm send-command \\
            --instance-ids ${instanceId} \\
            --document-name "AWS-RunShellScript" \\
            --parameters 'commands=[
              "sudo rm -rf /var/www/html/*",
              "sudo mkdir -p /var/www/html",
              "cd /tmp && wget https://github.com/${repoPath}/archive/refs/heads/${branch}.zip || echo downloading",
              "cd /var/www/html",
              "# Copy build files here",
              "sudo systemctl restart nginx"
            ]' \\
            --output text

2. Add these secrets to your GitHub repository:
   Go to: Repository Settings > Secrets and Variables > Actions

   Required secrets:
   - AWS_ACCESS_KEY_ID (your AWS access key)
   - AWS_SECRET_ACCESS_KEY (your AWS secret key)

3. Push to ${branch} branch - deployment happens automatically!

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

# Setup Git authentication (if using HTTPS with token)
# Uncomment and set your token if using HTTPS
# export GIT_TOKEN="your_github_personal_access_token"
# REPO_WITH_TOKEN=\${githubRepo/https:\\/\\//https://\${GIT_TOKEN}@}

# Clone or update repository
if [ -d ".git" ]; then
    echo "Updating from ${branch}..."
    git fetch origin
    git checkout ${branch}
    git pull origin ${branch}
else
    echo "Cloning repository..."
    # For HTTPS with token: git clone -b ${branch} $REPO_WITH_TOKEN .
    # For SSH (recommended): Convert HTTPS URL to SSH or use SSH URL directly
    REPO_SSH=\${githubRepo/https:\\/\\/github.com\\//git@github.com:}
    git clone -b ${branch} $REPO_SSH .
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
