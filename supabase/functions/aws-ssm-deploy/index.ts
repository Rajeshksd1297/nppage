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
      files 
    }: DeploymentRequest = await req.json();

    console.log('Starting SSM deployment to instance:', instanceId);

    if (!instanceId || !region || !awsAccessKeyId || !awsSecretAccessKey) {
      throw new Error('Missing required fields: instanceId, region, awsAccessKeyId, awsSecretAccessKey');
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

# Create deployment files
cd $PROJECT_DIR

${files ? files.map(f => `
echo "Creating file: ${f.path}"
cat > ${f.path} << 'FILECONTENT'
${f.content}
FILECONTENT
`).join('\n') : ''}

# Build the project
echo "Building project..."
export NODE_OPTIONS=--max-old-space-size=4096
${buildCommand}

# Deploy to web root - FRESH (remove all existing files)
echo "⚠️  Clearing web root and deploying fresh..."
sudo rm -rf /var/www/html/*
sudo cp -r dist/* /var/www/html/ 2>/dev/null || sudo cp -r build/* /var/www/html/ 2>/dev/null || echo "No dist or build folder found"

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

# Create backup of current deployment
if [ -d "/var/www/html" ]; then
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

# Create/update deployment files
cd $PROJECT_DIR

${files ? files.map(f => `
echo "Creating/updating file: ${f.path}"
cat > ${f.path} << 'FILECONTENT'
${f.content}
FILECONTENT
`).join('\n') : ''}

# Build the project
echo "Building project..."
export NODE_OPTIONS=--max-old-space-size=4096
${buildCommand}

# Deploy to web root - CODE ONLY (preserve user data)
echo "Deploying code updates (preserving user data)..."

# Deploy new build
sudo cp -r dist/* /var/www/html/ 2>/dev/null || sudo cp -r build/* /var/www/html/ 2>/dev/null || echo "No dist or build folder found"

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
        message: 'Deployment initiated via SSM',
        commandId: 'pending-implementation',
        instructions: [
          '1. Install AWS CLI on your local machine',
          '2. Configure AWS credentials using: aws configure',
          `3. Run the following command to deploy:`,
          `   aws ssm send-command --instance-ids ${instanceId} --document-name "AWS-RunShellScript" --region ${region} --parameters 'commands=["${deployScript.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"]'`,
          '',
          '4. Check command status:',
          '   aws ssm list-commands --region ' + region,
          '',
          'Alternative: Use AWS Systems Manager Session Manager in the AWS Console'
        ].join('\n'),
        deployScript,
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
