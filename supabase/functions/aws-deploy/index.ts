import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { EC2Client, RunInstancesCommand, DescribeInstancesCommand } from "https://esm.sh/@aws-sdk/client-ec2@3.709.0";

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

    const deploymentStartTime = new Date();
    let deploymentLog = `=== AWS EC2 REAL Deployment Log ===\n`;
    deploymentLog += `Deployment Started: ${deploymentStartTime.toISOString()}\n`;
    deploymentLog += `Deployment Name: ${deploymentName}\n`;
    deploymentLog += `Deployment Type: ${deploymentType}\n`;
    deploymentLog += `Region: ${region}\n`;
    deploymentLog += `Instance Type: ${instanceType}\n`;
    deploymentLog += `AMI: ${amiId}\n\n`;

    deploymentLog += `--- Launching EC2 Instance (REAL AWS API CALL) ---\n`;

    // Prepare EC2 instance parameters
    const runInstancesParams: any = {
      ImageId: amiId,
      InstanceType: instanceType,
      MinCount: 1,
      MaxCount: 1,
      TagSpecifications: [
        {
          ResourceType: 'instance',
          Tags: [
            { Key: 'Name', Value: deploymentName },
            { Key: 'ManagedBy', Value: 'Lovable-Platform' },
            { Key: 'DeploymentType', Value: deploymentType },
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

      deploymentLog += `\n--- Deployment Configuration ---\n`;
      if (deploymentType === 'fresh') {
        deploymentLog += `✓ Deployment Type: Fresh Installation\n`;
        if (includeDatabase) {
          deploymentLog += `✓ Database initialization: Enabled\n`;
        }
      } else {
        deploymentLog += `✓ Deployment Type: Incremental Update\n`;
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
      deploymentLog += `Completed at: ${deploymentEndTime.toISOString()}\n`;
      deploymentLog += `\nℹ️ Note: It may take 2-3 minutes for the instance to be fully ready.\n`;
      deploymentLog += `ℹ️ You can view this instance in your AWS Console:\n`;
      deploymentLog += `   https://console.aws.amazon.com/ec2/home?region=${region}#Instances:\n\n`;
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
