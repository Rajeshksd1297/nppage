import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { EC2Client, AuthorizeSecurityGroupIngressCommand, DescribeSecurityGroupsCommand, DescribeInstancesCommand } from "npm:@aws-sdk/client-ec2@3.709.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UnblockRequest {
  instanceId: string;
  region: string;
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

    const { instanceId, region } = await req.json() as UnblockRequest;

    console.log(`Unblocking HTTP for instance ${instanceId} in ${region}`);

    // Get AWS settings
    const { data: awsSettings, error: settingsError } = await supabaseClient
      .from('aws_settings')
      .select('*')
      .order('created_at', { desc: true })
      .limit(1)
      .maybeSingle();

    if (settingsError || !awsSettings) {
      throw new Error('AWS credentials not configured');
    }

    // Initialize EC2 Client
    const ec2Client = new EC2Client({
      region: region,
      credentials: {
        accessKeyId: awsSettings.aws_access_key_id,
        secretAccessKey: awsSettings.aws_secret_access_key,
      },
    });

    // Get instance details to find security groups
    const describeInstanceCommand = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });

    const instanceResponse = await ec2Client.send(describeInstanceCommand);
    const instance = instanceResponse.Reservations?.[0]?.Instances?.[0];

    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    if (!instance.SecurityGroups || instance.SecurityGroups.length === 0) {
      throw new Error('No security groups found for this instance');
    }

    const securityGroupId = instance.SecurityGroups[0].GroupId!;
    console.log(`Using security group: ${securityGroupId}`);

    // Check if HTTP rule already exists
    const describeCommand = new DescribeSecurityGroupsCommand({
      GroupIds: [securityGroupId],
    });
    const describeResponse = await ec2Client.send(describeCommand);
    const securityGroup = describeResponse.SecurityGroups?.[0];

    // Check for existing HTTP rule
    const hasHttpRule = securityGroup?.IpPermissions?.some(permission => 
      permission.FromPort === 80 && 
      permission.ToPort === 80 &&
      permission.IpProtocol === 'tcp'
    );

    if (hasHttpRule) {
      return new Response(
        JSON.stringify({
          success: true,
          alreadyOpen: true,
          message: 'HTTP port 80 is already open in the security group',
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    // Add HTTP inbound rule
    const authorizeCommand = new AuthorizeSecurityGroupIngressCommand({
      GroupId: securityGroupId,
      IpPermissions: [
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          IpRanges: [
            {
              CidrIp: '0.0.0.0/0',
              Description: 'Allow HTTP traffic from anywhere (added by Lovable)',
            },
          ],
        },
      ],
    });

    await ec2Client.send(authorizeCommand);

    console.log(`✓ Successfully added HTTP rule to security group ${securityGroupId}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'HTTP port 80 has been unblocked successfully',
        securityGroupId,
        rule: {
          protocol: 'tcp',
          port: 80,
          source: '0.0.0.0/0',
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Unblock HTTP error:', error);
    
    // Check for permission errors
    const permissionError = error.message?.includes('UnauthorizedOperation') || 
                           error.message?.includes('not authorized');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        needsPermissions: permissionError,
        requiredPermissions: permissionError ? [
          'ec2:DescribeSecurityGroups',
          'ec2:AuthorizeSecurityGroupIngress',
        ] : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
