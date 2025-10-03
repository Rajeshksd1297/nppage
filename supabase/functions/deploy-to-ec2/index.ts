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

    // Generate clean executable deployment script
    const deployScript = `#!/bin/bash
set -e

echo "Starting deployment to EC2..."

# Detect OS
if [ -f /etc/debian_version ]; then
    PKG_MANAGER="apt-get"
    WEB_USER="www-data"
    echo "Detected Debian/Ubuntu system"
elif [ -f /etc/redhat-release ]; then
    PKG_MANAGER="yum"
    WEB_USER="nginx"
    echo "Detected RedHat/CentOS/Amazon Linux system"
else
    echo "Unsupported OS"
    exit 1
fi

# Install Git
if ! command -v git &> /dev/null; then
    echo "Installing Git..."
    sudo \$PKG_MANAGER update -y
    sudo \$PKG_MANAGER install -y git
fi

# Install Node.js
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    if [ "\$PKG_MANAGER" = "apt-get" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi
fi

# Install Nginx
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo \$PKG_MANAGER install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
fi

# Setup deployment directory
DEPLOY_DIR="/var/www/${projectName}"
sudo mkdir -p \$DEPLOY_DIR
sudo chown -R \$USER:\$USER \$DEPLOY_DIR
cd \$DEPLOY_DIR

# Clone or update repository
if [ -d ".git" ]; then
    echo "Updating repository..."
    git fetch origin
    git checkout ${branch}
    git pull origin ${branch}
else
    echo "Cloning repository..."
    git clone -b ${branch} ${githubRepo} .
fi

# Build application
echo "Installing dependencies..."
npm install

echo "Building application with increased memory..."
export NODE_OPTIONS="--max-old-space-size=4096"
${buildCommand}

# Deploy to web root
if [ -d "dist" ]; then
    echo "Deploying to web root..."
    sudo mkdir -p /var/www/html
    sudo rm -rf /var/www/html/*
    sudo cp -r dist/* /var/www/html/
    sudo chown -R \$WEB_USER:\$WEB_USER /var/www/html
    sudo chmod -R 755 /var/www/html
fi

# Restart web server
echo "Restarting web server..."
sudo systemctl restart nginx

echo "Deployment complete!"
echo "Visit: http://${ec2Ip}"
`;

    const deploymentInstructions = `# SSH into your EC2 instance first:
# ssh -i /path/to/your-keypair.pem ubuntu@${ec2Ip}

# Then run these commands:
cat > deploy.sh << 'DEPLOYEOF'
${deployScript}
DEPLOYEOF

chmod +x deploy.sh
./deploy.sh`;

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
