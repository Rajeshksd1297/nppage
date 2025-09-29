import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityRequest {
  action: 'monitor' | 'analyze' | 'alert' | 'update_settings';
  severity?: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function monitorSecurityEvents() {
  try {
    // Get recent security logs
    const { data: recentLogs, error: logsError } = await supabase
      .from('security_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (logsError) {
      throw logsError;
    }

    // Analyze patterns and detect threats
    const analysis = analyzeSecurityPatterns(recentLogs || []);
    const threats = detectThreats(recentLogs || []);
    
    const report = {
      timestamp: new Date().toISOString(),
      totalEvents: recentLogs?.length || 0,
      severityBreakdown: {
        critical: recentLogs?.filter(log => log.severity === 'critical').length || 0,
        high: recentLogs?.filter(log => log.severity === 'high').length || 0,
        medium: recentLogs?.filter(log => log.severity === 'medium').length || 0,
        low: recentLogs?.filter(log => log.severity === 'low').length || 0,
      },
      threats,
      analysis,
      recommendations: generateRecommendations(analysis, threats),
      security_score: calculateSecurityScore(recentLogs || [])
    };

    // Send alerts if critical threats detected
    if (threats.length > 0) {
      await sendSecurityAlert(threats, report);
    }

    return report;

  } catch (error) {
    console.error('Security monitoring failed:', error);
    throw error;
  }
}

function analyzeSecurityPatterns(logs: any[]) {
  const patterns = {
    failedLogins: 0,
    suspiciousActivity: 0,
    ipAddressPatterns: {} as Record<string, number>,
    bruteForceAttempts: [] as Array<{ip_address: string, attempts: number, timespan: any}>
  };

  const ipCounts: Record<string, number> = {};

  logs.forEach(log => {
    if (log.event_type === 'login_failed') {
      patterns.failedLogins++;
    }
    
    if (log.severity === 'high' || log.severity === 'critical') {
      patterns.suspiciousActivity++;
    }

    if (log.ip_address) {
      const ip = log.ip_address as string;
      patterns.ipAddressPatterns[ip] = (patterns.ipAddressPatterns[ip] || 0) + 1;
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    }
  });

  // Detect brute force attempts
  Object.entries(ipCounts).forEach(([ip, count]) => {
    if ((count as number) >= 5) {
      patterns.bruteForceAttempts.push({
        ip_address: ip,
        attempts: count as number,
        timespan: {
          start: logs.find(l => l.ip_address === ip)?.created_at,
          end: logs.filter(l => l.ip_address === ip).slice(-1)[0]?.created_at
        }
      });
    }
  });

  return patterns;
}

function detectThreats(logs: any[]) {
  const threats = [];

  // Analyze recent logs for suspicious patterns
  const suspiciousLogs = logs.filter(log => 
    log.severity === 'high' || log.severity === 'critical'
  );

  const ipCounts: Record<string, number> = {};
  logs.forEach(log => {
    if (log.ip_address) {
      const ip = log.ip_address as string;
      ipCounts[ip] = (ipCounts[ip] || 0) + 1;
    }
  });

  // Check for brute force attacks
  Object.entries(ipCounts).forEach(([ip, count]) => {
    if ((count as number) > 10) {
      threats.push({
        type: 'brute_force_attack',
        severity: 'high',
        description: `Multiple failed attempts from IP ${ip}`,
        ip_address: ip,
        attempts: count,
        first_seen: logs.find(l => l.ip_address === ip)?.created_at
      });
    }
  });

  // Check for suspicious activities
  if (suspiciousLogs.length > 5) {
    threats.push({
      type: 'suspicious_activity_spike',
      severity: 'medium',
      description: `Unusual increase in security events: ${suspiciousLogs.length} high-severity events`,
      event_count: suspiciousLogs.length,
      first_seen: suspiciousLogs[0]?.created_at
    });
  }

  return threats;
}

function generateRecommendations(analysis: any, threats: any[]) {
  const recommendations = [];

  if (analysis.failedLogins > 10) {
    recommendations.push({
      priority: 'high',
      action: 'Review authentication settings',
      description: 'Multiple failed login attempts detected - consider implementing additional security measures'
    });
  }

  if (threats.some((t: any) => t.type === 'brute_force_attack')) {
    recommendations.push({
      priority: 'high',
      action: 'Implement rate limiting',
      description: 'Brute force attempts detected - consider implementing CAPTCHA or rate limiting'
    });
  }

  if (analysis.suspiciousActivity > 0) {
    recommendations.push({
      priority: 'medium',
      action: 'Review security logs',
      description: 'Suspicious activity detected - review detailed logs for potential threats'
    });
  }

  return recommendations;
}

function calculateSecurityScore(logs: any[]): number {
  let score = 100;
  
  const criticalEvents = logs.filter(log => log.severity === 'critical').length;
  const highEvents = logs.filter(log => log.severity === 'high').length;
  const mediumEvents = logs.filter(log => log.severity === 'medium').length;
  
  score -= (criticalEvents * 10);
  score -= (highEvents * 5);
  score -= (mediumEvents * 2);
  
  return Math.max(0, Math.min(100, score));
}

async function sendSecurityAlert(threats: any[], report: any) {
  try {
    // Check if security alerts are enabled
    const { data: settings } = await supabase
      .from('security_settings')
      .select('security_alerts, alert_email')
      .maybeSingle();

    if (!settings?.security_alerts || !settings?.alert_email) {
      console.log('Security alerts disabled or no email configured');
      return { success: false, reason: 'alerts_disabled' };
    }

    // Only send alerts for high severity threats
    const highSeverityThreats = threats.filter(threat => 
      threat.severity === 'high' || threat.severity === 'critical'
    );

    if (highSeverityThreats.length === 0) {
      console.log('No high severity threats to report');
      return { success: false, reason: 'no_high_severity_threats' };
    }

    // Log the alert (in production, you would integrate with email service)
    await supabase
      .from('security_logs')
      .insert({
        event_type: 'security_alert_triggered',
        severity: 'medium',
        description: `Security alert triggered for ${highSeverityThreats.length} high priority threats`,
        metadata: {
          alert_email: settings.alert_email,
          threats_count: highSeverityThreats.length,
          threats: highSeverityThreats.map(t => ({
            type: t.type,
            severity: t.severity,
            description: t.description
          })),
          security_score: report.security_score,
          recommendations: report.recommendations.slice(0, 3)
        }
      });

    console.log(`Security alert logged for ${highSeverityThreats.length} threats`);
    
    // In production, integrate with your email service here
    // Example: Resend, SendGrid, AWS SES, etc.
    
    return { 
      success: true, 
      alert_logged: true,
      message: `Alert logged for ${highSeverityThreats.length} threats`
    };

  } catch (error) {
    console.error('Error processing security alert:', error);
    return { success: false, error: (error as Error).message };
  }
}

async function updateSecuritySettings(updates: any, userId: string) {
  try {
    const { data, error } = await supabase
      .from('security_settings')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', updates.id || 1) // Assuming single row for global settings
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Log the settings update
    await supabase
      .from('security_logs')
      .insert({
        event_type: 'security_settings_updated',
        severity: 'low',
        description: 'Security settings were updated',
        user_id: userId,
        metadata: {
          updated_fields: Object.keys(updates),
          updated_by: userId
        }
      });

    return { success: true, data };
  } catch (error) {
    console.error('Error updating security settings:', error);
    throw error;
  }
}

async function performSecurityScan() {
  try {
    const scanResults = {
      timestamp: new Date().toISOString(),
      vulnerabilities: [] as Array<{type: string, severity: string, description: string}>,
      recommendations: [] as Array<{type: string, priority: string, description: string}>,
      overall_score: 0
    };

    // Check various security configurations
    const { data: settings } = await supabase
      .from('security_settings')
      .select('*')
      .maybeSingle();

    if (settings) {
      // Check SSL enforcement
      if (!settings.ssl_enforcement) {
        scanResults.vulnerabilities.push({
          type: 'ssl_not_enforced',
          severity: 'high',
          description: 'SSL enforcement is disabled - connections may not be secure'
        });
      }

      // Check two-factor authentication
      if (!settings.two_factor_enabled) {
        scanResults.vulnerabilities.push({
          type: 'no_two_factor',
          severity: 'medium',
          description: 'Two-factor authentication is not enabled'
        });
      }

      // Add recommendations
      if (!settings.firewall_enabled) {
        scanResults.recommendations.push({
          type: 'enable_firewall',
          priority: 'high',
          description: 'Enable firewall protection to block malicious traffic'
        });
      }
    }

    // Calculate overall security score
    scanResults.overall_score = Math.max(0, 100 - (scanResults.vulnerabilities.length * 15));

    // Log the security scan
    await supabase
      .from('security_logs')
      .insert({
        event_type: 'security_scan_completed',
        severity: 'low',
        description: `Security scan completed - found ${scanResults.vulnerabilities.length} vulnerabilities`,
        metadata: {
          vulnerabilities_count: scanResults.vulnerabilities.length,
          recommendations_count: scanResults.recommendations.length,
          security_score: scanResults.overall_score
        }
      });

    return scanResults;
  } catch (error) {
    console.error('Error performing security scan:', error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, data }: SecurityRequest = await req.json();

    // Verify user authentication
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Invalid authentication');
    }

    let result;

    switch (action) {
      case 'monitor':
        result = await monitorSecurityEvents();
        break;

      case 'analyze':
        result = await performSecurityScan();
        break;

      case 'alert':
        // Manually trigger security alert
        const monitoringResult = await monitorSecurityEvents();
        result = await sendSecurityAlert(monitoringResult.threats, monitoringResult);
        break;

      case 'update_settings':
        if (!data) {
          throw new Error('Settings data required');
        }
        result = await updateSecuritySettings(data, user.id);
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Security monitor error:', error);
    
    return new Response(JSON.stringify({ 
      error: (error as Error).message,
      success: false
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
};

serve(handler);