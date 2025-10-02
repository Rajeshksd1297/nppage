import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { EC2Client, DescribeInstancesCommand } from "npm:@aws-sdk/client-ec2@3.511.0";
import { SSMClient, SendCommandCommand, GetCommandInvocationCommand } from "npm:@aws-sdk/client-ssm@3.511.0";
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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const { instanceId, region } = await req.json();

    // Get AWS credentials
    const { data: settings } = await supabaseClient
      .from('aws_settings')
      .select('*')
      .single();

    if (!settings?.aws_access_key_id || !settings?.aws_secret_access_key) {
      throw new Error('AWS credentials not configured');
    }

    const ec2Client = new EC2Client({
      region: region || settings.default_region,
      credentials: {
        accessKeyId: settings.aws_access_key_id,
        secretAccessKey: settings.aws_secret_access_key,
      },
    });

    const ssmClient = new SSMClient({
      region: region || settings.default_region,
      credentials: {
        accessKeyId: settings.aws_access_key_id,
        secretAccessKey: settings.aws_secret_access_key,
      },
    });

    // Get basic instance info
    const describeCommand = new DescribeInstancesCommand({
      InstanceIds: [instanceId],
    });
    const instanceData = await ec2Client.send(describeCommand);
    const instance = instanceData.Reservations?.[0]?.Instances?.[0];

    if (!instance) {
      throw new Error('Instance not found');
    }

    // Comprehensive system information script
    const commands = [
      '#!/bin/bash',
      'echo "=== DISK USAGE ==="',
      'df -h',
      'echo ""',
      'echo "=== DISK USAGE INODES ==="',
      'df -i',
      'echo ""',
      'echo "=== DIRECTORY SIZES ==="',
      'du -sh /var/www/html/* 2>/dev/null || echo "N/A"',
      'du -sh /etc/nginx/* 2>/dev/null || echo "N/A"',
      'du -sh /var/log/nginx/* 2>/dev/null || echo "N/A"',
      'echo ""',
      'echo "=== FILE TREE ==="',
      'tree -L 3 -h /var/www/html 2>/dev/null || find /var/www/html -maxdepth 3 -type f -exec ls -lh {} \\;',
      'echo ""',
      'echo "=== SYSTEM INFO ==="',
      'uname -a',
      'cat /etc/os-release | grep PRETTY_NAME',
      'echo ""',
      'echo "=== CPU INFO ==="',
      'lscpu | grep -E "Model name|CPU\\(s\\)|Thread|Core|Socket"',
      'echo ""',
      'echo "=== MEMORY INFO ==="',
      'free -h',
      'echo ""',
      'echo "=== NETWORK INFO ==="',
      'ip addr show',
      'echo ""',
      'echo "=== NGINX STATUS ==="',
      'systemctl status nginx --no-pager',
      'echo ""',
      'echo "=== NGINX CONFIG TEST ==="',
      'nginx -t 2>&1',
      'echo ""',
      'echo "=== RUNNING PROCESSES ==="',
      'ps aux --sort=-%mem | head -20',
      'echo ""',
      'echo "=== INSTALLED PACKAGES ==="',
      'rpm -qa | grep -E "nginx|amazon-linux" | sort',
      'echo ""',
      'echo "=== FILE COUNTS ==="',
      'echo "HTML files: $(find /var/www/html -name "*.html" 2>/dev/null | wc -l)"',
      'echo "JS files: $(find /var/www/html -name "*.js" 2>/dev/null | wc -l)"',
      'echo "CSS files: $(find /var/www/html -name "*.css" 2>/dev/null | wc -l)"',
      'echo "Image files: $(find /var/www/html -type f \\( -name "*.jpg" -o -name "*.png" -o -name "*.gif" -o -name "*.svg" \\) 2>/dev/null | wc -l)"',
      'echo ""',
      'echo "=== RECENT LOGS ==="',
      'tail -20 /var/log/nginx/access.log 2>/dev/null || echo "No access logs"',
      'echo ""',
      'tail -20 /var/log/nginx/error.log 2>/dev/null || echo "No error logs"',
    ].join('\n');

    // Send command via SSM
    const sendCommand = new SendCommandCommand({
      InstanceIds: [instanceId],
      DocumentName: 'AWS-RunShellScript',
      Parameters: {
        commands: [commands],
      },
    });

    const commandResponse = await ssmClient.send(sendCommand);
    const commandId = commandResponse.Command?.CommandId;

    if (!commandId) {
      throw new Error('Failed to send SSM command');
    }

    // Wait for command to complete
    let attempts = 0;
    let output = '';
    
    while (attempts < 30) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const getCommand = new GetCommandInvocationCommand({
        CommandId: commandId,
        InstanceId: instanceId,
      });

      try {
        const result = await ssmClient.send(getCommand);
        
        if (result.Status === 'Success') {
          output = result.StandardOutputContent || '';
          break;
        } else if (result.Status === 'Failed' || result.Status === 'Cancelled' || result.Status === 'TimedOut') {
          throw new Error(`Command failed with status: ${result.Status}`);
        }
      } catch (error: any) {
        if (error.name !== 'InvocationDoesNotExist') {
          throw error;
        }
      }
      
      attempts++;
    }

    if (!output) {
      throw new Error('Command timed out or produced no output');
    }

    // Parse the output into structured data
    const parsedData = parseSystemOutput(output);

    return new Response(
      JSON.stringify({
        success: true,
        instanceInfo: {
          instanceId: instance.InstanceId,
          instanceType: instance.InstanceType,
          state: instance.State?.Name,
          publicIp: instance.PublicIpAddress,
          privateIp: instance.PrivateIpAddress,
          launchTime: instance.LaunchTime,
          availabilityZone: instance.Placement?.AvailabilityZone,
          platform: instance.PlatformDetails,
        },
        systemDetails: parsedData,
        rawOutput: output,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error fetching instance details:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function parseSystemOutput(output: string) {
  const sections: any = {};
  
  // Parse disk usage
  const diskMatch = output.match(/=== DISK USAGE ===([\s\S]*?)(?====|$)/);
  if (diskMatch) {
    sections.diskUsage = diskMatch[1].trim();
  }

  // Parse directory sizes
  const dirSizeMatch = output.match(/=== DIRECTORY SIZES ===([\s\S]*?)(?====|$)/);
  if (dirSizeMatch) {
    sections.directorySizes = dirSizeMatch[1].trim();
  }

  // Parse file tree
  const fileTreeMatch = output.match(/=== FILE TREE ===([\s\S]*?)(?====|$)/);
  if (fileTreeMatch) {
    sections.fileTree = fileTreeMatch[1].trim();
  }

  // Parse system info
  const sysInfoMatch = output.match(/=== SYSTEM INFO ===([\s\S]*?)(?====|$)/);
  if (sysInfoMatch) {
    sections.systemInfo = sysInfoMatch[1].trim();
  }

  // Parse CPU info
  const cpuMatch = output.match(/=== CPU INFO ===([\s\S]*?)(?====|$)/);
  if (cpuMatch) {
    sections.cpuInfo = cpuMatch[1].trim();
  }

  // Parse memory info
  const memMatch = output.match(/=== MEMORY INFO ===([\s\S]*?)(?====|$)/);
  if (memMatch) {
    sections.memoryInfo = memMatch[1].trim();
  }

  // Parse network info
  const netMatch = output.match(/=== NETWORK INFO ===([\s\S]*?)(?====|$)/);
  if (netMatch) {
    sections.networkInfo = netMatch[1].trim();
  }

  // Parse nginx status
  const nginxMatch = output.match(/=== NGINX STATUS ===([\s\S]*?)(?====|$)/);
  if (nginxMatch) {
    sections.nginxStatus = nginxMatch[1].trim();
  }

  // Parse processes
  const procMatch = output.match(/=== RUNNING PROCESSES ===([\s\S]*?)(?====|$)/);
  if (procMatch) {
    sections.processes = procMatch[1].trim();
  }

  // Parse file counts
  const fileCountMatch = output.match(/=== FILE COUNTS ===([\s\S]*?)(?====|$)/);
  if (fileCountMatch) {
    sections.fileCounts = fileCountMatch[1].trim();
  }

  // Parse logs
  const logsMatch = output.match(/=== RECENT LOGS ===([\s\S]*?)$/);
  if (logsMatch) {
    sections.recentLogs = logsMatch[1].trim();
  }

  return sections;
}
