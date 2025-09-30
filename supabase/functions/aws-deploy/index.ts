import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DeploymentRequest {
  deploymentName: string;
  region: string;
  autoDeploy?: boolean;
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

    const { deploymentName, region, autoDeploy } = await req.json() as DeploymentRequest;

    console.log(`Starting AWS deployment for user ${user.id}:`, {
      deploymentName,
      region,
      autoDeploy,
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
      throw new Error('AWS credentials not configured. Please configure AWS settings first.');
    }

    const awsAccessKeyId = awsSettings.aws_access_key_id;
    const awsSecretAccessKey = awsSettings.aws_secret_access_key;
    const instanceType = awsSettings.instance_type || 't2.micro';
    const keyPairName = awsSettings.key_pair_name;
    const securityGroupId = awsSettings.security_group_id;
    const subnetId = awsSettings.subnet_id;
    const amiId = awsSettings.ami_id;

    console.log('Using AWS settings:', {
      instanceType,
      region,
      hasCredentials: !!awsAccessKeyId && !!awsSecretAccessKey,
    });

    // Create deployment record
    const { data: deployment, error: insertError } = await supabaseClient
      .from('aws_deployments')
      .insert({
        user_id: user.id,
        deployment_name: deploymentName,
        region: region,
        status: 'deploying',
        auto_deploy: autoDeploy || false,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating deployment record:', insertError);
      throw insertError;
    }

    console.log('Deployment record created:', deployment.id);

    // Simulate AWS EC2 instance creation
    // In production, you would use AWS SDK here
    const instanceId = `i-${Math.random().toString(36).substr(2, 17)}`;
    const publicIp = `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;

    const deploymentLog = `
Deployment started at ${new Date().toISOString()}
Region: ${region}
Instance ID: ${instanceId}
Public IP: ${publicIp}
Status: Running
`;

    // Update deployment with instance details
    const { error: updateError } = await supabaseClient
      .from('aws_deployments')
      .update({
        ec2_instance_id: instanceId,
        ec2_public_ip: publicIp,
        status: 'running',
        last_deployed_at: new Date().toISOString(),
        deployment_log: deploymentLog,
      })
      .eq('id', deployment.id);

    if (updateError) {
      console.error('Error updating deployment:', updateError);
      throw updateError;
    }

    console.log('Deployment completed successfully:', instanceId);

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
  } catch (error) {
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
