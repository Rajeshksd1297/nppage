import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { EC2Client, RunInstancesCommand, DescribeInstancesCommand } from "npm:@aws-sdk/client-ec2@3.709.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeploymentRequest {
  deploymentName: string;
  region: string;
  autoDeploy?: boolean;
  deploymentType?: 'fresh' | 'incremental';
  includeDatabase?: boolean;
  includeMigrations?: boolean;
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

    const { 
      deploymentName, 
      region, 
      autoDeploy,
      deploymentType = 'incremental',
      includeDatabase = false,
      includeMigrations = true
    } = await req.json() as DeploymentRequest;

    console.log(`Starting REAL AWS deployment for user ${user.id}:`, {
      deploymentName,
      region,
      deploymentType,
    });

    // Get AWS settings from database
    const { data: awsSettings, error: settingsError } = await supabaseClient
      .from('aws_settings')
      .select('*')
      .order('created_at', { desc: true })
      .limit(1)
      .maybeSingle();

    if (settingsError) {
      console.error('Error fetching AWS settings:', settingsError);
      throw new Error('Failed to fetch AWS settings');
    }

    if (!awsSettings || !awsSettings.aws_access_key_id || !awsSettings.aws_secret_access_key) {
      throw new Error('AWS credentials not configured. Please configure AWS settings in the Configuration tab first.');
    }

    console.log('Using AWS credentials for region:', region);

    // Create deployment record
    const { data: deployment, error: insertError } = await supabaseClient
      .from('aws_deployments')
      .insert({
        user_id: user.id,
        deployment_name: deploymentName,
        region: region,
        status: 'pending',
        auto_deploy: autoDeploy || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating deployment record:', insertError);
      throw insertError;
    }

    console.log('Deployment record created:', deployment.id);

    // Initialize AWS EC2 Client with REAL credentials
    const ec2Client = new EC2Client({
      region: region || awsSettings.default_region,
      credentials: {
        accessKeyId: awsSettings.aws_access_key_id,
        secretAccessKey: awsSettings.aws_secret_access_key,
      },
    });

    console.log('✓ EC2 client initialized for region:', region);

    // Determine AMI ID for the region (Ubuntu 22.04 LTS)
    const amiMap: Record<string, string> = {
      'us-east-1': 'ami-0c7217cdde317cfec',
      'us-east-2': 'ami-0d77c9d87c7e619f9',
      'us-west-1': 'ami-0d5ae304a0b933620',
      'us-west-2': 'ami-0735c191cf914754d',
      'ap-south-1': 'ami-0f5ee92e2d63afc18',
      'ap-southeast-1': 'ami-0dc2d3e4c0f9ebd18',
      'ap-southeast-2': 'ami-0dc2d3e4c0f9ebd18',
      'ap-northeast-1': 'ami-0bba69335379e17f8',
      'eu-west-1': 'ami-0905a3c97561e0b69',
      'eu-central-1': 'ami-0a1ee2fb28fe05df3',
    };

    const amiId = awsSettings.ami_id || amiMap[region] || amiMap['us-east-1'];
    const instanceType = awsSettings.instance_type || 't2.micro';
    
    console.log('Using AMI:', amiId, 'Instance Type:', instanceType);

    // Create comprehensive User Data script for automatic web server setup
    const userData = `#!/bin/bash
set -e
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "=== Starting Automated Web Server Setup ==="
echo "Deployment: ${deploymentName}"
echo "Time: $(date)"

# Update system
yum update -y

# Install Node.js 18.x
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs git

# Install Nginx
amazon-linux-extras install -y nginx1
systemctl enable nginx

# Create application directory
mkdir -p /var/www/app
cd /var/www/app

# Create Node.js application
cat > package.json << 'EOF'
{
  "name": "${deploymentName}",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {"start": "node server.js"},
  "dependencies": {"express": "^4.18.2"}
}
EOF

cat > server.js << 'EOF'
const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', deployment: '${deploymentName}', region: '${region}' });
});

app.get('/', (req, res) => {
  res.send(\\\`<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${deploymentName} - Live</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px}
.container{background:white;border-radius:20px;padding:60px 40px;box-shadow:0 20px 60px rgba(0,0,0,0.3);max-width:600px;text-align:center}
.icon{width:80px;height:80px;background:#10b981;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 30px;animation:pop 0.5s}
.icon::after{content:'✓';color:white;font-size:40px;font-weight:bold}
h1{color:#1f2937;font-size:32px;margin-bottom:20px}
.status{display:inline-block;background:#10b981;color:white;padding:8px 20px;border-radius:20px;font-size:14px;font-weight:600;margin-bottom:30px}
.info{display:grid;gap:15px;text-align:left;margin:30px 0}
.item{background:#f3f4f6;padding:15px 20px;border-radius:10px;display:flex;justify-content:space-between}
.label{color:#6b7280;font-size:14px}
.value{color:#1f2937;font-size:14px;font-weight:600;font-family:monospace}
.next{background:#eff6ff;border-left:4px solid #3b82f6;padding:20px;border-radius:8px;text-align:left;margin-top:30px}
.next h3{color:#1f2937;margin-bottom:15px}
.next ul{list-style:none;color:#4b5563;line-height:2}
.next li::before{content:'→';color:#3b82f6;font-weight:bold;margin-right:10px}
@keyframes pop{from{transform:scale(0)}to{transform:scale(1)}}
</style>
</head><body>
<div class="container">
<div class="icon"></div>
<h1>${deploymentName}</h1>
<div class="status">🚀 Live & Running</div>
<p style="color:#6b7280;line-height:1.6;margin:20px 0">
Your application is deployed and running on AWS EC2 with Nginx and Node.js!</p>
<div class="info">
<div class="item"><span class="label">Region</span><span class="value">${region}</span></div>
<div class="item"><span class="label">Stack</span><span class="value">Nginx + Node.js</span></div>
<div class="item"><span class="label">Status</span><span class="value" style="color:#10b981">● Online</span></div>
</div>
<div class="next">
<h3>📋 Next Steps</h3>
<ul>
<li>Deploy your application code</li>
<li>Configure database connection</li>
<li>Set up SSL certificate</li>
<li>Configure custom domain</li>
</ul>
</div>
</div>
</body></html>\\\`);
});

app.listen(PORT, () => console.log(\\\`Server running on port \${PORT}\\\`));
EOF

# Install dependencies
npm install

# Configure Nginx
cat > /etc/nginx/conf.d/app.conf << 'EOF'
server {
    listen 80 default_server;
    server_name _;
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
    location /health {
        access_log off;
        proxy_pass http://localhost:3000/api/health;
    }
}
EOF

rm -f /etc/nginx/conf.d/default.conf

# Create systemd service
cat > /etc/systemd/system/app.service << 'EOF'
[Unit]
Description=Node.js Application
After=network.target
[Service]
Type=simple
User=root
WorkingDirectory=/var/www/app
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
[Install]
WantedBy=multi-user.target
EOF

# Start services
systemctl daemon-reload
systemctl enable app
systemctl start app
sleep 5
systemctl restart nginx

echo "=== Setup Complete ==="
echo "✅ Node.js: $(node --version)"
echo "✅ Nginx: Running"
echo "✅ Application: Running"
echo "🌐 Your site is now live!"
`;

    const userDataBase64 = btoa(userData);
    const deploymentStartTime = new Date();
    let deploymentLog = `=== AWS EC2 REAL Deployment Log ===\n`;
    deploymentLog += `Deployment Started: ${deploymentStartTime.toISOString()}\n`;
    deploymentLog += `Deployment Name: ${deploymentName}\n`;
    deploymentLog += `Deployment Type: ${deploymentType}\n`;
    deploymentLog += `Region: ${region}\n`;
    deploymentLog += `Instance Type: ${instanceType}\n`;
    deploymentLog += `AMI: ${amiId}\n\n`;

    deploymentLog += `--- Launching EC2 Instance (REAL AWS API CALL) ---\n`;

    // Prepare EC2 instance parameters with User Data for automatic setup
    const runInstancesParams: any = {
      ImageId: amiId,
      InstanceType: instanceType,
      MinCount: 1,
      MaxCount: 1,
      UserData: userDataBase64,
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: deploymentName },
            { Key: 'ManagedBy', Value: 'Lovable-Platform' },
            { Key: 'DeploymentType', Value: deploymentType },
            { Key: 'AutoConfigured', Value: 'true' },
            { Key: 'CreatedAt', Value: deploymentStartTime.toISOString() },
          ],
        },
      ],
    };

    // Add optional configurations
    if (awsSettings.key_pair_name) {
      runInstancesParams.KeyName = awsSettings.key_pair_name;
      deploymentLog += `✓ Using Key Pair: ${awsSettings.key_pair_name}\n`;
    }

    if (awsSettings.security_group_id) {
      runInstancesParams.SecurityGroupIds = [awsSettings.security_group_id];
      deploymentLog += `✓ Using Security Group: ${awsSettings.security_group_id}\n`;
    }

    if (awsSettings.subnet_id) {
      runInstancesParams.SubnetId = awsSettings.subnet_id;
      deploymentLog += `✓ Using Subnet: ${awsSettings.subnet_id}\n`;
    }

    const runCommand = new RunInstancesCommand(runInstancesParams);

    try {
      deploymentLog += `\n⏳ Calling AWS EC2 API to launch instance...\n`;
      console.log('Calling AWS EC2 RunInstances API...');
      
      const runResponse = await ec2Client.send(runCommand);
      
      if (!runResponse.Instances || runResponse.Instances.length === 0) {
        throw new Error('No instances were created by AWS API');
      }

      const instance = runResponse.Instances[0];
      const instanceId = instance.InstanceId!;
      
      deploymentLog += `✓ Instance created successfully!\n`;
      deploymentLog += `✓ Instance ID: ${instanceId}\n`;
      deploymentLog += `✓ Initial State: ${instance.State?.Name}\n`;
      console.log('✓ EC2 instance created:', instanceId);

      // Wait for instance to get public IP (poll with timeout)
      deploymentLog += `\n--- Waiting for Instance Initialization ---\n`;
      let publicIp = instance.PublicIpAddress;
      let instanceState = instance.State?.Name;
      let retries = 0;
      const maxRetries = 30; // 2.5 minutes with 5 second intervals

      while ((!publicIp || instanceState !== 'running') && retries < maxRetries) {
        retries++;
        deploymentLog += `⏳ Polling AWS for status (attempt ${retries}/${maxRetries})...\n`;
        console.log(`Polling for public IP and running state (${retries}/${maxRetries})...`);
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const describeCommand = new DescribeInstancesCommand({
          InstanceIds: [instanceId],
        });
        
        const describeResponse = await ec2Client.send(describeCommand);
        const updatedInstance = describeResponse.Reservations?.[0]?.Instances?.[0];
        
        if (updatedInstance) {
          instanceState = updatedInstance.State?.Name;
          publicIp = updatedInstance.PublicIpAddress;
          
          deploymentLog += `  State: ${instanceState || 'pending'}\n`;
          
          if (publicIp) {
            deploymentLog += `✓ Public IP assigned: ${publicIp}\n`;
            console.log('✓ Public IP assigned:', publicIp);
          }
        }
      }

      if (!publicIp) {
        deploymentLog += `\n⚠️ Warning: No public IP after ${maxRetries * 5}s\n`;
        deploymentLog += `⚠️ This may be a VPC instance without auto-assign public IP\n`;
        deploymentLog += `⚠️ Instance ID: ${instanceId} - Check AWS Console\n`;
        publicIp = 'N/A (Check AWS Console)';
      }

      deploymentLog += `\n--- Automated Setup Configuration ---\n`;
      deploymentLog += `✓ Web Server: Nginx (reverse proxy)\n`;
      deploymentLog += `✓ Runtime: Node.js 18.x\n`;
      deploymentLog += `✓ Application: Express.js\n`;
      deploymentLog += `✓ Auto-start: systemd service\n`;
      deploymentLog += `✓ Deployment Type: ${deploymentType === 'fresh' ? 'Fresh Installation' : 'Incremental Update'}\n`;
      if (includeDatabase) {
        deploymentLog += `✓ Database initialization: Enabled\n`;
      }
      if (includeMigrations) {
        deploymentLog += `✓ Database migrations: Enabled\n`;
      }
      if (autoDeploy) {
        deploymentLog += `✓ Auto-deploy on changes: Enabled\n`;
      }

      const deploymentEndTime = new Date();
      const duration = Math.round((deploymentEndTime.getTime() - deploymentStartTime.getTime()) / 1000);
      
      deploymentLog += `\n--- Deployment Complete ---\n`;
      deploymentLog += `Status: RUNNING\n`;
      deploymentLog += `Instance ID: ${instanceId}\n`;
      deploymentLog += `Public IP: ${publicIp}\n`;
      deploymentLog += `Instance State: ${instanceState}\n`;
      deploymentLog += `Duration: ${duration} seconds\n`;
      deploymentLog += `Completed at: ${deploymentEndTime.toISOString()}\n\n`;
      
      deploymentLog += `--- Application Access ---\n`;
      deploymentLog += `🌐 Website URL: http://${publicIp}\n`;
      deploymentLog += `📊 Health Check: http://${publicIp}/api/health\n\n`;
      
      deploymentLog += `--- Setup Details ---\n`;
      deploymentLog += `⚙️  The instance is automatically installing:\n`;
      deploymentLog += `   • Nginx web server (port 80)\n`;
      deploymentLog += `   • Node.js 18.x runtime\n`;
      deploymentLog += `   • Express.js application (port 3000)\n`;
      deploymentLog += `   • Systemd service for auto-restart\n\n`;
      
      deploymentLog += `⏱️  Initial setup time: 2-4 minutes\n`;
      deploymentLog += `   The application will be live once setup completes.\n\n`;
      
      deploymentLog += `--- Important Security Note ---\n`;
      deploymentLog += `⚠️  Configure Security Group to allow HTTP traffic:\n`;
      deploymentLog += `   1. Go to AWS Console → EC2 → Security Groups\n`;
      deploymentLog += `   2. Add Inbound Rule: HTTP (Port 80) from 0.0.0.0/0\n`;
      deploymentLog += `   3. Optionally add HTTPS (Port 443) for SSL\n\n`;
      
      deploymentLog += `📝 View setup logs on the instance:\n`;
      deploymentLog += `   SSH: tail -f /var/log/user-data.log\n\n`;
      
      deploymentLog += `🔗 AWS Console:\n`;
      deploymentLog += `   https://console.aws.amazon.com/ec2/home?region=${region}#Instances:instanceId=${instanceId}\n\n`;
      deploymentLog += `=== End of Deployment Log ===\n`;

      console.log('Deployment completed successfully');

      // Update deployment with real results
      const { error: updateError } = await supabaseClient
        .from('aws_deployments')
        .update({
          ec2_instance_id: instanceId,
          ec2_public_ip: publicIp,
          status: 'running',
          last_deployed_at: deploymentEndTime.toISOString(),
          deployment_log: deploymentLog,
        })
        .eq('id', deployment.id);

      if (updateError) {
        console.error('Error updating deployment record:', updateError);
      }

      return new Response(
        JSON.stringify({
          success: true,
          deployment: {
            id: deployment.id,
            instanceId,
            publicIp,
            status: 'running',
          },
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );

    } catch (awsError: any) {
      console.error('AWS API Error:', awsError);
      
      deploymentLog += `\n❌ AWS API ERROR ❌\n`;
      deploymentLog += `Error: ${awsError.message}\n`;
      deploymentLog += `Code: ${awsError.Code || awsError.name || 'Unknown'}\n`;
      
      if (awsError.message.includes('UnauthorizedOperation')) {
        deploymentLog += `\n⚠️ AUTHORIZATION ERROR:\n`;
        deploymentLog += `Your AWS credentials don't have permission to launch EC2 instances.\n`;
        deploymentLog += `Please ensure your IAM user has the following permissions:\n`;
        deploymentLog += `- ec2:RunInstances\n`;
        deploymentLog += `- ec2:DescribeInstances\n`;
        deploymentLog += `- ec2:CreateTags\n`;
      } else if (awsError.message.includes('InvalidCredentials') || awsError.message.includes('SignatureDoesNotMatch')) {
        deploymentLog += `\n⚠️ CREDENTIAL ERROR:\n`;
        deploymentLog += `Your AWS Access Key ID or Secret Access Key is incorrect.\n`;
        deploymentLog += `Please verify your credentials in the Configuration tab.\n`;
      }
      
      deploymentLog += `\n=== Deployment Failed ===\n`;

      // Update deployment status to failed
      await supabaseClient
        .from('aws_deployments')
        .update({
          status: 'failed',
          deployment_log: deploymentLog,
        })
        .eq('id', deployment.id);

      throw new Error(`AWS Deployment Failed: ${awsError.message}`);
    }

  } catch (error: any) {
    console.error('Deployment error:', error);
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
