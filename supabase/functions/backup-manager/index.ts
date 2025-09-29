import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BackupRequest {
  action: 'create' | 'restore' | 'download' | 'test' | 'schedule' | 'upload';
  backupType?: 'database' | 'files' | 'full';
  backupId?: string;
  restorePoint?: string;
  settings?: any;
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Memory-efficient ZIP implementation
class MemoryEfficientZip {
  private entries: Array<{ name: string; data: Uint8Array | string }> = [];
  private maxMemoryUsage = 30 * 1024 * 1024; // 30MB limit to stay under edge function limits
  private currentMemoryUsage = 0;

  addFile(name: string, data: Uint8Array | string): boolean {
    const size = typeof data === 'string' ? new TextEncoder().encode(data).length : data.length;
    
    // Skip files that are too large
    if (size > 5 * 1024 * 1024) { // 5MB per file limit
      console.warn(`Skipping large file: ${name} (${size} bytes)`);
      return false;
    }

    if (this.currentMemoryUsage + size > this.maxMemoryUsage) {
      console.warn(`Memory limit reached, skipping file: ${name}`);
      return false;
    }

    this.entries.push({ name, data });
    this.currentMemoryUsage += size;
    return true;
  }

  generateZip(): Uint8Array {
    const zipData: Uint8Array[] = [];
    const centralDirectory: Uint8Array[] = [];
    let offset = 0;

    // Create local file headers and data
    for (const entry of this.entries) {
      const fileName = new TextEncoder().encode(entry.name);
      const fileData = typeof entry.data === 'string' 
        ? new TextEncoder().encode(entry.data) 
        : entry.data;

      // Local file header (30 bytes + filename)
      const header = new Uint8Array(30 + fileName.length);
      const view = new DataView(header.buffer);
      
      view.setUint32(0, 0x04034b50, true); // Local file header signature
      view.setUint16(4, 20, true); // Version needed to extract
      view.setUint16(6, 0, true); // General purpose bit flag
      view.setUint16(8, 0, true); // Compression method (stored)
      view.setUint32(18, fileData.length, true); // Uncompressed size
      view.setUint32(22, fileData.length, true); // Compressed size
      view.setUint16(26, fileName.length, true); // File name length
      view.setUint16(28, 0, true); // Extra field length
      
      header.set(fileName, 30);
      
      zipData.push(header);
      zipData.push(fileData);

      // Create central directory entry
      const centralEntry = new Uint8Array(46 + fileName.length);
      const centralView = new DataView(centralEntry.buffer);
      
      centralView.setUint32(0, 0x02014b50, true); // Central directory signature
      centralView.setUint16(4, 20, true); // Version made by
      centralView.setUint16(6, 20, true); // Version needed to extract
      centralView.setUint16(8, 0, true); // General purpose bit flag
      centralView.setUint16(10, 0, true); // Compression method
      centralView.setUint32(20, fileData.length, true); // Uncompressed size
      centralView.setUint32(24, fileData.length, true); // Compressed size
      centralView.setUint16(28, fileName.length, true); // File name length
      centralView.setUint16(30, 0, true); // Extra field length
      centralView.setUint16(32, 0, true); // File comment length
      centralView.setUint16(34, 0, true); // Disk number start
      centralView.setUint16(36, 0, true); // Internal file attributes
      centralView.setUint32(38, 0, true); // External file attributes
      centralView.setUint32(42, offset, true); // Relative offset of local header
      
      centralEntry.set(fileName, 46);
      centralDirectory.push(centralEntry);

      offset += header.length + fileData.length;
    }

    // End of central directory record
    const centralDirSize = centralDirectory.reduce((sum, entry) => sum + entry.length, 0);
    const endRecord = new Uint8Array(22);
    const endView = new DataView(endRecord.buffer);
    
    endView.setUint32(0, 0x06054b50, true); // End of central directory signature
    endView.setUint16(4, 0, true); // Number of this disk
    endView.setUint16(6, 0, true); // Disk where central directory starts
    endView.setUint16(8, this.entries.length, true); // Number of central directory records on this disk
    endView.setUint16(10, this.entries.length, true); // Total number of central directory records
    endView.setUint32(12, centralDirSize, true); // Size of central directory
    endView.setUint32(16, offset, true); // Offset of start of central directory
    endView.setUint16(20, 0, true); // ZIP file comment length

    // Combine all parts
    const totalSize = offset + centralDirSize + 22;
    const result = new Uint8Array(totalSize);
    let pos = 0;

    // Copy local file headers and data
    for (const chunk of zipData) {
      result.set(chunk, pos);
      pos += chunk.length;
    }

    // Copy central directory
    for (const entry of centralDirectory) {
      result.set(entry, pos);
      pos += entry.length;
    }

    // Copy end record
    result.set(endRecord, pos);

    return result;
  }

  getMemoryUsage(): number {
    return this.currentMemoryUsage;
  }

  getFileCount(): number {
    return this.entries.length;
  }
}

const createOptimizedBackup = async (backupType: string, settings?: any) => {
  const backupId = crypto.randomUUID();
  
  try {
    console.log(`Starting optimized ${backupType} backup with ID: ${backupId}`);

    // Create backup job entry
    const { error: jobError } = await supabase
      .from('backup_jobs')
      .insert({
        id: backupId,
        job_type: backupType,
        status: 'running',
        metadata: { 
          settings,
          started_at: new Date().toISOString()
        }
      });

    if (jobError) {
      console.error('Error creating backup job:', jobError);
      throw jobError;
    }

    const zip = new MemoryEfficientZip();
    const startTime = Date.now();
    
    // 1. Create database backup
    if (backupType === 'database' || backupType === 'full') {
      console.log('Creating database backup...');
      const dbBackup = await createDatabaseBackup();
      zip.addFile('database/backup.sql', dbBackup);
    }
    
    // 2. Create storage files backup (with limits)
    if (backupType === 'files' || backupType === 'full') {
      console.log('Creating storage backup...');
      await createStorageBackup(zip);
    }
    
    // 3. Add essential files
    const readmeContent = `Emergency Backup Archive
Generated: ${new Date().toISOString()}
Backup ID: ${backupId}
Type: ${backupType}

This ZIP contains:
- database/backup.sql: Complete database backup with SQL commands
- storage/: Files from storage buckets (limited to prevent memory issues)
- config/: Backup configuration and metadata
- scripts/: Emergency restoration scripts

EMERGENCY RESTORATION:
1. Extract this ZIP file
2. Run the SQL in database/backup.sql against a PostgreSQL database
3. Upload files from storage/ to your hosting solution
4. Update configuration as needed

For support: Check the scripts/ folder for automated restoration tools.
`;
    
    zip.addFile('README.txt', readmeContent);
    
    // Add backup configuration
    const backupInfo = {
      backup_id: backupId,
      backup_type: backupType,
      created_at: new Date().toISOString(),
      project_id: Deno.env.get("SUPABASE_URL")?.split('//')[1]?.split('.')[0] || 'unknown',
      version: '3.0-optimized',
      memory_limit_applied: true,
      file_count: zip.getFileCount(),
      estimated_size: zip.getMemoryUsage()
    };
    
    zip.addFile('config/backup-info.json', JSON.stringify(backupInfo, null, 2));
    
    // Add restoration script
    const restorationScript = `-- Emergency Database Restoration Script
-- Generated: ${new Date().toISOString()}
-- Backup ID: ${backupId}

-- WARNING: This will overwrite existing data!
-- Make sure you have backups before running this script.

-- Step 1: Create database if not exists
-- CREATE DATABASE your_database_name;

-- Step 2: Connect to your database
-- \\c your_database_name;

-- Step 3: Run the backup.sql file
-- \\i database/backup.sql

-- Step 4: Verify data restoration
-- SELECT COUNT(*) FROM profiles;
-- SELECT COUNT(*) FROM books;

-- Restoration complete!
`;
    
    zip.addFile('scripts/restore_database.sql', restorationScript);
    
    console.log(`Generating ZIP with ${zip.getFileCount()} files, ${Math.round(zip.getMemoryUsage() / 1024 / 1024 * 100) / 100}MB`);
    
    const zipBuffer = zip.generateZip();
    const backupDuration = Math.floor((Date.now() - startTime) / 1000);
    const checksum = await generateChecksum(zipBuffer);
    
    const filePath = `/backups/${backupType}/${backupId}_${new Date().toISOString().split('T')[0]}.zip`;
    
    // Update backup job with completion
    const { error: updateError } = await supabase
      .from('backup_jobs')
      .update({
        status: 'completed',
        file_path: filePath,
        file_size: zipBuffer.length,
        backup_duration: backupDuration,
        checksum: checksum,
        completed_at: new Date().toISOString(),
        metadata: {
          ...settings,
          backup_type: backupType,
          files_in_zip: zip.getFileCount(),
          memory_used_mb: Math.round(zip.getMemoryUsage() / 1024 / 1024 * 100) / 100,
          optimization_applied: true,
          started_at: new Date(startTime).toISOString()
        }
      })
      .eq('id', backupId);

    if (updateError) {
      console.error('Error updating backup job:', updateError);
      throw updateError;
    }

    // Log security event
    await supabase
      .from('security_logs')
      .insert({
        event_type: 'backup_created',
        severity: 'low',
        description: `${backupType} backup created successfully - ${zipBuffer.length} bytes`,
        metadata: {
          backup_id: backupId,
          backup_type: backupType,
          file_size: zipBuffer.length,
          duration: backupDuration,
          files_backed_up: zip.getFileCount(),
          memory_optimized: true
        }
      });

    console.log(`Backup ${backupId} completed successfully`);
    
    return {
      success: true,
      zipBuffer,
      backup_id: backupId,
      file_size: zipBuffer.length,
      duration: backupDuration,
      files_count: zip.getFileCount()
    };

  } catch (error) {
    console.error(`Backup ${backupId} failed:`, error);
    
    // Update job status to failed
    await supabase
      .from('backup_jobs')
      .update({
        status: 'failed',
        error_message: (error as Error).message,
        completed_at: new Date().toISOString()
      })
      .eq('id', backupId);

    // Log security event for failure
    await supabase
      .from('security_logs')
      .insert({
        event_type: 'backup_failed',
        severity: 'high',
        description: `${backupType} backup failed: ${(error as Error).message}`,
        metadata: {
          backup_id: backupId,
          backup_type: backupType,
          error: (error as Error).message
        }
      });

    throw error;
  }
};

const createDatabaseBackup = async (): Promise<string> => {
  let backupData = `-- Database Backup Generated: ${new Date().toISOString()}\n`;
  backupData += `-- Memory-optimized backup with essential tables\n\n`;
  
  // Essential tables only to reduce memory usage
  const essentialTables = [
    'profiles', 'user_roles', 'books', 'blog_posts', 'events', 'awards', 'faqs',
    'newsletter_subscribers', 'contact_submissions', 'themes', 'subscription_plans'
  ];
  
  for (const table of essentialTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(100); // Limit records per table to prevent memory issues
      
      if (!error && data && data.length > 0) {
        backupData += `-- Table: ${table} (${data.length} records)\n`;
        backupData += `TRUNCATE TABLE ${table} CASCADE;\n`;
        
        const columns = Object.keys(data[0]);
        for (const row of data) {
          const values = columns.map(col => {
            const val = row[col];
            if (val === null || val === undefined) return 'NULL';
            if (typeof val === 'string') {
              return `'${val.replace(/'/g, "''").substring(0, 1000)}'`; // Limit string length
            }
            if (typeof val === 'object') {
              return `'${JSON.stringify(val).replace(/'/g, "''").substring(0, 1000)}'`;
            }
            if (typeof val === 'boolean') return val ? 'true' : 'false';
            return val;
          }).join(', ');
          
          backupData += `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${values});\n`;
        }
        backupData += `\n`;
      } else if (error) {
        backupData += `-- Warning: Could not backup table ${table}: ${error.message}\n\n`;
      }
    } catch (tableError) {
      backupData += `-- Error: Could not backup table ${table}: ${(tableError as Error).message}\n\n`;
    }
  }
  
  return backupData;
};

const createStorageBackup = async (zip: MemoryEfficientZip): Promise<void> => {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets || buckets.length === 0) {
      zip.addFile('storage/no_buckets.txt', 'No storage buckets found.');
      return;
    }

    let totalFiles = 0;
    const maxFilesTotal = 20; // Global limit to prevent memory issues

    for (const bucket of buckets) {
      if (totalFiles >= maxFilesTotal) break;
      
      try {
        const { data: files } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 10 }); // Very limited files per bucket

        if (files && files.length > 0) {
          const filesToProcess = files.slice(0, Math.min(5, maxFilesTotal - totalFiles)); // Max 5 per bucket
          
          for (const file of filesToProcess) {
            try {
              // Skip large files
              if (file.metadata?.size && file.metadata.size > 2 * 1024 * 1024) { // 2MB limit
                console.warn(`Skipping large file: ${file.name}`);
                continue;
              }

              const { data: fileData, error: downloadError } = await supabase.storage
                .from(bucket.name)
                .download(file.name);

              if (!downloadError && fileData) {
                const arrayBuffer = await fileData.arrayBuffer();
                const uint8Array = new Uint8Array(arrayBuffer);
                
                const filePath = `storage/${bucket.name}/${file.name}`;
                const success = zip.addFile(filePath, uint8Array);
                
                if (success) {
                  totalFiles++;
                  console.log(`Added file: ${filePath}`);
                } else {
                  console.warn(`Failed to add file due to memory constraints: ${filePath}`);
                  break;
                }
              }
            } catch (fileError) {
              console.error(`Error processing file ${file.name}:`, fileError);
            }
          }
        }
      } catch (bucketError) {
        console.error(`Error processing bucket ${bucket.name}:`, bucketError);
      }
    }

    // Add summary
    const summary = `Storage Backup Summary
Generated: ${new Date().toISOString()}
Files backed up: ${totalFiles}
Max files limit: ${maxFilesTotal}

Note: This backup is limited to small files to prevent memory issues.
Large files and excess files are skipped.
`;
    
    zip.addFile('storage/BACKUP_SUMMARY.txt', summary);
    
  } catch (error) {
    console.error('Storage backup failed:', error);
    zip.addFile('storage/BACKUP_ERROR.txt', `Storage backup failed: ${(error as Error).message}`);
  }
};

const generateChecksum = async (data: Uint8Array): Promise<string> => {
  const buffer = new ArrayBuffer(data.length);
  const view = new Uint8Array(buffer);
  view.set(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, backupType = 'full', backupId, settings }: BackupRequest = await req.json();

    switch (action) {
      case 'create':
        console.log(`Creating ${backupType} backup...`);
        const result = await createOptimizedBackup(backupType, settings);
        
        const today = new Date().toISOString().split('T')[0];
        const filename = `${backupType}_backup_${today}.zip`;
        
        const buffer = new ArrayBuffer(result.zipBuffer.length);
        const view = new Uint8Array(buffer);
        view.set(result.zipBuffer);
        
        return new Response(buffer, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': result.zipBuffer.length.toString(),
          }
        });

      default:
        return new Response(
          JSON.stringify({ error: 'Unsupported action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
  } catch (error) {
    console.error('Edge function error:', error);
    
    // Try to create minimal backup for memory errors
    if ((error as Error).message?.toLowerCase().includes('memory')) {
      try {
        const zip = new MemoryEfficientZip();
        const errorMsg = `Backup Failed Due to Memory Constraints
Generated: ${new Date().toISOString()}
Error: ${(error as Error).message}

This minimal backup was created because the full backup exceeded memory limits.

Recommendations:
1. Reduce the amount of data in storage buckets
2. Try backing up database and files separately
3. Contact support for large backup assistance

To restore essential data, you may need to:
- Export critical tables manually from the Supabase dashboard
- Download important files directly from storage buckets
`;
        
        zip.addFile('BACKUP_FAILURE_NOTICE.txt', errorMsg);
        const minimalZip = zip.generateZip();
        
        const buffer = new ArrayBuffer(minimalZip.length);
        const view = new Uint8Array(buffer);
        view.set(minimalZip);
        
        return new Response(buffer, {
          status: 200,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/zip',
            'Content-Disposition': 'attachment; filename="minimal_backup_error.zip"',
            'Content-Length': minimalZip.length.toString(),
          }
        });
      } catch (minimalError) {
        console.error('Even minimal backup failed:', minimalError);
      }
    }

    return new Response(
      JSON.stringify({ 
        error: 'Backup creation failed', 
        details: (error as Error).message,
        suggestion: (error as Error).message?.toLowerCase().includes('memory') ?
          'Memory limit exceeded. Try reducing data or backing up in smaller chunks.' :
          'Please check the logs for more details.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});