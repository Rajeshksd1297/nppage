import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { EC2Client, DescribeInstancesCommand, DescribeInstanceStatusCommand } from "npm:@aws-sdk/client-ec2@3.709.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstanceStatusRequest {
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

    const { instanceId, region } = await req.json() as InstanceStatusRequest;

    console.log(`Checking status for instance ${instanceId} in ${region}`);

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

    // Get detailed instance information
    const describeCommand = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });

    const describeResponse = await ec2Client.send(describeCommand);
    const instance = describeResponse.Reservations?.[0]?.Instances?.[0];

    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    // Get instance status (system status checks)
    let statusChecks = null;
    try {
      const statusCommand = new DescribeInstanceStatusCommand({
        InstanceIds: [instanceId],
        IncludeAllInstances: true,
      });
      const statusResponse = await ec2Client.send(statusCommand);
      statusChecks = statusResponse.InstanceStatuses?.[0];
    } catch (error) {
      console.error('Error fetching instance status:', error);
    }

    // Compile comprehensive status
    const status = {
      instanceId: instanceId,
      state: instance.State?.Name,
      stateReason: instance.StateReason?.Message,
      publicIp: instance.PublicIpAddress,
      privateIp: instance.PrivateIpAddress,
      instanceType: instance.InstanceType,
      launchTime: instance.LaunchTime,
      availabilityZone: instance.Placement?.AvailabilityZone,
      
      // Security group info
      securityGroups: instance.SecurityGroups?.map(sg => ({
        id: sg.GroupId,
        name: sg.GroupName,
      })),
      
      // Network info
      vpcId: instance.VpcId,
      subnetId: instance.SubnetId,
      
      // Status checks
      systemStatus: statusChecks?.SystemStatus?.Status,
      instanceStatus: statusChecks?.InstanceStatus?.Status,
      statusDetails: statusChecks?.SystemStatus?.Details?.map(d => ({
        name: d.Name,
        status: d.Status,
      })),
      
      // Tags
      tags: instance.Tags?.reduce((acc, tag) => {
        if (tag.Key && tag.Value) {
          acc[tag.Key] = tag.Value;
        }
        return acc;
      }, {} as Record<string, string>),
      
      // Monitoring
      monitoring: instance.Monitoring?.State,
      
      // Platform details
      platform: instance.Platform,
      architecture: instance.Architecture,
      
      // IAM permissions check
      permissionsUsed: [
        'ec2:DescribeInstances',
        'ec2:DescribeInstanceStatus',
      ],
      
      // Diagnostics
      diagnostics: {
        hasPublicIp: !!instance.PublicIpAddress,
        isRunning: instance.State?.Name === 'running',
        hasSecurityGroups: (instance.SecurityGroups?.length || 0) > 0,
        systemChecksOk: statusChecks?.SystemStatus?.Status === 'ok',
        instanceChecksOk: statusChecks?.InstanceStatus?.Status === 'ok',
      },
    };

    // Check if HTTP port is accessible - try multiple endpoints
    let httpAccessible = false;
    let httpCheckDetails = { tested: false, endpoint: '', error: '', status: 0 };
    
    if (instance.PublicIpAddress) {
      const endpoints = ['/', '/api/health', '/api/setup-status'];
      
      for (const endpoint of endpoints) {
        try {
          console.log(`Testing HTTP accessibility: http://${instance.PublicIpAddress}${endpoint}`);
          const httpCheck = await fetch(`http://${instance.PublicIpAddress}${endpoint}`, {
            method: 'GET',
            signal: AbortSignal.timeout(8000),
          });
          
          httpCheckDetails = {
            tested: true,
            endpoint: endpoint,
            error: '',
            status: httpCheck.status,
          };
          
          // Consider it accessible if we get ANY response (even 404)
          // This means the web server is running
          if (httpCheck.status > 0) {
            httpAccessible = true;
            console.log(`✓ HTTP accessible on ${endpoint} (status: ${httpCheck.status})`);
            break;
          }
        } catch (error: any) {
          httpCheckDetails = {
            tested: true,
            endpoint: endpoint,
            error: error.message,
            status: 0,
          };
          console.log(`✗ HTTP check failed for ${endpoint}:`, error.message);
          // Continue to next endpoint
        }
      }
    }

    const response = {
      success: true,
      status,
      httpAccessible,
      httpCheckDetails,
      recommendations: generateRecommendations(status, httpAccessible, httpCheckDetails),
    };

    return new Response(
      JSON.stringify(response),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Status check error:', error);
    
    // Check for permission errors
    const permissionError = error.message?.includes('UnauthorizedOperation') || 
                           error.message?.includes('not authorized');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        needsPermissions: permissionError,
        requiredPermissions: permissionError ? [
          'ec2:DescribeInstances',
          'ec2:DescribeInstanceStatus',
        ] : undefined,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

function generateRecommendations(status: any, httpAccessible: boolean, httpCheckDetails: any): string[] {
  const recommendations: string[] = [];

  if (status.state !== 'running') {
    recommendations.push(`Instance is in '${status.state}' state. It needs to be 'running' to serve traffic.`);
  }

  if (!status.diagnostics.hasPublicIp) {
    recommendations.push('Instance has no public IP address. Check if auto-assign public IP is enabled in the subnet.');
  }

  if (status.systemStatus && status.systemStatus !== 'ok') {
    recommendations.push(`System status checks are '${status.systemStatus}'. AWS may be experiencing issues.`);
  }

  if (status.instanceStatus && status.instanceStatus !== 'ok') {
    recommendations.push(`Instance status checks are '${status.instanceStatus}'. The instance may need to be restarted.`);
  }

  if (!httpAccessible && status.diagnostics.isRunning && status.diagnostics.hasPublicIp) {
    recommendations.push('❌ HTTP port 80 is NOT accessible. Root cause analysis:');
    
    if (httpCheckDetails.tested) {
      if (httpCheckDetails.error.includes('ConnectTimeout') || httpCheckDetails.error.includes('timeout')) {
        recommendations.push('  🔴 CONNECTION TIMEOUT - Server is not responding at all');
        recommendations.push('  → Security group inbound rules may be blocking port 80');
        recommendations.push('  → Firewall on the instance (firewalld) may be blocking traffic');
        recommendations.push('  → Network ACLs may be restricting traffic');
      } else if (httpCheckDetails.error.includes('ConnectionRefused')) {
        recommendations.push('  🔴 CONNECTION REFUSED - No service listening on port 80');
        recommendations.push('  → Nginx web server is not running');
        recommendations.push('  → Application setup failed - check: sudo systemctl status nginx');
      } else if (httpCheckDetails.error.includes('NetworkError')) {
        recommendations.push('  🔴 NETWORK ERROR - Cannot reach the instance');
        recommendations.push('  → Instance may not have internet connectivity');
        recommendations.push('  → VPC routing may be misconfigured');
      } else {
        recommendations.push(`  🔴 ERROR: ${httpCheckDetails.error}`);
      }
    }
    
    recommendations.push('');
    recommendations.push('🔧 Troubleshooting steps:');
    recommendations.push('  1. Verify Security Group has HTTP (port 80) rule with source 0.0.0.0/0');
    recommendations.push('  2. SSH to instance and check: sudo systemctl status nginx');
    recommendations.push('  3. Check setup logs: sudo tail -100 /var/log/user-data.log');
    recommendations.push('  4. Test locally on instance: curl http://localhost');
    recommendations.push('  5. Check firewall: sudo firewall-cmd --list-all');
  }

  if (status.monitoring === 'disabled') {
    recommendations.push('💡 CloudWatch detailed monitoring is disabled. Enable it for better insights.');
  }

  if (recommendations.length === 0 && httpAccessible) {
    recommendations.push('✅ All checks passed! Instance is healthy and serving HTTP traffic.');
  }

  return recommendations;
}
