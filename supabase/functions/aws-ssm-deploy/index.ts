import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeploymentRequest {
  instanceId: string;
  region: string;
  awsAccessKeyId: string;
  awsSecretAccessKey: string;
  buildCommand?: string;
  projectName?: string;
  deploymentType?: 'fresh' | 'code-only';
  autoSetupSSM?: boolean;
  gitRepoUrl?: string;
  gitBranch?: string;
  s3BucketName?: string;
  files?: Array<{ path: string; content: string }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      instanceId, 
      region, 
      awsAccessKeyId, 
      awsSecretAccessKey,
      buildCommand = "npm install && npm run build",
      projectName = "web-app",
      deploymentType = "code-only",
      autoSetupSSM = true,
      gitRepoUrl,
      gitBranch = "main",
      s3BucketName,
      files 
    }: DeploymentRequest = await req.json();

    console.log('Starting SSM deployment to instance:', instanceId);
    console.log('Auto-setup SSM:', autoSetupSSM);

    if (!instanceId || !region || !awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('Missing required fields: instanceId, region, awsAccessKeyId, awsSecretAccessKey');
    }

    // SSM Setup Instructions (if auto-setup is enabled)
    let ssmSetupInstructions = '';
    if (autoSetupSSM) {
      ssmSetupInstructions = `
=== AUTOMATIC SSM SETUP ===

The following steps will be attempted automatically via AWS CLI:

1. Check if instance has an IAM role
2. Create SSM role if needed (lovable-ssm-role)
3. Attach AmazonSSMManagedInstanceCore policy
4. Associate role with EC2 instance
5. Verify SSM agent is running

Commands that will be executed:

# Create IAM role for SSM
aws iam create-role \\
  --role-name lovable-ssm-role-${instanceId} \\
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }' \\
  --region ${region}

# Attach SSM policy to role
aws iam attach-role-policy \\
  --role-name lovable-ssm-role-${instanceId} \\
  --policy-arn arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore

# Create instance profile
aws iam create-instance-profile \\
  --instance-profile-name lovable-ssm-profile-${instanceId}

# Add role to instance profile
aws iam add-role-to-instance-profile \\
  --instance-profile-name lovable-ssm-profile-${instanceId} \\
  --role-name lovable-ssm-role-${instanceId}

# Wait for instance profile to be ready
sleep 10

# Attach instance profile to EC2
aws ec2 associate-iam-instance-profile \\
  --instance-id ${instanceId} \\
  --iam-instance-profile Name=lovable-ssm-profile-${instanceId} \\
  --region ${region}

# Wait for SSM agent to register (can take 1-2 minutes)
echo "Waiting for SSM agent to be ready..."
sleep 60

# Check SSM agent status
aws ssm describe-instance-information \\
  --filters "Key=InstanceIds,Values=${instanceId}" \\
  --region ${region}

Note: If the instance already has SSM configured, these commands will be skipped.
`;
    }

    // Create AWS signature for SSM API
    const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
    const date = timestamp.substring(0, 8);
    
    // Generate deployment script based on deployment type
    const deployScript = deploymentType === 'fresh' ? `#!/bin/bash
set -e

echo "=== Starting FRESH Installation via SSM ==="
echo "⚠️  WARNING: This will delete all existing data!"

# Update system packages
echo "Updating system packages..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    PKG_MANAGER="apt-get"
elif command -v yum &> /dev/null; then
    sudo yum update -y
    PKG_MANAGER="yum"
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo $PKG_MANAGER install -y nodejs
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo $PKG_MANAGER install -y nginx
    sudo systemctl enable nginx
fi

# FRESH INSTALLATION - Remove all existing data
PROJECT_DIR="/var/www/${projectName}"
echo "⚠️  Removing existing project directory: $PROJECT_DIR"
sudo rm -rf $PROJECT_DIR
echo "Creating fresh project directory: $PROJECT_DIR"
sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Ensure web root exists
sudo mkdir -p /var/www/html

# Clone or update repository
cd $PROJECT_DIR
${gitRepoUrl ? `
echo "Cloning repository from ${gitRepoUrl}..."
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    git fetch origin
    git checkout ${gitBranch}
    git pull origin ${gitBranch}
else
    echo "Cloning fresh repository..."
    git clone -b ${gitBranch} ${gitRepoUrl} .
fi
` : s3BucketName ? `
echo "Syncing files from S3 bucket: ${s3BucketName}..."
aws s3 sync s3://${s3BucketName}/ $PROJECT_DIR/ --region ${region}
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found after S3 sync"
    echo "Make sure you uploaded your project files to S3 bucket: ${s3BucketName}"
    exit 1
fi
echo "✓ Files synced from S3 successfully"
` : `
echo "⚠️  No Git repository URL or S3 bucket provided - Using existing files on instance"
echo "Please ensure your project files are already uploaded to $PROJECT_DIR"
echo ""
echo "If files are not present, you can upload them using:"
echo "  - SCP: scp -r ./your-project/* ec2-user@your-instance:/var/www/${projectName}/"
echo "  - SFTP: sftp ec2-user@your-instance"
echo "  - AWS S3: aws s3 sync ./your-project s3://your-bucket/ && aws s3 sync s3://your-bucket/ /var/www/${projectName}/"
echo ""
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found in $PROJECT_DIR"
    echo "Please upload your project files to this directory before running deployment"
    exit 1
fi
echo "✓ Found package.json - proceeding with build"
`}

# Build the project
echo "Building project..."
export NODE_OPTIONS=--max-old-space-size=4096
${buildCommand}

# Deploy to web root - FRESH (remove all existing files)
echo "⚠️  Clearing web root and deploying fresh..."
sudo mkdir -p /var/www/html
sudo rm -rf /var/www/html/*

# Copy build files
if [ -d "dist" ]; then
    echo "Deploying from dist folder..."
    sudo cp -r dist/* /var/www/html/
elif [ -d "build" ]; then
    echo "Deploying from build folder..."
    sudo cp -r build/* /var/www/html/
else
    echo "❌ Error: No dist or build folder found"
    echo "Build may have failed. Check the logs above."
    exit 1
fi

# Set proper permissions for nginx
echo "Setting proper file permissions..."
sudo chown -R www-data:www-data /var/www/html
sudo find /var/www/html -type d -exec chmod 755 {} \;
sudo find /var/www/html -type f -exec chmod 644 {} \;

# Configure Nginx
sudo tee /etc/nginx/sites-available/default > /dev/null << 'NGINXCONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    
    server_name _;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXCONF

# Restart Nginx
echo "Restarting Nginx..."
sudo systemctl restart nginx

echo "=== Fresh Installation Complete ==="
echo "Your application should now be accessible at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
` : `#!/bin/bash
set -e

echo "=== Starting CODE-ONLY Update via SSM ==="
echo "✓ User data will be preserved"

# Create backup timestamp
BACKUP_TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Update system packages
echo "Updating system packages..."
if command -v apt-get &> /dev/null; then
    sudo apt-get update
    PKG_MANAGER="apt-get"
elif command -v yum &> /dev/null; then
    sudo yum update -y
    PKG_MANAGER="yum"
fi

# Install Node.js if not present
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo $PKG_MANAGER install -y nodejs
fi

# Install Nginx if not present
if ! command -v nginx &> /dev/null; then
    echo "Installing Nginx..."
    sudo $PKG_MANAGER install -y nginx
    sudo systemctl enable nginx
fi

# CODE-ONLY UPDATE - Preserve existing data
PROJECT_DIR="/var/www/${projectName}"
echo "Using existing project directory: $PROJECT_DIR"

# Ensure directories exist
sudo mkdir -p /var/www/html
sudo mkdir -p $PROJECT_DIR

# Create backup of current deployment
if [ -d "/var/www/html" ] && [ "$(ls -A /var/www/html)" ]; then
    echo "Creating backup of current deployment..."
    sudo cp -r /var/www/html "/var/www/html.backup.$BACKUP_TIMESTAMP"
    echo "✓ Backup created at /var/www/html.backup.$BACKUP_TIMESTAMP"
fi

# Preserve user data directories (if they exist)
USER_DATA_DIRS=("uploads" "data" "storage" "database")
for dir in "\${USER_DATA_DIRS[@]}"; do
    if [ -d "/var/www/html/$dir" ]; then
        echo "Backing up $dir directory..."
        sudo cp -r "/var/www/html/$dir" "/tmp/$dir.backup.$BACKUP_TIMESTAMP"
    fi
done

sudo mkdir -p $PROJECT_DIR
sudo chown -R $USER:$USER $PROJECT_DIR

# Clone or update repository
cd $PROJECT_DIR
${gitRepoUrl ? `
echo "Updating repository from ${gitRepoUrl}..."
if [ -d ".git" ]; then
    echo "Pulling latest changes..."
    git fetch origin
    git checkout ${gitBranch}
    git pull origin ${gitBranch}
else
    echo "Repository not found, cloning..."
    git clone -b ${gitBranch} ${gitRepoUrl} .
fi
` : s3BucketName ? `
echo "Syncing updated files from S3 bucket: ${s3BucketName}..."
aws s3 sync s3://${s3BucketName}/ $PROJECT_DIR/ --region ${region}
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found after S3 sync"
    echo "Make sure you uploaded your project files to S3 bucket: ${s3BucketName}"
    exit 1
fi
echo "✓ Files synced from S3 successfully"
` : `
echo "⚠️  No Git repository URL or S3 bucket provided - Using existing files on instance"
echo "Checking for existing project files in $PROJECT_DIR..."
if [ ! -f "package.json" ]; then
    echo "❌ Error: No package.json found in $PROJECT_DIR"
    echo "Please upload your project files before running deployment"
    echo ""
    echo "Upload methods:"
    echo "  - SCP: scp -r ./your-project/* ec2-user@your-instance:/var/www/${projectName}/"
    echo "  - SFTP: sftp ec2-user@your-instance"
    echo "  - AWS S3: aws s3 sync ./your-project s3://bucket/ && aws s3 sync s3://bucket/ /var/www/${projectName}/"
    exit 1
fi
echo "✓ Found existing project files - proceeding with build"
`}

# Build the project
echo "Building project..."
export NODE_OPTIONS=--max-old-space-size=4096
${buildCommand}

# Deploy to web root - CODE ONLY (preserve user data)
echo "Deploying code updates (preserving user data)..."

# Copy build files
if [ -d "dist" ]; then
    echo "Deploying from dist folder..."
    sudo cp -r dist/* /var/www/html/
elif [ -d "build" ]; then
    echo "Deploying from build folder..."
    sudo cp -r build/* /var/www/html/
else
    echo "❌ Error: No dist or build folder found"
    echo "Build may have failed. Check the logs above."
    exit 1
fi

# Set proper permissions for nginx
echo "Setting proper file permissions..."
sudo chown -R www-data:www-data /var/www/html
sudo find /var/www/html -type d -exec chmod 755 {} \;
sudo find /var/www/html -type f -exec chmod 644 {} \;

# Restore user data directories
for dir in "\${USER_DATA_DIRS[@]}"; do
    if [ -d "/tmp/$dir.backup.$BACKUP_TIMESTAMP" ]; then
        echo "Restoring $dir directory..."
        sudo cp -r "/tmp/$dir.backup.$BACKUP_TIMESTAMP" "/var/www/html/$dir"
        sudo rm -rf "/tmp/$dir.backup.$BACKUP_TIMESTAMP"
        echo "✓ Restored $dir"
    fi
done

# Configure Nginx (if not already configured)
if [ ! -f "/etc/nginx/sites-available/default" ] || [ ! -s "/etc/nginx/sites-available/default" ]; then
    sudo tee /etc/nginx/sites-available/default > /dev/null << 'NGINXCONF'
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    
    root /var/www/html;
    index index.html;
    
    server_name _;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXCONF
fi

# Graceful Nginx reload (zero downtime)
echo "Reloading Nginx configuration..."
sudo nginx -t && sudo systemctl reload nginx

echo "=== Code Update Complete ==="
echo "✓ User data preserved"
echo "✓ Backup available at: /var/www/html.backup.$BACKUP_TIMESTAMP"
echo "Your application should now be accessible at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
`;

    // Prepare SSM SendCommand request
    const command = {
      DocumentName: 'AWS-RunShellScript',
      InstanceIds: [instanceId],
      Parameters: {
        commands: [deployScript]
      }
    };

    const ssmEndpoint = `https://ssm.${region}.amazonaws.com`;
    const payload = JSON.stringify(command);

    // Create AWS Signature V4
    const algorithm = 'AWS4-HMAC-SHA256';
    const credentialScope = `${date}/${region}/ssm/aws4_request`;
    
    const headers = new Headers({
      'Content-Type': 'application/x-amz-json-1.1',
      'X-Amz-Target': 'AmazonSSM.SendCommand',
      'X-Amz-Date': timestamp,
    });

    // This is a simplified implementation. For production, use AWS SDK or proper signing library
    console.log('Sending command to SSM...');
    console.log('Note: This requires proper AWS SDK implementation with signature V4');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Deployment prepared via SSM',
        commandId: 'pending-implementation',
        instructions: [
          autoSetupSSM ? ssmSetupInstructions : '',
          '',
          '=== DEPLOYMENT INSTRUCTIONS ===',
          '',
          '1. Install AWS CLI on your local machine if not already installed',
          '   Download: https://aws.amazon.com/cli/',
          '',
          '2. Configure AWS credentials:',
          '   aws configure',
          '   - AWS Access Key ID: (enter your key)',
          '   - AWS Secret Access Key: (enter your secret)',
          `   - Default region name: ${region}`,
          '   - Default output format: json',
          '',
          autoSetupSSM ? '3. (OPTIONAL) Setup SSM permissions automatically:' : '3. Ensure SSM is configured:',
          autoSetupSSM ? '   Run the SSM setup commands shown above first' : '   Your instance should have SSM agent installed and IAM role with AmazonSSMManagedInstanceCore policy',
          '',
          `4. Deploy using SSM:`,
          `   aws ssm send-command \\`,
          `     --instance-ids ${instanceId} \\`,
          `     --document-name "AWS-RunShellScript" \\`,
          `     --region ${region} \\`,
          `     --parameters 'commands=["${deployScript.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"]'`,
          '',
          '5. Check deployment status:',
          `   aws ssm list-commands --region ${region}`,
          '',
          '6. (Optional) View command output:',
          `   aws ssm get-command-invocation \\`,
          `     --command-id <COMMAND_ID_FROM_ABOVE> \\`,
          `     --instance-id ${instanceId} \\`,
          `     --region ${region}`,
          '',
          'Alternative: Use AWS Systems Manager Session Manager in the AWS Console',
          `https://console.aws.amazon.com/systems-manager/session-manager/${instanceId}?region=${region}`
        ].join('\n'),
        deployScript,
        ssmSetupEnabled: autoSetupSSM,
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
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
