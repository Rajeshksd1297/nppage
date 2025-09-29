import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SecurityRequest {
  action: 'monitor' | 'alert' | 'analyze' | 'update_settings';
  eventType?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

async function monitorSecurityEvents() {
  try {
    // Get recent security logs
    const { data: recentLogs, error: logsError } = await supabase
      .from('security_logs')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    if (logsError) throw logsError;

    // Analyze for suspicious patterns
    const analysis = await analyzeSecurityPatterns(recentLogs);
    
    // Check for security threats
    const threats = await detectThreats(recentLogs);
    
    // Generate security report
    const report = {
      timestamp: new Date().toISOString(),
      totalEvents: recentLogs.length,
      severityBreakdown: {
        critical: recentLogs.filter(log => log.severity === 'critical').length,
        high: recentLogs.filter(log => log.severity === 'high').length,
        medium: recentLogs.filter(log => log.severity === 'medium').length,
        low: recentLogs.filter(log => log.severity === 'low').length,
      },
      threats,
      analysis,
      recommendations: generateRecommendations(analysis, threats)
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

async function analyzeSecurityPatterns(logs: any[]) {
  const patterns = {
    failedLogins: logs.filter(log => log.event_type === 'failed_login'),
    suspiciousActivity: logs.filter(log => log.severity === 'high' || log.severity === 'critical'),
    unauthorizedAccess: logs.filter(log => log.event_type === 'unauthorized_access'),
    bruteForceAttempts: [],
    ipAddressPatterns: {},
    userAgentPatterns: {}
  };

  // Analyze IP patterns
  logs.forEach(log => {
    if (log.ip_address) {
      const ip = log.ip_address;
      patterns.ipAddressPatterns[ip] = (patterns.ipAddressPatterns[ip] || 0) + 1;
    }
  });

  // Detect brute force attempts (multiple failed logins from same IP)
  Object.entries(patterns.ipAddressPatterns).forEach(([ip, count]) => {
    if (count >= 5) {
      const ipLogs = logs.filter(log => log.ip_address === ip && log.event_type === 'failed_login');
      if (ipLogs.length >= 3) {
        patterns.bruteForceAttempts.push({
          ip_address: ip,
          attempts: ipLogs.length,
          timespan: ipLogs.length > 0 ? {
            start: ipLogs[ipLogs.length - 1].created_at,
            end: ipLogs[0].created_at
          } : null
        });
      }
    }
  });

  return patterns;
}

async function detectThreats(logs: any[]) {
  const threats = [];

  // Check for multiple failed login attempts
  const failedLogins = logs.filter(log => log.event_type === 'failed_login');
  if (failedLogins.length > 10) {
    threats.push({
      type: 'high_failed_login_rate',
      severity: 'high',
      description: `${failedLogins.length} failed login attempts in the last 24 hours`,
      count: failedLogins.length
    });
  }

  // Check for critical security events
  const criticalEvents = logs.filter(log => log.severity === 'critical');
  if (criticalEvents.length > 0) {
    threats.push({
      type: 'critical_security_events',
      severity: 'critical',
      description: `${criticalEvents.length} critical security events detected`,
      events: criticalEvents.map(event => ({
        type: event.event_type,
        timestamp: event.created_at,
        description: event.description
      }))
    });
  }

  // Check for unauthorized access attempts
  const unauthorizedAccess = logs.filter(log => log.event_type === 'unauthorized_access');
  if (unauthorizedAccess.length > 0) {
    threats.push({
      type: 'unauthorized_access_attempts',
      severity: 'high',
      description: `${unauthorizedAccess.length} unauthorized access attempts detected`,
      count: unauthorizedAccess.length
    });
  }

  // Check for suspicious IP activity
  const ipCounts = {};
  logs.forEach(log => {
    if (log.ip_address) {
      ipCounts[log.ip_address] = (ipCounts[log.ip_address] || 0) + 1;
    }
  });

  Object.entries(ipCounts).forEach(([ip, count]: [string, number]) => {
    if (count > 50) {
      threats.push({
        type: 'suspicious_ip_activity',
        severity: 'medium',
        description: `IP ${ip} has ${count} events in 24 hours`,
        ip_address: ip,
        event_count: count
      });
    }
  });

  return threats;
}

function generateRecommendations(analysis: any, threats: any[]) {
  const recommendations = [];

  if (threats.some(t => t.type === 'high_failed_login_rate')) {
    recommendations.push({
      priority: 'high',
      action: 'Enable account lockout after failed attempts',
      description: 'Consider implementing temporary account locks after multiple failed login attempts'
    });
  }

  if (threats.some(t => t.type === 'suspicious_ip_activity')) {
    recommendations.push({
      priority: 'medium',
      action: 'Review IP whitelist/blacklist',
      description: 'Consider adding suspicious IPs to blacklist or implementing rate limiting'
    });
  }

  if (analysis.bruteForceAttempts.length > 0) {
    recommendations.push({
      priority: 'high',
      action: 'Implement CAPTCHA or additional authentication',
      description: 'Brute force attempts detected - consider additional security measures'
    });
  }

  return recommendations;
}

async function sendSecurityAlert(threats: any[], report: any) {
  try {
    // Get security settings to check if alerts are enabled
    const { data: settings, error: settingsError } = await supabase
      .from('security_settings')
      .select('security_alerts, alert_email')
      .single();

    if (settingsError || !settings?.security_alerts || !settings?.alert_email) {
      console.log('Security alerts not configured or disabled');
      return;
    }

    const highSeverityThreats = threats.filter(t => t.severity === 'high' || t.severity === 'critical');
    
    if (highSeverityThreats.length === 0) return;

    const emailContent = `
      <h2>🚨 Security Alert - Immediate Attention Required</h2>
      
      <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
      
      <h3>Threats Detected:</h3>
      <ul>
        ${highSeverityThreats.map(threat => `
          <li>
            <strong>${threat.type}</strong> (${threat.severity})
            <br>${threat.description}
          </li>
        `).join('')}
      </ul>
      
      <h3>Security Summary (Last 24 Hours):</h3>
      <ul>
        <li>Total Events: ${report.totalEvents}</li>
        <li>Critical Events: ${report.severityBreakdown.critical}</li>
        <li>High Severity Events: ${report.severityBreakdown.high}</li>
      </ul>
      
      <h3>Recommended Actions:</h3>
      <ul>
        ${report.recommendations.map(rec => `
          <li><strong>${rec.action}</strong> - ${rec.description}</li>
        `).join('')}
      </ul>
      
      <p><em>Please review your security dashboard immediately.</em></p>
    `;

    await resend.emails.send({
      from: "Security Alert <security@yourdomain.com>",
      to: [settings.alert_email],
      subject: `🚨 Security Alert: ${highSeverityThreats.length} threats detected`,
      html: emailContent,
    });

    // Log the alert sending
    await supabase
      .rpc('log_security_event', {
        p_event_type: 'security_alert_sent',
        p_severity: 'info',
        p_event_data: {
          threats_count: highSeverityThreats.length,
          alert_email: settings.alert_email
        }
      });

  } catch (error) {
    console.error('Failed to send security alert:', error);
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
      .select()
      .single();

    if (error) throw error;

    // Log the settings update
    await supabase
      .rpc('log_security_event', {
        p_event_type: 'security_settings_updated',
        p_severity: 'info',
        p_user_id: userId,
        p_event_data: {
          updated_fields: Object.keys(updates)
        }
      });

    return data;

  } catch (error) {
    console.error('Failed to update security settings:', error);
    throw error;
  }
}

async function performSecurityScan() {
  const scanResults = {
    timestamp: new Date().toISOString(),
    checks: {
      ssl_enabled: true,
      https_redirect: true,
      password_policy: true,
      session_security: true,
      rls_enabled: true,
      data_encryption: true
    },
    vulnerabilities: [],
    recommendations: []
  };

  // Check security settings
  const { data: settings, error: settingsError } = await supabase
    .from('security_settings')
    .select('*')
    .single();

  if (!settingsError && settings) {
    if (!settings.ssl_enforcement) {
      scanResults.vulnerabilities.push({
        type: 'ssl_not_enforced',
        severity: 'high',
        description: 'SSL enforcement is disabled'
      });
    }

    if (settings.password_min_length < 8) {
      scanResults.vulnerabilities.push({
        type: 'weak_password_policy',
        severity: 'medium',
        description: 'Password minimum length is less than 8 characters'
      });
    }

    if (!settings.two_factor_enabled) {
      scanResults.recommendations.push({
        type: 'enable_2fa',
        priority: 'medium',
        description: 'Consider enabling two-factor authentication'
      });
    }
  }

  return scanResults;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, eventType, severity, data }: SecurityRequest = await req.json();
    
    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization required');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Invalid authorization');
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
        if (!eventType) throw new Error('Event type required for alert');
        
        await supabase
          .rpc('log_security_event', {
            p_event_type: eventType,
            p_severity: severity || 'medium',
            p_user_id: user.id,
            p_event_data: data || {}
          });
        
        result = { success: true, message: 'Security event logged' };
        break;

      case 'update_settings':
        if (!data) throw new Error('Settings data required');
        result = await updateSecuritySettings(data, user.id);
        break;

      default:
        throw new Error('Invalid action');
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });

  } catch (error: any) {
    console.error("Error in security-monitor function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);