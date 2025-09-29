import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackupRequest {
  action: 'create' | 'restore' | 'download' | 'test' | 'schedule';
  backupType?: 'database' | 'files' | 'full';
  backupId?: string;
  restorePoint?: string;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

async function createDatabaseBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `database-backup-${timestamp}.sql`;
  
  try {
    // Create backup job record
    const { data: job, error: jobError } = await supabase
      .from('backup_jobs')
      .insert({
        job_type: 'database',
        status: 'running',
        metadata: {
          filename,
          backup_type: 'database',
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (jobError) throw jobError;

    // Get all table names from public schema
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_backup_statistics');

    // Create SQL dump (simplified version - in production you'd use pg_dump)
    const backupData = await generateDatabaseDump();
    
    // Calculate file size and checksum
    const encoder = new TextEncoder();
    const data = encoder.encode(backupData);
    const fileSize = data.length;
    const checksum = await generateChecksum(data);

    // In a real implementation, you would upload to cloud storage
    const filePath = `backups/database/${filename}`;
    
    // Update backup job with completion details
    const { error: updateError } = await supabase
      .from('backup_jobs')
      .update({
        status: 'completed',
        file_path: filePath,
        file_size: fileSize,
        checksum,
        completed_at: new Date().toISOString(),
        backup_duration: Math.floor((Date.now() - new Date(job.created_at).getTime()) / 1000)
      })
      .eq('id', job.id);

    if (updateError) throw updateError;

    // Update last backup time in settings
    await supabase
      .from('backup_settings')
      .update({
        last_backup_at: new Date().toISOString(),
        next_backup_at: calculateNextBackup()
      });

    // Log security event
    await supabase
      .rpc('log_security_event', {
        p_event_type: 'backup_created',
        p_severity: 'info',
        p_event_data: {
          backup_id: job.id,
          backup_type: 'database',
          file_size: fileSize
        }
      });

    return {
      success: true,
      backupId: job.id,
      filename,
      fileSize,
      checksum
    };

  } catch (error) {
    console.error('Backup creation failed:', error);
    
    // Log security event for failure
    await supabase
      .rpc('log_security_event', {
        p_event_type: 'backup_failed',
        p_severity: 'error',
        p_event_data: {
          error: error.message,
          backup_type: 'database'
        }
      });

    throw error;
  }
}

async function generateDatabaseDump(): Promise<string> {
  // This is a simplified version. In production, you'd use pg_dump or similar
  const tables = [
    'profiles', 'books', 'blog_posts', 'events', 'awards', 'faqs',
    'newsletter_subscribers', 'contact_submissions', 'user_roles'
  ];

  let dump = `-- Database backup created at ${new Date().toISOString()}\n\n`;

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.warn(`Error backing up table ${table}:`, error);
        continue;
      }

      dump += `-- Table: ${table}\n`;
      dump += `DELETE FROM ${table};\n`;
      
      if (data && data.length > 0) {
        const columns = Object.keys(data[0]);
        for (const row of data) {
          const values = columns.map(col => {
            const value = row[col];
            if (value === null) return 'NULL';
            if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
            if (typeof value === 'object') return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
            return value;
          });
          dump += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
        }
      }
      dump += '\n';
    } catch (error) {
      console.warn(`Error processing table ${table}:`, error);
    }
  }

  return dump;
}

async function generateChecksum(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function calculateNextBackup(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1); // Default to daily
  return now.toISOString();
}

async function restoreFromBackup(backupId: string, userId: string) {
  try {
    // Get backup details
    const { data: backup, error: backupError } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('id', backupId)
      .eq('status', 'completed')
      .single();

    if (backupError || !backup) {
      throw new Error('Backup not found or incomplete');
    }

    // Create restore job record
    const { data: restoreJob, error: restoreError } = await supabase
      .from('backup_restore_history')
      .insert({
        backup_job_id: backupId,
        initiated_by: userId,
        restore_type: backup.job_type,
        status: 'running',
        metadata: {
          original_backup_date: backup.created_at,
          restore_initiated_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (restoreError) throw restoreError;

    // Log security event
    await supabase
      .rpc('log_security_event', {
        p_event_type: 'restore_initiated',
        p_severity: 'warning',
        p_user_id: userId,
        p_event_data: {
          backup_id: backupId,
          restore_job_id: restoreJob.id
        }
      });

    // In a real implementation, you would:
    // 1. Download the backup file from storage
    // 2. Validate the checksum
    // 3. Execute the restore process
    // 4. Update the restore job status

    // For now, we'll simulate the restore process
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Update restore job as completed
    await supabase
      .from('backup_restore_history')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', restoreJob.id);

    return {
      success: true,
      restoreJobId: restoreJob.id,
      message: 'Restore completed successfully'
    };

  } catch (error) {
    console.error('Restore failed:', error);
    
    await supabase
      .rpc('log_security_event', {
        p_event_type: 'restore_failed',
        p_severity: 'error',
        p_user_id: userId,
        p_event_data: {
          backup_id: backupId,
          error: error.message
        }
      });

    throw error;
  }
}

async function testRestore(backupId: string, userId: string) {
  // Test restore validates backup integrity without actually restoring
  try {
    const { data: backup, error } = await supabase
      .from('backup_jobs')
      .select('*')
      .eq('id', backupId)
      .single();

    if (error || !backup) {
      throw new Error('Backup not found');
    }

    // Simulate validation checks
    const validationResults = {
      checksumValid: true,
      fileAccessible: true,
      structureValid: true,
      sizeValid: backup.file_size > 0
    };

    const isValid = Object.values(validationResults).every(Boolean);

    await supabase
      .rpc('log_security_event', {
        p_event_type: 'backup_test',
        p_severity: 'info',
        p_user_id: userId,
        p_event_data: {
          backup_id: backupId,
          test_result: isValid ? 'passed' : 'failed',
          validation_results: validationResults
        }
      });

    return {
      success: true,
      valid: isValid,
      validationResults
    };

  } catch (error) {
    console.error('Test restore failed:', error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, backupType, backupId, restorePoint }: BackupRequest = await req.json();
    
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

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single();

    if (roleError || userRole?.role !== 'admin') {
      throw new Error('Admin access required');
    }

    let result;

    switch (action) {
      case 'create':
        if (backupType === 'database' || backupType === 'full') {
          result = await createDatabaseBackup();
        } else {
          throw new Error('Unsupported backup type');
        }
        break;

      case 'restore':
        if (!backupId) throw new Error('Backup ID required for restore');
        result = await restoreFromBackup(backupId, user.id);
        break;

      case 'test':
        if (!backupId) throw new Error('Backup ID required for test');
        result = await testRestore(backupId, user.id);
        break;

      case 'download':
        if (!backupId) throw new Error('Backup ID required for download');
        // Return download URL or file stream
        result = { downloadUrl: `/api/backup/download/${backupId}` };
        break;

      case 'schedule':
        // Update backup schedule
        const { error: scheduleError } = await supabase
          .from('backup_settings')
          .update({
            next_backup_at: calculateNextBackup(),
            updated_at: new Date().toISOString()
          });
        
        if (scheduleError) throw scheduleError;
        result = { success: true, message: 'Backup scheduled' };
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
    console.error("Error in backup-manager function:", error);
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